import './Slider.css'

import React, { Component } from 'react'
import classnames from 'classnames'

import { bound } from '../../../logic/util.js'

export default class Slider extends Component {
	constructor() {
		super()

		this.state = {
			value: 0,
			dragging: false,
		}

		this.startDrag = this.startDrag.bind(this)
		this.updateDrag = this.updateDrag.bind(this)
		this.endDrag = this.endDrag.bind(this)
	}

	measureRectangles() {
		if (this.area)
			this.areaRect = this.area.getBoundingClientRect()
		if (this.button)
			this.buttonRect = this.button.getBoundingClientRect()
	}

	getValueFromEvent(event) {
		const x = event.clientX - this.offset - this.areaRect.left - this.buttonRect.height/2 // The x-position of the mouse, relative to the slider bar.
		const w = this.areaRect.width - this.buttonRect.width // The available with of the slider bar.
		return bound(x/w, 0, 1)
	}

	startDrag(event) {
		// Set up listeners that will adjust the slider.
		window.addEventListener('mouseup', this.endDrag)
		window.addEventListener('mousemove', this.updateDrag)

		// Figure out all the positions and sizes of objects, as well as the offset that we should apply. (If the user clicks left of the slider, the mouse will hit the left part of the slider, while if the user clicks right of the slider, the mouse will stick to the right part.)
		this.measureRectangles()
		this.offset = bound(event.clientX - this.buttonRect.left - this.buttonRect.height/2, 0, this.buttonRect.width - this.buttonRect.height)

		// Make sure that, as soon as the mouse goes down, the slider is in the right place.
		this.updateDrag(event)
	}

	updateDrag(event) {
		// Remember the position internally.
		const value = this.getValueFromEvent(event)
		this.setState({
			value,
			dragging: true,
		})

		// Notify the application of the new value.
		this.props.setValue(value, false) // Set the "definite" parameter to false: this is not the definite slider value yet. It's still changing.
	}

	endDrag(event) {
		// Clean up listeners.
		window.removeEventListener('mouseup', this.endDrag)
		window.removeEventListener('mousemove', this.updateDrag)

		// Notify the application of the new value.
		this.props.setValue(this.getValueFromEvent(event), true) // Set the "definite" parameter to true: this is the definite slider value. The dragging has ended.

		// Update state that we are no longer dragging.
		this.setState({
			dragging: false,
		})
	}

	render() {
		// If no rectangles are known, measure them.
		if (!this.areaRect || !this.buttonRect)
			this.measureRectangles()

		// If the rectangles are still not known yet, then this is the first render. We cannot know the rectangles just yet. In that case, add to the javascript queue to update the slider again after rendering.
		if (!this.areaRect || !this.buttonRect)
			setTimeout(this.forceUpdate.bind(this), 0) // Yeah, it's a bit of a dirty trick.

		// Find the position the slider should be in.
		const value = bound(this.state.dragging ? this.state.value : this.props.getValue(), 0, 1) // If we are dragging, we keep track of our own value, mainly because the application itself does not always set the value immediately. It can also do so upon releasing the slider.
		const w = (this.areaRect && this.buttonRect) ? this.areaRect.width - this.buttonRect.width : 0
		const pos = w*value

		return (
			<div className={classnames('slider', { dragging: this.state.dragging })} ref={obj => { this.obj = obj }}>
				<div className="track" />
				<div className="clickArea" onMouseDown={this.startDrag} ref={obj => { this.area = obj}} />
				<div className="slideButton" onMouseDown={this.startDrag} ref={obj => { this.button = obj}} style={{ left: `${pos}px` }} />
			</div>
		)
	}
}