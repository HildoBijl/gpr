import { deepClone, getPosition, bound, getDistance, getMiddle, getEigenvalues } from '../logic/util.js'

// These are important settings.
const axes = ['x', 'y']
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
		initialZoomDistance: undefined, // When the user uses two fingers to pinch, this is the distance between the two fingers (touches). It is used to determine whether the fingers went closer together (zoom out) or further apart (zoom in).
		initialZoom: undefined, // The initial zoom present when the user starts pinching.
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
		evt,
	}),
	updateDragging: (evt) => ({
		type: 'UpdateTreeDragging',
		evt,
	}),
	endDragging: (evt) => ({
		type: 'EndTreeDragging',
		evt,
	}),
	startTouch: (evt) => ({
		type: 'StartTreeTouch',
		evt,
	}),
	updateTouch: (evt) => ({
		type: 'UpdateTreeTouch',
		evt,
	}),
	endTouch: (evt) => ({
		type: 'EndTreeTouch',
		evt,
	}),
	scroll: (evt) => ({
		type: 'TreeScroll',
		evt,
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
	let state = deepClone(originalState)
	switch (action.type) {
		case 'StartTreeDragging': {
			action.evt.preventDefault()
			return startDragging(state, getPosition(action.evt))
		}

		case 'UpdateTreeDragging': {
			action.evt.preventDefault()
			return updateDragging(state, getPosition(action.evt))
		}

		case 'EndTreeDragging': {
			// If there's no dragging going on, do nothing.
			if (!state.data.dragging)
				return originalState

			// Stop listening for mouse moves, and apply the final dragging position.
			action.evt.preventDefault()
			return endDragging(state, getPosition(action.evt))
		}

		case 'StartTreeTouch': {
			// Check the number of touches. If there's one, start dragging.
			if (action.evt.touches.length === 1) {
				action.evt.preventDefault()
				return startDragging(state, getPosition(action.evt.touches[0]))
			}

			// If there's two, stop dragging and start pinching.
			if (action.evt.touches.length === 2) {
				action.evt.preventDefault()
				const newTouch = action.evt.changedTouches[0]
				const oldTouch = Array.from(action.evt.touches).find(touch => touch.identifier !== newTouch.identifier)
				const stateWithoutDrag = endDragging(state, getPosition(oldTouch))
				return startPinching(stateWithoutDrag, getPosition(oldTouch), getPosition(newTouch))
			}

			// If there's three, stop pinching.
			if (action.evt.touches.length === 3) {
				const newTouch = action.evt.changedTouches[0]
				const oldTouches = Array.from(action.evt.touches).filter(touch => touch.identifier !== newTouch.identifier)
				return stopPinching(state, getPosition(oldTouches[0]), getPosition(oldTouches[1]))
			}

			// If there's more, do nothing.
			return originalState
		}

		case 'UpdateTreeTouch': {
			// Check the number of touches. If there's one, update the drag.
			if (action.evt.touches.length === 1 && state.data.dragging) {
				return updateDragging(state, getPosition(action.evt.touches[0]))
			}

			// If there's two, update the pinching.
			if (action.evt.touches.length === 2) {
				return updatePinching(state, getPosition(action.evt.touches[0]), getPosition(action.evt.touches[1]))
			}

			// If there's more, ignore it.
			return originalState
		}

		case 'EndTreeTouch': {
			// Check the number of touches. If there's zero, end the drag.
			if (action.evt.touches.length === 0 && state.data.dragging) {
				action.evt.preventDefault()
				return endDragging(state, getPosition(action.evt.changedTouches[0]))
			}
			
			// If there's one, start dragging.
			if (action.evt.touches.length === 1) {
				action.evt.preventDefault()
				return startDragging(state, getPosition(action.evt.touches[0]))
			}

			// If there's two, start pinching.
			if (action.evt.touches.length === 2) {
				action.evt.preventDefault()
				return startPinching(state, getPosition(action.evt.touches[0]), getPosition(action.evt.touches[1]))
			}

			// If there's more, do nothing.
			return originalState
		}

		case 'TreeScroll': {
			// If we're dragging, ignore any scrolls.
			if (state.data.dragging)
				return originalState

			// If there is a zoom command, adjust the zoom level.
			if (action.evt.altKey)
				return applyScrollZoom(state, action.evt)

			// There is a scroll command. Apply it.
			return applyScroll(state, action.evt)
		}

		// Adjust the visuals based on the state data. And update the state data itself while we're at it.
		case 'UpdateTreeVisuals': {
			// Check if we need an update. When nothing has happened, then we don't update.
			if (!state.data.requireUpdate)
				return originalState

			// Update the position and the velocity to what they should be at the current time. This only concerns the data part of the state.
			state = updatePositionVelocity(state)

			// Next, update the visuals. That is, calculate all the data that is needed to generate visuals. For this, first transfer the regular coordinates, with 0:0 meaning centered at the top and positive means right/down, to the css "left/top" coordinates, where 0:0 means being at the left top and positive means left/up.
			const position = getViewPosition(state)
			state.visuals = {
				position: position,
				zoom: state.data.zoom,
				dragging: state.data.dragging,
			}
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

// The dragging functions are used to position the tree, letting it follow the mouse or a touch.
function startDragging(state, clickPosition) {
	state.data.dragging = true
	state.data.initialPosition = deepClone(state.data.position) // Store the position of the tree when dragging started.
	state.data.clickPosition = clickPosition // Remember where we clicked, so we can calculate how much has been dragged.
	state.data.velocity = { x: 0, y: 0 } // Freeze any potential sliding of the tree.
	state.data.requireUpdate = true
	return state
}
function updateDragging(state, mousePosition) {
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

	// Arrange final stuff.
	state.data.position = newPosition
	state.data.requireUpdate = true
	return state
}
function endDragging(state, mousePosition) {
	// If there's no dragging, then don't do anything.
	if (!state.data.dragging)
		return state

	// Apply a final update to the state.
	state = updateDragging(state, mousePosition)

	// Set up a throwing effect. To do so, calculate the velocity that the tree had before ending the dragging.
	const reference = state.data.oldPositions[0]
	const time = new Date()
	const dt = time - new Date(reference.time)
	axes.forEach(axis => {
		state.data.velocity[axis] = dt > 0 ? (state.data.position[axis] - reference.position[axis]) / dt : 0
	})

	// Arrange final stuff.
	state.data.lastUpdateAt = time
	state.data.dragging = false
	return state
}

// applyScroll causes the position of the tree to be adjusted, based on a scroll event. So when the user scrolls, we fix that here.
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

// The pinching functions are used when the user puts two fingers (touches) down and brings them closer together (zoom out) or further apart (zoom in).
function startPinching(state, p1, p2) {
	const distance = getDistance(p1, p2)
	state.data.initialZoomDistance = distance
	state.data.initialZoom = state.data.zoom
	return state
}
function updatePinching(state, p1, p2) {
	const distance = getDistance(p1, p2)
	const newZoom = state.data.initialZoom*distance/state.data.initialZoomDistance
	const centerPoint = getMiddle(p1, p2)
	return setZoom(state, newZoom, centerPoint)
}
function stopPinching(state, p1, p2) {
	state = updatePinching(state, p1, p2)
	delete state.data.initialZoomDistance
	delete state.data.initialZoom
	return state 
}
// applyScrollZoom is called when the user scrolls with the scroll wheel and presses the right button to zoom.
function applyScrollZoom(state, evt) {
	// Arrange basics.
	state.data.velocity = { x: 0, y: 0 }
	evt.preventDefault()

	// Determine the new zoom level.
	if (evt.deltaY > 0)
		return setZoom(state, state.data.zoom/zoomFactor, getPosition(evt))
	return setZoom(state, state.data.zoom*zoomFactor, getPosition(evt))
}
// setZoom applies an actual zoom value.
function setZoom(state, zoom, centerPoint) {
	// Update the zoom value.
	const oldZoom = state.data.zoom
	const minZoom = Math.min(state.data.containerSize.x / state.data.size.x, state.data.containerSize.y / state.data.size.y)
	const newZoom = bound(zoom, minZoom, maxZoom)
	if (oldZoom === newZoom)
		return state

	// Our goal now is to adjust the position of the tree, to ensure that the mouse remains focused on the same point (the given centerpoint) while zooming. This feels more natural.
	axes.forEach(axis => {
		const containerLeftTopPosition = centerPoint[axis] - state.data.containerPosition[axis] // The position of the mouse within the container, in left/top coordinates.
		const containerPosition = (axis === 'x' ? containerLeftTopPosition - state.data.containerSize.x / 2 : containerLeftTopPosition) // The position of the mouse in the container in our own default coordinate system, with (0:0) being at the middle-top.
		const treePosition = (containerPosition + state.data.position[axis]) / oldZoom // The position of the mouse inside of the tree, independent of scaling, in our own default coordinate system.
		state.data.position[axis] = treePosition * newZoom - containerPosition // The new position of the tree inside the container.
	})

	// Arrange final stuff.
	state.data.zoom = newZoom
	state.data.requireUpdate = true
	return state
}

// updatePositionVelocity updates the position and velocity of the tree based on the given dynamics. So it lets it continue to float around, applying damping to its velocity, a spring effect at the boundary, etcetera.
function updatePositionVelocity(state) {
	// After an update, we don't need another one. (Unless stuff changes, and this is set to true again.)
	state.data.requireUpdate = false

	// If we're dragging, then don't need to do anything. The dragging handlers are taking care of updates.
	if (state.data.dragging)
		return state

	// Check the time since the last update.
	const time = new Date()
	const dt = time - new Date(state.data.lastUpdateAt)
	state.data.lastUpdateAt = time

	// Apply a position and velocity update. Do this individually, per axis.
	axes.forEach(axis => {
		let result = updateSingleAxisPositionVelocity({
			position: state.data.position[axis],
			velocity: state.data.velocity[axis],
			min: getMinCoordinate(state, axis),
			max: getMaxCoordinate(state, axis),
			dt,
		})
		state.data.position[axis] = result.position
		state.data.velocity[axis] = result.velocity
	})

	// If there is still a velocity, or we're not inside the rectangle, then apply more updates later.
	axes.forEach(axis => {
		state.data.requireUpdate = state.data.requireUpdate || 
			state.data.velocity[axis] !== 0 ||
			state.data.position[axis] < getMinCoordinate(state, axis) ||
			state.data.position[axis] > getMaxCoordinate(state, axis)
	})

	return state
}
function updateSingleAxisPositionVelocity({ position, velocity, min, max, dt }) {
	// If we're outside beyond max, flip the problem by an equivalent negative problem. Identically, if we're inside and going towards max, flip it to instead go towards min. This causes the minimum to be the only border that matters.
	if (position > max || (position >= min && velocity > 0)) {
		const equivalent = updateSingleAxisPositionVelocity({
			position: -position,
			velocity: -velocity,
			min: -max,
			max: -min,
			dt,
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
		// If we left the region, briefly pause at the border. This prevents a potential overshoot in case of too big time steps.
		if (result.position < min)
			result.position = min
		// If we're moving too slowly, stop moving.
		if (Math.abs(result.velocity) <= velocityThreshold)
			result.velocity = 0
	} else {
		// If we're outside but very close to a border and moving towards it, put us on the border and stop moving.
		if (!inside && Math.abs(result.position - min) <= positionThreshold && result.velocity > 0) {
			result.position = min
			result.velocity = 0
		}
	}

	return result
}

// getMinCoordinate and getMaxCoordinate return the minimum and maximum coordinates which the tree might have inside its container. Remember that the default position of the tree (position 0:0) means horizontally centered at the top. Negative x means slide to the left, positive x means slide to the right, negative y is impossible and positive y means slide downwards.
function getMinCoordinate(state, axis) {
	if (axis === 'y')
		return 0
	return -0.5 * Math.max(0, state.data.size.x * state.data.zoom - state.data.containerSize.x)
}
function getMaxCoordinate(state, axis) {
	if (axis === 'y')
		return Math.max(0, state.data.size.y * state.data.zoom - state.data.containerSize.y)
	return -getMinCoordinate(state, axis)
}
// getViewPosition returns the position of the tree in left/top coordinates, given the position in our regular coordinate system.
function getViewPosition(state) {
	return {
		x: -state.data.position.x - (state.data.size.x - state.data.containerSize.x) / 2,
		y: -state.data.position.y + (state.data.zoom - 1) * state.data.size.y / 2,
	}
}

// pullFunction tells us how the coordinate of the tree is adjusted when it is dragged (pulled) over an edge. If this function would be (diff) => diff, then it would be possible to pull the tree over the edge normally. But instead, we reduce the outcome in a smooth way, to give the appearance of some resistance.
function pullFunction(diff) {
	return dynamics.pullScale * Math.log(diff / dynamics.pullScale + 1)
}
