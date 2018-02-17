import React, { Component } from 'react'
import classnames from 'classnames'

import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { axisLeft, axisBottom } from 'd3-axis'
import { line, curveLinear } from 'd3-shape'

import GaussianProcess, { getSquaredExponentialCovarianceFunction } from '../../../../../logic/gaussianProcess.js'
import { getRange } from '../../../../../logic/util.js'

import Plot from '../../../../components/Figure/Plot.js'

import Transitioner from '../../../../../logic/transitioner.js'

// TODO NEXT:
// [Done] Figure out how gradients work within SVG. An alternative is to use canvas, but having two methods will be a hassle. Edit: custom gradients in SVG suck. Use canvas instead.
// [Done] Figure out how to get overflow with SVG but only for certain elements. Solution: set overflow: visible for the SVG block and apply a mask for SVG groups that should not have overflow.
// [Done] Make the plot dynamic. Allow the adding of points. Make sure things update properly.
// [Done] Allow for smooth updating of the plot, transitioning the mean line and the variances.
// - Copy the gradient method from the GP presentation script.
// - Allow potentially dragging points. In this case, updating the plot smoothly is not required anymore. It is useful to still use animation frame requests, instead of rerendering upon every mouseMove event.
// [Done] Arrange z-indices: make sure measurement points appear on top. Edit: this depends on the order the elements appear inside the SVG.
// - Potentially put it all in a GP Plot class, for as much as possible. Add options showAxes, showNumbers, range, the gp that's used, an update feature, whether you can add points, delete points, drag them, and so on.

