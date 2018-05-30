import './Figure.css'

import React, { Component } from 'react'
import classnames from 'classnames'

import Refresh from '../../icons/Refresh.js'

export default class Figure extends Component {

	/*
	 * renderControlBar sets up the control bar for this figure. It can be filled up by defining the appropriate functions:
	 * - onReset will add a reset button that calls onReset when clicked on.
	 * - setCounter and getCounter will add a counter with a + and a -. The data management should be handled by the child class. The function getCounter should return the value that is to be shown on the counter, and setCounter is called when a plus or minus is clicked on. Optionally, the parameters `this.numCounters` can be set in the constructor, if multiple counters are to be used. In that case, both setCounter and getCounter will get, as second parameter, the counter index (starting from 0).
	 * The whole renderControlBar function can also be overwritten by child classes. It's useful if the overriding function still returns a div with className controlBar.
	 */
	renderControlBar() {
		// Create an array that will contain all items needed for the control bar.
		const items = []

		// If a setCounter and a getCounter function has been defined, we add counters.
		if (this.setCounter && this.getCounter) {
			const numCounters = this.numCounters || 1 // It is possible to use multiple counters. In this case, the parameters `numCounters` should be set in the constructor.
			new Array(numCounters).fill(0).forEach((_, index) => {
				const value = this.getCounter(index)
				items.push(
					<div key={`counter${index}`} className="counter">
						<div className="btn minus" onClick={(event) => this.setCounter(value - (event.shiftKey ? 10 : 1), index)} />
						<div className="item count">{value}</div>
						<div className="btn plus" onClick={(event) => this.setCounter(value + (event.shiftKey ? 10 : 1), index)} />
					</div>
				)
			})
		}

		// If a reset functionality has been defined in this figure, add a reset function to the control bar.
		if (this.onReset)
			items.push(<div key="reset" className="item btn icon" onClick={() => this.props.data.gp.removeAllMeasurements()}><Refresh /></div>)

		// If there are no items on the control bar, show nothing.
		if (items.length === 0)
			return ''
		return <div className="controlBar">{items}</div>
	}

	// render sets up the figure, with a figure number and potentially a control bar.
	render() {
		// Verify that a section is given and process related data.
		if (!this.props.section)
			throw new Error('Missing section: a figure must be told which section it belongs to. Provide a section object along with the figure.')
		const section = this.props.section
		section.counters.figure++

		// Verify necessary functions.
		if (!this.renderSubFigures)
			throw new Error('Missing renderSubFigures function: a class extended the Figure class, but it did not implement the obligatory renderSubFigures method.')

		// Set up the object code.
		return (
			<div className={classnames('figure', this.props.className)}>
				<div className="subFigures">{this.renderSubFigures()}</div>
				{this.renderControlBar()}
				<span className="figureCounter">Figure {section.number}.{section.counters.figure}</span>
			</div>
		)
	}
}
