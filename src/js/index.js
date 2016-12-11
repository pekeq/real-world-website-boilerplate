// import './velocity-easings.js'
import {wait, $, $$} from './utils.js'

const PageDispatcher = require('@yuheiy/page-dispatcher')
// const Velocity = require('velocity-animate')

const dispatcher = new PageDispatcher()

dispatcher.on('home', () => {
  console.log('home')
})

dispatcher.on('about', () => {
  console.log('about')
})

const currentPageType = document.body.dataset.pageType
dispatcher.run(currentPageType)
