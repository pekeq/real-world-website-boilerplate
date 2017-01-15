import {delay, $, $$, loadImage} from './utils.js'

const PageDispatcher = require('@yuheiy/page-dispatcher')

const dispatcher = new PageDispatcher()

dispatcher.on('home', () => {
  console.log('home')
})

dispatcher.on('about', () => {
  console.log('about')
})

const currentPageType = document.body.dataset.pageType
dispatcher.run(currentPageType)
