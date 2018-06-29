const defaultState = {
	mousePosition: { // The position of the mouse. It's tracked, in case the explainer needs to follow the mouse.
		x: 0,
		y: 0,
	}
}

/*
 * First, set up the actions changing things.
 */

const actions = {
	setMousePosition: (position) => ({
		type: 'SetMousePosition',
		position,
	}),
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(state = defaultState, action) {
  switch (action.type) {
		case 'SetMousePosition': {
			return {
				...state,
				mousePosition: action.position,
			}
		}

		default: {
      return state
    }
  }
}

/*
 * Third, set up getter functions for various useful parameters.
 */

