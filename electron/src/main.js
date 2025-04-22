import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { readFileSync, writeFileSync } from 'fs'

// get file structure information for accessing required files
const fileName = fileURLToPath(import.meta.url)
const dirName = dirname(fileName)

// determine if this was run with the dev tag.
const isDev = process.argv.includes('--mode=dev')

// Serial port connection
let serialConnection = null
// Initialize serial connection
function initSerialConnection() {
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
    parser.on('data', (line) => {
      console.log('Parsed line:', line)
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

  // export paths to json file for use later
  ipcMain.on('export-paths', async (event, paths) => {
    // open a dialog for the user to pick a file path to save to
    const { filePath, canceled } = dialog.showSaveDialog(win, {
      title: 'Export Path',
      defaultPath: path.join(app.getPath('documents'), 'paths.json'),
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    // if we have a good path, save the paths there as json
    if (!canceled && filePath) {
      writeFileSync(filePath, JSON.stringify(paths, null, 2), 'utf-8')
    }
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
}

// handler for when renderer requests to import paths
const importPaths = async (event) => {
  // get a reference to the window invoking this
  const win = BrowserWindow.fromWebContents(event.sender)

  // open a dialog to select the path to load in
  const { filePaths, canceled } = await dialog.showOpenDialog(win, {
    title: 'Import Paths',
    defaultPath: app.getPath('documents'),
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  })

  // if a path was selected, read it and return it back to the renderer
  if (!canceled && filePaths.length > 0) {
    return readFileSync(filePaths[0], 'utf-8')
  }
}

// wait until electronjs is ready before some operations
app.whenReady().then(() => {
  ipcMain.handle('import-paths', importPaths)
  createWindow()
  console.log('window created')

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
