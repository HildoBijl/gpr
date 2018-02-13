import React, { Component } from 'react'

import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { axisLeft, axisBottom } from 'd3-axis'
import { line, curveLinear } from 'd3-shape'

import GaussianProcess, { getSquaredExponentialCovarianceFunction } from '../../../../../logic/gaussianProcess.js'
import { getRange } from '../../../../../logic/util.js'

import Figure from '../../../../components/Figure/Figure.js'

// TODO NEXT:
// - Figure out how gradients work within SVG. An alternative is to use canvas, but having two methods will be a hassle.
// - Make the plot interactive. Allow clicks to add points. Make sure things update properly.
// - Allow potentially dragging points.
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

		this.gp = new GaussianProcess({ covariance: getSquaredExponentialCovarianceFunction({ Vx: 2 ** 2, Vy: 4 ** 2 }), outputNoise: 0.01 })
		this.gp.addMeasurement([
			{ input: -3, output: 1.1 },
			{ input: -2.1, output: 1.8 },
			{ input: -0.8, output: 2.1 },
			{ input: -0.1, output: 0.9 },
			{ input: 0.6, output: -0.2 },
			{ input: 1.4, output: -1.6 },
			{ input: 1.7, output: -2.2 },
			{ input: 2.6, output: -1.7 },
			{ input: 3.4, output: -0.4 },
		])
		this.prediction = this.gp.getPrediction({
			input: getRange(this.range.x.min, this.range.x.max, 101)
		})
		// TODO: REMOVE
		window.gpt = this.gp
		window.prediction = this.prediction
	}
	componentDidMount() {
		this.initializePlot()
		this.updatePlot()
	}
	componentDidUpdate() {
		this.updatePlot()
	}
	initializePlot() {
		// Set up all containers.
		this.svgContainer = select('#samplePlot')
			.append('g')
		this.circleContainer = this.svgContainer.append('g')
		this.xAxisContainer = this.svgContainer.append('g').attr('class', 'axis')
		this.yAxisContainer = this.svgContainer.append('g').attr('class', 'axis')
		this.meanContainer = this.svgContainer.append('g')

		// Set up the scales.
		const xScale = scaleLinear().domain([this.range.x.min, this.range.x.max]).range([10, 990])
		const yScale = scaleLinear().domain([this.range.y.min, this.range.y.max]).range([740, 10])

		// Set up the axes.
		const xAxis = axisBottom(xScale)
		const yAxis = axisLeft(yScale)
		this.xAxisContainer
			.attr('transform', `translate(0,${yScale(0)})`)
			.call(xAxis)
		this.yAxisContainer
			.attr('transform', `translate(${xScale(0)},0)`)
			.call(yAxis)

		// Set up the line for the mean.
		console.log(this.prediction)
		window.line = line // TODO
		this.lineFunction = line()
			.x(prediction => xScale(prediction.input))
			.y(prediction => yScale(prediction.output.mean))
			.curve(curveLinear)
		this.meanLine = this.meanContainer.append('path')
			.attr('d', this.lineFunction(this.prediction))
			.attr('stroke', 'blue')
			.attr('stroke-width', 2)
			.attr('fill', 'none')

		this.lineFunction = line()
			.x(prediction => xScale(prediction.input))
			.y(prediction => yScale(prediction.output.mean + 2 * Math.sqrt(prediction.output.variance)))
			.curve(curveLinear)
		this.meanLine = this.meanContainer.append('path')
			.attr('d', this.lineFunction(this.prediction))
			.attr('stroke', 'blue')
			.attr('stroke-width', 1)
			.attr('fill', 'none')

		this.lineFunction = line()
			.x(prediction => xScale(prediction.input))
			.y(prediction => yScale(prediction.output.mean - 2 * Math.sqrt(prediction.output.variance)))
			.curve(curveLinear)
		this.meanLine = this.meanContainer.append('path')
			.attr('d', this.lineFunction(this.prediction))
			.attr('stroke', 'blue')
			.attr('stroke-width', 1)
			.attr('fill', 'none')

		// Set up the measurement points, first adding new ones, then updating existing ones and finally removing old ones.
		const points = this.circleContainer
			.selectAll('circle')
			.data(this.gp.measurements)
		points.enter() // New points.
			.append('circle')
			.attr('r', '6')
			// .on('click', (bin) => this.props.setStatisticsBounds([bin.x0, bin.x1]))
			.merge(points) // New and existing points.
			.attr('cx', point => xScale(point.input))
			.attr('cy', point => yScale(point.output))
		points.exit() // Outdated points.
			.remove()
	}
	updatePlot() {
		// TODO: FIGURE OUT WHAT GOES IN THE INITIALIZE AND WHAT GOES IN THE UPDATE.
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
				<svg id="samplePlot" viewBox="0 0 1000 750" className="noNumbers" />
			</Figure>
		)
	}
}

export default Plot