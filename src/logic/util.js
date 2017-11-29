// deepClone gives a clone of an object, where every sub-object is also cloned.
export function deepClone(obj) {
	return JSON.parse(JSON.stringify(obj))
}