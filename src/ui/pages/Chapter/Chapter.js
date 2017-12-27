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

const stateMap = (state) => {
	// Determine which payload contains chapter information. When fading out the page, we can use the previous payload.
	let payload = {}
	if (state.location.payload.chapter)
		payload = state.location.payload
	else if (state.location.prev.payload && state.location.prev.payload.chapter)
		payload = state.location.prev.payload
	
	return {
		chapter: payload.chapter,
		section: payload.section,
	}
}
export default connect(stateMap)(Chapter)