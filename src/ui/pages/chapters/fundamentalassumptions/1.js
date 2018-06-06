import React from 'react'

import Section from '../../../components/Section/Section.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'
import InteractiveFigure from './figures/InteractiveFigure.js'

export default class CurrentSection extends Section {
	render() {
		this.reset()
		return (
			<div>
				<p>When performing Gaussian Process regression, we always have to make use of prior knowledge. To see why, and what kind of assumptions we have to make, we will examine a simple example problem: estimating temperature.</p>
				
				<h4>Measuring temperature in the morning</h4>
				<p>This morning I was feeling scientific: I started measuring the temperature outside my house. It's winter as I write this, and in Dutch winters the temperature is always near the freezing point. So at 8:00 I measured a temperature of 2 degrees Celsius, while at 10:00 it was exactly 4 °C. Then I wondered: what was the temperature at 9:00?</p>
				<p>You, as a human, can probably figure out which answers are likely. You might guess, "Roughly 3 degrees!" but everywhere between 2 and 4 degrees would be an acceptable answer. You might even be fine with 4.5 °C, depending on when the sun came out. But if I'd tell you it was 8 °C at 9:00, you'd say I was nuts.</p>
				<p>Of course your prediction skills are excellent, but how are you able to do this? The answer is: you have prior knowledge. You know that the temperature varies only gradually over time, and you use that knowledge in your estimates.</p>
				<p>Can we also let a computer make such predictions though? Of course the answer is "yes", but if we want to do so, we must also give the computer this prior knowledge. In short, we have to tell the computer that the temperature only gradually varies over time.</p>
				
				<h4>What is "gradually"?</h4>
				<p>Explaining the concept "gradually" to a computer is not as easy as it sounds. Mathematically, the word "gradually" doesn't mean much. After all, there are infinitely many gradually varying functions, as the following figure shows. Can you obtain a temperature variation, for my particular scientific morning, that seems sensible to you?</p>
				<InteractiveFigure section={this} number={++this.counters.figure} />
				{/* TODO: Make this figure. Also figure out whether figures should be in the bottom of this file, or in their own file. For this figure, we probably need to be able to set a new covariance function and recalculate matrices first. */}
				<FigureGuide>
					<p>The above figure shows an example of how the temperature (the vertical axis) may have varied over time (the horizontal axis) during this particular morning. Note that the temperature variation (the line) satisfies our measurements (the dots), but other than that is not very sensible yet. You can adjust the slider to make the function vary more quickly or more slowly. Click the reset button to get a different example of a temperature variation. Try to get the temperature variation that corresponds best with what you expect it to be.</p>
				</FigureGuide>
				<p>The lesson is that we have to be very specific. We have to tell the computer, with mathematical precision, what we know about temperature variations. So let's get at it.</p>
			</div>
		)
	}
}