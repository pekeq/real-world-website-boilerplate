export const wait = (delay = 0) => new Promise(done => setTimeout(done, delay))

// dom
export const $ = (selector, context = document) => context.querySelector(selector)
export const $$ = (selector, context = document) => context.querySelectorAll(selector)
