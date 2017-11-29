import '../../shared/reset.css'
import '../../shared/general.css'
import './App.css'

import React from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'

import Header from '../Header/Header.js'
import Page from '../Page/Page.js'

const App = (props) => (
  <div className={classnames('app', props.theme)}>
    <Header />
    <Page />
  </div>
)

const stateMap = (state) => ({
  theme: state.settings.theme
})
export default connect(stateMap)(App)