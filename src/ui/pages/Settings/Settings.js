import './Settings.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import Checkbox from '../../components/Checkbox/Checkbox.js'

import settingsActions from '../../../redux/settings.js'
import statusActions from '../../../redux/status.js'
import chapters from '../../pages/chapters'

class Settings extends Component {
	componentDidMount() {
		this.checkChapterCaching()
	}
	componentDidUpdate(prevProps) {
		if (this.props.settings.enableOfflineUse && !prevProps.settings.enableOfflineUse)
			this.checkChapterCaching()
	}

	checkChapterCaching() {
		// Do we need a check?
		if (!this.props.settings.enableOfflineUse)
			return // Do nothing if the enableOfflineUse setting is off.
		if (this.props.status.offlineUse !== 'unknown')
			return // Don't check again if we already checked.

		// Walk through all the chapters to load each of their sections.
		this.props.noteOfflineUse('loading')
		const promises = [] // We'll store all the loading promises in this array.
		for (let name in chapters) {
			const chapter = chapters[name]
			if (!chapter.sections)
				continue // Ignore this chapter if no sections have been added to it yet.

			// Load each individual section of the chapter. It will then automatically be cached by the service worker.
			chapter.sections.forEach((_, ind) => {
				promises.push(import(`../../pages/chapters/${name}/${ind + 1}.js`))
			})
		}
		// If all sections have been loaded, or if one section fails, we know the result.
		Promise.all(promises).then(() => {
			this.props.noteOfflineUse('available')
		}).catch((err) => {
			this.props.noteOfflineUse('error')
		})
	}

	render() {
		const settings = this.props.settings
		return (
			<div className="settings">
				<h2>Extra content</h2>
				<Checkbox
					label={[<span>Include figure explanations/guides</span>, <span className="circle figureGuides"></span>]}
					checked={settings.showFigureGuides}
					changeFunction={(newVal) => this.props.applySettings({ showFigureGuides: newVal })}
				/>
				<Checkbox
					label="Include important equations in the storyline"
					checked={settings.showEquations}
					changeFunction={(newVal) => this.props.applySettings({ showEquations: newVal })}
				/>
				<p className="addedNote"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i> This requires knowledge of both probability theory and linear algebra</p>
				<Checkbox
					label="Include derivations of equations (Not available yet)"
					checked={settings.showDerivations}
					changeFunction={(newVal) => this.props.applySettings({ showDerivations: newVal })}
					disabled={true || !settings.showEquations}
				/>
				<h2>Other preferences</h2>
				<Checkbox
					label="Enable this app for offline use"
					checked={settings.enableOfflineUse}
					changeFunction={(newVal) => this.props.applySettings({ enableOfflineUse: newVal })}
				/>
				{this.getOfflineUseNote()}
				<Checkbox
					label="Use alternative dark theme"
					checked={settings.theme === 'darkTheme'}
					changeFunction={(newVal) => this.props.applySettings({ theme: newVal ? 'darkTheme' : 'lightTheme' })}
				/>
				<Checkbox
					label="Show progress in the content tree (Not available yet)"
					checked={settings.showProgress}
					changeFunction={(newVal) => this.props.applySettings({ showProgress: newVal })}
					disabled={true}
				/>
			</div>
		)
	}
	getOfflineUseNote() {
		if (!this.props.settings.enableOfflineUse)
			return <p className="offlineUseStatus empty addedNote">&nbsp;</p>
		switch (this.props.status.offlineUse) {
			case 'loading':
				return <p className="offlineUseStatus notification addedNote"><i className="fa fa-hourglass" aria-hidden="true"></i> Loading all the chapters...</p>
			case 'error':
				return <p className="offlineUseStatus error addedNote"><i className="fa fa-exclamation-circle" aria-hidden="true"></i> Oops ... something went wrong. Try a refresh?</p>
			case 'available':
				return <p className="offlineUseStatus success addedNote"><i className="fa fa-check-circle" aria-hidden="true"></i> All the chapters have been cached.</p>
			default: // Should only briefly be the case, right before we start loading the chapters.
				return <p className="offlineUseStatus empty addedNote">&nbsp;</p>
		}
	}
}

const stateMap = (state) => ({
	settings: state.settings,
	status: state.status,
})
const actionMap = (dispatch) => ({
	applySettings: (newSettings) => dispatch(settingsActions.applySettings(newSettings)),
	noteOfflineUse: (result) => dispatch(statusActions.offlineUse(result)),
})
export default connect(stateMap, actionMap)(Settings)