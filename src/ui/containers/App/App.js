import 'katex/dist/katex.min.css'
import '../../shared/reset.css'
import '../../shared/general.css'
import '../../font-awesome/less/font-awesome.css'
import './App.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'

import Explainer from '../../components/Explainer/Explainer.js'
import Header from '../Header/Header.js'
import Page from '../Page/Page.js'

import settingsActions from '../../../redux/settings.js'

class App extends Component {
  componentWillMount() {
    this.props.loadSettings()
  }
  render() {
    return (
      <div className={classnames('app', this.props.theme)}>
        <Explainer />
        <Header />
        <Page />
      </div>
    )
  }
}

const stateMap = (state) => ({
  theme: state.settings.theme,
})
const actionMap = (dispatch) => ({
  loadSettings: () => dispatch(settingsActions.loadSettings()),
})
export default connect(stateMap, actionMap)(App)