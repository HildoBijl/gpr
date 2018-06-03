import React from 'react'

import { connectToData } from '../../../../../redux/dataStore.js'
import GaussianDistribution from '../../../../../logic/gaussianDistribution.js'

import Figure from '../../../../components/Figure/Figure.js'
import GPPlot from '../../../../components/Figure/GPPlot.js'

const id = 'testPlot'
const gpData = {
	covarianceData: {
		type: 'SquaredExponential',
		Vx: 2 ** 2,
		Vy: 2 ** 2,
	},
}

class InteractiveFigure extends Figure {
	renderSubFigures() {
		this.num = 'A'
		return <InteractivePlot />
	}
	onReset() {
		this.props.data.gp.removeAllMeasurements()
	}
	setCounter(newValue) {
		return this.props.data.gp.setNumSamples(Math.max(0, newValue))
	}
	getCounter(counterIndex) {
		return (this.props.data.gp.samples || []).length
	}
}
export default connectToData(InteractiveFigure, id, { gp: true })

class InteractivePlot extends GPPlot {
	// TODO:
	// - Set up a separate function in the GPPlot class to draw a sliver of the background for a GP.
	// - Use this to start making content.

	// TODO:
	// - Set up a function in the GP class to recalculate all matrices.
	// - Add actions to the reduxGP file (and to the GP):
	//   x setMeanFunction
	//   x setCovarianceFunction
	//   x setDefaultOutputNoise
	//   For all these actions, add the option to recalculate all matrices afterwards, or to simply continue with the previous matrix that existed.

	constructor() {
		super()

		// Define important settings.
		this.id = id
		// this.className.noNumbers = true
		this.className.pointer = true

		// Set up the plot range.
		this.range = {
			input: {
				min: -2,
				max: 6,
			},
			output: {
				min: -5,
				max: 5,
			},
		}

		// Set up the GP. This data will be installed as soon as the GP Plot is set up. [ToDo: rename outputNoise to defaultOutputNoise]
		this.gpData = gpData
	}
	getInputAxisStyle() {
		return super.getInputAxisStyle().tickFormat(v => `${(v + 24) % 24}:00`)
	}
	getOutputAxisStyle() {
		return super.getOutputAxisStyle().tickFormat(v => `${v.toFixed(1)} °C`)
	}
	handleClick(pos, evt) {
		this.props.data.gp.addMeasurement({
			input: this.scale.input.invert(pos.x),
			output: new GaussianDistribution(this.scale.output.invert(pos.y), Math.random()),
		})
	}
	handleMouseMove(pos, evt) {
		const point = {
			input: this.scale.input.invert(pos.x),
			output: this.scale.output.invert(pos.y),
		}
		this.extraPoint = this.isWithinRange(point) ? point : null
	}
	handleMouseLeave(pos, evt) {
		delete this.extraPoint
	}
}
InteractivePlot = connectToData(InteractivePlot, id, { gp: true })
