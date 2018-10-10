import React from 'react'
import Link from 'redux-first-router-link'

import { line, curveLinear } from 'd3-shape'

import { connectToData } from '../../../../redux/dataStore.js'
import { connectToExplainer } from '../../../../redux/explainer.js'
import { getRange } from '../../../../logic/util.js'
import { gaussianPDF } from '../../../../logic/math.js'

import Section from '../../../components/Section/Section.js'
import Figure from '../../../components/Figure/Figure.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'
import LinePlot from '../../../components/Figure/LinePlot.js'
import GPPlot from '../../../components/Figure/GPPlot.js'
import { Note, Term, Num, Emph } from '../../../components/Textbox/index.js'

import { priorId, priorInitial, t0, t1, shift, minM, maxM, minL, maxL, indicatorLineStyle } from './parameters.js'

// The message shown in the visualization plot.
const temperatureMessage = (T) => <div>This point in the plot corresponds to {T.toFixed(1)} °C in the adjacent plot: see the line there too.</div>

class CurrentSection extends Section {
	render() {
		this.reset()
		return (
			<div>
				<p>To start off, we are going to look at a simple question: without doing any measurements, what would we expect the temperature at {t0 + shift}:00 to be? What sort of values could it have?</p>

				<h4>Mathematically defining the distribution</h4>
				<p>We know, given that we're in the Netherlands in winter, that the temperature is going to be near the freezing point. Temperatures above 10 °C or below -5 °C are quite unlikely.</p>
				<p>We can mathematically define this by saying that the temperature, at any given time, has a <Term>Guassian (normal) distribution</Term>. <Note>Of course we could also use any other type of distribution, instead of a Gaussian distribution. However, Gaussian distributions occur a lot in real life. In addition, using a Gaussian distributions results in relatively easy equations. So let's stick with Gaussian distributions.</Note> This distribution has a <Term>mean</Term> (the location of our bell curve) and a <Term>standard deviation</Term> (the width of it). But what should they be?</p>
				<FGaussianDistribution section={this} number={++this.counters.figure} />
				<FigureGuide>
					<p>In the above figure, you see the probability distribution of the temperature at {t0 + shift}:00. The horizontal axis shows the temperature, while the vertical axis indicates the probability that this temperature takes place. Hover your mouse over the plot to learn more about this.</p>
					<p>Below the figure, you can adjust the sliders. The left slider sets the mean (the location) of the bell curve, and the right slider sets the standard deviation (the width). Adjust them to something that makes sense to you.</p>
				</FigureGuide>
				<p>Based on the above figure, you seem to find a mean of <Num>{this.props.data.m.toFixed(1)} °C</Num> and a standard deviation of <Num>{this.props.data.l.toFixed(1)} °C</Num> appropriate here. (Based on my experiences with Dutch winter weather, I would go for roughly 2 °C as mean and 4 °C as standard deviation.) The mean will not be very important later on, but the standard deviation will be. It functions as a <Term>length scale</Term>: it specifies how much our temperature really varies. The bigger the number, the more temperature variations we assume will be present.</p>
				{/* ToDo: add equations for this. */}

				<h4>Visualizing the distribution</h4>
				<p>We just visualized the distribution of the temperature at {t0 + shift}:00 using a Gaussian bell curve. This works well if we only care about the temperature at {t0 + shift}:00. But if we also want to include the temperatures at other times, it's better to use color gradients instead. That gives us another type of visualization.</p>
				<FVisualizations section={this} number={++this.counters.figure} className="twoColumn" />
				<FigureGuide>
					<p>In the above figure, the left graph shows the probability distribution of the temperature at {t0 + shift}:00. The horizontal axis shows the temperature, while the vertical axis indicates the probability that this temperature takes place. A temperature near zero is more likely than a temperature far from zero. At the same time, the right plot also shows this temperature distribution, but now with a color gradient. The horizontal axis denotes the time and the vertical axis the temperature. In this plot, the color represents the probability: the lighter the color, the more likely the temperature is to occur.</p>
					<p>To use the figure, hover your mouse over one of the plots. It shows you, through the lines that appear, which position on the left graph corresponds to which position on the right one.</p>
				</FigureGuide>
				<p>Keep in mind that the two visualization methods mean the exact same thing: they indicate how likely it is that a given temperature occurs.</p>

				<h4>The distribution of the temperature at other times</h4>

				<p>By now we've defined all our knowledge concerning the temperature at {t0 + shift}:00. But what about the temperature at {t1 + shift}:00? What can we say about that?</p>

				<p>The key realization is that the <Emph>distribution</Emph> of the temperature at {t1 + shift}:00 is exactly the same as the <Emph>distribution</Emph> of the temperature at {t0 + shift}:00. After all, it is just as likely to freeze at {t0 + shift}:00 as it is at {t1 + shift}:00. <Note>Okay, you might say that we have higher temperatures closer to noon. However, you must realize that this is another bit of prior knowledge you have that computers do not. So let's ignore this piece of prior knowledge for now. We don't want to make things too complicated yet. In a later chapter, when <Link to={{ type: 'CHAPTER', payload: { chapter: 'covariancefunctions' } }}>tuning covariance functions</Link>, we do look into this.</Note> Note that this does <Emph>not</Emph> mean that the temperature at {t0 + shift}:00 always equals that at {t1 + shift}:00. It could very well freeze at {t0 + shift}:00 and thaw at {t1 + shift}:00 or vice versa.</p>
				<p>We can also visualize this. To do so, we simply add another color gradient at {t1 + shift}:00.</p>
				<FTwoTemperatures section={this} number={++this.counters.figure} times={[2,3]} />
				<FigureGuide>
					<p>Hover your mouse over the colored bars to get more information on what they mean.</p>
				</FigureGuide>
				<p>Of course this same trick would work for the temperatures at other times too. Like at 6:00, or 11:00, or 13:00.</p>
				<FTwoTemperatures section={this} number={++this.counters.figure} times={[-1,0,1,2,3,4,5,6,7]} />
				<p>In this way, we can mathematically define what we know about the temperature at any time. However, we're not done just yet. After all, the temperatures at various times are also linked.</p>
			</div>
		)
	}
}
export default connectToData(CurrentSection, priorId, { initial: priorInitial })

