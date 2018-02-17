// transitioner is a class that transitions a value over time. When a new value is set (through setValue) it remembers the old value and the time at which the new value was set. Then, when the value is asked (through getValue) it properly transitions from the old value to the new value, based on the current time.
// The constructor gets a settings object with several properties.
// - transitionTime [default 400] is the time in milliseconds to apply the transition. Afterwards, the given value is simply returned.
// - transitionType [default 'ease'] is the type of transition. Only a limited number of types is supported so far, so if you need something, you may have to add it yourself first.

import { Bezier } from './util.js'

export default class Transitioner {
	constructor(settings) {
		this.settings = {
			transitionTime: 400,
			transitionType: 'ease',
			...settings,
		}
	}

	// setValue sets the value which the transitioner should move towards to. It returns the object itself, so you can use `value = new Transitioner().setValue(10)` or something similar.
	setValue(value) {
		// Check input.
		if (isNaN(value))
			throw new Error('Invalid data type: the transitioner was given a value that is not a number.')
		if (value === this.value)
			return

		// Store the value and remember the time.
		this.oldValue = this.getValue()
		this.value = value
		this.lastSetAt = performance.now()
		return this
	}

	getValue() {
		// Check some boundary cases.
		if (this.value === undefined)
			return undefined
		if (this.oldValue === undefined)
			return this.value

		// Return the right value, based on the part of the transition we should have already done.
		const part = this.getPart()
		return part * this.value + (1 - part) * this.oldValue
	}

	getPart() {
		if (this.lastSetAt === undefined)
			return 1

		// Check the time that has passed since setting the value.
		const dt = performance.now() - this.lastSetAt
		const part = dt / this.settings.transitionTime
		if (part >= 1)
			return 1

		// Check the transition function that is being used.
		switch (this.settings.transitionType) {
			case 'linear':
				return part
			case 'ease':
				return ease.get(part)
			case 'ease-in':
				return easeIn.get(part)
			case 'ease-out':
				return easeOut.get(part)
			case 'ease-in-out':
				return easeInOut.get(part)
			default:
				throw new Error(`Unknown transition type: the type "${this.settings.transitionType}" is not supported.`)
		}
	}
}

// Define some parameters for transitioning curves.
// For specific types of Bezier curves, see https://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp.
const ease = new Bezier(0.25, 0.1, 0.25, 1)
const easeIn = new Bezier(0.42, 0, 1, 1)
const easeOut = new Bezier(0, 0, 0.58, 1)
const easeInOut = new Bezier(0.42, 0, 0.58, 1)
