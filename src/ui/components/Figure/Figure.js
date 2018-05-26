import './Figure.css'

import React, { Component } from 'react'
import classnames from 'classnames'

export default class Figure extends Component {
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
				{this.renderControlBar ? <div className="controlBar">{this.renderControlBar()}</div> : ''}
				<span className="figureCounter">Figure {section.number}.{section.counters.figure}</span>
			</div>
		)
	}
}
