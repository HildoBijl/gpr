import React from 'react'
import Link from 'redux-first-router-link'
import classnames from 'classnames'

import { connectToData } from '../../../../redux/dataStore.js'
import { connectToExplainer } from '../../../../redux/explainer.js'
import { getRange } from '../../../../logic/util.js'
import { gaussianPDF } from '../../../../logic/math.js'

import Section from '../../../components/Section/Section.js'
import Figure from '../../../components/Figure/Figure.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'
import GPPlot from '../../../components/Figure/GPPlot.js'
import LinePlot from '../../../components/Figure/LinePlot.js'
import { Term, Emph, Num } from '../../../components/Textbox/index.js'

import { priorId, priorInitial, t0, t1, t2, shift, measuredTemperature, blockStepSize, maxC, temperatureRange, probabilityRangeLarge, temperatureDifferenceRange, minLT, maxLT, indicatorLineStyle } from './parameters.js'

class CurrentSection extends Section {
	render() {
		this.reset()
		return (
			<div>
				<p>How are the temperatures at various times linked? And how can we mathematically define this link? That is what we'll look at next.</p>

				<h4>The link between {t0 + shift}:00 and {t1 + shift}:00</h4>

				<p>Without any prior knowledge, the temperature at {t1 + shift}:00 is likely to be somewhere between -6°C and 10°C. That's all that we can say. But now suppose that we know the temperature at {t0 + shift}:00. Suppose that it equals {measuredTemperature}°C. What can we then say about the distribution of the temperature at {t1 + shift}:00?</p>
				<p>The key is that the temperature doesn't change very quickly. In other words, the temperature at {t1 + shift}:00 will be <Emph>similar</Emph> to the temperature at {t0 + shift}:00. But how similar? Could the temperature also be {measuredTemperature + 1}°C? Maybe {measuredTemperature + 2}°C? And what about {measuredTemperature + 3}°C?</p>
				<FCorrelation section={this} number={++this.counters.figure} time={t1} className="twoColumn" />
				<FigureGuide>
					<p>In the above figure, the left plot again shows the probability distribution of the temperature, but now for {t1 + shift}:00. The right figure shows the same distribution using a color gradient. There is also a red dot. This represents the measurement we did at {t0 + shift}:00. We measured a temperature of {measuredTemperature}°C.</p>
					<p>To adjust the figure, use the slider at the bottom. With it, you can change how much variation the temperature will have at {t1 + shift}:00.</p>
				</FigureGuide>
				<p>So you just defined the link between the temperatures at {t0 + shift}:00 and {t1 + shift}:00. The way in which we mathematically indicate this link is through the <Term>correlation</Term>. A correlation of 1 means that the two temperatures are exactly equal, while a correlation of 0 means that knowing the temperature at {t0 + shift}:00 does not tell us anything about the temperature at {t1 + shift}:00. It seems you've decided on a correlation of <Num>{this.props.data[`c${t1}`].toFixed(2)}</Num>.</p>

				<h4>Temperatures at distant times may vary</h4>
				<p>Next, let's focus on a slightly different question: what do we know about the temperature at {t2 + shift}:00? We still only know that at {t0 + shift}:00 we had 2°C. So what's different here?</p>
				<p>The answer is that the temperature at {t2 + shift}:00 is not linked so much with the temperature at {t0 + shift}:00. Sure, it's linked a little bit, but less than what we had for {t1 + shift}:00. Let's see what you think the correlation will be now.</p>
				<FCorrelation section={this} number={++this.counters.figure} time={t2} className="twoColumn" />
				<FigureGuide>
					<p>The above figure works exactly the same as the previous one. It's just made for the temperature at {t2 + shift}:00.</p>
				</FigureGuide>
				<p>So this time, according to your input, we have a correlation of <Num>{this.props.data[`c${t2}`].toFixed(2)}</Num>.</p>

				<h4>The correlation function</h4>
				<p>We see that the correlation between function values depends on how much time has passed. To fully define this, we will set up a <Term>correlation function</Term>. This correlation function specifies, given the difference t<sub>1</sub> - t<sub>2</sub> between two times t<sub>1</sub> and t<sub>2</sub>{/* ToDo: properly implement equations. */}, what the correlation is between the temperatures at these times.</p>
				<p>There's already a few things that we know. For example, we know that if the time difference is zero hours, then the correlation must be one. After all: the temperature at {t0 + shift}:00 <Emph>must</Emph> be equal to the temperature at {t0 + shift}:00. Secondly, we have just specified that, if the time difference is one hour, then the correlation we should have is <Num>{this.props.data[`c${t1}`].toFixed(2)}</Num>. Similarly, if the time difference is three hours, the correlation we should have is <Num>{this.props.data[`c${t2}`].toFixed(2)}</Num>.</p>
				<p>To keep things simple, we assume that the correlation function also has the shape of a Gaussian bell curve. Having Gaussian bell curves everywhere keeps our equations relatively simple. The only thing we still need to specify is how wide this bell curve should be. This is something you can do, with the figure below. Note that I've already indicated our three known correlations inside of it.</p>
				<FCorrelationFunction section={this} number={++this.counters.figure} covariance={false} />
				<FigureGuide>
					<p>This figure shows the correlation between temperatures at different times. The horizontal axis denotes the time difference. For example, if we compare the temperature at {t0 + shift}:00 with the temperature at {t2 + shift}:00, then the time difference is three hours. The vertical axis denotes the correlation. The points that are already present in the plot are points of which you have already specified the correlation in the previous figures.</p>
					<p>To adjust the figure, use the slider at the bottom. This will change the width of the bell curve. Try to get it as close as possible to the points you specified. You can also hover over the figure with the mouse to get more information.</p>
				</FigureGuide>
				<p>The width parameter of the correlation function (you just set it to <Num>{this.props.data.lT.toFixed(1)}</Num> hours) is an important parameter. It also functions as a <Term>length scale</Term>: it defines how much time (or space) needs to pass before the correlation is reduced to 61% of its original value. In other words, it tells us how quickly our temperature (the output value) can vary. A small length scale means that the temperature varies a lot, while a large length scale means that the temperature varies very little. We will study this further in the chapter on <Link to={{ type: 'CHAPTER', payload: { chapter: 'hyperparameters' } }}>tuning hyperparameters</Link>.</p>

				<h4>The covariance function</h4>
				<p>In practice, we don't work with the correlation function. Instead, we work with the covariance function. To obtain it, we only have to take the standard deviation of the temperature (you set it to <Num>{this.props.data.l.toFixed(1)}</Num>), take the square (<Num>{(this.props.data.l ** 2).toFixed(1)}</Num>) and multiply the correlation function by this number. This gives us the covariance function, shown below.</p>
				<FCorrelationFunction section={this} number={++this.counters.figure} covariance={true} />
				<FigureGuide>
					<p>This figure shows the covariance function for our problem. It is exactly the same as the previous figure, but then multiplied by a constant value of <Num>{(this.props.data.l ** 2).toFixed(1)}</Num>. Again, hover over the figure to see what it means.</p>
				</FigureGuide>
			</div>
		)
	}
}
export default connectToData(CurrentSection, priorId, { initial: priorInitial })

