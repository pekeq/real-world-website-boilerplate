export const delay = (ms = 4) => new Promise(resolve => setTimeout(resolve, ms))

export const $ = (selector, context = document) => context.querySelector(selector)
export const $$ = (selector, context = document) => context.querySelectorAll(selector)

export const loadImage = imagePath => new Promise(resolve => {
  const image = new Image()
  image.addEventListener('load', () => resolve(image))
  image.src = imagePath
})
