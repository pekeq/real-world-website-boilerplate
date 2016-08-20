'use strict';
require('core-js');
require('shared-js/velocity-easings');
const Dispatcher = require('@yuheiy/page-dispatcher');

const dispatcher = new Dispatcher();
const home = () => {
  const Velocity = require('velocity-animate');
  const ScrollMagic = require('scrollmagic');
  const {$} = require('shared-js/utils');
  const controller = new ScrollMagic.Controller();

  // do stuff...
};

dispatcher.on('home', home);

window.ProjectNameSpace = {
  run(...args) {
    if (document.readyState === 'loading') {
      document.addEventListener(
        'DOMContentLoaded',
        dispatcher.run.bind(dispatcher, ...args)
      );
    } else {
      dispatcher.run(...args);
    }
  }
}
