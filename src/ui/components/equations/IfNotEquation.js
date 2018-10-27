// IfNotEquation is a wrapper that connects to the app settings. If equations are shown, it hides itself. Otherwise it shows itself. It's the opposite of IfEquation.

import { connect } from 'react-redux'

const IfNotEquation = (props) => {
	if (!props.display)
		return null
	return props.children
}
const stateMap = (state) => ({
	display: !state.settings.showEquations,
})
export default connect(stateMap)(IfNotEquation)