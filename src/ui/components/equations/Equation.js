/* The Equation object represents a math equation. It takes whatever is put into it and displays it as math. There are various properties that can be set.
 * - debug: boolean (optional; default false) telling whether to log into the console useful info. When adding hover effects, it will also be useful to temporarily put this on, to find which text is displayed in the equation.
 * - hoverInfo: object or array of objects (optional) telling the equation which elements should have info added to it when the user hovers over them. This can be an object or an array of objects. Each object has the properties
 *   x elements: object/string or array of objects/strings indicating which text should be marked with hover effects. An example is ['m', {text: 'm', occurrence: 2}, 'mm']. When a string is used, then it is assumed that the first occurrence is required.
 *   x explainer: React element indicating what should be shown in the explainer when the user hovers over the respective elements.
 */

import React, { Component } from 'react'
import { BlockMath, InlineMath } from 'react-katex'

import { connectToExplainer } from '../../../redux/explainer.js'
import { findInString, isObject } from '../../../logic/util.js'

class Equation extends Component {
	constructor() {
		super()
		this.initialize = this.initialize.bind(this)
	}
	render() {
		// Don't render if no math is given.
		if (!this.isValid())
			return null

		// Check if it is an inline equation (when indicated) or a block equation (default). Render it accordingly.
		if (this.props.inline) {
			return (
				<span className="equation" ref={this.initialize}>
					<InlineMath math={this.getMath()} />
				</span>
			)
		} else {
			return (
				<div className="equation" ref={this.initialize}>
					<BlockMath math={this.getMath()} />
				</div>
			)
		}
	}

	// isValid checks if this class has been given valid input. If not, we don't render it. (Maybe the valid input will follow later, on a subsequent render.)
	isValid() {
		return !!this.props.children // It is valid when children (a math statement) have been provided.
	}

	// getMath returns the math code for this equation.
	getMath() {
		const math = this.props.children // Extract the text given to this element.
		return Array.isArray(math) ? math.join(' ') : math // If the input is an array (as may happen when using function calls in the text) then turn it into a string. Add a space to prevent funny stuff is an equation part isn't closed properly, like when it ends with \alpha or so.
	}

	// initialize will initialize various properties of the equation (like hover functionalities) as soon as it finished rendering. 
	initialize(obj) {
		// Check if we should initialize.
		if (!obj)
			return // There is no object yet.
		if (this.obj)
			return // We already initialized before.
		this.obj = obj // Remember the object. This also remembers that we initialized the object.
		this.html = obj.querySelector('.katex-html') // This element contains all HTML elements for the equation. Other parts only contain auxiliary info and are not shown.

		// Apply the debug mode.
		if (this.props.debug) {
			console.log('[EqDebug] Initializing equation')
			console.log(`[EqDebug] LaTeX code: ${this.getMath()}`)
			console.log(`[EqDebug] Equation text: ${this.getEquationText()}`)
			const numHoverIndicators = Array.isArray(this.props.hoverInfo) ? this.props.hoverInfo.length : 1
			console.log(`[EqDebug] ${numHoverIndicators} hover indicator${numHoverIndicators === 1 ? '' : 's'} present in the hoverInfo property`)
			console.log('[EqDebug] Leafs are the following elements:')
			console.log(this.getAllLeafsWithText())
		}

		// Implement whatever needs to be implemented.
		this.setUpHoverInfo()
	}

	// setUpHoverInfo implements the hoverInfo property of the equation. See the class description for the set-up of the hoverInfo property.
	setUpHoverInfo() {
		// Check if we should do anything.
		if (!this.props.hoverInfo)
			return

		// Extract the info and turn it into an array if it is not an array already, because the script assumes an array.
		let hoverInfo = this.props.hoverInfo
		hoverInfo = Array.isArray(hoverInfo) ? hoverInfo : [hoverInfo]

		// Set up the hoverInfo for each info object.
		hoverInfo.forEach(info => {
			if (!this.isValidSearchCriterion(info.elements))
				return
			const elements = this.findElementsWith(info.elements)
			this.addHoverNote(elements, info.explainer)
		})
		
		// TODO IN FUTURE: Keep track of the event listeners. When there is an update, remove all event listeners from old objects and add them to the new ones. By doing this, we can deal with changing equations too. At the moment, hoverInfo does not work when the equation changes.
	}

