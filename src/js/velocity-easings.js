/*
Expand easings of velocity.
Those easings can be used.

- easeInElastic
- easeOutElastic
- easeInOutElastic
- easeInBack
- easeOutBack
- easeInOutBack
- easeInBounce
- easeOutBounce
- easeInOutBounce
*/
'use strict';

import Velocity from 'velocity-animate'

const baseEasings = {}

baseEasings.Elastic = p => p === 0 || p === 1
  ? p
  : - Math.pow(2, 8 * (p - 1)) *
      Math.sin (((p - 1) * 80 - 7.5) * Math.PI / 15)

baseEasings.Back = p => p * p * (3 * p - 2)

baseEasings.Bounce = p => {
  let pow2
  let bounce = 4
  while (p < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {}
  return 1 / Math.pow(4, 3 - bounce) - 7.5625 *
    Math.pow((pow2 * 3 - 2) / 22 - p, 2)
}

for (const [name, easeIn] of Object.entries(baseEasings)) {
  Velocity.Easings[`easeIn${name}`] = easeIn
  Velocity.Easings[`easeOut${name}`] = p => 1 - easeIn(1 - p)
  Velocity.Easings[`easeInOut${name}`] = p => p < 0.5
    ? easeIn(p * 2) / 2
    : 1 - baseEasings[name](p * -2 + 2) / 2
}
