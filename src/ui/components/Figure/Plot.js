import React, { Component } from 'react'
import classnames from 'classnames'

import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { axisLeft, axisBottom } from 'd3-axis'

import { getRange } from '../../../logic/util.js'

import SubFigure from '../../components/Figure/SubFigure.js'

const functionsToBind = [
	'cycleUpdates',
	'handleClick',
	'handleMouseEnter',
	'handleMouseMove',
	'handleMouseLeave',
	'stopPropagationOnTouchMove',
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

		// Set up necessary parameters.
		this.handler = {} // This will be used to store event handlers for this object.

		// Set up default parameters.
		this.width = 1000
		this.height = 750
		this.useSVG = true
		this.useCanvas = false
		this.className = {
			plot: true,
		}

		// Ensure that functions always have the correct `this` parameter, also when called from callbacks.
		functionsToBind.forEach(name => {
			if (typeof(this[name]) === 'function')
				this[name] = this[name].bind(this)
		})
		
		// Define settings that may be overwritten by the child class.
		this.transitionTime = 400
		this.range = { input: { min: -5, max: 5 }, output: { min: -3, max: 3 } }
		this.numPlotPoints = 101
	}

	// Upon mounting, initialize the object, if we haven't already done so. Also set up necessary event listeners and animation frame requests.
	componentDidMount() {
		// Extract the canvas context, if a canvas is available. (This needs to be done upon every mounting, since a new mounting generally means a new canvas too.)
		if (this.canvas)
			this.ctx = this.canvas.getContext('2d') // Note that we cannot use `this.context` as the context parameter is also used behind the scenes by React. It will be cleared.
		
		// Extract the (SubFigure) container of the plot.
		this.container = (this.svg || this.canvas).parentElement.parentElement

		// Ensure plotpoints are present. They can be defined manually, or only defined through their properties.
		if (!this.plotPoints)
			this.plotPoints = getRange(this.range.input.min, this.range.input.max, this.numPlotPoints)

		// Set up event listeners. Also ensure that they get the position of the event as first parameter, using an expanded handler.
		eventHandlers.forEach(data => {
			// Check if the corresponding handler is specified by the child class. If not, ignore it.
			if (!this[data.handler])
				return
			
			// Check if the handler has already been set up. If not, set it up.
			if (!this.handler[data.handler])
				this.handler[data.handler] = (evt) => this[data.handler](this.getPositionFromEvent(evt), evt)
			
			// Start listening to the event.
			this.container.addEventListener(data.event, this.handler[data.handler])
		})

		// Set up an additional handler on touchMove, which is used only internally. It prevents the swiping of a plot from swiping a page as well.
		this.container.addEventListener('touchmove', this.stopPropagationOnTouchMove)
		
		// Set up containers. The order matters: later containers are on top of earlier containers.
		this.svgContainer = select(this.svg)
		this.axisContainer = this.svgContainer.append('g').attr('class', 'axis')

		// Set up the scales.
		this.scale = {
			input: scaleLinear().domain([this.range.input.min, this.range.input.max]).range([0, this.width]),
			output: scaleLinear().domain([this.range.output.min, this.range.output.max]).range([this.height, 0]),
		}

		// Set up the axes.
		const inputAxis = this.getInputAxisStyle()
		const outputAxis = this.getOutputAxisStyle()
		this.axisContainer
			.append('g')
			.attr('transform', `translate(0,${this.scale.output(0)})`)
			.call(inputAxis)
		this.axisContainer
			.append('g')
			.attr('transform', `translate(${this.scale.input(0)},0)`)
			.call(outputAxis)

		// Ensure that the plot is updated regularly.
		this.cycleUpdates(true)
	}

	// We implement a componentDidUpdate function to ensure that, if a child class overloads this method and calls the super.componentDidUpdate, things won't crash.
	componentDidUpdate() {
		// Do nothing.
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

	// stopPropagationOnTouchMove will be called upon touch moving. This event is then not propagated further. The reason is that, if we don't, then touch moves upon plots will activate the section handling, and we might accidentally swipe to the previous/next section.
	stopPropagationOnTouchMove(event) {
		// Prevent the page from swiping or anything similar.
		event.stopPropagation()

		// Make sure that the explainer knows of the position of the finger, if this class is connected to it.
		if (this.props.explainer && this.props.explainer.setMousePosition) {
			const touch = event.changedTouches[0] // We only support single touch stuff.
			this.props.explainer.setMousePosition({
				x: touch.pageX,
				y: touch.pageY,
			})
		}
	}

	// cycleUpdates is called on every animation frame request. It calls the update function of the plot, if it exists. To start animating, this function also needs to be called. Optionally, it can be given `true' to skip the first update. This is useful if the calling script is still initializing things.
	cycleUpdates(skipFirstUpdate) {
		if (this.update) {
			if (skipFirstUpdate !== true)
				this.update()
			this.animationFrameRequest = window.requestAnimationFrame(this.cycleUpdates)
		}
	}

	// getInputAxisStyle returns a d3 axis function for the x-axis. It can be overwritten by child classes to get specific types of ticks or axis formatting.
	getInputAxisStyle() {
		return axisBottom(this.scale.input)
	}

	// getOutputAxisStyle returns a d3 axis function for the x-axis. It can be overwritten by child classes to get specific types of ticks or axis formatting.
	getOutputAxisStyle() {
		return axisLeft(this.scale.output)
	}

	// getPositionFromEvent takes an event object and (based on the clientX and clientY parameters) turns it into the internal coordinates which the event took place at.
	getPositionFromEvent(evt) {
		return {
			x: evt.offsetX / this.container.offsetWidth * this.width,
			y: evt.offsetY / this.container.offsetHeight * this.height,
		}
	}

	// clearCanvas is used to empty the canvas so a new drawing can be drawn.
	clearCanvas() {
		if (!this.canvas)
			throw new Error('No canvas: the clear canvas function cannot be called when no canvas has been ordered to be present.')
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
	}

	// isWithinRange checks whether a point (with an input and an output) falls within the range of this plot.
	isWithinRange(point) {
		if (point.input < this.range.input.min)
			return false
		if (point.input > this.range.input.max)
			return false
		if (point.output < this.range.output.min)
			return false
		if (point.output > this.range.output.max)
			return false
		return true
	}

	// render sets up the HTML of the plot. Based on what has been requested (through useSVG and useCanvas) it adds an SVG or Canvas object.
	render() {
		if (!this.useSVG && !this.useCanvas)
			throw new Error('Plot render error: cannot generate a plot without either an SVG or a canvas.')
		return (
			<SubFigure width={this.width} height={this.height} title={this.props.title} className={classnames(this.className)}>
				{this.useSVG ? (
					<svg ref={obj => { this.svg = obj }} viewBox={`0 0 ${this.width} ${this.height}`}>
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