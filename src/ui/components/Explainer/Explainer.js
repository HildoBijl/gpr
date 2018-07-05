import './Explainer.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import explainerActions from '../../../redux/explainer.js'

const dx = 0 // The number of pixels which the explainer arrow should deviate from the cursor. (Positive right.)
const dy = -6 // The number of pixels which the explainer arrow should deviate from the cursor. (Positive downwards.)

class Explainer extends Component {
	constructor() {
		super()
		this.handleMouseMove = this.handleMouseMove.bind(this)
		this.handleTouchMove = this.handleTouchMove.bind(this)
	}
	componentDidMount() {
		window.addEventListener('mousemove', this.handleMouseMove)
		window.addEventListener('touchmove', this.handleTouchMove, false)
	}
	componentWillUnmount() {
		window.removeEventListener('mousemove', this.handleMouseMove)
		window.removeEventListener('touchmove', this.handleTouchMove)
	}
	handleMouseMove(event) {
		this.props.setMousePosition({
			x: event.pageX,
			y: event.pageY,
		})
	}
	handleTouchMove(event) {
		const touch = event.changedTouches[0]
		this.props.setMousePosition({
			x: touch.pageX,
			y: touch.pageY,
		})
	}
	componentDidUpdate(prevProps) {
		// If the message changed, adjust the contents box width.
		if (prevProps && prevProps.contents !== this.props.contents)
			this.adjustWidth()
	}
	adjustWidth() {
		// Verify that there are contents and that there's a container containing them.
		if (!this.props.contents)
			return
		if (!this.contentsContainer)
			return

		// Set up important settings.
		const maxAspectRatio = 8 // The maximum ratio between the width and the height of the box. We don't want a box that's very wide but only one line high. It's better to use two lines then.
		let minWidth = 0 // The minimum width of the container. The container is also an indication of how much the arrow can move, so less than zero should not happen. Zero is still OK (albeit small).
		let maxWidth = Math.min(800, 0.75 * document.body.clientWidth) // The maximum width. It depends on both the page width and on an absolute number in case of a very wide page.

		// First run a binary search with as criterion the aspect ratio. We find the smallest height for which there is a satisfactory aspect ratio.
		while (maxWidth - minWidth > 0.1) {
			const attemptedWidth = (maxWidth + minWidth) / 2
			this.contentsContainer.style.width = `${attemptedWidth}px`
			if (this.contents.clientWidth / this.contents.clientHeight > maxAspectRatio)
				maxWidth = attemptedWidth // The situation doesn't satisfy the aspect ratio requirement. We cannot use this width and must use something smaller. Lower the maximum width.
			else
				minWidth = attemptedWidth // The situation is fine. Raise the minimum width.
		}
		this.contentsContainer.style.width = `${minWidth}px`
		const height = this.contents.clientHeight

		// Second run a binary search with as criterion the height. We find the smallest width such that the height is satisfied.
		minWidth = 0 // Reset the minimum width. We can use smaller width now. Higher widths are not allowed, because they violate the aspect ratio requirement, so we don't raise the maximum again.
		while (maxWidth - minWidth > 4) {
			const attemptedWidth = (maxWidth + minWidth) / 2
			this.contentsContainer.style.width = `${attemptedWidth}px`
			if (this.contents.clientHeight > height)
				minWidth = attemptedWidth // The situation satisfies requirements. 
			else
				maxWidth = attemptedWidth
		}

		// Apply the final setting.
		this.contentsContainer.style.width = `${maxWidth}px`
	}
	render() {
		// Check visibility.
		if (!this.props.visible)
			return null

		// Make the container follow the mouse.
		const position = this.props.position || this.props.mousePosition
		const containerStyle = {
			left: position.x + dx,
			top: position.y + dy,
		}

		// Make the contents move towards the center of the page, to prevent edge-of-page trouble.
		const part = position.x / document.body.clientWidth // The part of the page (horizontally speaking) which the mouse pointer is at.
		const contentsStyle = {
			transform: `translateX(-${part*100}%)`,
		}

		// Set up the HTML.
		return (
			<div className="explainer" style={containerStyle}>
				<div className="arrow" />
				<div className="contentsContainer" style={contentsStyle} ref={obj => this.contentsContainer = obj}>
					<div className="contents" ref={obj => this.contents = obj}>{this.props.contents}</div>
				</div>
			</div>
		)
	}
}

const stateMap = (state) => ({
	...state.explainer,
})
const actionMap = (dispatch) => ({
	setMousePosition: (position) => dispatch(explainerActions.setMousePosition(position)),
})
export default connect(stateMap, actionMap)(Explainer)