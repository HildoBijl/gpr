// Section serves as a template for sections. It has some functions that can be useful for all sections that are written.

import { Component } from 'react'

export default class Section extends Component {
	// reset is called prior to every render, and it resets figure numbers, equation numbers and such.
	reset() {
		this.number = this.props.index + 1
		this.counters = {
			figure: 0
		}
		// TODO: Incorporate equation numbers.
	}
}