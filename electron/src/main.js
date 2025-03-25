import { app, BrowserWindow, ipcMain } from "electron"
import path, { dirname } from 'path'
import { fileURLToPath } from "url"
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
// Initialize serial connection
function initSerialConnection() {
    console.log("initSerialConnection")
  try {
    const serialPath = process.platform === 'win32' ? 'COM3' : '/dev/ttyACM0'; // Windows path vs Linux path
    serialConnection = new SerialPort({
      path: serialPath,
      baudRate: 115200,
      dataBits: 8,          // EIGHTBITS
      parity: 'none',       // PARITY_NONE
      stopBits: 1,          // STOPBITS_ONE
      autoOpen: true,
    //   timeout: 1000         // 1 second timeout in milliseconds
    })

    const parser = new ReadlineParser({
        delimiter: '\n',
        encoding: 'utf8',
        includeDelimiter: false
    })

    // Pipe serial to parser
    serialConnection.pipe(parser)
    
    // Debug: Monitor raw data
    // serialConnection.on('data', (data) => {
    //     console.log("Raw UTF8:", data.toString('utf8'))
    // })

    // Parser handler
    let a = 0
    let b = 0
    let c = 0
    parser.on('data', (line) => {
      let arr = line.split(' ')
      if (arr[0] == "A") { 
        a = parseFloat(arr[1])
      }
      if (arr[0] == "B") {
        b = parseFloat(arr[1])
      }
      if (arr[0] == "C") {
        c = parseFloat(arr[1])
      }
      if (a != 0 && b != 0 && c != 0) {
        // console.log(a, b, c)
        console.log(trilaterationCalculations(a, b, c))
        a = 0
        b = 0
        c = 0
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
      

    console.log("\n\n")

    return true
  } catch (error) {
    console.error('Failed to open serial port:', error)
    console.error("plug in USB anchor first")
    return false
  }
}

// will create a window of the web app
const createWindow = () => {
    // // Disable GPU
    // app.commandLine.appendSwitch('disable-gpu');

    // // Disable DevTools extensions to prevent some warnings
    // app.commandLine.appendSwitch('disable-extensions');

    // const win = new BrowserWindow({
    //     // not set to desired setting yet
    //     width: 800,
    //     height: 600,
    //     alwaysOnTop: true,
    //     // webPreferences: {
    //     //     nodeIntegration: false,
    //     //     contextIsolation: true,
    //     // }
    // })
  const win = new BrowserWindow({
    // not set to desired setting yet
    width: 1920,
    height: 1200,
    fullscreen: true,
  })

  if (isDev) {
    // if we are in dev mode, instead of loading the static files, load the url we are expecting
    // vite to be hosting the webpage at.
    win.loadURL('http://localhost:3000')
    win.webContents.openDevTools()
  } else {
    // load in the static html file
    win.loadFile(path.join(dirName, '../solidjs-dist/index.html'))
  }
}

// wait until electronjs is ready before some operations
app.whenReady().then(() => {
    setTimeout(() => createWindow(), 250)
    console.log("window created")
    
    // Initialize serial connection after window is created
    initSerialConnection()

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