import './Settings.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import settingActions from '../../../redux/settings.js'

// import Checkbox from '../../components/Checkbox/Checkbox.js'
// import Radio from '../../components/Radio/Radio.js'

class Settings extends Component {
  render() {
		console.log(this.props.state)
    return (
      <div className="page settings">
				<h1>Settings</h1>
				<p>ToDo: make this page</p>
      </div>
    )
  }
}

const stateMap = (state) => ({
	state
})
const actionMap = (dispatch) => ({

})
export default connect(stateMap, actionMap)(Settings)