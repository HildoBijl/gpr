/*
 * This file expands the GaussianProcess class, adding capabilities for it to connect to the redux data store. By doing this, Gaussian Process data can be stored globally in redux and saved across page changes.
 *
 * There are four parts to this file:
 * - gpActions that specifies what actions there exist in the first place to modify GP state data in the data store.
 * - gpReducer specifying how to modify the state for each of these actions.
 * - getGPModifierFunctions that specifies what methods an outside class can get (by connecting to the data store) to modify the data.
 * - GaussianProcess is an extension of the GaussianProcess class and has support for processing updates sent by redux into the Gaussian Process object. It looks at the last change made and implements it into the GP's own internal data.
 */

import RegularGP from './GaussianProcess.js'

// The gpActions object contains redux functions for actions. It specifies the dataStoreSource to let the data store reducer know it should call the gpReducer.
const gpActions = {
	applyState: (state, updateGP) => ({
		type: 'GPApplyState',
		state,
		updateGP,
	}),
	addMeasurement: (measurement) => ({
		type: 'GPAddMeasurement',
		measurement,
	}),
	removeAllMeasurements: () => ({
		type: 'GPRemoveAllMeasurements',
	}),
	setNumSamples: (numSamples) => ({
		type: 'GPSetNumSamples',
		numSamples,
	}),
	refreshSamples: () => ({
		type: 'GPRefreshSamples',
	}),
	setMeanFunction: (meanData) => ({
		type: 'GPSetMeanFunction',
		meanData,
	}),
	setCovarianceFunction: (covarianceData) => ({
		type: 'GPSetCovarianceFunction',
		covarianceData,
	}),
	setDefaultOutputNoiseVariance: (defaultOutputNoiseVariance) => ({
		type: 'GPSetDefaultOutputNoiseVariance',
		defaultOutputNoiseVariance,
	}),
}

// The gpReducer is the special reducer for actions related to Gaussian Processes. First of all, it keeps track of the last action that has been applied to it, which is added to the state by the 'gpReducer' wrapper function. This function uses the 'defaultReducer' below, which does all the hard work of processing actions into the state.
export function gpReducer(state, action) {
	return {
		...defaultReducer(state, action),
		lastChange: {
			...action,
			timestamp: performance.now(),
		}
	}
}
function defaultReducer(state, action) {
	switch (action.type) {

		case 'GPApplyState': {
			// This is the hard override of the state. We simply save the state and deal with whatever happens.
			state = {
				...action.state,
				isDataAvailable: true, // We note that data is available inside redux, so that if we return to a page and reload a plot with a GP object, the data from redux is used.
			}
			return state
		}

		case 'GPAddMeasurement': {
			state = { ...state }

			// Clone (or create) the measurement array and add the new measurement.
			state.measurements = (state.measurements || []).slice(0)
			state.measurements.push(action.measurement)
			return state
		}

		case 'GPRemoveAllMeasurements': {
			// Implement an empty measurement array.
			return {
				...state,
				measurements: [],
			}
		}

		case 'GPSetNumSamples': {
			// Check the input.
			if (!(action.numSamples >= 0))
				throw new Error(`Invalid number of samples: the setNumSamples function of a Gaussian process was called with the number ${action.numSamples}. This must be a non-negative number.`)

			// Fix the samples array of the state.
			const samples = (state.samples || []).slice(0) // Clone the array.
			while (samples.length < action.numSamples) { // Add samples as long as necessary.
				samples.push(RegularGP.generateSample())
			}
			while (samples.length > action.numSamples) { // Remove samples as long as necessary.
				samples.pop()
			}

			// Set up the new state.
			return {
				...state,
				samples,
			}
		}

		case 'GPRefreshSamples': {
			return {
				...state,
				samples: state.samples.map(() => GaussianProcess.generateSample()),
			}
		}

		case 'GPSetMeanFunction': {
			return {
				...state,
				meanData: action.meanData,
			}
		}

		case 'GPSetCovarianceFunction': {
			return {
				...state,
				covarianceData: action.covarianceData,
			}
		}

		case 'GPSetDefaultOutputNoiseVariance': {
			return {
				...state,
				defaultOutputNoiseVariance: action.defaultOutputNoiseVariance,
			}
		}

		default: {
			throw new Error(`Unknown action type: the GP reducer was called with an unknown action type "${action.type}".`)
		}
	}
}

