import idbKeyval from 'idb-keyval'

const defaultSettings = {
	theme: 'lightTheme',
}

/*
 * First, set up the actions changing things.
 */

const actions = {
	// TODO
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(settings = defaultSettings, action) {
  switch (action.type) {

		// case 'TODO': {
		// 	return {
		// 		...settings,
		// 		newSetting: false,
		// 	}
		// }

		default: {
      return settings
    }
  }
}

/*
 * Third, set up getter functions for various useful parameters.
 */

