import React from 'react'

import { connectToData } from '../../../../../redux/dataStore.js'

import Figure from '../../../../components/Figure/Figure.js'
import GPPlot from '../../../../components/Figure/GPPlot.js'

const id = 'testPlot'
const gpData = {
	covarianceData: {
		type: 'SquaredExponential',
		Vx: 2 ** 2,
		Vy: 2 ** 2,
	},
	outputNoise: 0.1,
}

class InteractiveFigure extends Figure {
	renderSubFigures() {
		return <InteractivePlot />
	}
	renderControlBar() {
		return <span onClick={this.reset.bind(this)} style={{cursor: 'pointer', background: '#113344', padding: '4px', borderRadius: '4px'}}>Test reset</span>
		// TODO: ADD PROPER RESET BUTTON?
	}
	reset() {
		// TODO: REMOVE
		console.log('Resetting...')
		this.props.data.gp.applyState(gpData)
	}
}
export default connectToData(InteractiveFigure, id, { gp: true })

class InteractivePlot extends GPPlot {
	// TODO NEXT: 
	// - Play around with the new functionalities. Use different GP names, multiple GPs, etcetera.
	// - Add extra functions for within redux? Next to adding measuments? (Maybe we'll need samples after adding a control bar?)

	// TODO: Set up a GaussianProcess folder within the logic folder, with a separate file for the redux stuff. Also consider putting the applyState and processUpdate functions in an inherited class. Except that the applyState function is now used by the main class too.
	// For processUpdate, also check if the internal state still matches the redux state. If not, throw an error?

	// TODO NEXT: A PLAN FOR STORING DATA OF A PLOT IN REDUX WHILE GOING TO ANOTHER PAGE.
	// - Have a GP export essential data (measurements used, samples generated) in some useful format.
	// V Set up a covariance function data object containing essential covariance function data, so that covariance functions can also be exported.
	// - Upon an event, fire an action for the GP plot (its ID) and with the respective data.
	// - The action changes the data for that GP and remembers the last action for the GP object itself to process. It's key that the format of the data is clear, as it needs to be used by both the redux file changing the storage as the GP class reading it.
	// - When doing something GP-specific, like generating a sample, then ask the GP for the data to be generated, store it, and let the GP itself then process it. It's a bit of a roundabout way of doing this, but it's the only way to properly process and store the data.
	// - When a plot reloads, check if data on it is already available. If so, load in all the data.
	// - When a plot loads for the first time, use a given set-up (or default). Ignore the given set-up if data is already available.
	// - Make the option to reset (override the set-up to the given one).
	// - A plot may also have other data. So store GP data into an object named "gp". Use other objects for other data. In redux, use a key-value storage for this.
	// - A figure may even have multiple GPs, so use the name of a GP for that storage?

	// TODO NEXT:
	// V Turn Figure into a proper class. And Subfigure as well.
	// V In the Figure class, use methods renderSubFigures (not optional) and renderControlBar (optional) that will be incorporated by the figure's render function.
	// V Make the InteractivePlot (this file) expand on the Figure.
	// V Add a non-exported subclass inside this file, expanding upon the GPPlot and use it in the new renderSubFigures function.
	// V Replace the half-class for plots by a twoColumn class for figures.
	// V Make a simple reset button and get it working.
	// - Apply styling to the control bar.

	// Also ToDo:
	// - At the GP class, when adding measurements, allow us to specify noise on the output. This output noise will be taken into account at the covariance matrix.
	// - Upon creating a GP class, allow to set a default output noise. If so, that will be used for all measurements unless specified differently. Throw an error if no default is set and no output noise is given.

	// TODO and then:
	// - Set up a button to increase/decrease the number of samples.
	// - Generate samples and plot them. The plan for generating samples is this.
	//   x Check the test points for which we want a sample. If they are fifteen or less, find the posterior covariance, generate the Cholesky, and come up with a sample.
	//   x If they are more than fifteen points (say, n points) then generating a Cholesky might be tricky. So then:
	//     x generate a range from 0 to n-1 with fifteen numbers in it. Round these numbers. They are the indices of the test points that we will generate a sample for.
	//     x Find the posterior covariance matrix for said test points, generate the Cholesky and come up with a sample.
	//     x Clone the GP. Then add the samples as infinitely precise measurements (or near-infinite anyway).
	//     x For the cloned GP, calculate the mean for the full set of test points. This counts as a sample.
	// - Animate the samples too, so that when you add a data point, the samples move too. This means samples should be passed through transitioners. At the same time, we should also remember the random vectors used to generate said samples.

	constructor() {
		super()

		// Define important settings.
		this.id = id
		this.className.noNumbers = true
		this.className.pointer = true

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

		// Set up the GP. This data will be installed as soon as the GP Plot is set up. [ToDo: rename outputNoise to defaultOutputNoise]
		this.gpData = gpData
	}
	handleClick(pos, evt) {
		const measurement = {
			input: this.scale.x.invert(pos.x),
			output: this.scale.y.invert(pos.y),
		}
		this.props.data.gp.addMeasurement(measurement)
	}
	handleMouseMove(pos, evt) {
		this.extraPoint = {
			input: this.scale.x.invert(pos.x),
			output: this.scale.y.invert(pos.y),
		}
	}
	handleMouseLeave(pos, evt) {
		delete this.extraPoint
	}
}
InteractivePlot = connectToData(InteractivePlot, id, { gp: true })
