import './Note.css'

import React, { Component } from 'react'
import classnames from 'classnames'

export default class Note extends Component {
	constructor() {
		super()
		this.state = {
			open: false,
		}
		this.change = this.change.bind(this)
	}
	change() {
		this.setState({ open: !this.state.open })
	}
	render() {
		return (
			<span className={classnames('noteContainer', { open: this.state.open })}>
				<span className="noteDial" onClick={this.change} />
				{this.state.open ? ' ' : ''} {/* This space is to allow proper spacing (and line breaks) between the dial and the note. */}
				{this.state.open ? <span className="note">{this.props.children}</span> : ''}
			</span>
		)
	}
}