import './Tree.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'

import treeActions from '../../../redux/tree.js'

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
		this.tree.addEventListener('mousedown', this.startDragging)
		document.addEventListener('mouseup', this.endDragging)
		this.tree.addEventListener('touchstart', this.props.startTouch)
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
		this.tree.removeEventListener('mouseup', this.startDragging)
		document.removeEventListener('mouseup', this.endDragging)
		this.tree.removeEventListener('touchstart', this.props.startTouch)
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
		this.props.updateSize(this.getTreeSize())
		this.props.updateContainerSize(this.getTreeContainerSize(), this.getTreeContainerPosition())
	}

	getTreeSize() {
		return {
			x: this.tree.offsetWidth,
			y: this.tree.offsetHeight,
		}
	}
	getTreeContainerSize() {
		return {
			x: this.treeContainer.offsetWidth,
			y: this.treeContainer.offsetHeight,
		}
	}
	getTreeContainerPosition() {
		return {
			x: this.treeContainer.offsetLeft,
			y: this.treeContainer.offsetTop,
		}
	}
	
	render() {
		const scale = this.props.zoom
		const shift = this.props.position
		return (
			<div className={classnames('treeContainer', {'dragging': !!this.props.dragging })} ref={obj => this.treeContainer = obj}>
				<div className="tree" id="tree" style={{
					width: '2000px', // TODO
					height: '1200px',
					transform: `matrix(${scale},0,0,${scale},${shift.x},${shift.y})`,
				}} ref={obj => this.tree = obj}>
					<div className="chapter" style={{left: '100px', top: '100px'}}>Chapter 1</div>
					<div className="chapter" style={{left: '100px', top: '500px'}}>Chapter 2</div>
					<div className="chapter" style={{left: '800px', top: '500px'}}>Chapter 3</div>
					<div className="chapter" style={{left: '1500px', top: '900px'}}>Chapter 4</div>
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
	updateSize: (size) => dispatch(treeActions.updateSize(size)),
	updateContainerSize: (size, position) => dispatch(treeActions.updateContainerSize(size, position)),
})
export default connect(stateMap, actionMap)(Tree)