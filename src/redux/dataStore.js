import { connect } from 'react-redux'

import { deepMerge } from '../logic/util.js'
import { gpReducer, getGPModifierFunctions } from '../logic/gaussianProcess.js'

// Define keys that may not be used in the data store.
const invalidKeys = {
	set: true,
	add: true,
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
	addData: (id, data) => ({
		type: 'AddData',
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

export function reducer(state = {}, action) {
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

		// AddData will add a set of key-value pairs to the data storage. Other key-value pairs will be unmodified.
		case 'AddData': {
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

		// SetData will override the full data storage with the given data.
		case 'SetData': {
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
 * - The id of the data store. This can also be an array of ids.
 * - Various options.
 *   x You can add GP support by putting { gp: true } or { gp: 'SomeName' } or { gp: ['Name1','Name2'] } as parameters.
 * After connection, the class can access the data from the data store through either (when a single id is given) this.props.data[key] or (when an array of ids is given) this.props.data[id][key].
 */
export function connectToData(Class, id, options = {}) {
	if (!id)
		throw new Error('Missing ID: no ID was given to the connectToData function.')

	// How we do this depends on whether id is a string or an array. If it's a string, we couple the array to a single data store. Otherwise, we couple it to multiple data stores.
	if (typeof id === 'string') {
		// Set up the connection for a single data store. To access them, you need to use this.props.data[key].
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
					...getModifierFunctionsFromOptions(options, dispatch, currId),
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

// getModifierFunctions returns all the functions which a class, connected to a data store, gets to adjust the data in the data store.
function getModifierFunctions(dispatch, id) {
	return {
		set: (data) => dispatch(actions.setData(id, data)),
		add: (data) => dispatch(actions.setData(id, data)),
		delete: (key) => dispatch(actions.deleteKey(id, key)),
	}
}

// getModifierFunctionsFromOptions returns all the modifier functions (based on the options) that a class, connected to a data store, gets to adjust the data in the data store.
function getModifierFunctionsFromOptions(options, dispatch, id) {
	let functions = {}
	Object.keys(options).forEach(key => {
		switch (key) {
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