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
	constructor() {
		super()
		this.numSliders = 2
	}
	renderSubFigures() {
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
	setSlider(newValue, definite, index) {
		// ToDo: set directly into the GP.
		this.props.data.set({ [`slider${index}`]: newValue })
	}
	getSlider(index) {
		// ToDo: pull directly from the GP.
		return this.props.data[`slider${index}`]
	}
}
export default connectToData(InteractiveFigure, id, { gp: true })

class InteractivePlot extends GPPlot {
	// TODO:
	// - Set up a function in the GP class to recalculate all matrices.
	// - Add actions to the reduxGP file (and to the GP):
	//   x setMeanFunction
	//   x setCovarianceFunction
	//   x setDefaultOutputNoise
	//   For all these actions, add the option to recalculate all matrices afterwards, or to simply continue with the previous matrix that existed.

	// TODO
	// V Set up a slider that can be adjusted/slid.
	// - Couple the slider to a hyperparameter.

	// TODO:
	// - Set up a separate function in the GPPlot class to draw a sliver of the background for a GP.
	// - Use this for certain plots in the chapter.

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
		console.log(this.props.data)
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
