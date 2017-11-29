import React from 'react'
import { connect } from 'react-redux'

const Chapter = (props) => (
	<div>
		<p>This is going to be chapter {props.chapter}, section {props.section}.</p>
	</div>
)

const stateMap = (state) => ({
	chapter: state.location.payload.chapter,
	section: state.location.payload.section,
})
export default connect(stateMap)(Chapter)