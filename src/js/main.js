'use strict'

import 'picturefill'
import './velocity-easings'
import PageDispatcher from '@yuheiy/page-dispatcher'
import Velocity from 'velocity-animate'

const dispatcher = new PageDispatcher()

dispatcher.on('home', () => {
  console.log('home')
})

dispatcher.on('about', () => {
  console.log('about')
})

window.App = {
  run(...args) {
    if (['interactive', 'complete'].includes(document.readyState)) {
      dispatcher.run(...args)
    } else {
      document.addEventListener(
        'DOMContentLoaded',
        () => dispatcher.run(...args),
        false
      )
    }
  }
}
