import './GPPlot.css'

import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { axisLeft, axisBottom } from 'd3-axis'
import { line, curveLinear } from 'd3-shape'

import { getRange } from '../../../logic/util.js'

import Plot from '../../components/Figure/Plot.js'
import Transitioner from '../../../logic/transitioner.js'
import GaussianProcess from '../../../logic/GaussianProcess/reduxGP.js'

export default class GPPlot extends Plot {
	constructor() {
		super()

		// Define important settings that are crucial for this GP.
		this.dataName = 'gp' // This is the name, within the data store, through which the GP data is stored.
		this.useCanvas = true
		this.className.gpPlot = true // Tell the plot that it's a GPPlot, so the corresponding CSS styling applied.

		// Define settings that may be overwritten by the child class.
		this.gpData = {} // This object will contain all data (the full initial state) of the GP that will be used.
		this.transitionTime = 400
		this.range = { input: { min: -5, max: 5 }, output: { min: -3, max: 3 } }
		this.numPlotPoints = 101
		this.measurementRadius = 6
	}

	// initialize sets up all parameters (mostly D3 objects, but also transitioners) that are needed to properly plot the Gaussian Process.
	initialize() {
		// Ensure plotpoints are present. They can be defined manually, or only defined through their properties.
		if (!this.plotPoints)
			this.plotPoints = getRange(this.range.input.min, this.range.input.max, this.numPlotPoints)

		// Set up the GP object. For this, check if data is available.
		if (this.props.data[this.dataName].isDataAvailable) {
			this.gp = new GaussianProcess(this.props.data[this.dataName])
		} else {
			this.gp = new GaussianProcess(this.gpData) // We start with a GP object which already has the right data. (So we don't have to recalculate stuff.)
			this.props.data[this.dataName].applyState(this.gpData, false) // We also store the data in redux, specifically noting that no update is required.
		}

		// Set up all containers. The order matters: later containers are on top of earlier containers.
		this.svgContainer = select(this.svg)
		this.axisContainer = this.svgContainer.append('g').attr('class', 'axis')
		this.sampleContainer = this.svgContainer.append('g').attr('mask', 'url(#noOverflow)').attr('class', 'samples')
		this.meanContainer = this.svgContainer.append('g').attr('mask', 'url(#noOverflow)').attr('class', 'mean')
		this.measurementContainer = this.svgContainer.append('g').attr('class', 'measurements')

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

		// Set up the line function for the mean.
		this.meanFunction = line()
			.x(prediction => this.scale.input(prediction.input))
			.y(prediction => this.scale.output(prediction.output.mean))
			.curve(curveLinear)

		// Set up the line function for the sample.
		this.sampleFunction = line()
			.x(point => this.scale.input(point.input))
			.y(point => this.scale.output(point.output))
			.curve(curveLinear)

		// Set up the prediction array using transitioners and fill it with the initial prediction.
		this.prediction = this.gp.getPrediction({
			input: this.plotPoints
		}).map(point => ({
			input: point.input,
			output: {
				mean: new Transitioner({ transitionTime: this.transitionTime }).setValue(point.output.mean),
				std: new Transitioner({ transitionTime: this.transitionTime }).setValue(Math.sqrt(point.output.variance)),
			},
		}))

		// Set up an array for samplers too, but it starts empty.
		this.samples = []
	}

	// getInputAxisStyle returns a d3 axis function for the x-axis. It can be overwritten by child classes to get specific types of ticks or axis formatting.
	getInputAxisStyle() {
		return axisBottom(this.scale.input)
	}

	// getOutputAxisStyle returns a d3 axis function for the x-axis. It can be overwritten by child classes to get specific types of ticks or axis formatting.
	getOutputAxisStyle() {
		return axisLeft(this.scale.output)
	}

	// restore turns the GP object for this plot to its initial (default) settings.
	restore() {
		// Tell redux to apply the initial data specified in gpData.
		this.props.data[this.dataName].applyState(this.gpData)
	}

	// componentDidUpdate is called when the data of a GP is potentially updated. It tells the GP to check if recalculations are necessary.
	componentDidUpdate(prevProps, prevState, snapshot) {
		const gpData = this.props.data[this.dataName]
		if (this.gp.processUpdate(gpData))
			this.recalculate()
	}

	// recalculate asks the GP what the current prediction for the plot points is, and plugs it into the transitioners.
	recalculate() {
		// Extract the prediction.
		const newPrediction = this.gp.getPrediction({
			input: this.plotPoints
		})
		newPrediction.forEach((point, i) => {
			this.prediction[i].output.mean.setValue(point.output.mean)
			this.prediction[i].output.std.setValue(Math.sqrt(point.output.variance))
		})

		// Extract the samples.
		const newSamples = this.gp.getSamples({ input: this.plotPoints })
		newSamples.forEach((sample, i) => {
			// If there are no transitioners yet for this sample, create them first.
			if (!this.samples[i]) {
				this.samples[i] = []
				sample.forEach((value, j) => {
					this.samples[i][j] = new Transitioner({ transitionTime: this.transitionTime })
				})
			}
			// Adjust the transitioners.
			sample.forEach((value, j) => {
				this.samples[i][j].setValue(value)
			})
		})
		// Remove extra unnecessary samples.
		while (this.samples.length > newSamples.length)
			this.samples.pop()
	}

	// reset resets the GP and applies the change to the plot.
	reset() {
		this.props.data[this.dataName].applyState(this.gpData) // Reapply the default GP data to our GP object.
		this.recalculate()
	}

