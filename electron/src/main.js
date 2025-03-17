import { app, BrowserWindow } from "electron"
import path, { dirname } from 'path'
import { fileURLToPath } from "url"
import { session } from "electron"

// get file structure information for accessing required files
const fileName = fileURLToPath(import.meta.url)
const dirName = dirname(fileName)

// determine if this was run with the dev tag.
const isDev = process.argv.includes('--mode=dev')

// will create a window of the web app
const createWindow = () => {
    const win = new BrowserWindow({
        // not set to desired setting yet
        width: 800,
        height: 600,
        alwaysOnTop: true,
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
    // WIP: set up project to avoid security warnings
    // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    //     callback({
    //         responseHeaders: {
    //             ...details.responseHeaders,
    //             'Content-Security-Policy': ['default-src \'localhost\'']
    //         }
    //     })
    // })

    // start the app by creating a window
    createWindow()

    app.on('activate', () => {
        // if the app is activated but there are no windows, create a window
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    // if all windows are closed, quit the application
    // (unless you are on a mac)
    if (process.platform !== 'darwin') app.quit()
})
