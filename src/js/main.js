// import './velocity-easings.js'
import {interactive} from 'document-promises'
import {$, $$} from './utils.js'

require('picturefill')
const PageDispatcher = require('@yuheiy/page-dispatcher')
const Velocity = require('velocity-animate')

const dispatcher = new PageDispatcher()

dispatcher.on('home', () => {
  console.log('home')
})

dispatcher.on('about', () => {
  console.log('about')
})

window.App = class App {
  static run(...args) {
    interactive.then(() => dispatcher.run(...args))
  }
}
