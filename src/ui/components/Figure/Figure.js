import './Figure.css'

import React from 'react'
import classnames from 'classnames'

export default (props) => {
	const section = props.section
	section.counters.figure++
	return (
		<div className="figure">
			<div className="plots">
				{props.children}
			</div>
			<span className="figureCounter">Figure {section.number}.{section.counters.figure}</span>
		</div>
	)
}
