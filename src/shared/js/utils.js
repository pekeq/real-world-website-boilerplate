'use strict';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const wait = (delay = 0) => new Promise(done => setTimeout(done, delay));

module.exports = {
  $,
  $$,
  wait
};
