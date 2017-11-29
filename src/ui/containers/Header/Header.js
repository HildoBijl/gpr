import './Header.css'

import React from 'react'
import Link from 'redux-first-router-link'

import logo from '../../../logo.svg'
import MenuItem from '../../components/MenuItem/MenuItem.js'
import Tree from '../../icons/Tree.js'
import Cog from '../../icons/Cog.js'
import Info from '../../icons/Info.js'

export default () => (
	<header className="header">
		<div className="contents">
			<div className="title">
				<Link to={{ type: 'HOME' }}>
					<img src={logo} alt="logo" />
				</Link>
				<h1>Gaussian Process Regression - A Tutorial</h1>
			</div>
			<nav className="menu">
				<MenuItem link="TREE" icon={Tree} label="Contents" />
				<MenuItem link="SETTINGS" icon={Cog} label="Settings" />
				<MenuItem link="ABOUT" icon={Info} label="About" />
			</nav>
		</div>
	</header>
)