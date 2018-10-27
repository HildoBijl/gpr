import React from 'react'

import { InlineMath, BlockMath } from 'react-katex';

import Section from '../../../components/Section/Section.js'
import { Equation, IfEquation, IfNotEquation } from '../../../components/equations'

export default class CurrentSection extends Section {
	constructor() {
		super()
		this.state = { x: 1}
	}
	componentDidMount() {
		setInterval(this.update.bind(this), 1000)
	}
	update() {
		this.setState({
			x: this.state.x + 1,
		})
	}
	render() {
		return (
			<div>
				<p>This section is still being written. Check back later to see if it's been added.</p>
				<IfEquation><p>Hello</p></IfEquation>
				<IfNotEquation><p>Bye equations</p></IfNotEquation>
				<InlineMath>x^2</InlineMath>
				<IfEquation>
					<Equation math={toMatrix([['K', 'K_m'], ['K_m^T', 'K_{mm}']])} />
				</IfEquation>
				{/* ToDo: first set up a subsection on the joint distribution of two temperatures. Show what examples are. Then do the same for three samples. Finally, let the user tune the number of samples. */}
				{/* Or alternatively: show what happens when you still have a single measurement, but vary the number of points. */}
				{/* <p><Link to={{ type: 'CHAPTER', payload: { chapter: 'whatisgpr' } }}>Go to the previous chapter</Link></p> */}
			</div>
		)
	}
}

const toMatrix = (arr) => {
	return '\\begin{bmatrix}'
		+ arr.map(line => line.join(' & ')).join(' \\\\ ')
		+ '\\end{bmatrix}'
}