import React, { Component } from 'react'
import Link from 'redux-first-router-link'

import { connectToData } from '../../../redux/dataStore.js'

import Figure from '../../components/Figure/Figure.js'
import GPPlot from '../../components/Figure/GPPlot.js'

// Set up datastore data.
const gpDemoId = 'gaussianProcessRegressionDemo'
const gpDemoInitial = {
	gp: {
		meanData: {
			type: 'Constant',
			m: 2,
		},
		covarianceData: {
			type: 'SquaredExponential',
			Vx: 1.2 ** 2,
			Vy: 4 ** 2,
		},
		measurements: [
			{
				input: 0.4,
				output: 0.4,
			},
			{
				input: 3,
				output: 6,
			},
			{
				input: 6,
				output: 4,
			},
		],
		defaultOutputNoiseVariance: 0.1,
	}
}
const timeRange = {
	min: -1,
	max: 7,
}
const temperatureRange = {
	min: -6,
	max: 10,
}

export default class Home extends Component {
	render() {
		return (
			<div>
				<p>This web app is an interactive book. It's a tutorial explaining you all about the machine learning technique called Gaussian process regression.</p>
				<h4>What is Gaussian process regression?</h4>
				<p>Gaussian Process (GP) regression is, roughly said, a method of approximating functions/relations, based on measurements. For example, suppose that we measure the temperature at various times in a day, what can we then say about the temperature at intermediate times? That's the problem shown in the plot below. Interact with it! Click/press on it to add measurements, or reset the plot to remove them.</p>
				<FGPDemo section={this} />
				<p>But GP regression isn't only about function approximation. It's also about finding structure in data, making predictions, identifying systems, optimizing processes, and much, much more. In this tutorial app, you can read all about it and, more importantly, play around with it.</p>
				<h4>How to use this app</h4>
				<p>If this app needed a manual, it wouldn't be any good. Head to the <Link to={{ type: 'TREE' }}>Contents Tree</Link> and start reading/playing!</p>
			</div>
		)
	}
}

// Set up the figure.
class FGPDemo extends Figure {
	renderSubFigures() {
		return <PGPDemo />
	}
	onReset() {
		this.props.data.gp.removeAllMeasurements()
	}
}
FGPDemo = connectToData(FGPDemo, gpDemoId, { gp: true, initial: gpDemoInitial })

// Set up the plot.
class PGPDemo extends GPPlot {
	constructor() {
		super()

		// Define important settings.
		this.measurementRadius = 8
		this.className.pointer = true // Show a cursor pointer.

		// Set up the plot range.
		this.range = {
			input: timeRange,
			output: temperatureRange,
		}
	}
	getInputAxisStyle() {
		return super.getInputAxisStyle().tickFormat(v => `${(v + 6 + 24) % 24}:00`)
	}
	getOutputAxisStyle() {
		return super.getOutputAxisStyle().tickFormat(v => `${v} °C`)
	}
	update() {
		// These are the things that we want to draw.
		this.drawMean()
		this.drawStd()
		this.drawMeasurements()
	}
	handleClick(pos, evt) {
		this.props.data.gp.addMeasurement({
			input: this.scale.input.invert(pos.x),
			output: this.scale.output.invert(pos.y),
		})
	}
	handleMouseMove(pos, evt) {
		const point = {
			input: this.scale.input.invert(pos.x),
			output: this.scale.output.invert(pos.y),
		}
		this.extraPoint = this.isWithinRange(point) ? point : null
	}
	handleMouseLeave(pos) {
		delete this.extraPoint
	}
}
PGPDemo = connectToData(PGPDemo, gpDemoId, { gp: true })