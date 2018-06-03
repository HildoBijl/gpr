import './Textbox.css'

import React from 'react'

import Note from './Note.js'

// Define some textbox elements that are too easy to get their own file.

const Term = (props) => {
	return (
		<span className="term">{props.children}</span>
	)
}

const Num = (props) => {
	return (
		<span className="num">{props.children}</span>
	)
}

const Emph = (props) => {
	return (
		<span className="emph">{props.children}</span>
	)
}

export { Note, Term, Num, Emph }