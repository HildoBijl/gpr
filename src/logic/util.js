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