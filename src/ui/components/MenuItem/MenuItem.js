import './MenuItem.css'

import React from 'react'
import { connect } from 'react-redux'
import Link from 'redux-first-router-link'
import classnames from 'classnames'

const MenuItem = (props) => (
	<Link to={{ type: props.link }} className={classnames('menuItem', {'active': props.link === props.currentLink})}>
		<props.icon />
		<div className="label">{props.label}</div>
	</Link>
)

const stateMap = (state) => ({ currentLink: state.location.type })
export default connect(stateMap)(MenuItem)