// This function returns the probability that the temperature falls in the block with the given index.
const getProbabilityOfIndex = (index, func) => {
	const numPoints = 101
	const start = temperatureRange.min + index * blockStepSize
	const end = start + blockStepSize
	const samplePoints = getRange(start, end, numPoints)
	const sum = samplePoints.reduce((sum, x) => sum + func(x), 0)
	const meanValue = sum / numPoints
	const probability = meanValue * blockStepSize
	return probability * 100 // In percentages.
}

// Set up the correlation figures.
class FCorrelation extends Figure {
	setSlider(newValue, index) {
		this.props.data.set({ [`c${this.props.time}`]: newValue * maxC })
	}
	getSlider(index) {
		return this.props.data[`c${this.props.time}`] / maxC
	}
	renderSubFigures() {
		return [
			<PCorrelation1 className="extraMargin" key="visualization1" time={this.props.time} title={`The probability distribution of the temperature at ${this.props.time + 6}:00`} />,
			<PCorrelation2 className="extraMargin" key="visualization2" time={this.props.time} title="The same distribution, but then with a color gradient" />,
		]
	}
}
FCorrelation = connectToData(FCorrelation, priorId)

// Set up the first correlation plot.
class PCorrelation1 extends LinePlot {
	constructor() {
		super()

		// Define important settings.
		this.numPlotPoints = 201 // Useful when the length scale is cut down and samples vary quickly.
		this.transitionTime = 0 // To prevent lag of the line when sliding the slider.

		// Set up the plot range.
		this.range = {
			input: temperatureRange,
			output: probabilityRangeLarge,
		}
		// Set up important settings that will be used by D3 to display the line and blocks.
		this.padding = 2 // The number of pixels that we pull in the blocks.
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
		return super.getInputAxisStyle().tickFormat(v => `${v}°C`)
	}
	getOutputAxisStyle() {
		return super.getOutputAxisStyle().tickFormat(v => `${Math.round(v * 100)}%`)
	}
	recalculate() {
		const { m, l } = this.props.data
		const c = this.props.data[`c${this.props.time}`] // We don't want the correlation to be 0, because it results in a zero variance which messes up the equations.
		const posteriorMean = m + c * (measuredTemperature - m)
		const posteriorLength = Math.sqrt((1 - c) * (l ** 2))
		this.setLine({
			color: '#1133aa',
			width: 3,
			function: x => gaussianPDF(x, posteriorMean, posteriorLength),
		})
	}
	update() {
		this.drawPlotLines()
		this.drawBlocks()
		this.updateExplainer()
	}
	initializeBlocks() {
		// Set up important parameters to remember.
		this.blockData = []
		this.hPadding = this.scale.input.invert(this.padding) - this.scale.input.invert(0) // The horizontal padding in plot coordinates.
		this.vPadding = -(this.scale.output.invert(this.padding) - this.scale.output.invert(0)) // The vertical padding in plot coordinates. At the moment it's not being used.

		// Set up the blocks with the right coordinates.
		let start = this.range.input.min, end = this.range.input.min + blockStepSize // We're starting from the minimum input.
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
			end += blockStepSize
		}
	}
	drawBlocks() {
		// Calculate the block output values.
		this.blockData.forEach(block => block.forEach((point, index) => {
			// Ignore the first two points, as they are the bottom points. Their output values are already set and won't change.
			if (index <= 1)
				return
			point.output = Math.max(this.lines[0].function(point.input), 0)
		}))

		// Set up a path for each line using D3.
		const blocks = this.blockContainer
			.selectAll('path')
			.data(this.blockData)
		blocks.enter()
			.append('path')
			.merge(blocks)
			.attr('class', (block, index) => classnames('block', { active: this.props.data.hover && index === this.props.data.hover.index && this.props.data.hover.time === this.props.time }))
			.attr('d', block => this.lineFunction(block) + 'Z')
			.on('mouseover', this.handleBlockMouseOver.bind(this))
			.on('mouseout', this.handleBlockMouseOut.bind(this))
		blocks.exit()
			.remove()
	}
	handleBlockMouseOver(block, index) {
		this.props.data.set({
			hover: {
				index,
				target: 1,
				type: 'block',
				time: this.props.time,
			}
		})
	}
	handleBlockMouseOut(block, index) {
		this.props.data.delete('hover')
	}
	updateExplainer() {
		// Check whether updates are required.
		if (this.props.data.hover === this.lastHover)
			return
		this.lastHover = this.props.data.hover

		// Check for basic cases.
		const hover = this.props.data.hover
		if (!hover)
			return this.props.explainer.reset()
		if (hover.target !== 1)
			return
		if (hover.time !== this.props.time)
			return
		if (hover.type !== 'block')
			return

		// Set the right message in the explainer.
		const index = hover.index
		const start = temperatureRange.min + index * blockStepSize
		const end = start + blockStepSize
		const middle = (start + end) / 2
		const probability = getProbabilityOfIndex(index, this.lines[0].function)
		this.props.explainer.set({
			contents: <div>There is a <Num>{probability.toFixed(1)}%</Num> chance that the temperature at {this.props.time + 6}:00 is between <Num>{start}°C</Num> and <Num>{end}°C</Num>.</div>,
			position: this.toPageCoordinates({
				x: middle,
				y: Math.min(this.lines[0].function(middle), this.range.output.max),
			}),
		})
	}
}
PCorrelation1 = connectToData(PCorrelation1, priorId)
PCorrelation1 = connectToExplainer(PCorrelation1)