	// isValidSearchCriterion checks whether the search criterion given has a valid format. If not, and if in debug mode, a warning is given.
	isValidSearchCriterion(search) {
		// If we have an array, check all elements.
		if (Array.isArray(search))
			return search.reduce((result, search) => result && this.isValidSearchCriterion(search), true)

		// Set up a warn function useful for adding debug info.
		const warnFunction = (details) => {
			if (this.props.debug)
				console.warn(`[EqDebug] Equation hover input issue: when setting up the hover functionalities for the equation with text "${this.getEquationText()}", an elements-search parameter did not have the right format. ${details} The elements-search parameter equals ${JSON.stringify(search)}.`)
			return false
		}

		// Check the parameter if it is a string.
		if (typeof(search) === 'string')
			return true // Strings are always fine.

		// Check the parameter if it is an object.
		if (isObject(search)) {
			if (search.text === undefined)
				return warnFunction(`The 'text' property was not defined.`)
			if (typeof(search.text) !== 'string')
				return warnFunction(`The 'text' property was not a valid string.`)
			if (search.text.length === 0)
				return warnFunction(`The 'text' property was an empty string.`)
			if (!Number.isInteger(search.occurrence))
				return warnFunction(`The 'occurrence' property was not a valid integer number.`)
			if (search.occurrence <= 0)
				return warnFunction(`The 'occurrence' property was not a positive integer. We start counting at 1. Negative numbers are not supported.`)
			return true // Everything checks out.
		}

		// All other cases are invalid.
		return warnFunction('It was not a string or an object.')
	}

	// getAllLeafsWithText walks through the entire equation and returns all elements that (1) do not have children, and (2) do have text. (Zero-width spaces are ignored.) These elements are returned as an array.
	getAllLeafsWithText() {
		return Array.from(this.html.querySelectorAll('*')) // Select all elements and turn them into an array.
			.filter(child => child.children.length === 0 && this.getObjTextLength(child) > 0) // Only select the endpoints (leafs) and then only those that have text. (Remove any zero-width spaces, as KaTeX uses them and they do count as characters.)
	}

	/* findElementsWith finds the fewest amount of elements in the equation containing the given search parameters. The 'search' parameter can have various set-ups.
	 * - a string with text. The first occurrence of this text will be used.
	 * - an object {text: 'a2+b2=c2', occurrence: 2} which will look for the (in this case) second occurrence of the given text.
	 * - an array consisting of the above options. (This can be mixed up in any way.)
	 * The leafs parameter can be passed along for efficiency reasons; so as not to have to get all the leafs again every time.
	 * The result is an array of objects that contain all the given search parameters.
	 */
	findElementsWith(search, leafs = this.getAllLeafsWithText()) {
		// Find out which leafs need to be present.
		const leafData = this.findLeafsWith(search, leafs)

		// Walk through all leafs.
		const containers = [] // The result that will be returned.
		leafData.forEach(data => {
			// Ignore leafs that shouldn't be part of the end result, and leafs that have already been placed.
			if (!data.present || data.placed)
				return

			// Walk from the leaf up along its parents, while checking exactly what it contains.
			let currContainer = data.leaf
			let lastValidContainer = currContainer
			data.placed = true
			while (currContainer.parentElement) { // While there is a parent element.
				currContainer = currContainer.parentElement

				// Check if this one is valid. The container may only contain leafs that either should be present, according to our search criteria.
				if (!leafData.reduce((valid, currData) => valid && (currData.present || !currContainer.contains(currData.leaf)), true)) // eslint-disable-line no-loop-func
					return containers.push(lastValidContainer) // Not valid! Remember the last container that was valid and move on to the next leaf.
				
				// Check if we have obtained new elements. If so, note that we have placed them and remember the current container as a valid container.
				leafData.forEach(currData => { // eslint-disable-line no-loop-func
					if (currData.present && !currData.placed && currContainer.contains(currData.leaf)) {
						lastValidContainer = currContainer
						currData.placed = true
					}
				})

				// Check if we have placed all elements.
				if (leafData.reduce((allPlaced, currData) => allPlaced && (!currData.present || currData.placed), true))
					return containers.push(lastValidContainer)
			}
		})

		// We're done!
		return containers
	}

