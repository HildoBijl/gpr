import React, { Component } from 'react'
import Link from 'redux-first-router-link'

import math from 'mathjs'

import { getGaussianRand, logDet, getGaussianSample, getGaussianSampleFromCholesky, mergeMatrices } from '../../../../logic/math.js'
import GaussianProcess, { getSquaredExponentialCovarianceFunction } from '../../../../logic/gaussianProcess.js'
import GaussianDistribution from '../../../../logic/gaussianDistribution.js'

import Figure from '../../../components/Figure/Figure.js'
import FigureGuide from '../../../components/Figure/FigureGuide.js'

import SamplePlot from './figures/samplePlot.js'

class Section extends Component {
	constructor() {
		super()
		// TODO
	}
	componentDidMount() {
		// TODO
	}

	// reset is called prior to every render, and it resets figure numbers, equation numbers and such.
	reset() {
		this.number = this.props.index + 1
		this.counters = {
			figure: 0
		}
	}

	render() {
		this.reset()
		return (
			<div>
				<p>This section is currently being written.</p>
				<p>It will have a ton of figures.</p>
				<SamplePlot section={this}>
					<p>ToDo: remove this, in favor of the plot.</p>
				</SamplePlot>
				<FigureGuide>
					<p>This explains what the figure does.</p>
				</FigureGuide>
				<p>Really pretty ones!</p>
				<Figure section={this}>
					<svg viewBox="0 0 1000 750" className="half">
						<rect x="50" y="500" width="900" height="200" />
						<rect x="300" y="50" width="400" height="400" />
					</svg>
					<svg viewBox="0 0 1000 750" className="half">
						<rect x="50" y="50" width="900" height="200" />
						<rect x="300" y="300" width="400" height="400" />
					</svg>
				</Figure>
				<p><Link to={{ type: 'CHAPTER', payload: { chapter: 'whatisgpr' } }}>Go to the previous chapter</Link></p>
			</div>
		)
	}
}

export default Section