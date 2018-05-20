import GaussianProcess, { getSquaredExponentialCovarianceFunction } from '../../../../../logic/gaussianProcess.js'

import GPPlot from '../../../../components/Figure/GPPlot.js'

export default class CurrentPlot extends GPPlot {
	// TODO NEXT: A PLAN FOR STORING DATA OF A PLOT IN REDUX WHILE GOING TO ANOTHER PAGE.
	// - Have a GP export essential data (measurements used, samples generated) in some useful format.
	// - Upon an event, fire an action for the GP plot (its ID) and with the respective data.
	// - The action changes the data for that GP and remembers the last action for the GP object itself to process. It's key that the format of the data is clear, as it needs to be used by both the redux file changing the storage as the GP class reading it.
	// - When doing something GP-specific, like generating a sample, then ask the GP for the data to be generated, store it, and let the GP itself then process it. It's a bit of a roundabout way of doing this, but it's the only way to properly process and store the data.
	// - When a plot reloads, check if data on it is already available. If so, load in all the data.
	// - When a plot loads for the first time, use a given set-up (or default). Ignore the given set-up if data is already available.
	// - Make the option to reset (override the set-up to the given one).
	// - A plot may also have other data. So store GP data into an object named "gp". Use other objects for other data. In redux, use a key-value storage for this.
	// - A figure may even have multiple GPs, so use the name of a GP for that storage?

	// TODO NEXT:
	// - Turn Figure into a proper class. And Subfigure as well.
	// - In the Figure class, use methods renderSubFigures (not optional) and renderControlBar (optional) that will be incorporated by the figure's render function.
	// - Make the InteractivePlot (this file) expand on the Figure.
	// - Add a non-exported subclass inside this file, expanding upon the GPPlot and use it in the new renderSubFigures function.
	// - Replace the half-class for plots by a twoColumn class for figures.
	// - Make a simple reset button and get it working.
	// - Apply styling to the control bar.

	// Also ToDo:
	// - At the GP class, when adding measurements, allow us to specify noise on the output. This output noise will be taken into account at the covariance matrix.
	// - Upon creating a GP class, allow to set a default output noise. If so, that will be used for all measurements. Throw an error if no default is set and no output noise is given.

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
		this.id = 'interactivePlot'
		// this.classes['noNumbers'] = true
		this.classes['pointer'] = true
		
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
	
		// Set up the GP.
		this.gp = new GaussianProcess({ covariance: getSquaredExponentialCovarianceFunction({ Vx: 2 ** 2, Vy: 2 ** 2 }), outputNoise: 0.1 })
	}
	handleClick(pos, evt) {
		this.gp.addMeasurement({
			input: this.scale.x.invert(pos.x),
			output: this.scale.y.invert(pos.y),
		})
		this.recalculate()
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