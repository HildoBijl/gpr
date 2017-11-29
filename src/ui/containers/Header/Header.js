import './Header.css'

import React from 'react'
import { connect } from 'react-redux'

import logo from '../../../logo.svg'

export default () => (
	<header className="header">
		<img src={logo} className="App-logo" alt="logo" />
		<h1 className="App-title">Welcome to React</h1>
	</header>
)