import './Figure.css'

import React, { Component } from 'react'
import classnames from 'classnames'

import Refresh from '../../icons/Refresh.js'

export default class Figure extends Component {

	/*
	 * renderControlBar sets up the control bar for this figure. It can be filled up by defining the appropriate functions:
	 * - onReset will add a reset button that calls onReset when clicked on.
	 * [ToDo: add more functions]
	 * The whole renderControlBar function can also be overwritten by child classes. It's useful if the overriding function still returns a div with className controlBar.
	 */
	renderControlBar() {
		// Create an array that will contain all items needed for the control bar.
		const items = []

		// If a reset functionality has been defined in this figure, add a reset function to the control bar.
		if (this.onReset)
			items.push(<div key="reset" className="btn icon" onClick={() => this.props.data.gp.removeAllMeasurements()}><Refresh /></div>)

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
