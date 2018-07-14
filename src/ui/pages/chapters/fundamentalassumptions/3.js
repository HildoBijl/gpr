import React from 'react'
import Link from 'redux-first-router-link'

import { connectToData } from '../../../../redux/dataStore.js'
import { connectToExplainer } from '../../../../redux/explainer.js'
import { getRange, bound } from '../../../../logic/util.js'

import Section from '../../../components/Section/Section.js'
import Figure from '../../../components/Figure/Figure.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'
import GPPlot from '../../../components/Figure/GPPlot.js'
import LinePlot from '../../../components/Figure/LinePlot.js'
import { Term, Emph, Num, Note } from '../../../components/Textbox/index.js'

const dataStoreID = 'gaussianDistributionIdea'
const gaussian = (x, m, l) => 1 / (Math.sqrt(2 * Math.PI) * l) * Math.exp(-0.5 * ((x - m) / l) ** 2)
const measuredTemperature = 2

export default class CurrentSection extends Section {
	render() {
		this.reset()
		return (
			<div>
				<p>How are the temperatures at various times linked? And how can we mathematically define this link? That is what we'll look at next.</p>

				<h4>The link between 8:00 and 9:00</h4>

				<p>Without any prior knowledge, the temperature at 9:00 is likely to be somewhere between -6 °C and 10 °C. That's all that we can say. But now suppose that we know the temperature at 8:00. Suppose that it equals {measuredTemperature} °C. What can we then say about the distribution of the temperature at 9:00?</p>
				<p>The key is that the temperature doesn't change very quickly. In other words, the temperature at 9:00 will be <Emph>similar</Emph> to the temperature at 8:00. But how similar? Could the temperature also be {measuredTemperature+1} °C? Maybe {measuredTemperature+2} °C? And what about {measuredTemperature+3} °C?</p>
				<FCorrelation section={this} number={++this.counters.figure} time={3} className="twoColumn" />
				<FigureGuide>
					<p>In the above figure, the left plot again shows the probability distribution of the temperature, but now for 9:00. The right figure shows the same distribution using a color gradient.</p>
					<p>To adjust the figure, use the slider at the bottom. With it, you can change how much variation the temperature will have at 9:00.</p>
				</FigureGuide>
				<p>So you just defined the link between the temperatures at 8:00 and 9:00. The way in which we mathematically indicate this link is through the <Term>correlation</Term>. A correlation of 1 means that the two temperatures are exactly equal, while a correlation of 0 means that knowing the temperature at 8:00 does not tell us anything about the temperature at 9:00. It seems you've decided on a correlation of <Num>[ToDo]</Num>.</p>

				<h4>Temperatures at distant times may vary</h4>
				<p>Next, let's focus on a slightly different question: what do we know about the temperature at 11:00? We still only know that at 8:00 we had 2 °C. So what's different here?</p>
				<p>The answer is that the temperature at 11:00 is not linked so much with the temperature at 8:00. Sure, it's linked a little bit, but less than what we had for 9:00. Let's see what you think the correlation will be now.</p>
				<FCorrelation section={this} number={++this.counters.figure} time={5} className="twoColumn" />
				<FigureGuide>
					<p>The above figure works exactly the same as the previous one. It's just made for the temperature at 11:00.</p>
				</FigureGuide>
				<p>So this time, we have a correlation of <Num>[ToDo]</Num>.</p>

				<h4>The correlation function</h4>
				<p>We see that the correlation between function values depends on how much time has passed. To fully define this, we will set up a <Term>correlation function</Term>. This correlation function specifies, given the difference between two times t<sub>1</sub> and t<sub>2</sub>{/* ToDo */}, what the correlation is between the temperatures at these times.</p>
				<p>There's already a few things that we know. For example, we know that if the time difference is zero hours, then the correlation must be one. After all: the temperature at 8:00 <Emph>must</Emph> be equal to the temperature at 8:00. Secondly, we have just specified that, if the time difference is one hour, then the correlation we should have is <Num>[ToDo]</Num>. Similarly, if the time difference is three hours, the correlation we should have is <Num>[ToDo]</Num>.</p>
				<p>To keep things simple, we assume that the correlation function also has the shape of a Gaussian bell curve. Having Gaussian bell curves everywhere keeps our equations relatively simple. The only thing we still need to specify is how wide this bell curve should be. This is something you can do, with the figure below. Note that I've already indicated our three known correlations inside of it.</p>
				<p>ToDo: make figure</p>
				<FigureGuide>
					<p>This figure shows the correlation between temperatures at different times. The horizontal axis denotes the time difference. For example, if we compare the temperature at 8:00 with the temperature at 11:00, then the time difference is three hours. The vertical axis denotes the correlation. The points that are already present in the plot are points of which we have already specified the correlation.</p>
					<p>To adjust the figure, use the slider at the bottom. This will change the width of the bell curve. Try to get it as close as possible to the points you specified.</p>
				</FigureGuide>
				<p>The width parameter of the correlation function (you just set it to <Num>[ToDo]</Num>) is an important parameter. If also functions as a <Term>length scale</Term>: it defines how much time (or space) needs to pass before 61% of the correlation is lost. In other words, it tells us how quickly our temperature (the output value) varies. A small length scale means that the temperature varies a lot, while a large length scale means that the temperature hardly varies. We will study this further in the chapter on <Link to={{ type: 'CHAPTER', payload: { chapter: 'hyperparameters' } }}>tuning hyperparameters</Link>.</p>

				<h4>The covariance function</h4>
				<p>In practice, we don't work with the correlation function. Instead, we work with the covariance function. To get it, we only have to take the standard deviation of the temperature (you set it to <Num>[ToDo]</Num>), take the square (<Num>ToDo</Num>) and multiply the correlation function by this number. This gives us the covariance function.</p>
				<p>ToDo: make figure</p>
				<FigureGuide>
					<p>This figure shows the covariance function for our problem. It is exactly the same as the previous figure, but then multiplied by a constant value of <Num>ToDo</Num>. You cannot interact with it.</p>
				</FigureGuide>
			</div>
		)
	}
}

