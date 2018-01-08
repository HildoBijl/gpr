import React from 'react'
import Link from 'redux-first-router-link'

const Section = () => {
	return (
		<div>
			<p>Section 3!...</p>
			<p><Link to={{ type: 'CHAPTER', payload: { chapter: 'fundamentalassumptions', section: 2, } }}>Go to the next chapter</Link></p>
		</div>
	)
}

export default Section