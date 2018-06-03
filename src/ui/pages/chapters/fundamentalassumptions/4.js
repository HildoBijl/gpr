import React from 'react'
import Link from 'redux-first-router-link'

import Section from '../../../components/Section/Section.js'

export default class CurrentSection extends Section {
	render() {
		return (
			<div>
				<p>This section is still being written. Check back later to see if it's been added.</p>
				{/* ToDo: first set up a subsection on the joint distribution of two temperatures. Show what examples are. Then do the same for three samples. Finally, let the user tune the number of samples. */}
				<p><Link to={{ type: 'CHAPTER', payload: { chapter: 'whatisgpr' } }}>Go to the previous chapter</Link></p>
			</div>
		)
	}
}