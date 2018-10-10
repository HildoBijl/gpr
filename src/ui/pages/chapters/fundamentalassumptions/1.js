import React from 'react'

import { connectToData } from '../../../../redux/dataStore.js'

import Section from '../../../components/Section/Section.js'
import Figure from '../../../components/Figure/Figure.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'
import GPPlot from '../../../components/Figure/GPPlot.js'

import { gradualId, gradualInitial } from './parameters.js'

export default class CurrentSection extends Section {
	render() {
		this.reset()
		return (
			<div>
				<p>When performing Gaussian Process regression, we always have to make use of prior knowledge. After all, humans do so too, when making predictions. To see how that works, we examine a simple example problem: estimating temperature.</p>
				
				<h4>Measuring temperature in the morning</h4>
				<p>This morning I was feeling scientific: I started measuring the temperature outside my house. It's winter as I write this, and in Dutch winters the temperature is always near the freezing point. So at 8:00 I measured a temperature of 2 degrees Celsius, while at 10:00 it was exactly 4 °C. Then I wondered: what was the temperature at 9:00?</p>
				<p>You, as a human, can probably figure out which answers are likely. You might guess, "Roughly 3 degrees!" but everywhere between 2 and 4 degrees would be an acceptable answer. You might even be fine with 4.5 °C, depending on when the sun came out. But if I'd tell you it was 8 °C at 9:00, you'd say I was nuts.</p>
				<p>Of course your prediction skills are excellent, but how are you able to do this? The answer is: you have prior knowledge. You know that the temperature varies only gradually over time, and you use that knowledge in your estimates.</p>
				<p>Can we also let a computer make such predictions though? Of course the answer is "yes", but if we want to do so, we must also give the computer this prior knowledge. In short, we have to tell the computer that the temperature only varies gradually over time.</p>
				
				<h4>What is "gradually"?</h4>
				<p>Explaining the concept "gradually" to a computer is not as easy as it sounds. Mathematically, the word "gradually" doesn't mean much. After all, there are infinitely many gradually varying functions, as the following figure shows. Using the sliders, can you obtain a temperature variation, for my particular scientific morning, that seems sensible to you?</p>
				<FGradual section={this} number={++this.counters.figure} />
				<FigureGuide>
					<p>The above figure shows an example of how the temperature (the vertical axis) may have varied over time (the horizontal axis) during this particular morning. Note that the temperature variation (the line) satisfies our measurements (the dots), but other than that is not very realistic yet. You can adjust the sliders to get different kinds of lines. Click the reset button to get a different example of a temperature variation. Try to get a temperature variation that corresponds with your expectations.</p>
				</FigureGuide>
				<p>The lesson is that we have to be very specific. We have to tell the computer, with mathematical precision, what we know about temperature variations. So let's get at it.</p>
			</div>
		)
	}
}

// Define figure variation data.
const minL = 1/8
const maxL = 8
const minM = -2
const maxM = 6
const multip = Math.log(maxL/minL)

// Set up the figure.
class FGradual extends Figure {
	constructor() {
		super()
		this.numSliders = 3
	}
	renderSubFigures() {
		return <PGradual />
	}
	onReset() {
		this.props.data.gp.refreshSamples()
	}
	setSlider(newValue, index, definite) {
		if (index === 0) {
			this.props.data.gp.setMeanFunction({
				...this.props.data.gp.meanData,
				m: newValue*(maxM - minM) + minM,
			})
		} else {
			this.props.data.gp.setCovarianceFunction({
				...this.props.data.gp.covarianceData,
				[index === 1 ? 'Vy' : 'Vx']: (minL*Math.pow(Math.E, multip*newValue)) ** 2,
			})
		}
	}
	getSlider(index) {
		// Mean?
		if (index === 0)
			return (this.props.data.gp.meanData.m - minM)/(maxM - minM)
		
		// Or variance?
		const key = index === 1 ? 'Vy' : 'Vx'
		const V = this.props.data.gp.covarianceData[key]
		return Math.log(Math.sqrt(V)/minL)/multip
	}
}
FGradual = connectToData(FGradual, gradualId, { gp: true, initial: gradualInitial })

// Set up the plot.
class PGradual extends GPPlot {
	constructor() {
		super()

		// Define important settings.
		this.measurementRadius = 8
		this.numPlotPoints = 201 // Useful when the length scale is cut down and samples vary quickly.
		this.transitionTime = 0 // Set to zero for instant reactions when adjusting sliders.

		// Set up the plot range.
		this.range = {
			input: {
				min: -1,
				max: 7,
			},
			output: {
				min: -2,
				max: 6,
			},
		}
	}
	getInputAxisStyle() {
		return super.getInputAxisStyle().tickFormat(v => `${(v + 6 + 24) % 24}:00`)
	}
	getOutputAxisStyle() {
		return super.getOutputAxisStyle().tickFormat(v => `${v} °C`)
	}
	update() {
		// These are the things that we want to draw.
		this.drawSamples()
		this.drawMeasurements()
	}
}
PGradual = connectToData(PGradual, gradualId, { gp: true })