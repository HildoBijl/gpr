// The Eq object represents an inline math equation. It is equivalent to <Equation inline={true} ... > ... </Equation>. If the inline property is manually overwritten and set to false (or falsy) then it will NOT be an inline equation but a block equation.

import React from 'react'
import Equation from './Equation.js'

const Eq = (props) => <Equation inline={true} {...props} />
export default Eq