import { app, BrowserWindow, ipcMain } from 'electron'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { trilaterationCalculations } from '../util/calculations.js'

// get file structure information for accessing required files
const fileName = fileURLToPath(import.meta.url)
const dirName = dirname(fileName)

// determine if this was run with the dev tag.
const isDev = process.argv.includes('--mode=dev')

// Serial port connection
let serialConnection = null
const xArr = []
const yArr = []

// Add these at the top along with your other variables
let positionBuffer = [];
const bufferSize = 15; // Adjust based on desired smoothing level

// Initialize serial connection
function initSerialConnection(win) {
  console.log('initSerialConnection')
  try {
    const serialPath = process.platform === 'win32' ? 'COM3' : '/dev/ttyACM0' // Windows path vs Linux path
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

      // if (aDeque.length > 10) {
      //   a = aDeque.reduce((acc, val) => acc + parseFloat(val), 0) / aDeque.length
      //   aDeque.length = 0
      // }
      // if (bDeque.length > 10) {
      //   b = bDeque.reduce((acc, val) => acc + parseFloat(val), 0) / bDeque.length
      //   bDeque.length = 0
      // }
      // if (cDeque.length > 10) {
      //   c = cDeque.reduce((acc, val) => acc + parseFloat(val), 0) / cDeque.length
      //   cDeque.length = 0
      // }
      
      if (a != 0 && b != 0 && c != 0) {
        let triArr = trilaterationCalculations(a, b, c);
        
        // Add position to buffer
        positionBuffer.push({x: triArr.x, y: triArr.y});
        
        // Maintain buffer size
        if (positionBuffer.length > bufferSize) {
          positionBuffer.shift();
        }
        
        // Calculate moving average if we have enough points
        if (positionBuffer.length > 5) {
          const avgX = positionBuffer.reduce((acc, pos) => acc + pos.x, 0) / positionBuffer.length;
          const avgY = positionBuffer.reduce((acc, pos) => acc + pos.y, 0) / positionBuffer.length;
          
          // Convert to inches with correct factor (39.3701 in/m)
          console.log(avgX * 39.3701, avgY * 39.3701);
          
          // Send the smoothed position to the renderer
          win.webContents.send('update-position', {x: avgX, y: avgY, id: 1});
        } else {
          // If we don't have enough points yet, still display raw data
          // console.log(triArr.x * 39.3701, triArr.y * 39.3701);
          // win.webContents.send('update-position', {x: triArr.x, y: triArr.y, id: 1});
        }
        
        // Reset distance measurements to wait for next complete set
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
  initSerialConnection(win)

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
