// deepClone gives a clone of an object, where every sub-object is also cloned.
export function deepClone(obj) {
	return JSON.parse(JSON.stringify(obj))
}

// getPosition returns the position at which an event occurred, as x-y-coordinates.
export function getPosition(evt) {
	return {
		x: evt.x || evt.clientX,
		y: evt.y || evt.clientY,
	}
}

// bound will give the closest number to x in the interval [min, max].
export function bound(x, min, max) {
	if (max < min)
		throw new Error(`The bound function was called with 'max' larger than 'min'.`)
	return Math.max(min, Math.min(max, x))
}