import React from 'react'
import Link from 'redux-first-router-link'

import Section from '../../../components/Section/Section.js'
import Figure from '../../../components/Figure/Figure.js'
import SubFigure from '../../../components/Figure/SubFigure.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'
import InteractiveFigure from './figures/InteractiveFigure.js'

export default class CurrentSection extends Section {
	render() {
		this.reset()
		return (
			<div>
				<p>This section is currently being written.</p>
				<p>It will have a ton of figures.</p>
				<InteractiveFigure section={this} />
				<FigureGuide>
					<p>This explains what the figure does.</p>
				</FigureGuide>
				<p>And sometimes pictures are split too, like the two pictures below.</p>
				<SampleFigure section={this} className="twoColumn" />
				<p><Link to={{ type: 'CHAPTER', payload: { chapter: 'whatisgpr' } }}>Go to the previous chapter</Link></p>
			</div>
		)
	}
}

class SampleFigure extends Figure {
	renderSubFigures() {
		return [
			<SubFigure title="The left figure" key="left">
				<svg viewBox="0 0 1000 750">
					<rect x="50" y="500" width="900" height="200" fill="#888" />
					<rect x="300" y="50" width="400" height="400" fill="#888" />
				</svg>
			</SubFigure>,
			<SubFigure title="The figure on the right" key="right">
				<svg viewBox="0 0 1000 750">
					<rect x="50" y="50" width="900" height="200" fill="#888" />
					<rect x="300" y="300" width="400" height="400" fill="#888" />
				</svg>
			</SubFigure>
		]
	}
}