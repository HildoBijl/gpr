import idbKeyval from 'idb-keyval'

import { deepClone } from '../logic/util.js'

const defaultSettings = {
	theme: 'lightTheme',
}

/*
 * First, set up the actions changing things.
 */
const actions = {
	applySettings: (settings) => ({
		type: 'ApplySettings',
		source: 'user',
		settings,
	}),
	loadSettings: () => (
		(dispatch) => idbKeyval.get('settings').then(settings => dispatch({
			type: 'ApplySettings',
			source: 'idb',
			settings,
		}))
	),
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(settings = defaultSettings, action) {
	window.idb = idbKeyval
  switch (action.type) {
		case 'ApplySettings': {
			console.log(action)
			console.log(settings)
			// Merge the given settings into the existing settings.
			const mergedSettings = applySettings(deepClone(settings), action.settings)

			// If the command came from the user (and not from loading the settings) then save the settings.
			if (action.source === 'user')
				idbKeyval.set('settings', mergedSettings)
			
			// Apply the new settings.
			return mergedSettings
		}

		default: {
      return settings
    }
  }
}

// applySettings takes an existing oldSettings object, looks at a newSettings object and copies all known settings from 
function applySettings(oldSettings, newSettings) {
	// If the newSettings object has a different type than what we're used to, throw an error.
	if (typeof(newSettings) !== typeof(oldSettings))
		return console.log('Warning: Cannot apply some settings. Object types do not match to what was given in the default settings.')

	// If the newSettings parameter is not an object, just return it. We are only able to deal with objects.
	if (typeof(newSettings) !== 'object' || Array.isArray(newSettings))
		return newSettings
	
	// Walk through each parameter of the new settings and, if we know it, apply it to the old settings.
	for (var key in newSettings) {
		if (!oldSettings.hasOwnProperty(key)) {
			console.log(`Warning: Cannot apply an unknown setting "${key}".`)
			continue
		}
		oldSettings[key] = applySettings(oldSettings[key], newSettings[key]) // We apply the setting objects recursively.
	}

	// Return the merged setting object.
	return oldSettings
}

/*
 * Third, set up getter functions for various useful parameters.
 */