	// getCurrentPrediction checks the transitioners and asks them what the current prediction is, based on the transitioning.
	getCurrentPrediction() {
		return this.prediction.map(point => ({
			input: point.input,
			output: {
				mean: point.output.mean.getValue(),
				std: point.output.std.getValue(),
			}
		}))
	}

	// getCurrentSamples checks the transitioners and asks them what the current samples are, based on the transitioning.
	getCurrentSamples() {
		return this.samples.map(sample => sample.map(point => point.getValue()))
	}

	// update will often be overwritten by the child class, but the default action is that it draws the mean, the standard deviation and the measurements.
	update() {
		this.drawSamples()
		this.drawMean()
		this.drawStd()
		this.drawMeasurements()
	}

	// drawMean draws the line that represents the mean of the GP.
	drawMean() {
		// As is usual with D3, define an array with all the elements that need to be drawn. Okay, we're only drawing a single line, so the array has one element.
		const prediction = this.getCurrentPrediction()
		const lineData = [prediction]

		// Set up a path for the mean line using D3.
		const lines = this.meanContainer
			.selectAll('path')
			.data(lineData)
		lines.enter()
			.append('path')
			.attr('class', 'mean')
			.merge(lines)
			.attr('d', prediction => this.meanFunction(prediction) + 'l10000,0l10000,10000l10000,-10000') // We add the line segments at the end to work around a bug in chrome where a clipping mask combined with a completely straight SVG path results in an invisible line. So we just prevent the line from being straight by adding a large invisible section.
		lines.exit()
			.remove()
	}

	// drawStd draws the gradient background on the canvas that represents the standard deviation of the GP.
	drawStd() {
		// Check that we have a canvas and that it's empty.
		if (!this.canvas)
			throw new Error('Missing canvas: cannot draw the standard deviation of a Gaussian Process when no canvas is present.')
		this.clearCanvas()

		// Extract the current prediction data from the transitioners and walk through all the points, drawing gradient rectangles to the left of each of them (apart from the first).
		const prediction = this.getCurrentPrediction()
		let left, right // We will draw vertical rectangles. The left and right parameters will take into account the data on either side of the rectangle.
		const zeroValue = this.scale.output(0) // This is a constant we need many times when scaling the standard deviation.
		for (let i = 0; i < prediction.length; i++) {
			// Shift the data forward.
			left = right
			right = {
				x: Math.round(this.scale.input(prediction[i].input)),
				mean: this.scale.output(prediction[i].output.mean),
				std: this.scale.output(prediction[i].output.std) - zeroValue,
			}

			// Don't do anything at the first iteration, since we do not draw the rectangle to the left of the leftmost point.
			if (i === 0)
				continue

			// Set up an image data object and walk through it, setting every pixel.
			const dx = right.x - left.x
			const dMean = right.mean - left.mean
			const dStd = right.std - left.std
			const imgData = this.ctx.createImageData(dx, this.height)
			for (let x = left.x; x < right.x; x++) { // Walk horizontally through the pixels of the rectangle.
				const mean = left.mean + (x - left.x) / dx * dMean // The current mean of the GP, linearly extrapolated.
				const std = left.std + (x - left.x) / dx * dStd // The current std of the GP, linearly extrapolated.
				for (let y = 0; y < this.height; y++) { // Walk vertically through the pixels.
					const ind = ((x - left.x) + y * dx) * 4 // The index within the image data that we're currently at. (The image data array uses four elements per pixel (rgba).)
					imgData.data[ind + 0] = 0 // Red.
					imgData.data[ind + 1] = 34 // Blue.
					imgData.data[ind + 2] = 204 // Green.
					imgData.data[ind + 3] = 255 * Math.exp(-0.5 * (((mean - y) / std) ** 2)) // Alpha.
				}
			}
			this.ctx.putImageData(imgData, left.x, 0)
		}
	}

	// drawMeasurements draws circles for each of the measurements that is present in the GP. When an extraMeasurement parameter has been defined for the object (with input and output parameters) then this is also drawn. This can be useful when an extra circle is drawn on a mouseover event.
	drawMeasurements() {
		// Extract all the measurements. Add the extra point if it is present.
		const measurements = (this.extraPoint ? [...this.gp.getMeasurements(), this.extraPoint] : this.gp.getMeasurements())

		// Set up the measurement points using D3, first adding new ones, then updating existing ones and finally removing old ones.
		const points = this.measurementContainer
			.selectAll('circle')
			.data(measurements)
		points.enter() // New points.
			.append('circle')
			.attr('class', 'measurement')
			.attr('r', this.measurementRadius)
			.merge(points) // New and existing points.
			.attr('cx', measurement => this.scale.input(GaussianProcess.getInputFromMeasurement(measurement)))
			.attr('cy', measurement => this.scale.output(GaussianProcess.getOutputFromMeasurement(measurement)))
		points.exit() // Outdated points.
			.remove()
	}

	// drawSamples draws sample lines for the samples given by the GP object. To make samples, simply tell the GP object to have the correct number of samples.
	drawSamples() {
		// Extract the samples from the transitioners. And as is usual with D3, define an array with all the elements that need to be drawn.
		const samples = this.getCurrentSamples()
		const lineData = samples.map(sample => sample.map((sampleValue, i) => ({
			input: this.plotPoints[i],
			output: sampleValue,
		})))

		// Set up a path for the mean line using D3.
		const lines = this.sampleContainer
			.selectAll('path')
			.data(lineData)
		lines.enter()
			.append('path')
			.attr('class', 'sample')
			.merge(lines)
			.attr('d', this.sampleFunction)
		lines.exit()
			.remove()
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
}