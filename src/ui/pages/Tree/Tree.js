import './Tree.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'

import treeActions from '../../../redux/tree.js'
import chapters, { chapterArray, size, margin, treeRect } from '../chapters'
import { getWindowSize } from '../../../logic/util.js'
import { phoneLandscapeWidth } from '../../shared/params.js'

class Tree extends Component {
	constructor() {
		super()

		// Bind this object to event handlers.
		this.startDragging = this.startDragging.bind(this)
		this.endDragging = this.endDragging.bind(this)
		this.checkSize = this.checkSize.bind(this)
		this.updateVisuals = this.updateVisuals.bind(this)
	}

	componentDidMount() {
		// Listen to user inputs.
		this.treeContainer.addEventListener('mousedown', this.startDragging)
		document.addEventListener('mouseup', this.endDragging)
		this.treeContainer.addEventListener('touchstart', this.props.startTouch)
		document.addEventListener('touchmove', this.props.updateTouch)
		document.addEventListener('touchend', this.props.endTouch)
		document.addEventListener('wheel', this.props.scroll)

		// Listen to screen resizes.
		this.checkSize()
		window.addEventListener('resize', this.checkSize)

		// Start the update loop to get animations.
		this.updateVisuals()
	}

	componentWillUnmount() {
		// Remove event listeners.
		this.treeContainer.removeEventListener('mousedown', this.startDragging)
		document.removeEventListener('mouseup', this.endDragging)
		this.treeContainer.removeEventListener('touchstart', this.props.startTouch)
		document.removeEventListener('touchmove', this.props.updateTouch)
		document.removeEventListener('touchend', this.props.endTouch)
		document.removeEventListener('wheel', this.props.scroll)

		// Stop listening for screen resizes.
		window.removeEventListener('resize', this.checkSize)

		// Stop the updates of the visualization.
		window.cancelAnimationFrame(this.animationFrameRequest)
	}

	// updateVisuals is called at every animation frame, to update the state of the tree related to its visual display.
	updateVisuals() {
		this.props.updateVisuals()
		this.animationFrameRequest = window.requestAnimationFrame(this.updateVisuals)
	}

	startDragging(evt) {
		this.props.startDragging(evt)
		document.addEventListener('mousemove', this.props.updateDragging)
	}

	endDragging(evt) {
		this.props.endDragging(evt)
		document.removeEventListener('mousemove', this.props.updateDragging)
		document.removeEventListener('touchmove', this.props.updateDragging)
	}

	checkSize(evt) {
		this.props.updateTreeRect(this.getTreeRect())
		this.props.updateTreeContainerRect(this.getTreeContainerRect())
		this.props.updateWindowSize(getWindowSize()) // Make sure to do this only after the tree rectangles are is set. They are needed for the function to properly work.
	}

	getTreeRect() {
		return {
			...treeRect, // TODO: ADD ADJUSTABLE HEIGHT BASED ON WHAT OPENS UP.
		}
	}
	getTreeContainerRect() {
		return {
			width: this.treeContainer.offsetWidth,
			height: this.treeContainer.offsetHeight,
			left: this.treeContainer.offsetLeft,
			top: this.treeContainer.offsetTop,
			right: this.treeContainer.offsetLeft + this.treeContainer.offsetWidth,
			bottom: this.treeContainer.offsetTop + this.treeContainer.offsetHeight,
		}
	}

	render() {
		const scale = this.props.zoom
		const shift = this.props.position
		this.chapterBlocks = {}
		return (
			<div className={classnames('treeContainer', { 'dragging': !!this.props.dragging })} ref={obj => this.treeContainer = obj}>
				<div className="tree" id="tree" style={{
					transform: `matrix(${scale},0,0,${scale},${shift.x},${shift.y})`,
				}} ref={obj => this.tree = obj}>
					{chapterArray.map(chapter => <div
						key={chapter.name}
						className="chapter"
						ref={obj => this.chapterBlocks[chapter.name] = obj}
						style={{
							left: (chapter.position.x - size.x / 2) + 'px',
							top: chapter.position.y + 'px',
						}}
					>{chapter.title}</div>)}
				</div>
			</div>
		)
	}
}

const stateMap = (state) => ({
	...state.tree.visuals
})
const actionMap = (dispatch) => ({
	startDragging: (evt) => dispatch(treeActions.startDragging(evt)),
	updateDragging: (evt) => dispatch(treeActions.updateDragging(evt)),
	endDragging: (evt) => dispatch(treeActions.endDragging(evt)),
	startTouch: (evt) => dispatch(treeActions.startTouch(evt)),
	updateTouch: (evt) => dispatch(treeActions.updateTouch(evt)),
	endTouch: (evt) => dispatch(treeActions.endTouch(evt)),
	scroll: (evt) => dispatch(treeActions.scroll(evt)),
	updateVisuals: (evt) => dispatch(treeActions.updateVisuals(evt)),
	updateWindowSize: (size) => dispatch(treeActions.updateWindowSize(size)),
	updateTreeRect: (rect) => dispatch(treeActions.updateRect(rect)),
	updateTreeContainerRect: (rect) => dispatch(treeActions.updateContainerRect(rect)),
})
export default connect(stateMap, actionMap)(Tree)