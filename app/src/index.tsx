/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')
if (root !== null) {
  root.style.margin = '0%'
  root.style.padding = '0%'
}

render(() => <App />, root!)
