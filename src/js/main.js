// import './velocity-easings.js'
import {wait, $, $$, interactive} from './utils.js'

require('picturefill')
const PageDispatcher = require('@yuheiy/page-dispatcher')
// const Velocity = require('velocity-animate')

const dispatcher = new PageDispatcher()

dispatcher.on('home', () => {
  console.log('home')
})

dispatcher.on('about', () => {
  console.log('about')
})

window.App = class App {
  static async run(...args) {
    await interactive
    return dispatcher.run(...args)
  }
}
