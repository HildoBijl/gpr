import { deepClone, getPosition, bound, getDistance, getMiddle, getEigenvalues, Bezier } from '../logic/util.js'
import { phoneLandscapeWidth } from '../ui/shared/params.js'
import chapters, { size, treeRect } from '../ui/pages/chapters'

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

const maxClickDrag = 10 // Pixels. The maximum number of pixels which the user can drag over while it's still considered to be a click.
const targetingTime = 400 // Milliseconds. The number of milliseconds we take to put the screen on top of a chapter block that just got activated.
const easer = new Bezier(0.25,0,0,1) // A function that allows is to approximate a Bezier curve. It's used for making the targeting go smoothly.

const getDefaultState = () => ({
	data: {
		position: {
			x: 0,
			y: 0,
		},
		oldPositions: [], // We use this to store old positions, so we can obtain the velocity later of the dragger when needed.
		windowSize: { // The size of the window. This can be used to adjust the zoom factor. Smartphones may want to have a smaller tree than huge desktop screens. We assume a certain width of the screen. If it turns out to be different (e.g. smaller) than the script may adjust the zoom factor to compensate.
			x: 1200,
			y: 900,
		},
		descriptionHeights: {}, // For every chapter, we keep track of how high the description field is. This is needed to expand the tree rectangle when one of the lower blocks gets its description shown.
		containerRect: { // The rectangle of the container containing the tree, in client (screen) coordinates. When the window is resized, this rectangle is adjusted.
			width: 0,
			height: 0,
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
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
		validClick: false, // When the mouse goes down (or a touch starts) the user may be clicking on a chapter or dragging the screen. We're going to keep track of whether it's the first or the latter. It's not a click when the user drags the mouse/finger for more than the specified threshold. In that case we set validClick to false, and any subsequent mouseUp event is not considered a click.
		activeChapter: undefined, // The name of the chapter that's currently active. If undefined, no chapter is active.
		previousActiveChapter: undefined, // The name of the chapter that was previously active. We use this to make sure the hiding of chapters also has proper styling.
		targeting: null, // When the user activates a chapter, we need to move the screen there in a smooth way. This object arranges that. It will get the properties 'oldPosition' (the position the screen was at, at the time of the click), 'startTime' (the time of the click) and 'target' (the target position we need to put the screen at).
	},
	visuals: {
		position: {
			x: 0,
			y: 0,
		},
		zoom: 1,
		dragging: false,
		activeChapter: undefined,
		validClick: false,
		treeRect: {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
			width: 0,
			height: 0,
		},
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
	clickChapterTitle: (name, evt) => ({
		type: 'ClickTreeChapterTitle',
		name,
		evt,
	}),
	clickChapterDescription: (name, evt) => (
		(dispatch, getState) => {
			// If there is not a valid click (the user drags instead of clicks) then do nothing.
			if (!getState().tree.data.validClick)
				return
			// Deal with the mouseup or endtouch event in the regular way.
			if (evt.type === 'mouseup') {
				dispatch({
					type: 'EndTreeDragging',
					evt,
				})
			} else {
				dispatch({
					type: 'EndTreeTouch',
					evt,
				})
			}
			// Go to the chapter page.
			dispatch({
				type: 'CHAPTER',
				payload: {
					chapter: name,
					section: 1, // TODO: Potentially remove this, and let the chapter figure out which section to go to.
				}
			})
		}
	),
	updateVisuals: () => ({
		type: 'UpdateTreeVisuals',
	}),
	updateWindowSize: (size) => ({
		type: 'UpdateWindowSize',
		size,
	}),
	updateDescriptionHeights: (descriptionHeights) => ({
		type: 'UpdateTreeDescriptionHeights',
		descriptionHeights,
	}),
	updateContainerRect: (rect) => ({
		type: 'UpdateTreeContainerRect',
		rect,
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

			// If, after the dragging, we still have a valid click, then the user didn't really drag but only click. This means that we need to deactivate whatever chapter was active.
			if (state.data.validClick && !action.evt.processedByTree) {
				state.data.previousActiveChapter = state.data.activeChapter
				state.data.activeChapter = undefined
			}

			// Apply the final dragging position.
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
				// If, after the dragging, we still have a valid click, then the user didn't really drag but only click. This means that we need to deactivate whatever chapter was active.
				if (state.data.validClick && !action.evt.processedByTree) {
					state.data.previousActiveChapter = state.data.activeChapter
					state.data.activeChapter = undefined
				}

				// End the dragging.
				action.evt.preventDefault()
				return endDragging(state, getPosition(action.evt.changedTouches[0]))
			}

			// If there's one, start dragging.
			if (action.evt.touches.length === 1) {
				action.evt.preventDefault()
				state = startDragging(state, getPosition(action.evt.touches[0]))
				state.data.validClick = false
				return state
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
			if (!action.evt.shiftKey && !action.evt.ctrlKey)
				return applyScrollZoom(state, action.evt)

			// There is a scroll command. Apply it.
			return applyScroll(state, action.evt)
		}

		case 'ClickTreeChapterTitle': {
			// Check if it is a valid click. That is, the mouse didn't move a lot after going down. If not, do nothing.
			if (!state.data.validClick)
				return originalState

			// If the given chapter was active, deactivate it. Otherwise activate it.
			if (state.data.activeChapter === action.name) {
				state.data.previousActiveChapter = state.data.activeChapter
				state.data.activeChapter = undefined
			} else {
				state.data.previousActiveChapter = state.data.activeChapter
				state.data.activeChapter = action.name

				// Set up targeting data, to center the screen at the given target. Most importantly, set up the target position.
				const chapter = chapters[state.data.activeChapter]
				const descriptionHeight = state.data.descriptionHeights[state.data.activeChapter]
				if (chapter && descriptionHeight) {
					const availableHeight = state.data.containerRect.height/state.data.zoom
					const blockHeight = size.y + descriptionHeight
					state.data.targeting = {
						oldPosition: deepClone(state.data.position),
						startTime: new Date(),
						target: {
							x: bound(
								chapter.position.x*state.data.zoom,
								getMinCoordinate(state, 'x'),
								getMaxCoordinate(state, 'x'),
							),
							y: bound(
								(chapter.position.y - Math.max(0, (availableHeight - blockHeight)/2))*state.data.zoom,
								getMinCoordinate(state, 'y'),
								getMaxCoordinate(state, 'y'),
							),
						},
					}
				}
			}
			action.evt.processedByTree = true // Remember in the event object that we already saw it pass by.
			return state
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
				activeChapter: state.data.activeChapter,
				previousActiveChapter: state.data.previousActiveChapter,
				validClick: state.data.validClick,
				treeRect: getCurrentTreeRect(state),
			}
			return state
		}

		case 'UpdateWindowSize': {
			// Determine by how much we need to adjust the zoom factor.
			const oldSize = state.data.windowSize
			const newSize = action.size
			let factor = 1
			const screenWasSmall = oldSize.x <= phoneLandscapeWidth
			const screenIsSmall = newSize.x <= phoneLandscapeWidth
			if (screenWasSmall && !screenIsSmall) {
				factor *= 1.2
			} else if (!screenWasSmall && screenIsSmall) {
				factor /= 1.2
			}

			// Adjust the zoom factor, if necessary.
			if (factor !== 1) {
				const centerPoint = { // As center-point for our zoom, we use the point at the top middle of the container rectangle.
					x: state.data.containerRect.left + state.data.containerRect.width / 2,
					y: state.data.containerRect.top,
				}
				state = setZoom(state, state.data.zoom * factor, centerPoint)
			}

			// Remember the new window size.
			state.data.windowSize = deepClone(action.size)
			return state
		}

		case 'UpdateTreeDescriptionHeights': {
			state.data.descriptionHeights = {
				...state.data.descriptionHeights,
				...action.descriptionHeights,
			}
			state.data.requireUpdate = true
			return state
		}

		case 'UpdateTreeContainerRect': {
			state.data.containerRect = deepClone(action.rect)
			state.data.requireUpdate = true
			return state
		}

		case 'TREE': { // When we get to this page, make sure that some parameters have default values, which they might not have if the user already visited the tree before.
			state.data.dragging = false
			state.data.validClick = false
			state.data.activeChapter = undefined
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
	state.data.validClick = true // Note that this drag could also still be a click.
	state.data.targeting = null // If we start dragging, there is no need to automatically converge to a target anymore. The user takes control.
	return state
}
function updateDragging(state, mousePosition) {
	// If there's no dragging, then don't do anything.
	if (!state.data.dragging)
		return state

	// Check if the user has been dragging so much that we cannot consider the mouse-down-and-up a valid click anymore.
	if (state.data.validClick && getDistance(mousePosition, state.data.clickPosition) > maxClickDrag)
		state.data.validClick = false

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
	if (evt.shiftKey) {
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
	state.data.validClick = false // Make sure that none of the touches will count as a click in any way.
	return state
}
function updatePinching(state, p1, p2) {
	const distance = getDistance(p1, p2)
	const newZoom = state.data.initialZoom * distance / state.data.initialZoomDistance
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
		return setZoom(state, state.data.zoom / zoomFactor, getPosition(evt))
	return setZoom(state, state.data.zoom * zoomFactor, getPosition(evt))
}
// setZoom applies an actual zoom value.
function setZoom(state, zoom, centerPoint) {
	// Update the zoom value.
	const oldZoom = state.data.zoom
	const currentTreeRect = getCurrentTreeRect(state)
	const minZoom = Math.min(state.data.containerRect.width / currentTreeRect.width, state.data.containerRect.height / currentTreeRect.height)
	const newZoom = bound(zoom, minZoom, maxZoom)
	if (oldZoom === newZoom)
		return state

	// Our goal now is to adjust the position of the tree, to ensure that the mouse remains focused on the same point (the given centerpoint) while zooming. This will make the zooming feel natural.
	axes.forEach(axis => {
		const containerLeftTopPosition = centerPoint[axis] - state.data.containerRect[axis === 'x' ? 'left' : 'top'] // The position of the mouse within the container, in left/top coordinates.
		const containerPosition = (axis === 'x' ? containerLeftTopPosition - state.data.containerRect.width / 2 : containerLeftTopPosition) // The position of the mouse in the container in our own default coordinate system, with (0:0) being at the middle-top.
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

	// Check if there is a target. 
	if (state.data.targeting) {
		// Find the time passed since the target was established (as a fraction of the total time) and check if we should already be at the target.
		const t = (time - new Date(state.data.targeting.startTime))/targetingTime
		if (t > 1) { // The targeting is done.
			state.data.position = deepClone(state.data.targeting.target)
			state.data.targeting = null
			return state
		}

		// Apply easing to get to the right spot.
		const partTraveled = easer.get(t)
		axes.forEach(axis => {
			const oldPosition = state.data.targeting.oldPosition[axis]
			const newPosition = state.data.targeting.target[axis]
			state.data.position[axis] = oldPosition + partTraveled*(newPosition - oldPosition)
		})
		state.data.requireUpdate = true
		return state
	}

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

// getMinCoordinate and getMaxCoordinate return the minimum and maximum coordinates which the tree might have inside its container. Remember that the default position of the tree (position 0:0) means that the (0:0) point defined in the tree is at the center in the top. Negative x means slide to the left, positive x means slide to the right, negative y is impossible (unless there are tree blocks there) and positive y means slide downwards. We also do some bounding to ensure that, if the user zooms out a lot, we don't get max bounds smaller than min bounds.
function getMinCoordinate(state, axis) {
	const currentTreeRect = getCurrentTreeRect(state)
	if (axis === 'y') {
		return currentTreeRect.top * state.data.zoom
	}
	const minX = currentTreeRect.left * state.data.zoom + state.data.containerRect.width / 2
	const maxX = currentTreeRect.right * state.data.zoom - state.data.containerRect.width / 2
	return Math.min(minX, (minX + maxX) / 2)
}
function getMaxCoordinate(state, axis) {
	const currentTreeRect = getCurrentTreeRect(state)
	if (axis === 'y') {
		const minY = getMinCoordinate(state, axis)
		const maxY = currentTreeRect.bottom * state.data.zoom - state.data.containerRect.height
		return Math.max(maxY, minY)
	}
	const minX = currentTreeRect.left * state.data.zoom + state.data.containerRect.width / 2
	const maxX = currentTreeRect.right * state.data.zoom - state.data.containerRect.width / 2
	return Math.max(maxX, (minX + maxX) / 2)
}
// getViewPosition returns the position of the tree in left/top coordinates, given the position in our regular coordinate system.
function getViewPosition(state) {
	return {
		x: -state.data.position.x + state.data.containerRect.width / 2,
		y: -state.data.position.y,
	}
}

// pullFunction tells us how the coordinate of the tree is adjusted when it is dragged (pulled) over an edge. If this function would be (diff) => diff, then it would be possible to pull the tree over the edge normally. But instead, we reduce the outcome in a smooth way, to give the appearance of some resistance.
function pullFunction(diff) {
	return dynamics.pullScale * Math.log(diff / dynamics.pullScale + 1)
}



// getCurrentTreeRect calculates the tree rectangle based on the default size of the tree and on which block is expanded. If a block is expanded, we need to ensure that its description is properly shown.
function getCurrentTreeRect(state) {
	const currentTreeRect = deepClone(treeRect)
	if (state.data.activeChapter) {
		const chapter = chapters[state.data.activeChapter]
		const descriptionHeight = state.data.descriptionHeights[state.data.activeChapter]
		if (chapter && descriptionHeight) {
			currentTreeRect.bottom = Math.max(
				currentTreeRect.bottom,
				chapter.position.y + size.y + descriptionHeight,
			)
			currentTreeRect.height = currentTreeRect.bottom - currentTreeRect.top
		}
	}
	return currentTreeRect
}
