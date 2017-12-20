import './Header.css'

import React from 'react'
import Link from 'redux-first-router-link'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'

import pages, { getTitle } from '../../pages'
import logo from '../../../logo.svg'
import MenuItem from '../../components/MenuItem/MenuItem.js'
import Tree from '../../icons/Tree.js'
import Cog from '../../icons/Cog.js'
import Info from '../../icons/Info.js'

const Header = (props) => {
	const page = pages[props.locationType] || pages.NOTFOUND
	return (
		<header className="header">
			<div className="contents">
				<div className="title">
					<Link to={{ type: 'HOME' }} className="logoLink">
						<img src={logo} alt="logo" className="logo" />
					</Link>
					<h1>{getTitle(page, props.payload)}</h1>
					<Helmet>
						<title>{page.skipPrefix ? '' : 'Gaussian Process Regression - '}{getTitle(page, props.payload)}</title>
					</Helmet>
				</div>
				<nav className="menu">
					<MenuItem link="TREE" icon={Tree} label="Contents" />
					<MenuItem link="SETTINGS" icon={Cog} label="Settings" />
					<MenuItem link="ABOUT" icon={Info} label="About" />
				</nav>
			</div>
		</header>
	)
}

const stateMap = (state) => ({
	locationType: state.location.type,
	payload: state.location.payload,
})
export default connect(stateMap)(Header)