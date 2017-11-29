import './Settings.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import Checkbox from '../../components/Checkbox/Checkbox.js'

import settingsActions from '../../../redux/settings.js'

class Settings extends Component {
  render() {
		console.log(this.props.state)
    return (
      <div className="page settings">
				<Checkbox
					label="Use alternative dark theme"
					checked={this.props.settings.theme === 'darkTheme'}
					changeFunction={(newVal) => this.props.applySettings({ theme: newVal ? 'darkTheme' : 'lightTheme' })}
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