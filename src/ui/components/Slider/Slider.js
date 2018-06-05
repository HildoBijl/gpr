import './Slider.css'

import React from 'react'

export default (props) => {
	// ToDo: add javascript on sliding. Also add the definite parameter to the setValue function when the button is released.
	return (
		<div className="slider">
			<div className="track" />
			<div className="clickArea" />
			<div className="slideButton" />
		</div>
	)
}