	/* findLeafsWith finds the leafs corresponding to a given text. The 'search' parameter is identical to what's possible for findElementsWith. It returns an array of objects [{leaf: LeafObject, present: true/false}, ...]. This array is just as long as the leafs object, but it marks whether each leaf must be present.
	 */
	findLeafsWith(search, leafs = this.getAllLeafsWithText()) {
		// Set up the result array and fill it with the right values.
		const result = leafs.map(leaf => ({	leaf,	present: false }))
		this.findLeafIndices(search, leafs).forEach(index => result[index].present = true)
		return result
	}

	// findLeafIndices searches for a search object (as described in the findLeafsWith function, but arrays are not allowed anymore). It returns an array of indices of the leafs that make up the given search criterion. When the leafs are not found, a warning is logged in the console (tip: use debug={true} as equation property to get extra info) and no leafs are marked as to be added.
	findLeafIndices(search, leafs = this.getAllLeafsWithText()) {
		// If we have an array, walk through them and merge (flatten) all the results.
		if (Array.isArray(search))
			return search.map(searchElement => this.findLeafIndices(searchElement, leafs)).reduce((arr, val) => arr.concat(val), []) // The last part is to flatten the array. (The array function 'flat' is not browser-compatible yet.)

		// If we are only given a string, turn it into an object, to generalize the function.
		if (typeof (search) === 'string')
			search = { text: search, occurrence: 1 }

		// Find the position of the text that we are looking for.
		const equationText = this.getEquationText(leafs)
		const targetStart = findInString(search.text, equationText, search.occurrence)
		const targetEnd = targetStart + search.text.length

		// Check if it exists. If not, log a warning and do nothing.
		if (targetStart === -1) {
			if (this.props.debug)
				console.warn(`Equation hover issue: when rendering the equation "${this.getMath()}" with render text "${this.getEquationText()}" we couldn't find any elements satisfying the search criterion ${JSON.stringify(search)}. Equation hover effects might be missing.`)
			else
				console.warn(`Equation hover issue: when rendering an equation, a hover effect failed to implement. Hover effects may not be fully functional.`)
			return [] // Return an empty array, to prevent anything from happening further.
		}

		// Walk through all leafs and find if they are in the right position.
		const indices = []
		for (let i = 0, start, end = 0; i < leafs.length; i++) {
			start = end
			end+= this.getObjTextLength(leafs[i])
			if ((start < targetStart && end > targetStart) || (start < targetEnd && end > targetEnd))
				throw new Error(`Invalid equation search text: the search text given for the equation may not contain a part of a single element. We searched for "${search.text}" in "${equationText}".`)
			if (start >= targetStart && end <= targetEnd)
				indices.push(i)
		}
		return indices
	}

	// getEquationText returns the text representing the equation. Parts of it can be used for hovering effects.
	getEquationText() {
		return this.html.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '')
	}

	// getObjText returns the text of a DOM object. For this, we also remove any zero-width spaces, as KaTeX uses them and they do count as characters, while they are not visible in any way.
	getObjText(leaf) {
		return leaf.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '')
	}

	// getObjTextLength returns the length of the text inside a DOM object.
	getObjTextLength(leaf) {
		return this.getObjText(leaf).length
	}

	// addHoverNote takes an array of elements and a React object to put into the explainer as contents. Whenever the user hover over any of the elements in the array, they all light up and the explainer is shown above the hovered element.
	addHoverNote(elements, explainerContents) {
		elements.forEach(element => {
			element.classList.add('hoverable')
			element.addEventListener('mouseenter', this.startHover.bind(this, elements, element, explainerContents))
			element.addEventListener('mouseleave', this.endHover.bind(this, elements))
		})
	}

	// startHover is called when the user hovers over an element that has been given hover functionalities. It makes sure that the elements are lighted up and the explainer is shown.
	startHover(elements, element, explainerContents) {
		// Make all the elements look properly.
		this.obj.classList.add('hovering')
		elements.forEach(element => {
			element.classList.add('hovering')
		})

		// Set the explainer in the right place.
		const rect = element.getBoundingClientRect()
		this.props.explainer.set({
			contents: explainerContents,
			position: {
				x: rect.left + rect.width / 2,
				y: rect.y - 6,
			},
		})
	}

	// endHover is called when the user stops hovering over an element. It resets the equation back to its normal state.
	endHover(elements) {
		// Make all the elements look properly.
		this.obj.classList.remove('hovering')
		elements.forEach(element => {
			element.classList.remove('hovering')
		})
		
		// Get rid of the explainer.
		this.props.explainer.reset()
	}
}
export default connectToExplainer(Equation)