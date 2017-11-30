import './Page.css'

import React from 'react'
import { connect } from 'react-redux'

import pages from '../../pages'

const Page = (props) => {
	const page = pages[props.locationType] || pages.NOTFOUND
	return (
		<main className="page">
			<div className="content">
				<page.component />
			</div>
		</main>
	)
}

const stateMap = (state) => ({
	locationType: state.location.type
})
export default connect(stateMap)(Page)