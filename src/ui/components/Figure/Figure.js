import './Figure.css'

import React, { Component } from 'react'
import classnames from 'classnames'

import Counter from '../Counter/Counter.js'
import Slider from '../Slider/Slider.js'
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

		// If a setSlider and a getSlider function has been defined, we add sliders. These will have a value between 0 (left) and 1 (right). The setSlider function can have three parameters: value (obviously), definite (a boolean that says whether the value is still definite - we are done dragging/sliding) and index (the index of the slider, in case we have multiple).
		if (this.setSlider && this.getSlider) {
			const numSliders = this.numSliders || 1 // It is possible to use multiple sliders. In this case, the parameter `numSliders` should be set in the constructor.
			new Array(numSliders).fill(0).forEach((_, index) => {
				items.push(<Slider key={`slider${index}`} getValue={() => this.getSlider(index)} setValue={(value, definite) => this.setSlider(value, definite, index)} />)
			})
		}

		// If a setCounter and a getCounter function has been defined, we add counters. These can be negative too, but you could also have a setCounter function which adjusts negative values to zero.
		if (this.setCounter && this.getCounter) {
			const numCounters = this.numCounters || 1 // It is possible to use multiple counters. In this case, the parameter `numCounters` should be set in the constructor.
			new Array(numCounters).fill(0).forEach((_, index) => {
				items.push(<Counter key={`counter${index}`} value={this.getCounter(index)} setValue={(value) => this.setCounter(value, index)} />)
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
		// Verify that a section is given.
		const section = this.props.section
		if (!section)
			throw new Error('Missing section: a figure must be told which section it belongs to. Provide a section object along with the figure.')

		// Verify necessary functions.
		if (!this.renderSubFigures)
			throw new Error('Missing renderSubFigures function: a class extended the Figure class, but it did not implement the obligatory renderSubFigures method.')

		// Set up the object code.
		return (
			<div className={classnames('figure', this.props.className)}>
				<div className="subFigures">{this.renderSubFigures()}</div>
				{this.renderControlBar()}
				<span className="figureCounter">Figure {section.number}.{this.props.number}</span>
			</div>
		)
	}
}
