import { deepClone } from '../logic/util.js'

const defaultStatus = {
	offlineUse: 'unknown', // Can be 'unknown', 'loading', 'error' or 'available'.
}

/*
 * First, set up the actions changing things.
 */

const actions = {
	offlineUse: (result) => ({
		type: 'OfflineUseUpdate',
		result,
	}),
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(status = defaultStatus, action) {
	const originalStatus = status
	status = deepClone(status)
  switch (action.type) {
		case 'OfflineUseUpdate': {
			status.offlineUse = action.result
			return status
		}

		default: {
      return originalStatus
    }
  }
}

/*
 * Third, set up getter functions for various useful parameters.
 */