// Set up the Gaussian distribution figure.
class FGaussianDistribution extends Figure {
	constructor() {
		super()
		this.className.extraControlBarSpace = true
		this.numSliders = 2
	}
	renderSubFigures() {
		return <PGaussianDistribution />
	}
	setSlider(newValue, index, definite) {
		this.props.explainer.reset() // On smartphones the explainer may still be visible even when dragging the slider. In that case, manually turn off the explainer.
		if (index === 0)
			this.props.data.set({ m: minM + newValue * (maxM - minM) })
		else
			this.props.data.set({ l: minL + newValue * (maxL - minL) })
	}
	getSlider(index) {
		if (index === 0)
			return (this.props.data.m - minM) / (maxM - minM)
		return (this.props.data.l - minL) / (maxL - minL)
	}
}
FGaussianDistribution = connectToData(FGaussianDistribution, priorId)
FGaussianDistribution = connectToExplainer(FGaussianDistribution)

// Set up the corresponding plot.
class PGaussianDistribution extends LinePlot {
	constructor() {
		super()

		// Define important settings.
		this.numPlotPoints = 201 // Useful when the length scale is cut down and samples vary quickly.
		this.transitionTime = 0 // To prevent lag of the line when sliding the slider.
		this.width = 1000
		this.height = 500

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
		this.setLine({
			color: '#1133aa',
			width: 3,
			function: x => gaussianPDF(x, this.props.data.m, this.props.data.l),
		})
	}
	update() {
		this.drawPlotLines()
		this.drawBlocks()
	}
	initializeBlocks() {
		// Set up important parameters to remember.
		this.blockData = []
		this.hPadding = this.scale.input.invert(this.padding) - this.scale.input.invert(0) // The horizontal padding in plot coordinates.
		this.vPadding = -(this.scale.output.invert(this.padding) - this.scale.output.invert(0)) // The vertical padding in plot coordinates. At the moment it's not being used.

		// Set up the blocks with the right coordinates.
		let start = this.range.input.min, end = this.range.input.min + this.stepSize // We're starting from the minimum input.
		const filter = input => (input > start + this.hPadding / 2 && input < end - this.hPadding / 2)
		const mapper = input => ({ input })
		while (start < this.range.input.max) { // Walk with blocks through the whole plot.
			// Add all the points. For the bottom points, we can already determine the output value. For the bottom points that will not work.
			const block = [].concat(
				{ // Bottom right point.
					input: end - this.hPadding / 2,
					output: 0,
				},
				{ // Bottom left point.
					input: start + this.hPadding / 2,
					output: 0,
				},
				{ // Top left point. The output will be set later for all the top points, as it depends on the plot settings.
					input: start + this.hPadding / 2,
				},
				this.plotPoints.filter(filter).map(mapper), // All the points at the top, from the plotPoints.
				{ // Top right point.
					input: end - this.hPadding / 2,
				},
			)

			// Store the block.
			this.blockData.push(block)

			// Shift the start and end coordinates.
			start = end
			end += this.stepSize
		}
	}
	drawBlocks() {
		// Calculate the block output values.
		this.blockData.forEach(block => block.forEach((point, index) => {
			// Ignore the first two points, as they are the bottom points. Their output values are already set and won't change.
			if (index <= 1)
				return
			point.output = Math.max(gaussianPDF(point.input, this.props.data.m, this.props.data.l), 0)
		}))

		// Set up a path for each line using D3.
		const blocks = this.blockContainer
			.selectAll('path')
			.data(this.blockData)
		blocks.enter()
			.append('path')
			.attr('class', 'block')
			.merge(blocks)
			.attr('d', block => this.lineFunction(block) + 'Z')
			.on('mouseover', this.handleBlockMouseOver.bind(this))
			.on('mouseout', this.handleBlockMouseOut.bind(this))
		blocks.exit()
			.remove()
	}
	handleBlockMouseOver(block, index) {
		this.setExplainerMessage(index)
	}
	handleBlockMouseOut(block, index) {
		this.props.explainer.reset()
	}
	setExplainerMessage(index) {
		// Calculate the right probability using the cumulative distribution. We kind of cheat, and simply take the mean of several values.
		const numPoints = 11
		const start = this.range.input.min + index * this.stepSize
		const end = start + this.stepSize
		const samplePoints = getRange(start, end, numPoints)
		const sum = samplePoints.reduce((sum, x) => sum + gaussianPDF(x, this.props.data.m, this.props.data.l), 0)
		const meanValue = sum / numPoints
		const probability = meanValue * this.stepSize * 100

		// Set the right message in the explainer.
		const middle = (start + end)/2
		this.props.explainer.set({
			contents: <div>There is a <Num>{probability.toFixed(1)}%</Num> chance that the temperature is between <Num>{start}°C</Num> and <Num>{end}°C</Num>.</div>,
			position: this.toPageCoordinates({
				x: middle,
				y: Math.min(gaussianPDF(middle, this.props.data.m, this.props.data.l), this.range.output.max),
			}),
		})
	}
}
PGaussianDistribution = connectToData(PGaussianDistribution, priorId)
PGaussianDistribution = connectToExplainer(PGaussianDistribution)

