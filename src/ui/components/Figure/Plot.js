import React, { Component } from 'react'
import classnames from 'classnames'

import { SubFigure } from '../../components/Figure/Figure.js'

const functionsToBind = [
	'cycleUpdates',
	'handleClick',
	'handleMouseEnter',
	'handleMouseMove',
	'handleMouseLeave',
]
const eventHandlers = [
	{ event: 'click', handler: 'handleClick' },
	{ event: 'mouseenter', handler: 'handleMouseEnter' },
	{ event: 'mousemove', handler: 'handleMouseMove' },
	{ event: 'mouseleave', handler: 'handleMouseLeave' },
]

export default class Plot extends Component {
	constructor() {
		super()

		// Set up default parameters.
		this.width = 1000
		this.height = 750
		this.useSVG = true
		this.useCanvas = false
		this.classes = {
			plot: true,
		}

		// Ensure that functions always have the correct `this` parameter, also when called from callbacks.
		functionsToBind.forEach(name => {
			if (typeof(this[name]) === 'function')
				this[name] = this[name].bind(this)
		})
	}

	// The getID is used to extract the ID of this plot. It can be overwritten by child classes, for example when iterating multiple plots in a loop.
	getID() {
		if (this.id)
			return this.id
		throw new Error(`Missing ID error: tried to render a Plot with an unknown ID. When extending Plot, make sure you specify a unique ID for the new class.`)
	}

	// Upon mounting, initialize the object, if we haven't already done so. Also set up necessary event listeners and animation frame requests.
	componentDidMount() {
		// Initialize the plot if we haven't already done so.
		if (!this.initialized) {
			// Extract the canvas context, if a canvas is available.
			if (this.canvas)
				this.ctx = this.canvas.getContext('2d') // Note that we cannot use `this.context` as the context parameter is also used behind the scenes by React. It will be cleared.
			
			// Extract the (subfigure) container of the plot.
			this.container = (this.svg || this.canvas).parentElement.parentElement
			window.svg = this.svg

			// Call any potential custom initialize function.
			if (this.initialize)
				this.initialize()

			this.initialized = true
		}

		// Set up event listeners. Also ensure that they get the position of the event as first parameter, using an expanded handler.
		eventHandlers.forEach(data => {
			if (!this[data.handler])
				return // Ignore this event type if the corresponding handler is not specified by a child class.
			if (!data.expandedHandler)
				data.expandedHandler = (evt) => this[data.handler](this.getPositionFromEvent(evt), evt)
			this.container.addEventListener(data.event, data.expandedHandler)
		})

		// Ensure that the plot is updated regularly.
		this.cycleUpdates()
	}

	// Upon unmounting, deactivate event listeners and animation frame requests.
	componentWillUnmount() {
		window.cancelAnimationFrame(this.animationFrameRequest)

		// Set up event listeners. Also ensure that they get the position of the event as first parameter.
		eventHandlers.forEach(data => {
			if (!this[data.handler])
				return // Ignore this event type if the corresponding handler is not specified by a child class.
			this.container.removeEventListener(data.event, data.expandedHandler)
		})
	}

	// cycleUpdates is called on every animation frame request. It calls the update function of the plot, if it exists. To start animating, this function also needs to be called.
	cycleUpdates() {
		if (this.update) {
			this.update()
			this.animationFrameRequest = window.requestAnimationFrame(this.cycleUpdates)
		}
	}

	// getPositionFromEvent takes an event object and (based on the clientX and clientY parameters) turns it into the internal coordinates which the event took place at.
	getPositionFromEvent(evt) {
		window.evt = evt
		return {
			x: evt.offsetX / this.container.offsetWidth * this.width,
			y: evt.offsetY / this.container.offsetHeight * this.height,
		}
	}

	// clearCanvas is used to empty the canvas so a new drawing can be drawn.
	clearCanvas() {
		if (!this.initialized)
			throw new Error('Not initialized: cannot clear the canvas before the Plot object has been initialized. This happens upon mounting.')
		if (!this.canvas)
			throw new Error('No canvas: the clear canvas function cannot be called when no canvas has been ordered to be present.')
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
	}

	// render sets up the HTML of the plot. Based on what has been requested (through useSVG and useCanvas) it adds an SVG or Canvas object.
	render() {
		if (!this.useSVG && !this.useCanvas)
			throw new Error('Plot render error: cannot generate a plot without either an SVG or a canvas.')
		return (
			<SubFigure width={this.width} height={this.height} className={classnames(this.classes)}>
				{this.useSVG ? (
					<svg id={this.getID()} ref={obj => { this.svg = obj }} viewBox={`0 0 ${this.width} ${this.height}`}>
						<defs>
							<mask id="noOverflow">
								<rect x="0" y="0" width={this.width} height={this.height} fill="#fff" />
							</mask>
						</defs>
					</svg>
				) : ''}
				{this.useCanvas ? <canvas ref={obj => { this.canvas = obj }} width={this.width} height={this.height} /> : ''}
			</SubFigure>
		)
	}
}