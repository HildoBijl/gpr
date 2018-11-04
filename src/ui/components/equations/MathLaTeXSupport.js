// This file contains a large variety of Javascript functions to support making LaTeX equations in React. They are all exported in one big useful object.

const m = {
	frac: (num, den) => `\\frac{${num}}{${den}}`,
	exp: (exponent, exponential) => `${exponent}^{${exponential}}`,
	bmatrix: (arr) => '\\begin{bmatrix}'
		+ arr.map(line => line.join(' & ')).join(' \\\\ ')
		+ '\\end{bmatrix}',
}
export default m