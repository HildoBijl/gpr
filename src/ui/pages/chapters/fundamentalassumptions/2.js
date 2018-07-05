import React from 'react'
import Link from 'redux-first-router-link'

import { line, curveLinear } from 'd3-shape'

import { connectToData } from '../../../../redux/dataStore.js'
import { connectToExplainer } from '../../../../redux/explainer.js'
import { getRange } from '../../../../logic/util.js'

import Section from '../../../components/Section/Section.js'
import Figure from '../../../components/Figure/Figure.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'
import LinePlot from '../../../components/Figure/LinePlot.js'
import GPPlot from '../../../components/Figure/GPPlot.js'
import { Note, Term, Num } from '../../../components/Textbox/index.js'

// All the plots on this page use a single data store.
const dataStoreID = 'gaussianDistributionIdea'

// Define settings for the plots.
const minL = 0.4
const maxL = 6
const initialL = (maxL + minL) / 2
const gpData = {}

// Style data for lines.
const indicatorLineStyle = {
	'stroke': '#eeeeee',
	'stroke-width': '4',
}

// The message shown in the visualization plot.
const temperatureMessage = (T) => <div>This point in the plot corresponds to {T.toFixed(1)} °C in the adjacent plot: see the line there too.</div>

class CurrentSection extends Section {
	render() {
		this.reset()
		return (
			<div>
				<p>To start off, we are going to look at a simple question: without doing any measurements, what would we expect the temperature at 8:00 to be? What sort of values could it have?</p>

				<h4>Mathematically defining the distribution</h4>
				<p>We know, given that we're in the Netherlands in winter, that the temperature is going to be around 0 °C. A temperature of plus or minus one degree is likely, two or three degrees is also possible, four or five degrees a bit less likely, and we're definitely not likely to reach plus or minus ten degrees.</p>
				<p>We can mathematically define this by saying that the temperature, at any given time, has a <Term>Guassian (normal) distribution</Term>. <Note>Of course we could also use any other type of distribution, instead of a Gaussian distribution. However, Gaussian distributions occur a lot in real life. In addition, using a Gaussian distributions results in relatively easy equations. So let's stick with Gaussian distributions.</Note> We set the mean of this distribution to 0 °C. After all, on average we're near the freezing point. But what should the standard deviation (the width of our bell curve) be?</p>
				<FGaussianDistribution section={this} number={++this.counters.figure} />
				<FigureGuide>
					<p>In the above figure, you see the probability distribution of the temperature at 8:00. The horizontal axis shows the temperature, while the vertical axis indicates the probability that this temperature takes place. Hover your mouse over the plot to learn more about this.</p>
					<p>Below the figure, you can adjust the slider. With that, you can adjust the variation in probabilities. Adjust the plot to something that you find likely. (Hint: temperatures below -10 °C happen in the Netherlands, but only very rarely.)</p>
				</FigureGuide>
				<p>Based on the above figure, you seem to find a standard deviation of <Num>{this.props.data.l.toFixed(1)} °C</Num> appropriate here. (Based on my experiences with Dutch winter weather, I would go for 4.0 °C.) This number is the <Term>standard deviation</Term> for the temperature (our output value). You can see it as a <Term>length scale</Term>: how much does our temperature really vary? The bigger the number, the more we assume our temperature varies.</p>
				{/* ToDo: add equations for this. */}

				<h4>Visualizing the distribution</h4>
				<p>We just defined the distribution of the temperature. Next, we want to visualize it. This improves our understand of what is happening.</p>
				<p>We already saw one visualization: the Gaussian bell curve above, showing the probability distribution of the temperature at 8:00. This works well if we only care about the temperature at 8:00. But if we also want to know the temperatures at other times, it's often better to instead use color gradients to indicate distributions. That gives us another type of visualization.</p>
				{/* TODO NEXT: Set up this plot. */}
				<FVisualizations section={this} number={++this.counters.figure} className="twoColumn" />
				<FigureGuide>
					<p>In the above figure, the left graph shows the probability distribution of the temperature at 8:00. The horizontal axis shows the temperature, while the vertical axis indicates the probability that this temperature takes place. A temperature near zero is more likely than a temperature far from zero. At the same time, the right plot also shows this temperature distribution, but now with a color gradient. The lighter the color is, the more likely the temperature is to occur.</p>
					<p>To use the figure, hover your mouse over one of the plots. It shows you, through the colored lines that appear, which position on the left graph corresponds to which position on the right one.</p>
				</FigureGuide>
				<p>Keep in mind that the two visualization methods mean the exact same thing: they indicate how likely it is that a given temperature occurs.</p>

				<h4>The temperature at other times</h4>
				<p>We could also ask: what would we expect the temperature at 9:00 or 10:00 to be? (Still without doing any measurements just yet.) Would that be any different?</p>
				<p>The answer is no. The temperatures at these times would have the same exact distribution. After all, why would 8:00 be any different than 9:00? <Note>Okay, you might know that near noon we will probably have a higher temperature, but let's ignore that piece of prior knowledge for now. We don't want to make things too complicated yet. In a later chapter, when <Link to={{ type: 'CHAPTER', payload: { chapter: 'covariancefunctions' } }}>tuning covariance functions</Link>, we will look into this. For now we assume (at least until we do any measurements) that temperatures are distributed all the same.</Note></p>
			</div>
		)
	}
}
export default connectToData(CurrentSection, dataStoreID, { initial: { l: initialL, gp: gpData } })

