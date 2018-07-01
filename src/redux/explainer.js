import { connect } from 'react-redux'

const defaultState = {
	mousePosition: { // The position of the mouse. It's tracked, in case the explainer needs to follow the mouse.
		x: 0,
		y: 0,
	},
	visible: false, // Whether the explainer should be visible or not.
}

/*
 * First, set up the actions changing things.
 */

const actions = {
	setMousePosition: (position) => ({
		type: 'SetMousePosition',
		position,
	}),
	setVisible: (visible) => ({
		type: 'SetExplainerVisible',
		visible,
	}),
	setContents: (contents, visible = true) => ({
		type: 'SetExplainerContents',
		contents,
		visible,
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

		case 'SetExplainerVisible': {
			return {
				...state,
				visible: action.visible,
			}
		}

		case 'SetExplainerContents': {
			return {
				...state,
				contents: action.contents,
				visible: action.visible,
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
 
// connectToExplainer is used to give the explainer control functions (setVisible, setContents, etcetera) to the given class. It should only be given the class that is to be connected. After connection, the functions can be accessed through for instance this.props.explainer.setContents(...).
export function connectToExplainer(Class) {
	const stateMap = (state) => ({})
	const actionMap = (dispatch) => ({
		explainer: {
			setVisible: (visible) => dispatch(actions.setVisible(visible)),
			setContents: (contents, visible) => dispatch(actions.setContents(contents, visible)),
		}
	})
	return connect(stateMap, actionMap)(Class)
}
