import './Settings.css'

import React from 'react'
import { connect } from 'react-redux'

import Checkbox from '../../components/Checkbox/Checkbox.js'

import settingsActions from '../../../redux/settings.js'

const Settings = (props) => (
	<div className="page settings">
		<h2>Extra content</h2>
		<Checkbox
			label="Include explanations and guides to figures"
			checked={props.settings.showFigureGuides}
			changeFunction={(newVal) => props.applySettings({ showFigureGuides: newVal })}
		/>
		<Checkbox
			label="Include important equations in the storyline"
			checked={props.settings.showEquations}
			changeFunction={(newVal) => props.applySettings({ showEquations: newVal })}
		/>
		<p className="addedNote"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i> This requires knowledge of both probability theory and linear algebra</p>
		<Checkbox
			label="Include derivations of equations (will be added later)"
			checked={props.settings.showDerivations}
			changeFunction={(newVal) => props.applySettings({ showDerivations: newVal })}
			disabled={!props.settings.showEquations}
		/>
		<h2>Other preferences</h2>
		<Checkbox
			label="Enable this app for offline use"
			checked={props.settings.enableOfflineUse}
			changeFunction={(newVal) => props.applySettings({ enableOfflineUse: newVal })}
		/>
		<Checkbox
			label="Use alternative dark theme"
			checked={props.settings.theme === 'darkTheme'}
			changeFunction={(newVal) => props.applySettings({ theme: newVal ? 'darkTheme' : 'lightTheme' })}
		/>
		<Checkbox
			label="Show progress in the content tree"
			checked={props.settings.showProgress}
			changeFunction={(newVal) => props.applySettings({ showProgress: newVal })}
		/>
	</div>
)

const stateMap = (state) => ({
	settings: state.settings,
})
const actionMap = (dispatch) => ({
	applySettings: (newSettings) => dispatch(settingsActions.applySettings(newSettings)),
})
export default connect(stateMap, actionMap)(Settings)