/* The Equation object represents a math equation. It should have a 'math' property with the LaTeX code to display. There are various other properties that can be set.
 * - math: string (obligatory) representing the LaTeX code to display.
 * - showText: boolean (optional) telling whether to log into the console the text as set up by Katex. This is useful when setting up hover functionalities for the equation.
 */

import React, { Component } from 'react'
import { BlockMath } from 'react-katex'

import { connectToExplainer } from '../../../redux/explainer.js'

class Equation extends Component {
	constructor() {
		super()
		this.initialize = this.initialize.bind(this)
	}
	render() {
		if (!this.props.math)
			return null
		return (
			<div className="equation" ref={this.initialize}>
				<BlockMath math={this.props.math} />
			</div>
		)
	}
	initialize(obj) {
		console.log('Trying to initialize')
		// Check if we should initialize.
		if (!obj)
			return // There is no object yet.
		if (this.obj)
			return // We already initialized before.
		this.obj = obj

		// // Extract the HTML object.
		const html = obj.querySelector('.katex-html')
		// if (!html)
		// 	return

		// 	console.log('Initializing')

		// // If we are requested, we show the text.
		// if (this.props.showText)
		// 	console.log(html.textContent)

		// //
		window.t = this
		window.h = html
		// console.log(html)
		// const children = Array.from(html.querySelectorAll('*')) // Select all elements and turn them into an array.
		// 	.filter(child => child.children.length === 0 && child.textContent.length > 0) // Only select the endpoints (leafs) and then only those that have text.
		// window.c = children
		

		// this.initialized = true // Remember that we've been initialized. We don't have to do it again.
		let el = this.getAllLeafsWithText().filter(leaf => leaf.textContent === 'T')[0].parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement
		console.log(el.querySelectorAll('.mord'))
		el = el.querySelectorAll('.mord')[0]
		el.classList.add('hoverable')
		window.el = el
		el.addEventListener('mouseenter', this.hover.bind(this, el))
		el.addEventListener('mouseleave', this.reset.bind(this, el))

		const leafs = this.getAllLeafsWithText()
		for (let i = 2; i <= 4; i++) {
			const elx = leafs[i]
			// console.log(elx)
			// elx.addEventListener('mouseenter', this.hover.bind(this, el))
			// elx.addEventListener('mouseleave', this.reset.bind(this, el))
		}
	}
	hover(el, evt) {
		console.log('Entering')
		console.log(el)
		console.log(evt)
		window.e = evt
		const rect = el.getBoundingClientRect()
		el.classList.add('hovering')
		// window.el = evt.target
		this.props.explainer.set({
			contents: <div>Hovering over T!</div>,
			position: {
				x: rect.left + rect.width/2,
				y: rect.y - 6,
			},
		})
	}
	reset(el, evt) {
		console.log('Leaving')
		el.classList.remove('hovering')
		this.props.explainer.reset()
	}
	getAllLeafsWithText() {
		// Extract the HTML object.
		const html = this.obj.querySelector('.katex-html')
		if (!html)
			return []

		// Obtain the requested array.
		return Array.from(html.querySelectorAll('*')) // Select all elements and turn them into an array.
			.filter(child => child.children.length === 0 && child.textContent.length > 0) // Only select the endpoints (leafs) and then only those that have text.
	}
	check() {
		// console.log('Y')
		// console.log(this.y)
		// console.log((y.querySelector('.katex-html') || {}).textContent)
	}
}
export default connectToExplainer(Equation)

// ToDo: move this to some support file?
const toMatrix = (arr) => {
	return '\\begin{bmatrix}'
		+ arr.map(line => line.join(' & ')).join(' \\\\ ')
		+ '\\end{bmatrix}'
}