import React from 'react'

// We wrap icons in a div with an icon class for CSS styling.
export default (props) => (
	<div className="icon">
		{props.children}
	</div>
)