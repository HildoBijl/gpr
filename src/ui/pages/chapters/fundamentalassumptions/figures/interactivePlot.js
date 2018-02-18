import GaussianProcess, { getSquaredExponentialCovarianceFunction } from '../../../../../logic/gaussianProcess.js'

import GPPlot from '../../../../components/Figure/GPPlot.js'

export default class CurrentPlot extends GPPlot {
	// TODO NEXT:
	// - Turn Figure into a proper class. And Subfigure as well.
	// - In the Figure class, use methods renderSubFigures (not optional) and renderControlBar (optional) that will be incorporated by the figure's render function.
	// - Make the InteractivePlot (this file) expand on the Figure.
	// - Add a non-exported subclass inside this file, expanding upon the GPPlot and use it in the new renderSubFigures function.
	// - Make a simple reset button and get it working.
	// - Apply styling to the control bar.
	
	constructor() {
		super()

		// Define important settings.
		this.id = 'interactivePlot'
		this.classes['noNumbers'] = true
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