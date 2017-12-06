import { deepClone, getPosition, bound } from '../logic/util.js'

// These are important settings.
const axes = ['x','y']
const dynamics = {
	m: 1, // Mass
	bInside: .004, // Damping
	bOutside: .032, // Damping outside of the container, when the spring is extended.
	kOutside: 0.00016, // Spring constant at the page edges.
	pullScale: 16, // A constant to determine how hard/soft the edge of the page pulls against dragging. Smaller means a harder pull.
}
dynamics.lambdaInside = getEigenvalues(dynamics.m, dynamics.bInside, 0)
dynamics.lambdaOutside = getEigenvalues(dynamics.m, dynamics.bOutside, dynamics.kOutside)

const velocityFilterTime = 100 // Milliseconds. The time for which we remember drag positions, so that we can calculate the tree velocity later on.
const velocityThreshold = 0.01 // Pixels per millisecond. The speed below which we simply hard-stop the movement of the tree, to prevent having useless updates.
const positionThreshold = 0.5 // Pixels. When we get this close to an edge, we simply position the tree on the edge.

const zoomFactor = 1.1 // [-]. The amplification factor when zooming in/out on the tree.
const scrollAmount = 75 // Pixels. The amount of pixels you scroll for each tick of the scroll wheel.
const maxZoom = 2 // [-]. The maximum zoom factor.

const getDefaultState = () => ({
	data: {
		position: {
			x: 0,
			y: 0,
		},
		oldPositions: [], // We use this to store old positions, so we can obtain the velocity later of the dragger when needed.
		size: { // The original size of the tree object. Scaling is ignored. So even if we zoom in, the size remains the same.
			x: 0,
			y: 0,
		},
		containerSize: { // The size (width/height) of the container containing the tree. When the window is resized, this is adjusted.
			x: 0,
			y: 0,
		},
		containerPosition: { // The position of the container within the page (client).
			x: 0,
			y: 0,
		},
		velocity: {
			x: 0,
			y: 0,
		},
		dragging: false, // Are we dragging at the moment?
		lastUpdateAt: new Date(), // The last time we updated the position of the tree. This is necessary during free floating, to apply the right size time steps.
		zoom: 1, // The zoom level. 1 means no zoom, 2 means amplification to double size, 0.5 means zooming out to half size.
		requireUpdate: true, // A boolean to indicate whether something has changed in the data, requiring an update of the visuals.
	},
	visuals: {
		position: {
			x: 0,
			y: 0,
		},
		zoom: 1,
		dragging: false,
	},
})

/*
 * First, set up the actions changing things.
 */
