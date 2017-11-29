import './Checkbox.css'

import React from 'react'
import classnames from 'classnames'

export default (props) => {
	const className = classnames('checkboxField', { 'checked': props.checked })
	const onClick = () => props.changeFunction(!props.checked)
	return (
		<div>
			<span className={className}	onClick={onClick}>
				<span />
				<label />
			</span>
			<span onClick={onClick}>{props.label}</span>
		</div>
	)
}
