import { combineReducers, createStore, applyMiddleware } from 'redux'
import { connectRoutes } from 'redux-first-router'
import { composeWithDevTools } from 'redux-devtools-extension'
import reduxThunk from 'redux-thunk'
import createHistory from 'history/createBrowserHistory'

import routes from '../ui/pages'
import * as reducers from './reducers.js'

// Set up the Redux store in the default way.
const history = createHistory()
const router = connectRoutes(history, routes)
const reducer = combineReducers({ location: router.reducer, ...reducers })

const store = createStore(
	reducer,
  composeWithDevTools(router.enhancer, applyMiddleware(router.middleware)),
	applyMiddleware(reduxThunk)
)

export default store
