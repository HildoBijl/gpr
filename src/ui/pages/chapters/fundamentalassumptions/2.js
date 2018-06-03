import React from 'react'
import Link from 'redux-first-router-link'

import Section from '../../../components/Section/Section.js'
import Figure from '../../../components/Figure/Figure.js'
import SubFigure from '../../../components/Figure/SubFigure.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'
import { Note, Term, Num } from '../../../components/Textbox/index.js'

export default class CurrentSection extends Section {
	render() {
		this.reset()
		return (
			<div>
				<p>To start off, we are going to look at a simple question: without doing any measurements, what would we expect the temperature at 8:00 to be? What sort of values could it have?</p>

				<h4>Mathematically defining the distribution</h4>
				<p>We know, given that we're in the Netherlands in winter, that the temperature is going to be around 0 °C. A temperature of plus or minus one degree is likely, two or three degrees is also possible, four or five degrees a bit less likely, and we're definitely not likely to reach plus or minus ten degrees.</p>
				<p>We can mathematically define this by saying that the temperature, at any given time, has a <Term>Guassian (normal) distribution</Term>. <Note>Of course we could also use any other type of distribution, instead of a Gaussian distribution. However, using Gaussian distributions results in relatively easy equations, which is why we always like to stick with Gaussian distributions.</Note> We set the mean of this distribution to 0 °C. After all, on average we're near the freezing point. But what should the standard deviation (the width of our bell curve) be?</p>
				<p>ToDo: make figure</p>
				<FigureGuide>
					<p>In the above figure, you see the probability distribution of the temperature at 8:00. The horizontal axis shows the temperature, while the vertical axis indicates the probability that this temperature takes place. A temperature near zero is more likely than a temperature far from zero.</p>
					<p>Below the figure, you can adjust the slider. With that, you can adjust the variation in probabilities. Set it to a value that you think is likely.</p>
				</FigureGuide>
				<p>From the above figure, we can see that a standard deviation of <Num>[ToDo] °C</Num> would be appropriate here. This number is the <Term>standard deviation</Term> for the temperature (our output value). You can see it as a <Term>length scale</Term>: how much does our temperature really vary? The bigger the number, the more we assume our temperature varies.</p>
				{/* ToDo: add equations for this. */}

				<h4>Visualizing the distribution</h4>
				<p>We just defined the distribution of the temperature. Next, we want to visualize it. This improves our understand of what is happening.</p>
				<p>We already saw one visualization: the Gaussian bell curve above, showing the probability distribution of the temperature at 8:00. This works well if 8:00 is the only time we are dealing with. But if we have multiple times to take into account, it's often better to use color gradients to indicate distributions. That gives us another type of visualization.</p>
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