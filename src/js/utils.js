export const wait = (delay = 4) => new Promise(done => setTimeout(done, delay))

// dom
export const $ = (selector, context = document) => context.querySelector(selector)
export const $$ = (selector, context = document) => context.querySelectorAll(selector)

export const interactive = new Promise(resolve => {
  const EVENT_TYPE = 'readystatechange'

  const listener = () => {
    if (['interactive', 'complete'].includes(document.readyState)) {
      document.removeEventListener(EVENT_TYPE, listener)
      resolve()
    }
  }

  document.addEventListener(EVENT_TYPE, listener)
  listener()
})