// Set up the visualizations figure.
class FVisualizations extends Figure {
	renderSubFigures() {
		return [
			<PVisualizations1 className="extraMargin" key="visualization1" title={`The probability distribution of the temperature at ${t0 + shift}:00`} />,
			<PVisualizations2 className="extraMargin" key="visualization2" title="The same distribution, but then with a color gradient" />,
		]
	}
}

// Set up the first visualizations plot.
class PVisualizations1 extends LinePlot {
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

		// Set up important settings that will be used by D3 to display the line.
		this.lineFunction = line()
			.x(point => this.scale.input(point.input))
			.y(point => this.scale.output(point.output))
			.curve(curveLinear)
	}
	componentDidMount() {
		super.componentDidMount()
		this.indicatorContainer = this.svgContainer.append('g')
		this.recalculate()
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
	handleMouseMove(pos, evt) {
		const T = this.scale.input.invert(pos.x)
		this.props.data.set({ T })
		this.props.explainer.set({
			contents: temperatureMessage(T),
			position: this.toPageCoordinates({ x: T, y: Math.min(gaussianPDF(T, this.props.data.m, this.props.data.l), this.range.output.max) }),
		})
	}
	handleMouseLeave(pos, evt) {
		this.props.data.delete('T')
		this.props.explainer.reset()
	}
	recalculate() {
		this.setLine({
			color: '#1133aa',
			width: 3,
			function: x => gaussianPDF(x, this.props.data.m, this.props.data.l),
		})
	}
	update() {
		super.update()

		// Draw the line. We need an array of arrays.
		const lineData = this.props.data.T === undefined ? [] : [[
			{ input: this.props.data.T, output: 0 },
			{ input: this.props.data.T, output: Math.min(gaussianPDF(this.props.data.T, this.props.data.m, this.props.data.l), this.range.output.max) },
		]]
		this.drawLines(this.indicatorContainer, lineData, indicatorLineStyle)
	}
}
PVisualizations1 = connectToData(PVisualizations1, priorId)
PVisualizations1 = connectToExplainer(PVisualizations1)