// Set up the visualizations figure.
class FCorrelation extends Figure {
	setSlider(newValue, index) {
		this.props.data.set({ [`c${this.props.time}`]: newValue })
	}
	getSlider(index) {
		return this.props.data[`c${this.props.time}`]
	}
	renderSubFigures() {
		return [
			<PCorrelation1 className="extraMargin" key="visualization1" time={this.props.time} title={`The probability distribution of the temperature at ${this.props.time+6}:00`} />,
			<PCorrelation2 className="extraMargin" key="visualization2" time={this.props.time} title="The same distribution, but then with a color gradient" />,
		]
	}
}
FCorrelation = connectToData(FCorrelation, dataStoreID)

// Set up the first visualizations plot.
class PCorrelation1 extends LinePlot {
	constructor() {
		super()

		// Define important settings.
		this.numPlotPoints = 201 // Useful when the length scale is cut down and samples vary quickly.
		this.transitionTime = 0 // To prevent lag of the line when sliding the slider.

		// Set up the plot range.
		this.range = {
			input: {
				min: -6,
				max: 10,
			},
			output: {
				min: 0,
				max: 0.16,
			},
		}
		// Set up important settings that will be used by D3 to display the line and blocks.
		this.padding = 2 // The number of pixels that we pull in the blocks.
		this.stepSize = 1 // The width of the blocks, in plot coordinates.
	}
	componentDidMount() {
		super.componentDidMount()
		this.recalculate()

		// Set up SVG container for blocks and calculate the block coordinates.
		this.blockContainer = this.svgContainer.append('g').attr('mask', 'url(#noOverflow)').attr('class', 'blocks')
		this.initializeBlocks()
	}
	componentDidUpdate() {
		super.componentDidUpdate()
		this.recalculate()
	}
	getInputAxisStyle() {
		return super.getInputAxisStyle().tickFormat(v => `${v} °C`)
	}
	getOutputAxisStyle() {
		return super.getOutputAxisStyle().tickFormat(v => `${Math.round(v * 100)}%`)
	}
	recalculate() {
		const { m, l } = this.props.data
		const c = bound(this.props.data[`c${this.props.time}`], 0, 0.9999) // We don't want the correlation to be 0, because it results in a zero variance which messes up the equations.
		this.setLine({
			color: '#1133aa',
			width: 3,
			function: x => gaussian(x, m - c*(measuredTemperature - m), l*(1-c)),
		})
	}
	update() {
		this.drawPlotLines()
		// this.drawBlocks()
	}
	initializeBlocks() {
		// // Set up important parameters to remember.
		// this.blockData = []
		// this.hPadding = this.scale.input.invert(this.padding) - this.scale.input.invert(0) // The horizontal padding in plot coordinates.
		// this.vPadding = -(this.scale.output.invert(this.padding) - this.scale.output.invert(0)) // The vertical padding in plot coordinates. At the moment it's not being used.

		// // Set up the blocks with the right coordinates.
		// let start = this.range.input.min, end = this.range.input.min + this.stepSize // We're starting from the minimum input.
		// const filter = input => (input > start + this.hPadding / 2 && input < end - this.hPadding / 2)
		// const mapper = input => ({ input })
		// while (start < this.range.input.max) { // Walk with blocks through the whole plot.
		// 	// Add all the points. For the bottom points, we can already determine the output value. For the bottom points that will not work.
		// 	const block = [].concat(
		// 		{ // Bottom right point.
		// 			input: end - this.hPadding / 2,
		// 			output: 0,
		// 		},
		// 		{ // Bottom left point.
		// 			input: start + this.hPadding / 2,
		// 			output: 0,
		// 		},
		// 		{ // Top left point. The output will be set later for all the top points, as it depends on the plot settings.
		// 			input: start + this.hPadding / 2,
		// 		},
		// 		this.plotPoints.filter(filter).map(mapper), // All the points at the top, from the plotPoints.
		// 		{ // Top right point.
		// 			input: end - this.hPadding / 2,
		// 		},
		// 	)

		// 	// Store the block.
		// 	this.blockData.push(block)

		// 	// Shift the start and end coordinates.
		// 	start = end
		// 	end += this.stepSize
		// }
	}
	drawBlocks() {
		// // Calculate the block output values.
		// this.blockData.forEach(block => block.forEach((point, index) => {
		// 	// Ignore the first two points, as they are the bottom points. Their output values are already set and won't change.
		// 	if (index <= 1)
		// 		return
		// 	point.output = Math.max(gaussian(point.input, this.props.data.m, this.props.data.l), 0)
		// }))

		// // Set up a path for each line using D3.
		// const blocks = this.blockContainer
		// 	.selectAll('path')
		// 	.data(this.blockData)
		// blocks.enter()
		// 	.append('path')
		// 	.attr('class', 'block')
		// 	.merge(blocks)
		// 	.attr('d', block => this.lineFunction(block) + 'Z')
		// 	.on('mouseover', this.handleBlockMouseOver.bind(this))
		// 	.on('mouseout', this.handleBlockMouseOut.bind(this))
		// blocks.exit()
		// 	.remove()
	}
	handleBlockMouseOver(block, index) {
		// this.setExplainerMessage(index)
	}
	handleBlockMouseOut(block, index) {
		// this.props.explainer.reset()
	}
	setExplainerMessage(index) {
		// // Calculate the right probability using the cumulative distribution. We kind of cheat, and simply take the mean of several values.
		// const numPoints = 11
		// const start = this.range.input.min + index * this.stepSize
		// const end = start + this.stepSize
		// const samplePoints = getRange(start, end, numPoints)
		// const sum = samplePoints.reduce((sum, x) => sum + gaussian(x, this.props.data.m, this.props.data.l), 0)
		// const meanValue = sum / numPoints
		// const probability = meanValue * this.stepSize * 100

		// // Set the right message in the explainer.
		// const middle = (start + end)/2
		// this.props.explainer.set({
		// 	contents: <div>There is a <Num>{probability.toFixed(1)}%</Num> chance that the temperature is between <Num>{start}°C</Num> and <Num>{end}°C</Num>.</div>,
		// 	position: this.toPageCoordinates({
		// 		x: middle,
		// 		y: Math.min(gaussian(middle, this.props.data.m, this.props.data.l), this.range.output.max),
		// 	}),
		// })
	}
}
PCorrelation1 = connectToData(PCorrelation1, dataStoreID)
PCorrelation1 = connectToExplainer(PCorrelation1)

