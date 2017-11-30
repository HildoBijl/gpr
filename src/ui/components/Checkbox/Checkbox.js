import './Checkbox.css'

import React from 'react'
import classnames from 'classnames'

export default (props) => {
	const onClick = () => props.changeFunction(!props.checked)
	return (
		<div className={classnames('checkboxContainer', props.disabled ? 'disabled' : 'enabled')}>
			<span className={classnames('checkboxField',	{ 'checked': props.checked && !props.disabled })}	onClick={onClick}>
				<span />
				<label />
			</span>
			<span onClick={onClick} className="checkboxLabel">{props.label}</span>
		</div>
	)
}
