import './Chapter.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { redirect } from 'redux-first-router'
import Link from 'redux-first-router-link'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Tabs, Tab } from 'material-ui/Tabs';
import SwipeableViews from 'react-swipeable-views';

import Spinner from '../../components/Spinner/Spinner.js'
import chapters from '../chapters'
import { deepClone, bound } from '../../../logic/util.js'

class Chapter extends Component {
	constructor() {
		super()
		this.state = {
			status: [], // An array with loading statuses for each section in the chapter. Elements can be 'loading', 'failed' or 'loaded'.
		}
		this.adjustSection = this.adjustSection.bind(this)
	}
	componentDidMount() {
		this.checkForURLUpdate()
		this.loadSections()
	}
	componentDidUpdate(prevProps) {
		this.checkForURLUpdate()
		if (prevProps.chapter !== this.props.chapter)
			this.loadSections()
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
	loadSections() {
		// Load the sections using dynamic imports. First, check if we have a valid chapter.
		const chapter = chapters[this.props.chapter]
		if (!chapter || !chapter.sections)
			return

		// Initialize relevant arrays and start the loading through the imports.
		this.sections = new Array(chapter.sections.length).fill(undefined)
		this.setState({ status: new Array(chapter.sections.length).fill('loading') })
		this.sections.forEach((_, ind) => {
			const section = ind + 1
			import(`../chapters/${chapter.name}/${section}`)
				.then((module) => {
					// Verify if this is the current chapter. Ignore it if the chapter has already changed.
					if (this.props.chapter !== chapter.name)
						return

					// Store the section and note that it's loaded.
					this.sections[ind] = module.default
					const newStatus = deepClone(this.state.status)
					newStatus[ind] = 'loaded'
					this.setState({ status: newStatus })
				})
				.catch((err) => {
					// Verify if this is the current chapter. Ignore it if the chapter has already changed.
					if (this.props.chapter !== chapter.name)
						return

					// Log the error.
					console.error(`An error occurred while loading the page "${chapter.title}" (section ${section}). Please try refreshing the page. If that does not work, contact us.`)
					console.log(err.message)

					// Note the failure in the Chapter state.
					const newStatus = deepClone(this.state.status)
					newStatus[ind] = 'failed'
					this.setState({ status: newStatus })
				})
		})
	}

	adjustSection(ind) {
		// Go to the section corresponding to the given index. (Section numbers start counting at 1. The index starts counting at 0.)
		const section = ind + 1
		if (section === this.props.section)
			return
		this.props.goToChapterSection({
			chapter: this.props.chapter,
			section,
		})
	}

	render() {
		// Sets up the page and wraps it in a transition group that provides transition animations when switching between different chapters (for instance through direct links).
		return (
			<MuiThemeProvider>
				<ReactCSSTransitionGroup
					component="div"
					className="chapterFader"
					transitionName="chapterFade"
					transitionAppear={true}
					transitionAppearTimeout={200}
					transitionEnterTimeout={200}
					transitionLeaveTimeout={200}
				>
					<div key={this.props.chapter} className="chapterContainer">
						{this.getPage()}
					</div>
				</ReactCSSTransitionGroup>
			</MuiThemeProvider>
		)
	}
	getPage() {
		// Extract and verify the chapter.
		const chapter = chapters[this.props.chapter]
		if (!chapter)
			return this.renderUnknownChapter()
		if (!chapter.sections)
			return this.renderChapterStub()

		// Render the tabs, with each respective section.
		const tabs = (
			<Tabs key="tabs" className="tabs" value={this.props.section - 1} onChange={this.adjustSection}>
				{chapter.sections.map((sectionTitle, ind) => {
					const titleWithEnters = sectionTitle.split('\n').map((item, key) => <span key={key}>{item}<br/></span> )
					const label = (
						<div>
							<span className="title">{titleWithEnters}</span>
							<span className="sectioning">Section {ind + 1}</span>
							<span className="number">{ind + 1}</span>
						</div>
					)
					return <Tab className="tab" key={ind} label={label} value={ind} />
				})}
			</Tabs>
		)

		// Render the sections, each depending on whether it's been loaded already or not.
		const sections = (
			<div key="sections" className="sections">
				<SwipeableViews className="swiper" index={this.props.section - 1} onChangeIndex={this.adjustSection} animateHeight={true}>
					{chapter.sections.map((_, ind) => {
						const status = this.state.status[ind]
						switch (status) {
							case 'loading':
								return this.renderLoadingSection(ind)
							case 'failed':
								return this.renderFailedSection(ind)
							case 'loaded':
								return this.renderLoadedSection(ind)
							default:
								return this.renderLoadingSection(ind) // When the status array has not been updated yet.
						}
					})}
				</SwipeableViews>
			</div>
		)

		return [tabs, sections]
	}
	renderUnknownChapter() {
		return (
			<div className="chapterStub">
				<p>Oops ... the URL you gave does not point to a valid chapter. Try the <Link to={{ type: 'TREE' }}>Contents Tree</Link> to find what you're looking for.</p>
			</div>
		)
	}
	renderChapterStub() {
		const chapter = chapters[this.props.chapter]
		return (
			<div className="chapterStub">
				<p>The chapter <strong>{chapter.title}</strong> is still being written. Check back later for further updates. Until then, head back to the <Link to={{ type: 'TREE' }}>Contents Tree</Link>.</p>
			</div>
		)
	}
	renderLoadingSection(ind) {
		return (
			<div key={ind} className="loading">
				<Spinner />
			</div>
		)
	}
	renderFailedSection(ind) {
		return (
			<div className="chapterStub" key={ind}>
				<p>Oops ... I could not load the relevant section for you. Maybe there's a problem with your internet connection? If not, the problem could also be on my side. Check back later, or drop me a note if the problem persists.</p>
			</div>
		)
	}
	renderLoadedSection(ind) {
		const Section = this.sections[ind]
		return (
			<div key={ind} className="section">
				<Section index={ind} />
				{this.renderNextSectionLink(ind)}
			</div>
		)
	}
	renderNextSectionLink(ind) {
		const chapter = chapters[this.props.chapter]
		const section = ind + 1
		let message
		if (section === chapter.sections.length) {
			message = <p>Congrats! You made it through the full chapter. Head back to the <Link to={{ type: 'TREE' }}>Contents Tree</Link>.</p>
		} else {
			const newSection = section + 1
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
	goToChapterSection: (payload) => dispatch({
		type: 'CHAPTER',
		payload,
	}),
	adjustChapterURL: (payload) => dispatch(redirect({
		type: 'CHAPTER',
		payload,
	})),
})
export default connect(stateMap, actionMap)(Chapter)