// Set up the second visualizations plot.
class PCorrelation2 extends GPPlot {
	constructor() {
		super()
		this.range = {
			input: {
				min: -1,
				max: 7,
			},
			output: {
				min: -6,
				max: 10,
			},
		}
	}
	componentDidMount() {
		super.componentDidMount()
		this.indicatorContainer = this.svgContainer.append('g')
	}
	getInputAxisStyle() {
		return super.getInputAxisStyle().tickFormat(v => `${(v + 6 + 24) % 24}:00`)
	}
	getOutputAxisStyle() {
		return super.getOutputAxisStyle().tickFormat(v => `${v} °C`)
	}
	handleMouseMove(pos, evt) {
		// const T = this.scale.output.invert(pos.y)
		// this.props.data.set({ T })
		// this.props.explainer.set({
		// 	contents: temperatureMessage(T),
		// 	position: this.toPageCoordinates({ x: 2, y: T }),
		// })
	}
	handleMouseLeave(pos, evt) {
		// this.props.data.delete('T')
		// this.props.explainer.reset()
	}
	update() {
		// // First draw the sliver.
		// const left = {
		// 	x: 1.9,
		// 	mean: this.props.data.m,
		// 	std: this.props.data.l,
		// }
		// const right = {
		// 	x: 2.1,
		// 	mean: this.props.data.m,
		// 	std: this.props.data.l,
		// }
		// this.drawStdSliver(left, right)

		// // Draw the line. We need an array of arrays.
		// const lineData = this.props.data.T === undefined ? [] : [[
		// 	{ input: left.x, output: this.props.data.T },
		// 	{ input: right.x, output: this.props.data.T },
		// ]]
		// this.drawLines(this.indicatorContainer, lineData, indicatorLineStyle)
	}
}
PCorrelation2 = connectToData(PCorrelation2, dataStoreID, { gp: true })
PCorrelation2 = connectToExplainer(PCorrelation2)

