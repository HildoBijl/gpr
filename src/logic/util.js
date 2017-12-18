const axes = ['x','y']

// deepClone gives a clone of an object, where every sub-object is also cloned.
export function deepClone(obj) {
	return JSON.parse(JSON.stringify(obj))
}

// getPosition returns the position at which an event occurred, as x-y-coordinates.
export function getPosition(evt) {
	if (evt.x !== undefined)
		return { x: evt.x, y: evt.y }
	if (evt.clientX !== undefined)
		return { x: evt.clientX, y: evt.clientY }
	throw new Error('Could not get position from given event.')
}

// getWindowSize returns the size of the current viewport in a browser-compatible way. It may not always be fully accurate: if window.innerWidth (and height) doesn't work, it uses the document client width. This is a different width, as it doesn't measure any potential scroll bar that may appear. However, the CSS media width parameter does take into account the width including scroll bar. So then funny stuff may happen. Most browsers support innerWidth though, so we should be fine.
export function getWindowSize() {
	const body = document.body || document.getElementsByTagName('body')[0]
	return {
		x: window.innerWidth || document.documentElement.clientWidth || body.clientWidth,
		y: window.innerHeight|| document.documentElement.clientHeight|| body.clientHeight,
	}
}

// bound will give the closest number to x in the interval [min, max].
export function bound(x, min, max) {
	if (max < min)
		throw new Error(`The bound function was called with 'max' larger than 'min'.`)
	return Math.max(min, Math.min(max, x))
}

// getDistance returns the distance between two points.
export function getDistance(p1, p2) {
	return Math.sqrt(axes.reduce((sum,axis) => sum + (p1[axis] - p2[axis]) ** 2, 0))
}

// getMiddle returns the point in the middle between two points.
export function getMiddle(p1, p2) {
	const p = {}
	axes.forEach(axis => {
		p[axis] = (p1[axis] + p2[axis])/2
	})
	return p
}

// getEigenvalues returns the eigenvalues for a dynamic system "a*\ddot{x} + b*\dot{x} + c*\dot{x} = 0". The two eigenvalues are returned inside an array.
export function getEigenvalues(a, b, c) {
	const d = b ** 2 - 4 * a * c
	if (d <= 0)
		throw new Error('Warning: the motion determinant of the shifting field is not positive. This is not supported. Adjust the dynamics constants.')
	const dRoot = Math.sqrt(d)
	return [
		(-b + dRoot) / (2 * a),
		(-b - dRoot) / (2 * a),
	]
}