// Set up the second visualizations plot.
class PVisualizations2 extends GPPlot {
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
		const T = this.scale.output.invert(pos.y)
		this.props.data.set({ T })
		this.props.explainer.set({
			contents: temperatureMessage(T),
			position: this.toPageCoordinates({ x: 2, y: T }),
		})
	}
	handleMouseLeave(pos, evt) {
		this.props.data.delete('T')
		this.props.explainer.reset()
	}
	update() {
		// First draw the sliver.
		const left = {
			x: 1.9,
			mean: this.props.data.m,
			std: this.props.data.l,
		}
		const right = {
			x: 2.1,
			mean: this.props.data.m,
			std: this.props.data.l,
		}
		this.drawStdSliver(left, right)

		// Draw the line. We need an array of arrays.
		const lineData = this.props.data.T === undefined ? [] : [[
			{ input: left.x, output: this.props.data.T },
			{ input: right.x, output: this.props.data.T },
		]]
		this.drawLines(this.indicatorContainer, lineData, indicatorLineStyle)
	}
}
PVisualizations2 = connectToData(PVisualizations2, priorId)
PVisualizations2 = connectToExplainer(PVisualizations2)

// Set up the figure with two temperatures visualized.
class FTwoTemperatures extends Figure {
	renderSubFigures() {
		return <PTwoTemperatures times={this.props.times} />
	}
}

// Set up the plot with two temperatures visualized.
class PTwoTemperatures extends GPPlot {
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
		this.blockContainer = this.svgContainer.append('g')
	}
	getInputAxisStyle() {
		return super.getInputAxisStyle().tickFormat(v => `${(v + 6 + 24) % 24}:00`)
	}
	getOutputAxisStyle() {
		return super.getOutputAxisStyle().tickFormat(v => `${v} °C`)
	}
	handleMouseMove(pos, evt) {
		const time = this.scale.input.invert(pos.x)
		const foundTime = this.props.times.find(currTime => Math.abs(time - currTime) <= 0.1)
		if (foundTime !== undefined) { // Are we on a blue bar?
			const T = this.scale.output.invert(pos.y)
			this.setExplainerMessage(time, T)
			this.drawBlock(time, T)
		} else {
			this.props.explainer.reset()
			this.drawBlock()
		}
	}
	handleMouseLeave(pos, evt) {
		this.props.explainer.reset()
		this.drawBlock()
	}
	update() {
		// First draw the slivers.
		this.props.times.forEach(time => {
			const left = {
				x: Math.max(time - 0.1, this.range.input.min),
				mean: this.props.data.m,
				std: this.props.data.l,
			}
			const right = {
				x: Math.min(time + 0.1, this.range.input.max),
				mean: this.props.data.m,
				std: this.props.data.l,
			}
			this.drawStdSliver(left, right)
		})
	}
	drawBlock(time, T) {
		// Set up the right rectangle.
		const blockData = []
		if (time !== undefined && T !== undefined) {
			time = Math.round(time)
			T = Math.floor(T)
			blockData.push([
				{ input: Math.max(time - 0.1, this.range.input.min), output: T },
				{ input: Math.max(time - 0.1, this.range.input.min), output: T + 1 },
				{ input: Math.min(time + 0.1, this.range.input.max), output: T + 1 },
				{ input: Math.min(time + 0.1, this.range.input.max), output: T },
			])
		}

		// Set up a path for each line using D3.
		const block = this.blockContainer
			.selectAll('path')
			.data(blockData)
		block.enter()
			.append('path')
			.attr('style', 'fill: #2c0; opacity: 0.3;')
			.merge(block)
			.attr('d', block => this.lineFunction(block) + 'Z')
		block.exit()
			.remove()
	}
	setExplainerMessage(time, T) {
		// Calculate the right probability using the cumulative distribution. We kind of cheat, and simply take the mean of several values.
		const numPoints = 11
		const stepSize = 1
		const start = Math.floor(T)
		const end = start + stepSize
		const samplePoints = getRange(start, end, numPoints)
		const sum = samplePoints.reduce((sum, x) => sum + gaussianPDF(x, this.props.data.m, this.props.data.l), 0)
		const meanValue = sum / numPoints
		const probability = meanValue * stepSize * 100

		// Set the right message in the explainer.
		time = Math.round(time)
		this.props.explainer.set({
			contents: <div>The chance that the temperature at <Num>{time+6}:00</Num> is between <Num>{start}°C</Num> and <Num>{end}°C</Num> is <Num>{probability.toFixed(1)}%</Num>.</div>,
			position: this.toPageCoordinates({
				x: time,
				y: end,
			}),
		})
	}
}
PTwoTemperatures = connectToData(PTwoTemperatures, priorId)
PTwoTemperatures = connectToExplainer(PTwoTemperatures)