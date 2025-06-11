import { app, BrowserWindow, ipcMain } from 'electron'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { trilaterationCalculations, kalmanFilterPosition, 
  multilaterationCalculations, trueMultilaterationMathjs,
  trueMultilaterationNLS
} from '../util/calculations.js'
import { EMA } from '../util/calculations.js'
import { Worker, isMainThread, parentPort } from 'worker_threads'

import * as math from 'mathjs';
// const fs = require('fs');
import fs from 'fs'

// Add these variables to store anchor positions
let anchorPositions = [
  [12.5, 12.9, 3.5],
  [26.58, 0, 5.5],
  [0, 0, 2.5],
  [22.08, 12.9, 0]
];

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
    const serialPath = process.platform === 'win32' ? 'COM3' : '/dev/ttyACM2' // Windows path vs Linux path

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

    let AA = 0
    let AB = 0
    let BA = 0
    let BB = 0
    let CA = 0
    let CB = 0
    let DA = 0
    let DB = 0

    let smoothedA = null;
    let smoothedB = null;
    console.log("TRY1")

    parser.on('data', (line) => {
      let arr = line.split(' ')
      // console.log(arr);

      // Differentiating between Responder A and B
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

      if (arr[3] == "A") {
        let distance = parseFloat(arr[1]);
        if (distance > 45) {
          console.log("Distance is too far");
          return;
        }
        distance = distance * 3.28084; // Convert meters to feet
        // console.log(`Distance in feet: ${distance}`);

        if (arr[0] == "A") {
          AA = distance
          console.log("A: ", distance);
        }
        else if (arr[0] == "B") {
          BA = distance
        }
        else if (arr[0] == "C") {
          CA = distance
        }
        else if (arr[0] == "D") {
          DA = distance
        }
      }
      else if (arr[3] == "B") {
        let distance = parseFloat(arr[1]);
        // console.log("Distance: ", distance);
        distance = distance * 3.28084; // Convert meters to feet
        // console.log("Distance: ", distance);
        // console.log(`Distance in feet: ${distance}`);
        if (distance > 45) {
          console.log("Distance is too far: ", distance);
          return;
        }

        if (arr[0] == "A") {
          // console.log("A: ", distance);
          AB = distance
        }
        else if (arr[0] == "B") {
          // console.log("B: ", distance);
          BB = distance
        }
        else if (arr[0] == "C") {
          CB = distance
          // console.log("CB: ", CB);
        }
        else if (arr[0] == "D") {
          DB = distance
          // console.log("DB: ", DB);
        }
      }

      a = 0

      if (AA != 0 && BA != 0 && CA != 0 && DA != 0) {
        let triArr = trueMultilaterationMathjs(AA, BA, CA, DA, anchorPositions);
        if (!triArr.z1) triArr.z1 = 0;
        if (!triArr.z2) triArr.z2 = 0;
    
        console.log("triArr: ", triArr);

        const filteredPosition = EMA(triArr, 1);
        // console.log('Filtered Position: ', filteredPosition);
        filteredPosition.id = 1;

        win.webContents.send('update-position', filteredPosition);
        AA = 0
        BA = 0
        CA = 0
        DA = 0
      }
      if (AB != 0 && BB != 0 && CB != 0) {
        let triArr = trueMultilaterationMathjs(AB, BB, CB, DB, anchorPositions);
        if (!triArr.z1) triArr.z1 = 0;
        if (!triArr.z2) triArr.z2 = 0;
    
        // console.log("triArr: ", triArr);

        const filteredPosition = EMA(triArr, 2);
        // console.log('Filtered Position:', filteredPosition);
        filteredPosition.id = 2;

        win.webContents.send('update-position', filteredPosition);
        AB = 0
        BB = 0
        CB = 0
      }

      win.webContents.send('update-position', {
        x: anchorPositions[0][0],
        y: anchorPositions[0][1],
        id: 3
      });
      win.webContents.send('update-position', {
        x: anchorPositions[1][0],
        y: anchorPositions[1][1],
        id: 4
      });
      win.webContents.send('update-position', {
        x: anchorPositions[2][0],
        y: anchorPositions[2][1],
        id: 5
      });
      win.webContents.send('update-position', {
        x: anchorPositions[3][0],
        y: anchorPositions[3][1],
        id: 6
      });
      
      // console.log('Parsed line:', arr[0], arr[1], arr[2])
    })

    // Debug: Monitor parser errors
    parser.on('error', (err) => {
      console.error('Parser error:', err)
    })

    serialConnection.on('open', () => {
      console.log('Serial port opened successfully')
    })

    serialConnection.on('close', () => {
      console.log('Serial port closed')
      attemptSerialConnection(mainWindow); // Attempt to reconnect
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

let mainWindow = null
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
  mainWindow = win
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

  ipcMain.handle('update-anchors', (event, anchors) => {
    console.log('Updating anchor positions:', anchors);
    anchorPositions = anchors;
    return true;
  });

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

const MAX_RETRIES = 100;
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