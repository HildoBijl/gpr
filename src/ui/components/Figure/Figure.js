import './Figure.css'

import React, { Component } from 'react'
import classnames from 'classnames'

import Counter from '../Counter/Counter.js'
import Slider from '../Slider/Slider.js'
import Refresh from '../../icons/Refresh.js'

export default class Figure extends Component {
	constructor() {
		super()
		this.className = { figure: true }
	}

	/*
	 * renderControlBar sets up the control bar for this figure. It can be filled up by defining the appropriate functions:
	 * - onReset will add a reset button that calls onReset when clicked on.
	 * - setCounter and getCounter will add a counter with a + and a -. The data management should be handled by the child class. The function getCounter should return the value that is to be shown on the counter, and setCounter is called when a plus or minus is clicked on. Optionally, the parameters `this.numCounters` can be set in the constructor, if multiple counters are to be used. In that case, both setCounter and getCounter will get, as second parameter, the counter index (starting from 0).
	 * The whole renderControlBar function can also be overwritten by child classes. It's useful if the overriding function still returns a div with className controlBar.
	 */
	renderControlBar() {
		// Extract an array of all the control bar elements.
		const items = [].concat(
			this.getSliders(),
			this.getCounters(),
			this.getResetButton(),
		)

		// If there are no items on the control bar, show nothing.
		if (items.length === 0)
			return ''
		return <div className="controlBar">{items}</div>
	}

	/*
	 * getSliders returns an array with slider components, ready to be added to the control bar. This only works if a setSlider and a getSlider function has been defined. Otherwise an empty array is returned.
	 * Sliders will have a value between 0 (left) and 1 (right). The setSlider function can have three parameters: value (obviously), definite (a boolean that says whether the value is still definite - we are done dragging/sliding) and index (the index of the slider, in case we have multiple). The getSlider should return the slider value, and is used to render the slider button properly. Storage of the slider value should be arranged by the child class.
	 */
	getSliders() {
		// Check if slider functions are defined.
		if (!this.setSlider || !this.getSlider)
			return []

		// Set up sliders.
		const numSliders = this.numSliders || 1 // It is possible to use multiple sliders. In this case, the parameter `numSliders` should be set in the constructor.
		return new Array(numSliders).fill(0).map((_, index) => <Slider key={`slider${index}`} value={this.getSlider(index)} setValue={(value, definite) => this.setSlider(value, definite, index)} />)
	}

	/*
	 * getCounters returns an array with counter components, ready to be added to the control bar. This only works if a getCounter and a setCounter function has been defined. Otherwise an empty array is return.
	 * Counters will have an integer value. It can be positive or negative, but if only positive numbers are desired, then the 'setCounter' function should be defined such as to ignore negative numbers. Storage should be arranged by the child class.
	 */
	getCounters() {
		// Check if counter functions are defined.
		if (!this.setCounter || !this.getCounter)
			return []

		// Set up counters.
		const numCounters = this.numCounters || 1 // It is possible to use multiple counters. In this case, the parameter `numCounters` should be set in the constructor.
		return new Array(numCounters).fill(0).map((_,index) => <Counter key={`counter${index}`} value={this.getCounter(index)} setValue={(value) => this.setCounter(value, index)} />)
	}

	/*
	 * getResetButton returns either a reset button (if onReset is defined by the child class) or an empty array if not.
	 */
	getResetButton() {
		if (!this.onReset)
			return []
		return <div key="reset" className="item btn icon" onClick={this.onReset.bind(this)}><Refresh /></div>
	}

	// renderFigureNumber sets up the figure number for the figure, if one is available.
	renderFigureNumber() {
		// Verify that a number is given. If not, do nothing.
		if (this.props.number === undefined)
			return ''

		// Verify that a section is given. If not, throw an error.
		if (this.props.section === undefined)
			throw new Error('Missing section: a figure must be told which section it belongs to. Provide a section object along with the figure.')

		return <span className="figureCounter">Figure {this.props.section.number}.{this.props.number}</span>
	}

	// renderSubFigures is a function that should return an array of subfigures to be displayed in the figure.
	renderSubFigures() {
		return this.props.children
	}

	// render sets up the figure, with a figure number and potentially a control bar.
	render() {
		// Verify necessary functions.
		if (!this.renderSubFigures)
			throw new Error('Missing renderSubFigures function: a class extended the Figure class, but it did not implement the obligatory renderSubFigures method.')

		// Set up the object code. The figure can have classes that are added either through the properties, or by the child class.
		return (
			<div className={classnames(this.className, this.props.className)}>
				<div className="subFigures">{this.renderSubFigures()}</div>
				{this.renderControlBar()}
				{this.renderFigureNumber()}
			</div>
		)
	}
}
