import { app, BrowserWindow, ipcMain } from 'electron'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { trilaterationCalculations, kalmanFilterPosition } from '../util/calculations.js'
import { Worker, isMainThread, parentPort } from 'worker_threads'
import * as math from 'mathjs';
// const fs = require('fs');
import fs from 'fs'



// get file structure information for accessing required files
const fileName = fileURLToPath(import.meta.url)
const dirName = dirname(fileName)

// determine if this was run with the dev tag.
const isDev = process.argv.includes('--mode=dev')
let lastFilteredPosition = null

// Serial port connection
let serialConnection = null
const xArr = []
const yArr = []

// Add these at the top along with your other variables
let positionBuffer = [];
const bufferSize = 15; // Adjust based on desired smoothing level

function interpolatePoints(p1, p2, t) {
  const x = p1[0] + (p2[0] - p1[0]) * t;
  const y = p1[1] + (p2[1] - p1[1]) * t;
  return [x, y];
}

// In main.js, add these helper functions at the top

// Calculate distance between two points
function getDistance(pos1, pos2) {
  if (!pos1 || !pos2) return 0;
  return Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
  );
}

// Interpolate between two positions
function interpolatePosition(pos1, pos2, t) {
  return {
    x: pos1.x + (pos2.x - pos1.x) * t,
    y: pos1.y + (pos2.y - pos1.y) * t,
    id: pos1.id
  };
}

let test = {x: 0, y: 0, id: 1};
// Initialize serial connection
function initSerialConnection(win) {
  console.log('initSerialConnection')
  try {
    const serialPath = process.platform === 'win32' ? 'COM3' : '/dev/ttyACM0' // Windows path vs Linux path

    // Check if serialPath exists
    if (!fs.existsSync(serialPath)) {
      // console.log("Serial path does not exist");
      console.error(`Serial path does not exist: ${serialPath}`);
      return false;
    }
    serialConnection = new SerialPort({
      path: serialPath,
      baudRate: 115200,
      dataBits: 8, // EIGHTBITS
      parity: 'none', // PARITY_NONE
      stopBits: 1, // STOPBITS_ONE
      autoOpen: true,
    })
    
    const parser = new ReadlineParser({
      delimiter: '\n',
      encoding: 'utf8',
      includeDelimiter: false,
    })
    
    // Pipe serial to parser
    serialConnection.pipe(parser)

    // Parser handler
    let a = 0
    let b = 0
    let c = 0

    let aDeque = [];
    let bDeque = [];
    let cDeque = [];
    console.log("TRY1")

    parser.on('data', (line) => {
      let arr = line.split(' ')
      if (arr[0] == "A") { 
        a = parseFloat(arr[1])
        // aDeque.push(arr[1])
      }
      if (arr[0] == "B") {
        b = parseFloat(arr[1])
        // bDeque.push(arr[1])
      }
      if (arr[0] == "C") {
        c = parseFloat(arr[1])
        // cDeque.push(arr[1])
      }

      
      if (a != 0 && b != 0 && c != 0) {
        test.x += .001
        // console.log(test)
        let triArr = trilaterationCalculations(a, b, c);
        
        const filteredPosition = kalmanFilterPosition(triArr);
        // const filteredPosition = triArr;
        filteredPosition.id = 1;
        console.log('Filtered Position:', filteredPosition.x, filteredPosition.y);
        
        const DISTANCE_THRESHOLD = .02; // Adjust this threshold as needed
        const INTERPOLATION_STEPS = 50; // Number of interpolated positions

        if (lastFilteredPosition) {
          const distance = getDistance(filteredPosition, lastFilteredPosition);
          // console.log('Distance:', distance);

          if (distance > DISTANCE_THRESHOLD) {
            console.log('Distance exceeded threshold:', distance);
            // Send original position
            win.webContents.send('update-position', lastFilteredPosition);
            
            // Send interpolated positions
            for (let i = 1; i <= INTERPOLATION_STEPS; i++) {
              const t = i / (INTERPOLATION_STEPS + 1);
              const interpolated = interpolatePosition(lastFilteredPosition, filteredPosition, t);
              win.webContents.send('update-position', interpolated,);
            }
            
            // Send final position
            win.webContents.send('update-position', filteredPosition);
          } else {
            // Just send the filtered position if within threshold
            win.webContents.send('update-position', filteredPosition);
          }
        } else {
          // First position, just send it
          win.webContents.send('update-position', filteredPosition);
        }

        win.webContents.send('update-position', {
          x: 0,
          y: 0,
          id: 2
        });
        win.webContents.send('update-position', {
          x: 4.24,
          y: 2.59,
          id: 3
        });
        win.webContents.send('update-position', {
          x: 0,
          y: 5.664,
          id: 4
        });


        lastFilteredPosition = {...filteredPosition};
        a = 0;
        b = 0; 
        c = 0;
      }
      // console.log('Parsed line:', arr[0], arr[1], arr[2])
    })

    // Debug: Monitor parser errors
    parser.on('error', (err) => {
      console.error('Parser error:', err)
    })

    serialConnection.on('open', () => {
      console.log('Serial port opened successfully')
    })

    serialConnection.on('error', (err) => {
      console.error('Serial port error:', err)
    })

    console.log('\n\n')

    return true
  } catch (error) {
    console.error('Failed to open serial port:', error)
    console.error('plug in USB anchor first')
    return false
  }
}

// will create a window of the web app
const createWindow = () => {
  const win = new BrowserWindow({
    // not set to desired setting yet
    width: 1920,
    height: 1200,
    fullscreen: true,
    webPreferences: {
      preload: path.join(dirName, 'preload.js'),
    },
  })

  if (isDev) {
    // if we are in dev mode, instead of loading the static files, load the url we are expecting
    // vite to be hosting the webpage at.
    setTimeout(() => {
      win.loadURL('http://localhost:3000')
      win.webContents.openDevTools()
    }, 250)
  } else {
    // load in the static html file
    win.loadFile(path.join(dirName, '../solidjs-dist/index.html'))
  }
  return win
}

// wait until electronjs is ready before some operations
app.whenReady().then(() => {
  let win = createWindow()
  console.log('window created')

  // Initialize serial connection after window is created
  
  console.log("Before initSerialConnection")
  attemptSerialConnection(win);

  ipcMain.handle('serial-status', () => {
    return serialConnection && serialConnection.isOpen
  })

  app.on('activate', () => {
    // if the app is activated but there are no windows, create a window
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // Close serial connection before quitting
  if (serialConnection && serialConnection.isOpen) {
    serialConnection.close()
  }

  if (process.platform !== 'darwin') app.quit()
})

const MAX_RETRIES = 10;
const RETRY_DELAY = 2000; // 2 seconds

function attemptSerialConnection(win, retryCount = 0) {
  const success = initSerialConnection(win);
  
  if (!success && retryCount < MAX_RETRIES) {
    console.log(`Connection failed, retrying in ${RETRY_DELAY/1000} seconds...`);
    setTimeout(() => {
      attemptSerialConnection(win, retryCount + 1);
    }, RETRY_DELAY);
  } else if (!success) {
    console.error('Max retry attempts reached. Serial connection failed.');
  } else {
    console.log('Serial connection established successfully');
  }
}