// getGPModifierFunctions is called when a class is connected to the data store. When the class has told the connector (in the options) that it wants to be connected to a GP, this function is called, and it should return functions to modify said data store.
export function getGPModifierFunctions(options, dispatch, id) {
	// Verify the input.
	let names
	if (options === true) {
		names = ['gp']
	} else if (typeof options === 'string') {
		names = [options]
	} else if (Array.isArray(options)) {
		options.forEach(name => {
			if (typeof name !== 'string')
				throw new Error('Invalid GP name: when passing options to the data store, an option was passed along to set up a data store for a GP. However, the name provided was not a string. GP data store names have to be strings.')
		})
		names = options
	} else {
		throw new Error('Invalid GP option: when passing options to the data store, a GP option was passed along with invalid GP names. The "gp" option should either be true, a string, or an array of strings.')
	}

	// For each GP, add all the actions, so that we can modify the data. We do extend each action by adding important data about which data store we're in.
	let result = {}
	names.forEach(name => {
		const extension = { id, name, dataStoreSource: 'gp' }
		result[name] = {}
		Object.keys(gpActions).forEach(key => {
			result[name][key] = (...args) => dispatch(extendAction(gpActions[key](...args), extension))
		})
	})
	return result
}
function extendAction(action, extension) {
	return {
		...action,
		...extension,
	}
}

export default class GaussianProcess extends RegularGP {
	/*
	 * processUpdate takes the given GP state from redux (passed as parameter), but it only pretty much only looks at the lastChange parameter and implements this last change (if not implemented already). It does do a check: are the state from redux and the internal state still in sync. If not, an error will be thrown. The return value is true or false: true when the update has been processed (and hence a redraw of any potential graph is required) and false when nothing has been done.
	 */
	processUpdate(state) {
		// We do the update based on the last change. First, verify that there is a new change.
		if (!state.lastChange)
			return false // There is no data to update with.
		if (state.lastChange.timestamp === this.lastChangeTimestamp)
			return false // Already processed this update.

		// Figure out what the last change is. This is where the GP implements the change from redux into its own data structure.
		switch (state.lastChange.type) {
			case 'GPApplyState': {
				// This is a hard override of the GP state. Apply the state directly and deal with whatever happens. There is one exception: if the 'updateGP' has been set to false, we don't apply this state. This may happen when the GP object already knows its state, but has merely sent it to redux to be stored. It should then not override the state that it already sent itself.
				if (state.lastChange.updateGP !== false)
					this.applyState(state)
				break
			}

			case 'GPAddMeasurement': {
				// Add the measurement to this GP. That's all.
				this.addMeasurement(state.lastChange.measurement)
				break
			}

			case 'GPRemoveAllMeasurements': {
				// Pass the call on to the GP.
				this.removeAllMeasurements()
				break
			}

			case 'GPSetNumSamples': {
				// Overwrite the samples array and store it in the GP. We have to clone the array: if the GP later decides to add a sample on its own, this state will be affected.
				this.state.samples = state.samples.slice(0)
				break
			}

			case 'GPRefreshSamples': {
				// Overwrite the samples array and store it in the GP. We have to clone the array: if the GP later decides to add a sample on its own, this state will be affected.
				this.state.samples = state.samples.slice(0)
				break
			}

			case 'GPSetMeanFunction': {
				this.setMeanFunction(state.lastChange.meanData)
				break
			}

			case 'GPSetCovarianceFunction': {
				this.setCovarianceFunction(state.lastChange.covarianceData)
				break
			}

			case 'GPSetDefaultOutputNoiseVariance': {
				this.setDefaultOutputNoiseVariance(state.lastChange.defaultOutputNoiseVariance)
				break
			}

			default: {
				throw new Error(`Unknown GP update action: a Gaussian Process update was requested concerning the action "${state.lastChange.type}" but this action is unknown.`)
			}
		}

		// Do a basic check to see if the states still match. If not, something is wrong. For now, throw an error. In the future, it may be better to try to deal with (i.e., apply) the new state regardless.
		if (!this.isStateValid(state))
			console.log('Warning: discrepancy in GP state. The state in the local Guassian Process object was not equal to the state found in the redux data store. Updates may have been missed, or processed incorrectly.')

		// Update the timestamp and end this update.
		this.lastChangeTimestamp = state.lastChange.timestamp
		return true
	}
	
	/*
	 * isStateValid compares the state within this GP object with the given state. It does this mostly in a shallow way: not comparing individual measurements but comparing the number of measurements present. It returns true or false, depending on whether the given (external) state matches the state within this GP object.
	 */
	isStateValid(state) {
		// Compare number of measurements.
		if ((state.measurements || []).length !== (this.state.measurements || []).length)
			return false

		// Compare number of samples.
		if ((state.samples || []).length !== (this.state.samples || []).length)
			return false
		
		// No discrepancies found.
		return true
	}

	// Overwrite the applyState function. When the state is applied, then the last change should also be seen as "processed". This prevents us from processing that last change again.
	applyState(state = {}) {
		super.applyState(state)
		if (state.lastChange)
			this.lastChangeTimestamp = state.lastChange.timestamp
	}
}