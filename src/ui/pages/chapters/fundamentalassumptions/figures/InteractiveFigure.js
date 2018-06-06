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
		this.props.data.gp.setCovarianceFunction({
			...this.props.data.gp.covarianceData,
			[index === 0 ? 'Vx' : 'Vy']: (0.2 + (newValue*5)) ** 2,
		})
	}
	getSlider(index) {
		const key = index === 0 ? 'Vx' : 'Vy'
		const V = this.props.data.gp.covarianceData[key]
		return (Math.sqrt(V) - 0.2)/5
	}
}
export default connectToData(InteractiveFigure, id, { gp: true, initial: { gp: gpData } })

class InteractivePlot extends GPPlot {
	// TODO:
	// V Set up a function in the GP class to recalculate all matrices.
	// V Add actions to the reduxGP file (and to the GP):
	//   x setMeanFunction
	//   x setCovarianceFunction
	//   x setDefaultOutputNoise
	//   For all these actions, add the option to recalculate all matrices afterwards, or to simply continue with the previous matrix that existed.

	// TODO
	// V Set up a slider that can be adjusted/slid.
	// V Couple the slider to a hyperparameter.

	// TODO:
	// - Set up a separate function in the GPPlot class to draw a sliver of the background for a GP.
	// - Use this for certain plots in the chapter.

	constructor() {
		super()

		// Define important settings.
		this.id = id
		// this.className.noNumbers = true // Do we show numbers on the axes?
		this.className.pointer = true // Should we show a pointer when the mouse is over the plot? Useful when the user can click on the plot to do something, like adding measurements.
		this.numPlotPoints = 201 // Useful when the length scale is cut down and samples vary quickly.
		this.transitionTime = 0 // Can be set to zero for instant reactions.

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

		// Set up the GP. This data will be installed as soon as the GP Plot is set up.
		this.gpData = gpData
	}
	getInputAxisStyle() {
		return super.getInputAxisStyle().tickFormat(v => `${(v + 24) % 24}:00`)
	}
	getOutputAxisStyle() {
		return super.getOutputAxisStyle().tickFormat(v => `${v.toFixed(1)} °C`)
	}
	handleClick(pos, evt) {
		console.log(this.props.data) // TODO REMOVE
		window.g = this.gp // TODO REMOVE
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
