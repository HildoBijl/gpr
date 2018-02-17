import React, { Component } from 'react'

import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { axisLeft, axisBottom } from 'd3-axis'
import { line, curveLinear } from 'd3-shape'

import GaussianProcess, { getSquaredExponentialCovarianceFunction } from '../../../../../logic/gaussianProcess.js'
import { getRange } from '../../../../../logic/util.js'

import Figure from '../../../../components/Figure/Figure.js'

import transitioner from '../../../../../logic/transitioner.js'

// TODO NEXT:
// [Done] Figure out how gradients work within SVG. An alternative is to use canvas, but having two methods will be a hassle. Edit: custom gradients in SVG suck. Use canvas instead.
// [Done] Figure out how to get overflow with SVG but only for certain elements. Solution: set overflow: visible for the SVG block and apply a mask for SVG groups that should not have overflow.
// [Done] Make the plot dynamic. Allow the adding of points. Make sure things update properly.
// - Allow for smooth updating of the plot, transitioning the mean line and the variances. This is difficult, as it requires the calculation of hundreds of values that need to be updated at every animation frame. The trick would be to first transform the prediction into a combination of [mean, std]. Then plug these values into a transitioner-object. This is a to-be-designed object, which remembers the old value, the old time, the new value and the transition time, as well as the transition type. It has a getValue() function that returns the current value, and a setValue() function that allows the adjustment of values. (All transition objects have the same settings? To easily allow a change in transition time/type or so?) This allows it to transition values. Then, based on these transitioning values, we update the plot on every animation frame. 
// Steps:
// x Upon change, update values and plug them into transitioner.
// x Set up animation frames within the object. (I think every object can use their own requests, but I'm not entirely sure.)
// x On every animation frame, get new values from the transitioner and put them (as a simple array) as data into d3.
// - Copy the gradient method from the GP presentation script.
// - Allow potentially dragging points. In this case, updating the plot smoothly is not required anymore. It is useful to still use animation frame requests, instead of rerendering upon every mouseMove event.
// - Arrange z-indices: make sure measurement points appear on top.
// - Potentially put it all in a GP Plot class, for as much as possible. Add options showAxes, showNumbers, range, the gp that's used, an update feature, whether you can add points, delete points, drag them, and so on.

