import React, { Component } from 'react'
import classnames from 'classnames'

export default class SubFigure extends Component {
	render() {
		// Determine the aspect ratio of the figure.
		let ratio = 0.75
		if (this.props.width && this.props.height)
			ratio = this.props.height / this.props.width
		
		// Set up the object code.
		return (
			<div className={classnames('subFigure',	this.props.className)}>
				{this.props.title ? <div className="title">{this.props.title}</div> : ''}
				<div className="subFigureInner" style={{'paddingBottom': `${ratio*100}%`}}>
					{this.props.children}
				</div>
			</div>
		)
	}
}