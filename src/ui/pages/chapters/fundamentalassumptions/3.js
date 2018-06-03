import React from 'react'
import Link from 'redux-first-router-link'

import Section from '../../../components/Section/Section.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'
import { Term, Emph, Num } from '../../../components/Textbox/index.js'

export default class CurrentSection extends Section {
	render() {
		return (
			<div>
				<p>Next, we are going to compare two different values. Suppose that we know the temperature at 8:00 is exactly zero degrees. What does this say about the temperature at 9:00?</p>

				<h4>Nearby temperatures have similar values</h4>
				<p>Given our situation, we can expect the temperature at 9:00 to be quite close to zero. Previously, a temperature of 6 °C would have been possible at 9:00. Now it's very unlikely. After all, temperatures don't change so quickly.</p>
				<p>To define this, we need to set up a new range for our temperature at 9:00. You can do this with the figure below.</p>
				<p>ToDo: make figure</p>
				<FigureGuide>
					<p>In the above figure, the left plot again shows the probability distribution of the temperature, but now for 9:00. The right figure shows the same distribution using a color gradient.</p>
					<p>To adjust the figure, use the slider at the bottom. With it, you can change how much variation the temperature will have at 9:00.</p>
				</FigureGuide>
				<p>So you just defined the link between the temperatures at 8:00 and 9:00. The way in which we mathematically indicate this link is through the <Term>correlation</Term>. A correlation of 1 means that the two temperatures are exactly equal, while a correlation of 0 means that knowing the temperature at 8:00 does not tell us anything about the temperature at 9:00. Based on the figure, a correlation of <Num>[ToDo]</Num> applies here.</p>

				<h4>Far-away temperatures may vary</h4>
				<p>Next, let's focus on a slightly different question: what do we know about the temperature at 11:00? We still only know that at 8:00 we had 0 °C. So what's different here?</p>
				<p>The answer is that the temperature at 11:00 is not linked so much with the temperature at 8:00. Sure, it's linked a little bit, but less than what we had for 9:00. Let's see what you think the correlation will be now.</p>
				<p>ToDo: make figure</p>
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