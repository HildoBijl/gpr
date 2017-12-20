import React from 'react'
import { connect } from 'react-redux'

import chapters from '../chapters'

const Chapter = (props) => {
	const chapter = chapters[props.chapter]
	return (
		<div>
			<p>This is going to be chapter <strong>{(chapter || { title: 'Unknown chapter'}).title}</strong>, section {props.section}.</p>
		</div>
	)
}

const stateMap = (state) => ({
	chapter: state.location.payload.chapter,
	section: state.location.payload.section,
})
export default connect(stateMap)(Chapter)