const colors = [
	[221, 34, 34],
	[221, 221, 34],
	[34, 221, 221],
	[221, 34, 221],
	[34, 221, 34],
	[221, 221, 221],
	[221, 136, 34],
	[34, 221, 136],
	[136, 34, 221],
	[136, 221, 34],
	[34, 136, 221],
	[221, 34, 136],
]
export default colors

export function getRandomColor() {
	return colors[Math.floor(Math.random()*colors.length)]
}

export function colorToHex(color) {
	return '#' + color.map(numToHex).join('')
}

export function hexToColor(hex) {
	return hex.slice(1).match(/.{1,2}/g).map(hex => parseInt(hex, 16))
}

export function darken(color, factor) {
	return color.map(num => Math.round(num*(1 - factor)))
}

export function lighten(color, factor) {
	return color.map(num => Math.round(255 - (255 - num)*(1 - factor)))
}

function numToHex(num) {
	return ('0' + (Number(num).toString(16))).slice(-2).toUpperCase()
}