// IfEquation is a wrapper that connects to the app settings. If equations are shown, it shows itself. Otherwise it hides itself. It's the opposite of IfNotEquation.

import { connect } from 'react-redux'

const IfEquation = (props) => {
	if (!props.display)
		return null
	return props.children
}
const stateMap = (state) => ({
	display: state.settings.showEquations,
})
export default connect(stateMap)(IfEquation)