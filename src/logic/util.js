// This is a random utility file, containing a not necessarily related assortment of useful functions.

const axes = ['x', 'y']

// isObject checks if a parameter is an object.
export function isObject(item) {
	return (item && typeof item === 'object' && !Array.isArray(item));
}

// deepClone gives a clone of an object, where every sub-object is also cloned.
export function deepClone(obj) {
	return JSON.parse(JSON.stringify(obj))
}

// deepMerge merges objects, where sub-objects are also merged. The result will be a clone (but not necessarily a deep clone). Original objects are not modified. When objects share a parameter, later objects passed along as parameter will always win.
export function deepMerge(...objects) {
	// Check parameters.
	objects.forEach(obj => {
		if (!isObject(obj))
			throw new Error('Invalid objects: tried to deepMerge objects, but at least one of them was not an actual object.')
	})

	// If there is only one object, there is nothing to be done.
	if (objects.length === 1)
		return { ...objects[0] }
	
	// If there are multiple objects, merge pairs together one by one.
	if (objects.length > 2) {
		let merger = {}
		objects.forEach(obj => {
			merger = deepMerge(merger, obj)
		})
		return merger
	}

	// If there are two objects, merge them together in the usual way.
	const a = objects[0], b = objects[1]
	const merger = { ...a }
	Object.keys(b).forEach(key => {
		if (isObject(b[key]) && (key in a) && isObject(a[key]))
			merger[key] = deepMerge(a[key], b[key]) // Recursively merge sub-objects.
		else
			merger[key] = b[key] // Maybe a doesn't have this key. Maybe a does, but in this case b simply wins and overwrites the result. Or maybe one of the values isn't an object, in which case b still wins.
	})
	return merger
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
		y: window.innerHeight || document.documentElement.clientHeight || body.clientHeight,
	}
}

// applyFunction will apply the given function to each of the elements of the given array.
export function applyFunction(fun, arr) {
	if (typeof fun !== 'function')
		throw new Error('The given function was not a function.')
	if (!Array.isArray(arr))
		throw new Error('The given array was not an array.')
	return arr.map(v => fun(v))
}

// applyFunctionToPairs will apply the given function to each pair of the elements from the given array(s). The result will be a two-dimensional array (matrix). If only one array is given, the second array is assumed to be equal to the first, and the resulting matrix will be symmetrical.
export function applyFunctionToPairs(fun, arr1, arr2) {
	// Check the input.
	if (typeof (fun) !== 'function')
		throw new Error('The given function was not a function.')
	if (!Array.isArray(arr1))
		throw new Error('The given array was not an array.')
	if (arr2 === undefined)
		arr2 = arr1
	if (!Array.isArray(arr2))
		throw new Error('The second given array was not an array.')

	// Process the result.
	return arr1.map(v1 => applyFunction((v2) => fun(v1, v2), arr2))
}

// bound will give the closest number to x in the interval [min, max].
export function bound(x, min, max) {
	if (max < min)
		throw new Error(`The bound function was called with 'max' larger than 'min'.`)
	return Math.max(min, Math.min(max, x))
}

// getRange(min, max, numPoints) return an array with numPoints numbers, equally distributed between min and max. For instance, getRange(3,9,5) will give [3, 4.5, 6, 7.5, 9].
export function getRange(min, max, numPoints) {
	return (new Array(numPoints)).fill(0).map((v, i) => min + (max - min) * i / (numPoints - 1))
}

// getDistance returns the distance between two points.
export function getDistance(p1, p2) {
	return Math.sqrt(axes.reduce((sum, axis) => sum + (p1[axis] - p2[axis]) ** 2, 0))
}

// getMiddle returns the point in the middle between two points.
export function getMiddle(p1, p2) {
	const p = {}
	axes.forEach(axis => {
		p[axis] = (p1[axis] + p2[axis]) / 2
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

// Bezier returns the position on a Bezier curve with the given coordinates. Usage is through `let bezier = new Bezier(0.25,0,0.25,1); bezier.get(part);`. See http://greweb.me/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/ for background.
export function Bezier(mX1, mY1, mX2, mY2) {
	this.get = function (aX) {
		if (mX1 === mY1 && mX2 === mY2) return aX; // linear
		return CalcBezier(GetTForX(aX), mY1, mY2);
	}

	function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
	function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
	function C(aA1) { return 3.0 * aA1; }

	// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
	function CalcBezier(aT, aA1, aA2) {
		return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
	}

	// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
	function GetSlope(aT, aA1, aA2) {
		return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
	}

	function GetTForX(aX) {
		// Newton raphson iteration
		var aGuessT = aX;
		for (var i = 0; i < 4; ++i) {
			var currentSlope = GetSlope(aGuessT, mX1, mX2);
			if (currentSlope === 0.0) return aGuessT;
			var currentX = CalcBezier(aGuessT, mX1, mX2) - aX;
			aGuessT -= currentX / currentSlope;
		}
		return aGuessT;
	}
}