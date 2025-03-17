## Setup

Run `npm run install-all` instead of `npm install` to install all npm dependencies for the project.

Create the directory `electron/solidjs-dist`.

## Project Structure

The wepage code is within `app/`. This is a solidJS application. It builds into static files at `electron/solidjs-dist`.

The web application code is in `electron/`. This is where electronjs is used to manage windows and interaction with the host computer.

## Development Mode

To run the application in dev mode, use `npm run dev`. This will have vite host the webpage at `http://localhost:3000`. Electronjs will then use that url to load it's content. Changes to `app/` should apply without needing to restart the app. Changes in `electron/` will require the app to be restarted.

## Production Mode

Running `npm run start` will build the webpage's static files and display them in an electronjs web application.

## Building

Running `npm run build` will build the webpage's static files. Running `npm run make` will build the webpage's static files and create an executable at `electron/out/trilateration-gui-electron-win32-x64/trilateration-gui-electron.exe`.