class Plot extends Component {
	constructor() {
		super()

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

		this.gp = new GaussianProcess({ covariance: getSquaredExponentialCovarianceFunction({ Vx: 2 ** 2, Vy: 4 ** 2 }), outputNoise: 0.01 })
	}
	componentDidMount() {
		this.initializePlot()
		this.updatePlot()
		setInterval(this.addMeasurement.bind(this), 1000);
	}
	componentDidUpdate() {
		this.updatePlot()
	}
	addMeasurement() {
		// Add a measurement (or if not available, remove all measurements) for the GP.
		if (this.gp.measurements.length === this.measurements.length)
			this.gp.reset()
		else
			this.gp.addMeasurement(this.measurements[this.gp.measurements.length])
		this.updatePlot()
	}
	initializePlot() {
		// Set up all containers. The order matters: later containers are on top of earlier containers.
		this.svgContainer = select('#samplePlot')
		// this.gradientContainer = this.svgContainer.append('g').attr('class', 'variance') // TODO: REMOVE
		this.xAxisContainer = this.svgContainer.append('g').attr('class', 'axis')
		this.yAxisContainer = this.svgContainer.append('g').attr('class', 'axis')
		this.meanContainer = this.svgContainer.append('g').attr('mask', 'url(#screen)').attr('class', 'mean')
		this.measurementContainer = this.svgContainer.append('g').attr('class', 'measurements')

		// Set up the scales.
		this.scale = {
			x: scaleLinear().domain([this.range.x.min, this.range.x.max]).range([0, 1000]),
			y: scaleLinear().domain([this.range.y.min, this.range.y.max]).range([750, 0]),
		}

		// Set up the gradients.
		// const rects = this.gradientContainer
		// 	.selectAll('rect')
		// 	.data(this.prediction)
		// rects.enter()
		// 	.append('rect')
		// 	.attr('fill', 'url(#gradient)')
		// 	.merge(rects)
		// 	.attr('transform', (point, i) => {
		// 		const dx = ((i === this.prediction.length - 1 ?
		// 			this.scale.x(point.input) :
		// 			this.scale.x((point.input + this.prediction[i + 1].input) / 2)
		// 		) - (i === 0 ?
		// 			this.scale.x(point.input) :
		// 			this.scale.x((point.input + this.prediction[i - 1].input) / 2)
		// 			))
		// 		const dy = ((i === this.prediction.length - 1 ?
		// 			this.scale.x(point.output.mean) :
		// 			this.scale.x((point.output.mean + this.prediction[i + 1].output.mean) / 2)
		// 		) - (i === 0 ?
		// 			this.scale.x(point.output.mean) :
		// 			this.scale.x((point.output.mean + this.prediction[i - 1].output.mean) / 2)
		// 			))
		// 		const skew = Math.atan2(-dy, dx) * 180 / Math.PI
		// 		return `skewY(${skew})`
		// 	})
		// 	.attr('x', (point, i) => (i === 0 ?
		// 		this.scale.x(point.input) :
		// 		this.scale.x((point.input + this.prediction[i - 1].input) / 2)
		// 	))
		// 	.attr('width', (point, i) => ((i === this.prediction.length - 1 ?
		// 		this.scale.x(point.input) :
		// 		this.scale.x((point.input + this.prediction[i + 1].input) / 2)
		// 	) - (i === 0 ?
		// 		this.scale.x(point.input) :
		// 		this.scale.x((point.input + this.prediction[i - 1].input) / 2)
		// 		)))
		// 	.attr('y', (point, i) => {
		// 		const x = (i === 0 ?
		// 			this.scale.x(point.input) :
		// 			this.scale.x((point.input + this.prediction[i - 1].input) / 2)
		// 		)
		// 		const xLeft = (i === 0 ?
		// 			this.scale.x(point.input) :
		// 			this.scale.x(this.prediction[i - 1].input)
		// 		)
		// 		const xRight = (i === this.prediction.length - 1 ?
		// 			this.scale.x(point.input) :
		// 			this.scale.x(this.prediction[i + 1].input)
		// 		)
		// 		const dx = (xRight - xLeft)
		// 		const yLeft = (i === 0 ?
		// 			this.scale.y(point.output.mean) :
		// 			this.scale.y(this.prediction[i - 1].output.mean)
		// 		)
		// 		const yRight = (i === this.prediction.length - 1 ?
		// 			this.scale.y(point.output.mean) :
		// 			this.scale.y(this.prediction[i + 1].output.mean)
		// 		)
		// 		const dy = yRight - yLeft
		// 		const skew = Math.atan2(-dy, dx)
		// 		return this.scale.y(point.output.mean + 2 * Math.sqrt(point.output.variance)) - x*dy/dx
		// 	})
		// 	.attr('height', point => this.scale.y(0) - this.scale.y(4 * Math.sqrt(point.output.variance)))
		// rects.exit()
		// 	.remove()

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
		this.lineFunction1 = line()
			.x(prediction => this.scale.x(prediction.input))
			.y(prediction => this.scale.y(prediction.output.mean + 2 * Math.sqrt(prediction.output.variance)))
			.curve(curveLinear)
		this.lineFunction2 = line()
			.x(prediction => this.scale.x(prediction.input))
			.y(prediction => this.scale.y(prediction.output.mean - 2 * Math.sqrt(prediction.output.variance)))
			.curve(curveLinear)
	}
	updatePlot() {
		// Extract the prediction.
		this.prediction = this.gp.getPrediction({
			input: getRange(this.range.x.min, this.range.x.max, 201)
		})
		// TODO: REMOVE
		window.gpt = this.gp
		window.prediction = this.prediction

		// Set up the line for the mean.
		const lines = this.meanContainer
			.selectAll('path')
			.data(new Array(3).fill(this.prediction))
		lines.enter()
			.append('path')
			.attr('stroke', 'blue')
			.attr('stroke-width', (p,i) => (i === 0 ? 2 : 1))
			.attr('fill', 'none')
			.merge(lines)
			.attr('d', (p, i) => (i === 0 ? this.lineFunction(p) : i === 1 ? this.lineFunction1(p) : this.lineFunction2(p)))
		lines.exit()
			.remove()

		// And lines for the variance.
		// this.meanLine = this.meanContainer.append('path')
		// 	.attr('d', this.lineFunction1(this.prediction))
		// 	.attr('stroke', 'blue')
		// 	.attr('stroke-width', 1)
		// 	.attr('fill', 'none')
		// this.meanLine = this.meanContainer.append('path')
		// 	.attr('d', this.lineFunction2(this.prediction))
		// 	.attr('stroke', 'blue')
		// 	.attr('stroke-width', 1)
		// 	.attr('fill', 'none')

		// Set up the measurement points, first adding new ones, then updating existing ones and finally removing old ones.
		const points = this.measurementContainer
			.selectAll('circle')
			.data(this.gp.measurements)
		points.enter() // New points.
			.append('circle')
			.attr('r', '6')
			// .on('click', (bin) => this.props.setStatisticsBounds([bin.x0, bin.x1]))
			.merge(points) // New and existing points.
			.attr('cx', point => this.scale.x(point.input))
			.attr('cy', point => this.scale.y(point.output))
		points.exit() // Outdated points.
			.remove()
	}
	getBounds(type) {
		return [
			this.gp.measurements.reduce((result, m) => (result === undefined || m[type] < result ? m[type] : result), undefined),
			this.gp.measurements.reduce((result, m) => (result === undefined || m[type] > result ? m[type] : result), undefined),
		]
	}
	render() {
		return (
			<Figure section={this.props.section}>
				<svg id="samplePlot" viewBox="0 0 1000 750" className="noNumbers">
					<defs>
						<linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
							<stop offset="0%" style={{ stopColor: 'rgb(17,51,187)', stopOpacity: '0' }} />
							<stop offset="50%" style={{ stopColor: 'rgb(17,51,187)', stopOpacity: '1' }} />
							<stop offset="100%" style={{ stopColor: 'rgb(17,51,187)', stopOpacity: '0' }} />
						</linearGradient>
						<mask id="screen">
							<rect x="0" y="0" width="1000" height="750" fill="#fff" />
						</mask>
					</defs>
				</svg>
			</Figure>
		)
	}
}

export default Plot