class TestPlot extends Plot {
	constructor() {
		super()

		// Define important settings.
		this.id = 'testPlot'
		this.useCanvas = true
		this.classes['noNumbers'] = true
		this.width = 1000
		this.height = 750

		// Ensure that functions always have the correct `this` parameter, also when called from callbacks.
		this.addMeasurement = this.addMeasurement.bind(this)
		this.initialize = this.initialize.bind(this)
		this.recalculate = this.recalculate.bind(this)
		this.update = this.update.bind(this)

		// Set up the plot range.
		this.range = {
			x: {
				min: -4,
				max: 5,
			},
			y: {
				min: -3,
				max: 3,
			},
		}

		this.measurements = [
			{ input: -3, output: 1.1 },
			{ input: -2.1, output: 1.8 },
			{ input: -0.8, output: 2.1 },
			{ input: -0.1, output: 0.9 },
			{ input: 0.6, output: -0.2 },
			{ input: 1.4, output: -1.6 },
			{ input: 1.7, output: -2.2 },
			{ input: 2.6, output: -1.7 },
			{ input: 3.4, output: -0.4 },
		]

		this.plotPoints = getRange(this.range.x.min, this.range.x.max, 201)

		this.gp = new GaussianProcess({ covariance: getSquaredExponentialCovarianceFunction({ Vx: 2 ** 2, Vy: 2 ** 2 }), outputNoise: 0.1 })

		setInterval(this.addMeasurement, 1000)
	}
	addMeasurement() {
		// Add a measurement (or if not available, remove all measurements) for the GP.
		if (this.gp.measurements.length === this.measurements.length)
			this.gp.reset()
		else
			this.gp.addMeasurement(this.measurements[this.gp.measurements.length])
		this.recalculate()
	}
	initialize() {
		// Set up all containers. The order matters: later containers are on top of earlier containers.
		this.svgContainer = select(`#${this.id}`)
		// this.gradientContainer = this.svgContainer.append('g').attr('class', 'variance') // TODO: REMOVE
		this.axisContainer = this.svgContainer.append('g').attr('class', 'axis')
		this.xAxisContainer = this.axisContainer.append('g')
		this.yAxisContainer = this.axisContainer.append('g')
		this.meanContainer = this.svgContainer.append('g').attr('mask', 'url(#noOverflow)').attr('class', 'mean')
		this.measurementContainer = this.svgContainer.append('g').attr('class', 'measurements')

		// Set up the scales.
		this.scale = {
			x: scaleLinear().domain([this.range.x.min, this.range.x.max]).range([0, 1000]),
			y: scaleLinear().domain([this.range.y.min, this.range.y.max]).range([750, 0]),
		}

		// Set up the axes.
		const xAxis = axisBottom(this.scale.x)
		const yAxis = axisLeft(this.scale.y)
		this.xAxisContainer
			.attr('transform', `translate(0,${this.scale.y(0)})`)
			.call(xAxis)
		this.yAxisContainer
			.attr('transform', `translate(${this.scale.x(0)},0)`)
			.call(yAxis)

		// Set up the line for the mean. (ToDo: for now also for the standard deviations.)
		this.lineFunction = line()
			.x(prediction => this.scale.x(prediction.input))
			.y(prediction => this.scale.y(prediction.output.mean))
			.curve(curveLinear)

		// Set up the initial prediction using transitioners.
		this.prediction = this.gp.getPrediction({
			input: this.plotPoints
		}).map(point => ({
			input: point.input,
			output: {
				mean: new Transitioner().setValue(point.output.mean),
				std: new Transitioner().setValue(Math.sqrt(point.output.variance)),
			},
		}))
	}
	recalculate() {
		// Extract the prediction.
		const newPrediction = this.gp.getPrediction({
			input: this.plotPoints
		})
		window.newPrediction = newPrediction
		newPrediction.forEach((point, i) => {
			this.prediction[i].output.mean.setValue(point.output.mean)
			this.prediction[i].output.std.setValue(Math.sqrt(point.output.variance))
		})
	}
	update() {
		// Extract the current prediction data from the transitioners.
		const currentPrediction = this.prediction.map(point => ({
			input: point.input,
			output: {
				mean: point.output.mean.getValue(),
				std: point.output.std.getValue(),
			}
		}))

		// Apply the prediction to the corresponding visual elements.
		this.updateGradients(currentPrediction)
		this.updateLines(currentPrediction)
		this.updateCircles()
	}
	updateGradients(prediction) {
		this.clearCanvas()
		const zeroValue = this.scale.y(0) // This is a constant we need many times when scaling the standard deviation.
		let start, end
		for (let i = 0; i < prediction.length; i++) {
			// Shift the data forward.
			start = end
			end = {
				x: Math.floor(this.scale.x(prediction[i].input)),
				mean: this.scale.y(prediction[i].output.mean),
				std: this.scale.y(prediction[i].output.std) - zeroValue,
			}

			// Don't do anything at the first iteration, since we have no start just yet then.
			if (i === 0)
				continue
			
			// Set up an image data object and walk through it, setting every pixel.
			const dx = end.x - start.x
			const dMean = end.mean - start.mean
			const dStd = end.std - start.std
			const imgData = this.ctx.createImageData(dx, this.height)
			for (let x = start.x; x < end.x; x++) { // Walk horizontally through the pixels between start and end.
				const mean = start.mean + (x - start.x) / dx * dMean // The current mean of the GP, linearly extrapolated.
				const std = start.std + (x - start.x) / dx * dStd // The current std of the GP, linearly extrapolated.
				for (let y = 0; y < this.height; y++) { // Walk vertically through the pixels.
					const ind = ((x - start.x) + y * dx) * 4 // The index within the image data that we're currently at. (The image data array uses four elements per pixel (rgba).)
					imgData.data[ind + 0] = 0
					imgData.data[ind + 1] = 34
					imgData.data[ind + 2] = 204
					imgData.data[ind + 3] = 255 * Math.exp(-0.5 * (((mean - y) / std) ** 2))
				}
			}
			this.ctx.putImageData(imgData, start.x, 0)
		}
	}
	updateLines(prediction) {
		// Set up the line for the mean.
		const lines = this.meanContainer
			.selectAll('path')
			.data([prediction])
		lines.enter()
			.append('path')
			.attr('stroke', '#13F')
			.attr('stroke-width', 2)
			.attr('fill', 'none')
			.merge(lines)
			.attr('d', prediction => this.lineFunction(prediction) + 'l10000,0l10000,10000l10000,-10000') // We add the line segments at the end to work around a bug in chrome where a clipping mask combined with a completely straight SVG path results in an invisible line. So we just prevent the line from being straight by adding a large invisible section.
		lines.exit()
			.remove()
	}
	updateCircles() {
		// Set up the measurement points, first adding new ones, then updating existing ones and finally removing old ones.
		const points = this.measurementContainer
			.selectAll('circle')
			.data(this.gp.measurements)
		points.enter() // New points.
			.append('circle')
			.attr('r', '6')
			// .on('click', (data) => this.someFunction(data))
			.merge(points) // New and existing points.
			.attr('cx', point => this.scale.x(point.input))
			.attr('cy', point => this.scale.y(point.output))
		points.exit() // Outdated points.
			.remove()
	}
}

export default TestPlot