import './Page.css'

import React from 'react'
import { connect } from 'react-redux'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

import pages from '../../pages'

const Page = (props) => {
	// Determine the page, as well as the key to give to the page to ensure new pages are considered as unique.
	const page = pages[props.locationType] || pages.NOTFOUND
	return (
		<main className="page">
			<ReactCSSTransitionGroup
				component="div"
				className="pageFader"
				transitionName="pageFade"
				transitionAppear={true}
				transitionAppearTimeout={200}
				transitionEnterTimeout={200}
				transitionLeaveTimeout={200}
			>
				<page.component key={page.name}/>
			</ReactCSSTransitionGroup>
		</main>
	)
}

const stateMap = (state) => ({
	locationType: state.location.type,
	payload: state.location.payload,
})
export default connect(stateMap)(Page)