// Set up the Gaussian distribution figure.
class FGaussianDistribution extends Figure {
	constructor() {
		super()
		this.className.extraControlBarSpace = true
	}
	renderSubFigures() {
		return <PGaussianDistribution />
	}
	setSlider(newValue) {
		this.props.data.set({ l: minL + newValue * (maxL - minL) })
		this.props.explainer.reset() // On smartphones the explainer may still be visible even when dragging the slider. In that case, manually turn off the explainer.
	}
	getSlider(index) {
		return (this.props.data.l - minL) / (maxL - minL)
	}
}
FGaussianDistribution = connectToData(FGaussianDistribution, dataStoreID)
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
				min: -10,
				max: 10,
			},
			output: {
				min: 0,
				max: 0.16,
			},
		}

		// Set up important settings that will be used by D3 to display the line and blocks.
		this.lineFunction = line()
			.x(point => this.scale.input(point.input))
			.y(point => this.scale.output(point.output))
			.curve(curveLinear)
		this.padding = 2 // The number of pixels that we pull in the blocks.
		this.stepSize = 1 // The width of the blocks, in plot coordinates.

		// Set up the function to be plotted.
		this.function = (x, l) => 1 / (Math.sqrt(2 * Math.PI) * l) * Math.exp(-0.5 * (x / l) ** 2)
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
			function: x => this.function(x, this.props.data.l),
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
			point.output = Math.max(this.function(point.input, this.props.data.l), 0)
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
		const sum = samplePoints.reduce((sum, x) => sum + this.function(x, this.props.data.l), 0)
		const meanValue = sum / numPoints
		const probability = meanValue * this.stepSize * 100

		// Set the right message in the explainer.
		const middle = (start + end)/2
		this.props.explainer.set({
			contents: <div>There is a <Num>{probability.toFixed(1)}%</Num> chance that the temperature is between <Num>{start}°C</Num> and <Num>{end}°C</Num>.</div>,
			position: this.toPageCoordinates({
				x: middle,
				y: Math.min(this.function(middle, this.props.data.l), this.range.output.max),
			}),
		})
	}
}
PGaussianDistribution = connectToData(PGaussianDistribution, dataStoreID)
PGaussianDistribution = connectToExplainer(PGaussianDistribution)

// Set up the visualizations figure.
class FVisualizations extends Figure {
	renderSubFigures() {
		return [
			<PVisualizations1 className="extraMargin" key="visualization1" title="The probability distribution of the temperature at 8:00" />,
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
				min: -10,
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

		// Set up the function to be plotted.
		this.function = (x, l) => 1 / (Math.sqrt(2 * Math.PI) * l) * Math.exp(-0.5 * (x / l) ** 2)
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
			position: this.toPageCoordinates({ x: T, y: Math.min(this.function(T, this.props.data.l), this.range.output.max) }),
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
			function: x => this.function(x, this.props.data.l),
		})
	}
	update() {
		super.update()

		// Draw the line. We need an array of arrays.
		const lineData = this.props.data.T === undefined ? [] : [[
			{ input: this.props.data.T, output: 0 },
			{ input: this.props.data.T, output: Math.min(this.function(this.props.data.T, this.props.data.l), this.range.output.max) },
		]]
		this.drawLines(this.indicatorContainer, lineData, indicatorLineStyle)
	}
}
PVisualizations1 = connectToData(PVisualizations1, dataStoreID)
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
				min: -10,
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
			mean: 0,
			std: this.props.data.l,
		}
		const right = {
			x: 2.1,
			mean: 0,
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
PVisualizations2 = connectToData(PVisualizations2, dataStoreID, { gp: true })
PVisualizations2 = connectToExplainer(PVisualizations2)
