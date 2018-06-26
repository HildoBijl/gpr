import React from 'react'
import Link from 'redux-first-router-link'

import { connectToData } from '../../../../redux/dataStore.js'

import Section from '../../../components/Section/Section.js'
import Figure from '../../../components/Figure/Figure.js'
import SubFigure from '../../../components/Figure/SubFigure.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'
import LinePlot from '../../../components/Figure/LinePlot.js'
import { Note, Term, Num } from '../../../components/Textbox/index.js'

const plotId = 'gaussianDistribution'

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
					<p>In the above figure, you see the probability distribution of the temperature at 8:00. The horizontal axis shows the temperature, while the vertical axis indicates the probability that this temperature takes place. A temperature near zero is more likely than a temperature far from zero.</p>
					<p>Below the figure, you can adjust the slider. With that, you can adjust the variation in probabilities. Set it to a value that you think is likely.</p>
				</FigureGuide>
				<p>Based on the above figure, you seem to find a standard deviation of <Num>{this.props.data.l.toFixed(1)} °C</Num> appropriate here. (Based on my experiences with Dutch winter weather, I would go 4.0 °C.) This number is the <Term>standard deviation</Term> for the temperature (our output value). You can see it as a <Term>length scale</Term>: how much does our temperature really vary? The bigger the number, the more we assume our temperature varies.</p>
				{/* ToDo: add equations for this. */}

				<h4>Visualizing the distribution</h4>
				<p>We just defined the distribution of the temperature. Next, we want to visualize it. This improves our understand of what is happening.</p>
				<p>We already saw one visualization: the Gaussian bell curve above, showing the probability distribution of the temperature at 8:00. This works well if we only care about the temperature at 8:00. But if we also want to know the temperatures at other times, it's often better to instead use color gradients to indicate distributions. That gives us another type of visualization.</p>
				<SampleFigure section={this} number={++this.counters.figure} className="twoColumn" />
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
export default connectToData(CurrentSection, plotId)

// Set up the Gaussian distribution figure.
const minL = 0.4
const maxL = 6
const initialL = (maxL + minL)/2
class FGaussianDistribution extends Figure {
	constructor() {
		super()
		this.className.extraControlBarSpace = true
	}
	renderSubFigures() {
		return <PGaussianDistribution />
	}
	setSlider(newValue) {
		this.props.data.set({ l: minL + newValue*(maxL - minL)})
	}
	getSlider(index) {
		return (this.props.data.l - minL)/(maxL - minL)
	}
}
FGaussianDistribution = connectToData(FGaussianDistribution, plotId, { initial: { l : initialL } })

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
				max: 0.2,
			},
		}
	}
	componentDidMount() {
		super.componentDidMount()
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
		return super.getOutputAxisStyle().tickFormat(v => `${Math.round(v*100)}%`)
	}
	recalculate() {
		const l = this.props.data.l
		this.setLine({
			color: '#1133aa',
			width: 3,
			function: x => 1/(Math.sqrt(2*Math.PI)*l)*Math.exp(-0.5*(x/l) ** 2),
		})
	}
	// ToDo next: add hover functionalities, to show plot blocks upon hover, as well as a globally defined indicator showing info.
}
PGaussianDistribution = connectToData(PGaussianDistribution, plotId)

class SampleFigure extends Figure {
	renderSubFigures() {
		return [
			<SubFigure title="The probability distribution of the temperature at 8:00" key="left">
				<svg viewBox="0 0 1000 750">
					<rect x="50" y="500" width="900" height="200" fill="#888" />
					<rect x="300" y="50" width="400" height="400" fill="#888" />
				</svg>
			</SubFigure>,
			<SubFigure title="The same distribution, but then with a color gradient" key="right">
				<svg viewBox="0 0 1000 750">
					<rect x="50" y="50" width="900" height="200" fill="#888" />
					<rect x="300" y="300" width="400" height="400" fill="#888" />
				</svg>
			</SubFigure>
		]
	}
}