import React, { Component } from 'react'
import classnames from 'classnames'

import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { axisLeft, axisBottom } from 'd3-axis'
import { line, curveLinear } from 'd3-shape'

import GaussianProcess, { getSquaredExponentialCovarianceFunction } from '../../../logic/gaussianProcess.js'
import { getRange } from '../../../logic/util.js'

import { SubFigure } from '../../components/Figure/Figure.js'

import Transitioner from '../../../logic/transitioner.js'

export default class Plot extends Component {
	constructor() {
		super()

		// Set up default parameters.
		this.width = 1000
		this.height = 750
		this.useSVG = true
		this.useCanvas = false
		this.classes = {}

		// Ensure that functions always have the correct `this` parameter, also when called from callbacks.
		this.cycleUpdates = this.cycleUpdates.bind(this)
	}
	getID() {
		if (this.id)
			return this.id
		throw new Error(`Missing ID error: tried to render a Plot with an unknown ID. When extending Plot, make sure you specify a unique ID for the new class.`)
	}
	componentDidMount() {
		// Initialize the plot if we haven't already done so.
		if (!this.initialized) {
			// Extract the canvas context, if a canvas is available.
			if (this.canvas)
				this.ctx = this.canvas.getContext('2d') // Note that we cannot use `this.context` as the context parameter is also used behind the scenes by React. It will be cleared.
			
			// Call any potential custom initialize function.
			if (this.initialize)
				this.initialize()

			this.initialized = true
		}

		// Ensure that the plot is updated regularly.
		this.cycleUpdates()
	}
	cycleUpdates() {
		if (this.update) {
			this.update()
			this.animationFrameRequest = window.requestAnimationFrame(this.cycleUpdates)
		}
	}
	componentWillUnmount() {
		window.cancelAnimationFrame(this.animationFrameRequest)
	}
	clearCanvas() {
		if (!this.initialized)
			throw new Error('Not initialized: cannot clear the canvas before the Plot object has been initialized. This happens upon mounting.')
		if (!this.canvas)
			throw new Error('No canvas: the clear canvas function cannot be called when no canvas has been ordered to be present.')
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
	}
	render() {
		return (
			<SubFigure width={this.width} height={this.height}>
				{this.useSVG ? (
					<svg id={this.getID()} viewBox={`0 0 ${this.width} ${this.height}`} className={classnames(this.classes)}>
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