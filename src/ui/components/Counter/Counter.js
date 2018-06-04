import './Counter.css'

import React from 'react'

export default (props) => {
	return (
		<div className="counter">
			<div className="btn minus" onClick={(event) => props.setValue(props.value - (event.shiftKey ? 10 : 1))} />
			<div className="item count">{props.value}</div>
			<div className="btn plus" onClick={(event) => props.setValue(props.value + (event.shiftKey ? 10 : 1))} />
		</div>
	)
}
