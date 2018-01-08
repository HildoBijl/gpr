import React from 'react'
import Link from 'redux-first-router-link'

const Section = () => {
	return (
		<div>
			<p>Section 2...</p>
			<p><Link to={{ type: 'CHAPTER', payload: { chapter: 'whatisgpr', section: 3 } }}>Go to the previous chapter</Link></p>
		</div>
	)
}

export default Section