const actions = {
	startDragging: (evt) => ({
		type: 'StartTreeDragging',
		evt: evt,
	}),
	updateDragging: (evt) => ({
		type: 'UpdateTreeDragging',
		evt: evt,
	}),
	endDragging: (evt) => ({
		type: 'EndTreeDragging',
		evt: evt,
	}),
	scroll: (evt) => ({
		type: 'TreeScroll',
		evt: evt,
	}),
	updateVisuals: () => ({
		type: 'UpdateTreeVisuals',
	}),
	updateSize: (size) => ({
		type: 'UpdateTreeSize',
		size,
	}),
	updateContainerSize: (size, position) => ({
		type: 'UpdateTreeContainerSize',
		size,
		position,
	}),
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(originalState = getDefaultState(), action) {
	const state = deepClone(originalState)
	switch (action.type) {
		case 'StartTreeDragging': {
			state.data.dragging = true
			state.data.initialPosition = deepClone(state.data.position) // Store the position of the tree when dragging started.
			state.data.clickPosition = getPosition(action.evt) // Remember where we clicked, so we can calculate how much has been dragged.
			state.data.velocity = { x: 0, y: 0 } // Freeze the sliding of the tree.
			state.data.requireUpdate = true
			return state
		}

		case 'UpdateTreeDragging': {
			return applyDragPosition(state, getPosition(action.evt))
		}

		case 'EndTreeDragging': {
			// If there's no dragging going on, do nothing.
			if (!state.data.dragging)
				return originalState

			// Stop listening for mouse moves, and apply the final dragging position.
			return applyDragPosition(state, getPosition(action.evt), true)
		}

		case 'TreeScroll': {
			// If we're dragging, ignore any scrolls.
			if (state.data.dragging)
				return originalState

			// If there is a zoom command, adjust the zoom level.
			if (action.evt.altKey)
				return applyZoom(state, action.evt)

			// There is a scroll command. Apply it.
			return applyScroll(state, action.evt)
		}

		// Adjust the visuals based on the state data. And update the state data itself while we're at it.
		case 'UpdateTreeVisuals': {
			// Check if we need an update. When we're not dragging, and there's no velocity, we don't.
			if (!state.data.requireUpdate)
				return originalState

			// Check the time since the last update.
			const time = new Date()
			const dt = time - new Date(state.data.lastUpdateAt)
			state.data.lastUpdateAt = time

			// If the tree is free-floating, apply a position and velocity update. Do this individually, per axis.
			if (!state.data.dragging) {
				['x', 'y'].forEach(axis => {
					let result = updatePositionVelocity({
						position: state.data.position[axis],
						velocity: state.data.velocity[axis],
						min: getMinCoordinate(state, axis),
						max: getMaxCoordinate(state, axis),
						dt,
						axis,
					})
					state.data.position[axis] = result.position
					state.data.velocity[axis] = result.velocity
				})
			}

			// Update the state that is being displayed. For this, first transfer the regular coordinates (0:0 means centered at the top) to the css "left/top" coordinates, where 0:0 means being at the left top.
			const position = getViewPosition(state)
			state.visuals = {
				position: position,
				zoom: state.data.zoom,
				dragging: state.data.dragging,
			}

			// If there is still a velocity, or we're not inside the rectangle, continue updating.
			state.data.requireUpdate = (
				state.data.velocity.x !== 0 ||
				state.data.velocity.y !== 0 ||
				state.data.position.x < getMinCoordinate(state, 'x') ||
				state.data.position.y < getMinCoordinate(state, 'y') ||
				state.data.position.x > getMaxCoordinate(state, 'x') ||
				state.data.position.y > getMaxCoordinate(state, 'y')
			)
			return state
		}

		case 'UpdateTreeSize': {
			state.data.size = action.size
			state.data.requireUpdate = true
			return state
		}

		case 'UpdateTreeContainerSize': {
			state.data.containerSize = action.size
			state.data.containerPosition = action.position
			state.data.requireUpdate = true
			return state
		}

		default: {
			return originalState
		}
	}
}

// applyDragPosition puts the tree in the position specified by the mouse, when dragging.
function applyDragPosition(state, mousePosition, finalUpdate) {
	// If there's no dragging, then don't do anything.
	if (!state.data.dragging)
		return state

	// Calculate the new position.
	const newPosition = {}
	axes.forEach(axis => {
		newPosition[axis] = state.data.initialPosition[axis] - (mousePosition[axis] - state.data.clickPosition[axis])
	})

	// If the new position is outside of the range, adjust it.
	axes.forEach(axis => {
		const min = getMinCoordinate(state, axis)
		const max = getMaxCoordinate(state, axis)
		if (newPosition[axis] < min) {
			const difference = min - newPosition[axis]
			newPosition[axis] = min - pullFunction(difference)
		} else if (newPosition[axis] > max) {
			const difference = newPosition[axis] - max
			newPosition[axis] = max + pullFunction(difference)
		}
	})

	// Clear the position storage from old positions and add the new position to it.
	const time = new Date()
	const oldPositions = state.data.oldPositions
	while (oldPositions.length > 0 && time - new Date(oldPositions[0].time) > velocityFilterTime) {
		oldPositions.shift()
	}
	oldPositions.push({
		position: newPosition,
		time,
	})

	// If this is the last update, also calculate the velocity.
	const dt = time - new Date(oldPositions[0].time)
	if (finalUpdate) {
		state.data.dragging = false
		state.data.lastUpdateAt = time
		if (dt > 0) {
			axes.forEach(axis => {
				state.data.velocity[axis] = (newPosition[axis] - oldPositions[0].position[axis]) / dt
			})
		}
	}

	// Arrange final stuff.
	state.data.position = newPosition
	state.data.requireUpdate = true
	return state
}

function applyZoom(state, evt) {
	// Determine the new zoom level.
	const oldZoom = state.data.zoom
	if (evt.deltaY > 0)
		state.data.zoom /= zoomFactor
	else
		state.data.zoom *= zoomFactor
	const minZoom = Math.min(state.data.containerSize.x/state.data.size.x, state.data.containerSize.y/state.data.size.y)
	state.data.zoom = bound(state.data.zoom, minZoom, maxZoom)
	if (state.data.zoom === oldZoom)
		return state

	// Our goal now is to adjust the position of the tree, to ensure that the mouse remains focused on the same point while zooming. This feels more natural. For this, first find the coordinates within the container where the mouse resides. Then adjust the tree position accordingly.
	const mousePosition = getPosition(evt)
	const newZoom = state.data.zoom
	axes.forEach(axis => {
		const containerLeftTopPosition = mousePosition[axis] - state.data.containerPosition[axis] // The position of the mouse within the container, in left/top coordinates.
		const containerPosition = (axis === 'x' ? containerLeftTopPosition - state.data.containerSize.x/2 : containerLeftTopPosition) // The position of the mouse in the container in our own default coordinate system, with (0:0) being at the middle-top.
		const treePosition = (containerPosition + state.data.position[axis])/oldZoom // The position of the mouse inside of the tree, independent of scaling, in our own default coordinate system.
		state.data.position[axis] = treePosition*newZoom - containerPosition // The new position of the tree inside the container.
	})

	// Arrange final stuff.
	state.data.velocity = { x: 0, y: 0 }
	state.data.requireUpdate = true
	evt.preventDefault()
	return state
}

function applyScroll(state, evt) {
	// Check whether we need to adjust the coordinates horizontally or vertically.
	const scroll = evt.deltaY > 0 ? -scrollAmount : scrollAmount
	if (evt.ctrlKey) {
		const min = getMinCoordinate(state, 'x')
		const max = getMaxCoordinate(state, 'x')
		state.data.position.x = bound(state.data.position.x + scroll, min, max)
	} else {
		const min = getMinCoordinate(state, 'y')
		const max = getMaxCoordinate(state, 'y')
		state.data.position.y = bound(state.data.position.y + scroll, min, max)
	}

	// Arrange final stuff.
	state.data.velocity = { x: 0, y: 0 }
	state.data.requireUpdate = true
	evt.preventDefault()
	return state
}

function updatePositionVelocity({ position, velocity, min, max, dt, axis }) {
	// If we're beyond max, flip the problem by an equivalent negative problem. Identically, if we're inside and going towards max, flip it to instead go towards min. This causes the minimum to be the only border that matters.
	if (position > max || (position >= min && velocity > 0)) {
		const equivalent = updatePositionVelocity({
			position: -position,
			velocity: -velocity,
			min: -max,
			max: -min,
			dt,
			axis,
		})
		return {
			position: -equivalent.position,
			velocity: -equivalent.velocity,
		}
	}

	// So now we can assume that the minimum is the only border that counts. Determine whether we're inside this bound or outside of it.
	let inside = false
	if (position > min || (position === min && velocity > 0))
		inside = true

	// Find the eigenvalues and the coefficients for the motion equation, and use them to come up with the new position and velocity.
	const lambda = inside ? dynamics.lambdaInside : dynamics.lambdaOutside
	const c = [
		(lambda[1] * (position - min) - velocity) / (lambda[1] - lambda[0]),
		(lambda[0] * (position - min) - velocity) / (lambda[0] - lambda[1]),
	]
	let result = {
		position: min + c[0] * Math.exp(lambda[0] * dt) + c[1] * Math.exp(lambda[1] * dt),
		velocity: c[0] * lambda[0] * Math.exp(lambda[0] * dt) + c[1] * lambda[1] * Math.exp(lambda[1] * dt),
	}

	// Finally handle some edge cases. They depend on whether we're inside or outside the area.
	if (inside) {
		// If we left the region, briefly pause at the border. This prevents a large overshoot in case of too big time steps.
		if (result.position < min)
			result.position = min
		// If we're moving too slowly, stop moving.
		if (Math.abs(result.velocity) <= velocityThreshold)
			result.velocity = 0
	} else {
		// If we're outside but very close to a border, put us on the border and stop moving.
		if (!inside && Math.abs(result.position - min) <= positionThreshold) {
			result.position = min
			result.velocity = 0
		}
	}

	return result
}

// getEigenvalues returns the eigenvalues for a dynamic system "a*\ddot{x} + b*\dot{x} + c*\dot{x} = 0". The two eigenvalues are returned inside an array.
function getEigenvalues(a, b, c) {
	const d = b ** 2 - 4 * a * c
	if (d <= 0)
		throw new Error('Warning: the motion determinant of the shifting field is not positive. This is not supported. Adjust the dynamics constants.')
	const dRoot = Math.sqrt(d)
	return [
		(-b + dRoot) / (2 * a),
		(-b - dRoot) / (2 * a),
	]
}

// getMinCoordinate and getMaxCoordinate return the minimum and maximum coordinates which the tree might have inside its container. Remember that the default position of the tree (position 0:0) means horizontally centered at the top. Negative x means slide to the left, positive x means slide to the right, negative y is impossible and positive y means slide downwards.
function getMinCoordinate(state, axis) {
	if (axis === 'y')
		return 0
	return -0.5*Math.max(0, state.data.size.x*state.data.zoom - state.data.containerSize.x)
}
function getMaxCoordinate(state, axis) {
	if (axis === 'y')
		return Math.max(0, state.data.size.y*state.data.zoom - state.data.containerSize.y)
	return -getMinCoordinate(state, axis)
}
// getViewPosition returns the position of the tree in left/top coordinates, given the position in our regular coordinate system.
function getViewPosition(state) {
	return {
		x: -state.data.position.x - (state.data.size.x - state.data.containerSize.x)/2,
		y: -state.data.position.y + (state.data.zoom - 1)*state.data.size.y/2,
	}
}

// pullFunction tells us how the coordinate of the tree is adjusted when it is dragged (pulled) over an edge. If this function would be (diff) => diff, then it would be possible to pull the tree over the edge normally. But instead, we reduce the outcome in a smooth way, to give the appearance of some resistance.
function pullFunction(diff) {
	return dynamics.pullScale*Math.log(diff/dynamics.pullScale + 1)
}

/*
 * Third, set up getter functions for various useful parameters.
 */

