import React from 'react'
import Link from 'redux-first-router-link'

const Section = () => {
	return (
		<div>
			<p>Section 1!..</p>
			<p><Link to={{ type: 'CHAPTER', payload: { chapter: 'whatisgpr' } }}>Go to the previous chapter</Link></p>
		</div>
	)
}

export default Section