import React from 'react'

import Section from '../../../components/Section/Section.js'
import { Equation, Eq, IfEquation, IfNotEquation, m } from '../../../components/equations'

export default class CurrentSection extends Section {
	render() {
		return (
			<div>
				<p>This section is still being written. Check back later to see if it's been added.</p>
				<IfEquation><p>Hello</p></IfEquation>
				<IfNotEquation><p>Bye equations</p></IfNotEquation>
				<IfEquation>
					<Equation debug={true} hoverInfo={[
						{
							elements: ['m', {text: 'm', occurrence: 2}, 'mm'],
							explainer: <div>These subscripts denote that the matrices are related to measurements.</div>
						},
						{
							elements: ['[',']'],
							explainer: <div>These brackets indicate a matrix.</div>
						},
					]}>{m.bmatrix([['K', 'K_m'], ['K_m^T', 'K_{mm}']])}</Equation>
				</IfEquation>
				This is an equation <Eq hoverInfo={[
					{ elements: 'a', explainer: 'This is one side' },
					{ elements: 'b', explainer: 'This is another side' },
					{ elements: 'c', explainer: 'This is the diagonal side' },
				]}>a^2+b^2={m.exp('c',2)}</Eq>.
				<Equation hoverInfo={[
					{ elements: 'CL', explainer: <>Lift coefficient <Eq>C_L</Eq></> },
					{ elements: 'ρ', explainer: 'Air density' },
					{ elements: 'V', explainer: 'Airspeed' },
					{ elements: 'S', explainer: 'Surface area' },
				]}>{m.frac(1, 2)}C_L \rho V^2 S</Equation>
				{/* ToDo: first set up a subsection on the joint distribution of two temperatures. Show what examples are. Then do the same for three samples. Finally, let the user tune the number of samples. */}
				{/* Or alternatively: show what happens when you still have a single measurement, but vary the number of points. */}
				{/* <p><Link to={{ type: 'CHAPTER', payload: { chapter: 'whatisgpr' } }}>Go to the previous chapter</Link></p> */}
			</div>
		)
	}
}
