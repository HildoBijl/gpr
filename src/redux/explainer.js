import { connect } from 'react-redux'

const defaultState = {
	mousePosition: { // The position of the mouse. It's tracked, in case the explainer needs to follow the mouse.
		x: 0,
		y: 0,
	},
	position: undefined, // The position where the explainer should be shown. If it is falsy, then the mouse position is used.
	visible: false, // Whether the explainer should be visible or not.
}

/*
 * First, set up the actions changing things.
 */

const actions = {
	set: (data) => {
		const action = {
			...data,
			type: 'SetExplainer',
		}
		if (data.visible === undefined && data.contents !== undefined)
			action.visible = true // Automatically make the explainer visible when contents are added.
		return action
	},
	setMousePosition: (position) => ({
		type: 'SetMousePosition',
		position,
	}),
	setPosition: (position) => ({
		type: 'SetExplainer',
		position,
	}),
	setVisible: (visible) => ({
		type: 'SetExplainer',
		visible,
	}),
	setContents: (contents, visible = true) => ({
		type: 'SetExplainer',
		contents,
		visible,
	}),
	reset: () => ({
		type: 'ResetExplainer',
	}),
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(state = defaultState, action) {
	switch (action.type) {
		case 'SetExplainer': {
			state = { ...state }
			if (action.contents !== undefined)
				state.contents = action.contents
			if (action.position !== undefined)
				state.position = action.position
			if (action.visible !== undefined)
				state.visible = action.visible
			return state
		}

		case 'SetMousePosition': {
			return {
				...state,
				mousePosition: action.position,
			}
		}

		case 'ResetExplainer': {
			return { ...defaultState }
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
			set: (data) => dispatch(actions.set(data)),
			setMousePosition: (position) => dispatch(actions.setMousePosition(position)),
			setPosition: (position) => dispatch(actions.setPosition(position)),
			setVisible: (visible) => dispatch(actions.setVisible(visible)),
			setContents: (contents, visible) => dispatch(actions.setContents(contents, visible)),
			reset: () => dispatch(actions.reset()),
		}
	})
	return connect(stateMap, actionMap)(Class)
}
