import './Figure.css'

import React from 'react'
import classnames from 'classnames'

export default (props) => {
	if (!props.section)
		throw new Error('Missing section: a figure must be told which section it belongs to. Provide a section object along with the figure.')
	const section = props.section
	section.counters.figure++
	return (
		<div className="figure">
			<div className="subFigures">
				{props.children}
			</div>
			<span className="figureCounter">Figure {section.number}.{section.counters.figure}</span>
		</div>
	)
}

export const SubFigure = (props) => {
	let ratio = 0.75
	if (props.width && props.height)
		ratio = props.height / props.width
	return (
		<div className={classnames(
			'subFigure',
			props.className,
		)}>
			{props.title ? <div className="title">{props.title}</div> : ''}
			<div className="subFigureInner" style={{'paddingBottom': `${ratio*100}%`}}>
				{props.children}
			</div>
		</div>
	)
}