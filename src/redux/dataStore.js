import { connect } from 'react-redux'

import { deepMerge } from '../logic/util.js'
import { gpReducer, getGPModifierFunctions } from '../logic/GaussianProcess/reduxGP.js'

// Define keys that may not be used in the data store.
const invalidKeys = {
	set: true,
	reset: true,
	delete: true,
}

/*
 * First, set up the actions changing things.
 */

const actions = {
	setData: (id, data) => ({
		type: 'SetData',
		id,
		data,
	}),
	resetData: (id, data) => ({
		type: 'ResetData',
		id,
		data,
	}),
	deleteKey: (id, key) => ({
		type: 'DeleteKey',
		id,
		key, // May also be an array.
	})
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

const initialState = {} // This may be expanded by functions connecting to the datastore.

export function reducer(state = initialState, action) {
	// Check if there was an external source for this action.
	if (action.dataStoreSource) {
		// So we have an external reducer. Clone (or create if not available) the appropriate objects, as is usual for redux.
		if (!state[action.id])
			state[action.id] = {} // No object is available. Make a new one.
		else
			state = { ...state } // An object is available. To ensure that it's not connected to the old one, clone it.
		if (!state[action.id][action.name])
			state[action.id][action.name] = {} // No object is available. Make a new one.
		else
			state[action.id] = { ...state[action.id] } // An object is available. To ensure that it's not connected to the old one, clone it.

		// Check which external reducer we will use.
		const source = action.dataStoreSource
		switch (source) {
			case 'gp': {
				state[action.id][action.name] = gpReducer(state[action.id][action.name], action)
				return state
			}

			default: {
				throw new Error(`Unknown data store source: an action was given to the data store from an unknown source "${source}".`)
			}
		}
	}
	
	// Check if the action was one of our regular actions.
	switch (action.type) {

		// SetData will set certain key-value pairs in the data storage. Other key-value pairs will be unmodified.
		case 'SetData': {
			const id = action.id
			verifyKeys(Object.keys(action.data))
			return {
				...state,
				[id]: {
					...state[id],
					...action.data,
				}
			}
		}

		// ResetData will override the full data storage with the given data.
		case 'ResetData': {
			const id = action.id
			verifyKeys(Object.keys(action.data))
			return {
				...state,
				[id]: action.data,
			}
		}

		case 'DeleteKey': {
			state = {...state}
			const keysToDelete = (Array.isArray(action.key) ? action.key : [action.key])
			verifyKeys(keysToDelete)
			keysToDelete.forEach(key => {
				delete state[action.id][key]
			})
			return state
		}

		default: {
			return state
		}
	}
}

/*
 * Third, set up getter functions for various useful parameters.
 */

/* connectToData is used to connect a class to a part of the data store. Parameters given should be:
 * - The class to be connected. This should be a Javascript class.
 * - The ID of the data store. This can also be an array of IDs, in case you want to connect to multiple datastores.
 * - Various options. 
 *   x You can add an initial state by putting { initial: { key1: "value1", key2: "value2" }}.
 *   x You can add GP support in three ways: use { gp: true } to name the gp "gp" (default), use { gp: 'SomeName' } to name the gp "SomeName", or use { gp: ['Name1','Name2'] } to have multiple GPs with different names. It is also possible (and recommended) to add an initial GP state. This is done through the above "initial" option. So you can use { initial: { SomeName: { covarianceData: ..., ... }}}.
 * If you use multiple IDs (for example 'plotOne', 'graphTwo', etc.) then your options object should not be like the above. Instead, it should have the same keys as the IDs given, { plotOne: { gp: true, ... }, graphTwo: { initial: { ... }, ... }}, where each sub-object would constitute a regular options object.
 * After connection, the class can access the data from the data store through either (when a single id is given) this.props.data[key] or (when an array of ids is given) this.props.data[id][key].
 */
export function connectToData(Class, id, options = {}) {
	if (!id)
		throw new Error('Missing ID: no ID was given to the connectToData function.')

	// How we do this depends on whether id is a string or an array. If it's a string, we couple the array to a single data store. Otherwise, we couple it to multiple data stores.
	if (typeof id === 'string') {
		// Set up the connection for a single data store. To access them, you need to use this.props.data[key].
		adjustInitialStateFromOptions(id, options)
		const stateMap = (state) => ({
			data: state.dataStore[id],
		})
		const actionMap = (dispatch) => ({
			data: {
				...getModifierFunctions(dispatch, id),
				...getModifierFunctionsFromOptions(options, dispatch, id),
			}
		})
		const mergeProps = (stateProps, actionProps, ownProps) => deepMerge(stateProps, actionProps, ownProps)
		return connect(stateMap, actionMap, mergeProps)(Class)
	} else if (Array.isArray(id)) {
		// Set up the connection for multiple data stores. To access them, you need to use this.props.data[id][key].
		id.forEach(currId => {
			adjustInitialStateFromOptions(currId, options[currId])
		})
		const stateMap = (state) => {
			let data = {}
			id.forEach(currId => {
				data[currId] = state.dataStore[currId]
			})
			return { data }
		}
		const actionMap = (dispatch) => {
			let data = {}
			id.forEach(currId => {
				data[currId] = {
					...getModifierFunctions(dispatch, currId),
					...getModifierFunctionsFromOptions(options[currId] || {}, dispatch, currId),
				}
			})
			return data
		}
		const mergeProps = (stateProps, actionProps, ownProps) => deepMerge(stateProps, actionProps, ownProps)
		return connect(stateMap, actionMap, mergeProps)(Class)
	} else {
		throw new Error('Invalid ID: the ID given to the connectToData function was neither a string nor an array.')
	}
}

// adjustInitialStateFromOptions will look at the options and check if the initial state needs to be adjusted, based on it.
function adjustInitialStateFromOptions(id, options) {
	// Check that an initial parameter is given in the options.
	if (!options.initial)
		return

	// Check that an initial state has not already been defined for this ID. That's not allowed. (Otherwise it would secretly overwrite earlier data, which is undesirable.)
	if (initialState[id])
		throw new Error(`Double assignment of initial datastore state: the datastore "${id}" was assigned an initial state, but it already had been assigned one previously. Double assigning of an initial state is not allowed.`)
	
	// Store the initial state.
	initialState[id] = options.initial
}

// getModifierFunctions returns all the functions which a class, connected to a data store, gets to adjust the data in the data store.
function getModifierFunctions(dispatch, id) {
	return {
		set: (data) => dispatch(actions.setData(id, data)),
		reset: (data) => dispatch(actions.resetData(id, data)),
		delete: (key) => dispatch(actions.deleteKey(id, key)),
	}
}

// getModifierFunctionsFromOptions returns all the modifier functions (based on the options) that a class, connected to a data store, gets to adjust the data in the data store.
function getModifierFunctionsFromOptions(options, dispatch, id) {
	let functions = {}
	Object.keys(options).forEach(key => {
		switch (key) {
			case 'initial': {
				// The "initial" option (adding an initial state) does not add any modifier functions.
				return
			}

			case 'gp': {
				functions = {
					...functions,
					...getGPModifierFunctions(options[key], dispatch, id),
				}
				return
			}

			default: {
				throw new Error(`Unknown connection option: when connecting to the data store, an option was passed along with key "${key}". This is not a known option.`)
			}
		}
	})
	return functions
}

// verifyKeys is given an array of keys (strings) and checks whether all of them are legal. If any of them is illegal, an exception is thrown.
function verifyKeys(keys) {
	keys.forEach(key => {
		if (invalidKeys[key])
			throw new Error(`Illegal key used: tried to add data to a data store but used the key "${key}" which is reserved.`)
	})
}