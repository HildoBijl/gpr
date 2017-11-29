import '../../shared/reset.css'
import '../../shared/general.css'
import './App.css'

import React from 'react'

import Header from '../Header/Header.js'
import Page from '../Page/Page.js'

export default () => (
  <div className="app">
    <Header />
    <Page />
  </div>
)