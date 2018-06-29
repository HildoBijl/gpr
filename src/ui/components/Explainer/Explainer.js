import './Explainer.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'

import explainerActions from '../../../redux/explainer.js'

class Explainer extends Component {
	constructor() {
		super()
		this.handleMouseMove = this.handleMouseMove.bind(this)
	}
	componentDidMount() {
		window.addEventListener('mousemove', this.handleMouseMove)
	}
	componentWillUnmount() {
		window.removeEventListener('mousemove', this.handleMouseMove)
	}
	handleMouseMove(event) {
		console.log(event)
		this.props.setMousePosition({
			x: event.pageX,
			y: event.pageY,
		})
		console.log(this.props.pos)
	}
	render() {
		const style = {
			left: this.props.mousePosition.x,
			top: this.props.mousePosition.y,
		}
		const percentage = this.props.mousePosition.x/document.body.clientWidth*100
		console.log(percentage)
		return (
			<div className="explainer" style={style}>
				<div className="contents">This is a test text. It will show useful info to the reader.</div>
				<div className="cornerContainer">
					<div className="corner" style={{left: `${percentage}%`, transform: `translateX(-${percentage}%)`}} />
				</div>
			</div>
		)
	}
}

const stateMap = (state) => ({
	mousePosition: state.explainer.mousePosition, // TODO REMOVE
})
const actionMap = (dispatch) => ({
	setMousePosition: (position) => dispatch(explainerActions.setMousePosition(position)),
})
export default connect(stateMap, actionMap)(Explainer)