// Set up the second correlation plot.
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
		this.measurementRadius = 12
	}
	componentDidMount() {
		super.componentDidMount()
		this.blockContainer = this.svgContainer.append('g')
	}
	getInputAxisStyle() {
		return super.getInputAxisStyle().tickFormat(v => `${(v + 6 + 24) % 24}:00`)
	}
	getOutputAxisStyle() {
		return super.getOutputAxisStyle().tickFormat(v => `${v}°C`)
	}
	handleMouseMove(pos) {
		const time = this.scale.input.invert(pos.x)
		if (Math.abs(time - this.props.time) <= 0.1) { // Are we on a blue bar?
			const T = this.scale.output.invert(pos.y)
			const index = Math.floor((T - temperatureRange.min) / blockStepSize)
			if (!this.props.data.hover || this.props.data.hover.index !== index) { // Should we update?
				this.props.data.set({
					hover: {
						index,
						target: 2,
						type: 'block',
						time: this.props.time,
					}
				})
			}
		} else {
			if (this.props.data.hover && this.props.data.hover.type === 'block')
				this.props.data.delete('hover')
		}
	}
	handleMouseLeave() {
		this.props.data.delete('hover')
	}
	handleMeasurementMouseOver() {
		this.props.data.set({
			hover: {
				target: 2,
				type: 'measurement',
				time: this.props.time,
			}
		})
	}
	handleMeasurementMouseOut() {
		this.props.data.delete('hover')
	}
	update() {
		// Calculate posterior distribution data.
		const { m, l } = this.props.data
		const c = this.props.data[`c${this.props.time}`] // We don't want the correlation to be 0, because it results in a zero variance which messes up the equations.
		const posteriorMean = m + c * (measuredTemperature - m)
		const posteriorLength = Math.sqrt((1 - c) * (l ** 2))

		// Draw the sliver.
		const left = {
			x: this.props.time - 0.1,
			mean: posteriorMean,
			std: posteriorLength,
		}
		const right = {
			x: this.props.time + 0.1,
			mean: posteriorMean,
			std: posteriorLength,
		}
		this.drawStdSliver(left, right)

		// Draw the measurement point.
		this.drawMeasurements()

		// Draw the right block and set up the right explainer.
		this.drawBlock()
		this.updateExplainer()

	}
	drawBlock() {
		// Set up the right rectangle.
		const blockData = []
		const hover = this.props.data.hover
		if (hover && hover.type === 'block' && hover.time === this.props.time) {
			const T = temperatureRange.min + hover.index * blockStepSize
			blockData.push([
				{ input: Math.max(hover.time - 0.1, this.range.input.min), output: T },
				{ input: Math.max(hover.time - 0.1, this.range.input.min), output: T + blockStepSize },
				{ input: Math.min(hover.time + 0.1, this.range.input.max), output: T + blockStepSize },
				{ input: Math.min(hover.time + 0.1, this.range.input.max), output: T },
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
	updateExplainer() {
		// Check whether updates are required.
		if (this.props.data.hover === this.lastHover)
			return
		this.lastHover = this.props.data.hover

		// Check for basic cases.
		const hover = this.props.data.hover
		if (!hover)
			return this.props.explainer.reset()
		if (hover.target !== 2)
			return
		if (hover.time !== this.props.time)
			return

		// Check if it's a measurement hover.
		if (hover.type === 'measurement') {
			return this.props.explainer.set({
				contents: <div>At {t0 + shift}:00 we measured the temperature to equal 2°C.</div>,
				position: this.toPageCoordinates({
					x: this.props.data.gp.measurements[0].input,
					y: this.props.data.gp.measurements[0].output,
				}),
			})
		}

		// Set up the PDF function needed for getting the probability.
		const { m, l } = this.props.data
		const c = this.props.data[`c${this.props.time}`] // We don't want the correlation to be 0, because it results in a zero variance which messes up the equations.
		const posteriorMean = m + c * (measuredTemperature - m)
		const posteriorLength = Math.sqrt((1 - c) * (l ** 2))
		const pdf = x => gaussianPDF(x, posteriorMean, posteriorLength)

		// Set the right message in the explainer.
		const index = hover.index
		const start = temperatureRange.min + index * blockStepSize
		const end = start + blockStepSize
		const probability = getProbabilityOfIndex(index, pdf)
		this.props.explainer.set({
			contents: <div>There is a <Num>{probability.toFixed(1)}%</Num> chance that the temperature at {this.props.time + 6}:00 is between <Num>{start}°C</Num> and <Num>{end}°C</Num>.</div>,
			position: this.toPageCoordinates({
				x: hover.time,
				y: Math.min(end, this.range.output.max),
			}),
		})
	}
}
PCorrelation2 = connectToData(PCorrelation2, priorId, { gp: true })
PCorrelation2 = connectToExplainer(PCorrelation2)

// Set up the correlation function figure.
class FCorrelationFunction extends Figure {
	setSlider(newValue) {
		this.props.data.set({ lT: minLT + newValue * (maxLT - minLT) })
	}
	getSlider() {
		return (this.props.data.lT - minLT) / (maxLT - minLT)
	}
	renderSubFigures() {
		return <PCorrelationFunction className="extraMargin" covariance={this.props.covariance} title={`The ${this.props.covariance ? 'covariance' : 'correlation'} function of our process`} />
	}
}
FCorrelationFunction = connectToData(FCorrelationFunction, priorId)

// Set up the correlation function plot.
class PCorrelationFunction extends LinePlot {
	constructor() {
		super()

		// Define important settings.
		this.transitionTime = 0 // To prevent lag of the line when sliding the slider.

		// Set up the plot range.
		this.range = {
			input: temperatureDifferenceRange,
			output: {
				min: 0,
				max: 1,
			},
		}
	}
	getFactor() {
		return this.props.covariance ? this.props.data.l ** 2 : 1
	}
	getInputAxisStyle() {
		return super.getInputAxisStyle().tickFormat(v => `${v}:00`)
	}
	componentDidMount() {
		super.componentDidMount()
		this.indicatorContainer = this.svgContainer.append('g')
		this.pointContainer = this.svgContainer.append('g')
		this.recalculate()
	}
	componentDidUpdate() {
		super.componentDidUpdate()
		if (this.props.covariance) {
			this.setRange({
				input: temperatureDifferenceRange,
				output: {
					min: 0,
					max: this.getFactor(),
				}
			})
		}
		this.recalculate()
	}
	recalculate() {
		// Read data.
		const { lT } = this.props.data

		// Define the line.
		this.setLine({
			color: '#33aa11',
			width: 3,
			function: x => Math.exp(-0.5 * (x / lT) ** 2) * this.getFactor(),
		})
	}
	update() {
		this.drawPlotLines()
		this.drawPoints()

		// Draw the line. We need an array of arrays.
		const dT = this.props.data.dT
		const lineData = dT === undefined ? [] : [[
			{ input: dT, output: 0 },
			{ input: dT, output: this.lines[0].function(dT) },
		]]
		this.drawLines(this.indicatorContainer, lineData, indicatorLineStyle)
	}
	drawPoints() {
		const c1 = this.props.data[`c${t1}`]
		const c2 = this.props.data[`c${t2}`]

		// Extract all the measurements. Add the extra point if it is present.
		const measurements = [
			{ x: 0, y: this.getFactor() },
			{ x: t1 - t0, y: c1 * this.getFactor() },
			{ x: t2 - t0, y: c2 * this.getFactor() },
		]

		// Set up the measurement points using D3, first adding new ones, then updating existing ones and finally removing old ones.
		const points = this.pointContainer
			.selectAll('circle')
			.data(measurements)
		points.enter() // New points.
			.append('circle')
			.attr('class', 'measurement')
			.attr('r', 8)
			.attr('fill', '#33aa11')
			.on('mouseover', this.handlePointMouseOver.bind(this))
			.on('mouseout', this.handlePointMouseOut.bind(this))
			.merge(points) // New and existing points.
			.attr('cx', point => this.scale.input(point.x))
			.attr('cy', point => this.scale.output(point.y))
		points.exit() // Outdated points.
			.remove()
	}
	handlePointMouseOver(point, index) {
		this.pointHover = true // Specify that we're hovering over a point, so we should ignore other events that would adjust the explainer.
		this.handleMouseLeave() // Pretend that the mouse left the plot, to remove the line that would otherwise be visible.
		this.props.explainer.set({
			contents: index === 0 ? <div>The temperature at {t0 + shift}:00 (or any other time) has a correlation of <Num>1</Num> with itself.</div> : <div>You specified that the temperature at {t0 + shift}:00 has a correlation of <Num>{point.y.toFixed(2)}</Num> with the temperature at {t0 + shift + point.x}:00 (time difference of {point.x} hours).</div>,
			position: this.toPageCoordinates(point),
		})
	}
	handlePointMouseOut() {
		delete this.pointHover // Reenable other mouse events.
		this.props.explainer.reset()
	}
	handleMouseMove(pos) {
		// If we're hovering over a point, ignore mouse moves.
		if (this.pointHover)
			return

		// Calculate data.
		const dT = this.scale.input.invert(pos.x)
		const time = t0 + shift + dT
		const hour = Math.floor(time)
		const minute = dT >= 0 ? Math.floor((time - hour) * 60) : Math.ceil((time - hour) * 60)
		const relHour = Math.floor(Math.abs(dT))
		const relMinute = Math.floor((Math.abs(dT) - relHour) * 60)
		const sign = dT >= 0 ? '' : '-'
		const c = this.lines[0].function(dT) // The correlation

		// Set up the explainer.
		this.props.explainer.set({
			contents: <div>We hereby assume that the temperature at {t0 + shift}:00 and the temperature at {hour}:{minute < 10 ? `0${minute}` : minute} (time difference of {sign}{relHour}:{relMinute < 10 ? `0${relMinute}` : relMinute} hours) have a {this.props.covariance ? 'covariance' : 'correlation'} of <Num>{c.toFixed(this.props.covariance ? 1 : 2)}</Num>.</div>,
			position: this.toPageCoordinates({ x: dT, y: c }),
		})

		// Enable the drawing of a line.
		this.props.data.set({ dT })
	}
	handleMouseLeave() {
		this.props.data.delete('dT')
		this.props.explainer.reset()
	}
}
PCorrelationFunction = connectToData(PCorrelationFunction, priorId)
PCorrelationFunction = connectToExplainer(PCorrelationFunction)

