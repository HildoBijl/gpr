import './Page.css'

import React from 'react'
import { connect } from 'react-redux'
import pages from '../../pages'

const Page = (props) => {
	const Page = pages[props.locationType]
	return (
		<main className="page">
			<div className="content">
				{Page ? <Page /> : <pages.NOTFOUND />}
			</div>
		</main>
	)
}

const stateMap = (state) => ({
	locationType: state.location.type
})
export default connect(stateMap)(Page)