import './Chapter.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { redirect } from 'redux-first-router'
import Link from 'redux-first-router-link'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

import chapters from '../chapters'
import { bound } from '../../../logic/util.js'

class Chapter extends Component {
	constructor() {
		super()
		this.state = {
			status: 'loading', // Can be 'loading', 'failed' or 'loaded'. It concerns the current section that should be displayed.
		}
	}
	componentDidMount() {
		this.checkForURLUpdate()
		this.loadSection()
	}
	componentDidUpdate(prevProps) {
		this.checkForURLUpdate()
		if (prevProps.chapter !== this.props.chapter || prevProps.section !== this.props.section)
			this.loadSection()
	}
	checkForURLUpdate() {
		// If the props say we should update the URL, then we do so. This is the case when the URL does not contain a section or the wrong section, and we want to put the currently active section in the URL.
		if (!this.props.updateURL)
			return
		this.props.adjustChapterURL({
			chapter: this.props.chapter,
			section: this.props.section,
		})
	}
	loadSection() {
		// Load the section using dynamic imports.
		const chapter = chapters[this.props.chapter]
		if (!chapter || !this.props.section)
			return

		const section = this.props.section
		import(`../chapters/${chapter.name}/${section}`)
			.then((module) => {
				// Verify if this is the current chapter and section. Ignore it if the chapter name has already changed by now.
				if (this.props.chapter !== chapter.name || this.props.section !== section)
					return

				// Store the section and make it active.
				this.section = module.default
				this.setState({ status: 'loaded' })
			})
			.catch((err) => {
				// Verify if this is the current chapter and section. Ignore it if the chapter name has already changed by now.
				if (this.props.chapter !== chapter.name || this.props.section !== section)
					return

				// Note the failure in the Chapter state, to be displayed.
				this.setState({ status: 'failed' })
			})
	}

	render() {
		// Sets up the page and wraps it in a transition group that provides transition animations.
		// TODO: Figure out whether we need the section in the key too. That is, whether we need transitions between sections of the same chapter too.
		return (
			<ReactCSSTransitionGroup
				component="div"
				className="chapterPage"
				transitionName="chapterFade"
				transitionAppear={true}
				transitionAppearTimeout={200}
				transitionEnterTimeout={200}
				transitionLeaveTimeout={200}
			>
				<div className="content" key={this.props.chapter + '/' + this.props.section}>
					{this.getPage()}
				</div>
			</ReactCSSTransitionGroup>
		)
	}
	getPage() {
		// Extract and verify the chapter.
		const chapter = chapters[this.props.chapter]
		if (!chapter)
			return this.renderUnknownChapter()
		if (!chapter.sections)
			return this.renderChapterStub()

		// Render the appropriate loading status.
		switch (this.state.status) {
			case 'loading':
				return this.renderLoadingSection()
			case 'failed':
				return this.renderFailedSection()
			case 'loaded':
				return this.renderLoadedSection()
			default:
				return this.renderFailedSection() // Should not occur.
		}
	}



	renderUnknownChapter() {
		return <p>Oops ... the URL you gave does not point to a valid chapter. Try the <Link to={{ type: 'TREE' }}>Contents Tree</Link> to find what you're looking for.</p>
	}
	renderChapterStub() {
		const chapter = chapters[this.props.chapter]
		return <p>The chapter <strong>{chapter.title}</strong> is still being written. Check back later for further updates. Until then, head back to the <Link to={{ type: 'TREE' }}>Contents Tree</Link>.</p>
	}
	renderLoadingSection() {
		return <p>Loading section ... todo: add loading screen.</p>
	}
	renderFailedSection() {
		return <p>Oops ... I could not load the relevant section for you. Maybe there's a problem with your internet connection? If not, the problem could also be on my side. Check back later, or drop me a note if the problem persists.</p>
	}
	renderLoadedSection() {
		const chapter = chapters[this.props.chapter]
		return (
			<div>
				<h2>{chapter.sections[this.props.section - 1]}</h2>
				<this.section />
				{this.renderNextSectionLink()}
			</div>
		)
	}
	renderNextSectionLink() {
		const chapter = chapters[this.props.chapter]
		let message
		if (this.props.section === chapter.sections.length) {
			message = <p>Congrats! You made it through the full chapter. Head back to the <Link to={{ type: 'TREE' }}>Contents Tree</Link>.</p>
		} else {
			const newSection = this.props.section + 1
			message = <p>Continue reading the next section, <Link to={{ type: 'CHAPTER', payload: { chapter: this.props.chapter, section: newSection } }}>{chapter.sections[newSection - 1]}</Link></p>
		}

		return (
			<footer>
				<hr />
				{message}
			</footer>
		)
	}
}

const stateMap = (state) => {
	// Determine which payload contains chapter information. When fading out the page, we can use the previous payload.
	let payload = {}
	if (state.location.payload.chapter)
		payload = state.location.payload
	else if (state.location.prev.payload && state.location.prev.payload.chapter)
		payload = state.location.prev.payload

	// TODO: Use local storage to keep track of what the last section was that the user visited. Apply that here.
	const chapter = chapters[payload.chapter]
	let section
	if (chapter && chapter.sections)
		section = bound(payload.section || 1, 1, chapter.sections.length)
	return {
		chapter: payload.chapter,
		section: section, // Assume default section 1 if no section is given.
		updateURL: chapter && payload.section !== section, // Should the section be updated?
	}
}
const actionMap = (dispatch) => ({
	adjustChapterURL: (payload) => dispatch(redirect({
		type: 'CHAPTER',
		payload,
	})),
})
export default connect(stateMap, actionMap)(Chapter)