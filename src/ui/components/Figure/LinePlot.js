import './LinePlot.css'

import { select } from 'd3-selection'
import { line, curveLinear } from 'd3-shape'

import colors, { colorToHex } from '../../../logic/colors.js'

import Plot from '../../components/Figure/Plot.js'
import Transitioner from '../../../logic/transitioner.js'

const defaultLine = {
	function: x => x, // The function that is used for the line. It's a simple javascript number taking a number and giving a number.
	// color: '#dd2222', // A color can be provided as a string, in the usual CSS format. If it's not set, then one of the default colors will be used, in a rotating fashion.
	width: 1, // The width of the line.
}

export default class LinePlot extends Plot {
	constructor() {
		super()

		// Apply settings.
		this.className.linePlot = true // Tell the plot that it's a LinePlot, so the corresponding CSS styling applied.

		// Set up important storing parameters.
		this.lines = [] // This will store the definitions of the lines, as given by the calling functions.
		this.linePoints = [] // This will store the actual lines (the transitioners) which will be used to draw the plot. It is not directly affected by calling functions.
	}

	// componentDidMount sets up all parameters (mostly D3 objects, but also transitioners) that are needed to properly plot the Gaussian Process.
	componentDidMount() {
		// Do the regular plot initialization.
		super.componentDidMount()

		// Set up all containers. The order matters: later containers are on top of earlier containers.
		this.svgContainer = select(this.svg)
		this.lineContainer = this.svgContainer.append('g').attr('mask', 'url(#noOverflow)').attr('class', 'lines')

		// Set up the line function for all lines. This tells us how to transform a set of data points into coordinates.
		this.lineFunction = line()
			.x(prediction => this.scale.input(prediction.input))
			.y(prediction => this.scale.output(prediction.output))
			.curve(curveLinear)
	}

	// addLine will add a line object to the lines array, which will subsequently be shown on the plot. It returns the index of the element that was added.
	addLine(line) {
		const index = this.lines.length
		this.setLine(line, index)
		return index
	}

	// setLine will update a line object within the lines array. It requires the adjusted line object and the index.
	setLine(line, index) {
		// Verify the input.
		if (index === undefined) {
			if (this.lines.length > 1)
				throw new Error('Missing line index: the function setLine was called without an index. This is only allowed when a single line is present. However, multiple lines have already been added.')
			index = 0
		}

		// Store the line.
		this.lines[index] = this.processLine(line, index)

		// If there are no linePoints yet, set them up, with transitioners. Otherwise update the values inside the transitioners.
		if (!this.linePoints[index]) {
			this.linePoints[index] = this.plotPoints.map(input => ({
				input,
				output: new Transitioner({ transitionTime: this.transitionTime }).setValue(line.function(input)),
			}))
		} else {
			this.linePoints[index].forEach(point => {
				point.output.setValue(line.function(point.input))
			})
		}
	}

	// deleteLine will remove the line with the given index.
	deleteLine(index) {
		// Verify the input.
		if (index === undefined) {
			if (this.lines.length > 1)
				throw new Error('Missing line index: the function setLine was called without an index. This is only allowed when a single line is present. However, multiple lines have already been added.')
			if (!this.lines[0])
				throw new Error('Missing line: tried to delete a line, but no line is present.')
			index = 0
		}
		if (!this.lines[index])
			throw new Error(`Invalid line index: tried to delete the line with index ${index} but no such line is present.`)

		// Delete the line.
		delete this.lines[index]
		delete this.linePoints[index]
	}

	// processLine takes a line object and adds default settings in case certain settings are missing.
	processLine(line, index = 0) {
		return {
			...defaultLine,
			color: colorToHex(colors[index % colors.length]), // Choose a color based on the index. We could pick random colors too, but then we may get more doubles.
			...line,
		}
	}

	// update will often be overwritten by the child class, but the default action is that it draws the mean, the standard deviation and the measurements.
	update() {
		this.drawLines()
	}

	// drawLines will (re)draw all the lines that are known in this LinePlot. For this, it pulls the current lines out of the transitioners and puts them on the screen using D3.
	drawLines() {
		// Extract an array with all line values from the transitioners.
		const lineData = this.linePoints.map(linePoints => {
			return linePoints.map(point => ({
				input: point.input,
				output: point.output.getValue(),
			}))
		})

		// Set up a path for each line using D3.
		const lines = this.lineContainer
			.selectAll('path')
			.data(lineData)
		lines.enter()
			.append('path')
			.attr('class', 'line')
			.attr('stroke', (line, index) => this.lines[index].color)
			.attr('stroke-width', (line, index) => this.lines[index].width)
			.merge(lines)
			.attr('d', line => this.lineFunction(line) + 'l10000,0l10000,10000l10000,-10000') // We add the line segments at the end to work around a bug in chrome where a clipping mask combined with a completely straight SVG path results in an invisible line. So we just prevent the line from being straight by adding a large invisible section.
		lines.exit()
			.remove()
	}
}