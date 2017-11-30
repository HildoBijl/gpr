import './Settings.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import Checkbox from '../../components/Checkbox/Checkbox.js'

import settingsActions from '../../../redux/settings.js'

class Settings extends Component {
  render() {
    return (
      <div className="page settings">
				<h2>Extra content</h2>
				<Checkbox
					label="Include explanations and guides to figures"
					checked={this.props.settings.showFigureGuides}
					changeFunction={(newVal) => this.props.applySettings({ showFigureGuides: newVal })}
				/>
				<Checkbox
					label="Include important equations in the storyline"
					checked={this.props.settings.showEquations}
					changeFunction={(newVal) => this.props.applySettings({ showEquations: newVal })}
				/>
				<p className="addedNote"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i> This requires knowledge of both probability theory and linear algebra</p>
				<Checkbox
					label="Include derivations of equations (under construction)"
					checked={this.props.settings.showDerivations}
					changeFunction={(newVal) => this.props.applySettings({ showDerivations: newVal })}
					disabled={!this.props.settings.showEquations}
				/>
				<h2>Other preferences</h2>
				<Checkbox
					label="Enable this app for offline use"
					checked={this.props.settings.enableOfflineUse}
					changeFunction={(newVal) => this.props.applySettings({ enableOfflineUse: newVal })}
				/>
				<Checkbox
					label="Use alternative dark theme"
					checked={this.props.settings.theme === 'darkTheme'}
					changeFunction={(newVal) => this.props.applySettings({ theme: newVal ? 'darkTheme' : 'lightTheme' })}
				/>
				<Checkbox
					label="Show progress in the content tree"
					checked={this.props.settings.showProgress}
					changeFunction={(newVal) => this.props.applySettings({ showProgress: newVal })}
				/>
      </div>
    )
  }
}

const stateMap = (state) => ({
	settings: state.settings,
})
const actionMap = (dispatch) => ({
	applySettings: (newSettings) => dispatch(settingsActions.applySettings(newSettings)),
})
export default connect(stateMap, actionMap)(Settings)