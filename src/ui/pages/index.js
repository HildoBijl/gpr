import Home from './Home/Home.js'
import Tree from './Tree/Tree.js'
import Settings from './Settings/Settings.js'
import About from './About/About.js'
import Chapter from './Chapter/Chapter.js'
import NotFound from './NotFound/NotFound.js'

import chapters from './chapters'

const pages = {
	HOME: {
		component: Home,
		title: 'Gaussian process regression: an interactive book',
		skipPrefix: true, // Do not use a prefix in the <title>.
		path: '/',
	},
	TREE: {
		component: Tree,
		title: 'Content tree',
		path: '/contents',
	},
	SETTINGS: {
		component: Settings,
		title: 'Settings',
		path: '/settings',
	},
	ABOUT: {
		component: About,
		title: 'About this interactive book',
		path: '/about',
	},
	CHAPTER: {
		component: Chapter,
		title: (payload) => `${(chapters[payload.chapter] || { title: 'Unknown chapter'}).title}`,
		path: '/chapter/:chapter/:section?',
	},
	NOTFOUND: {
		component: NotFound,
		title: 'Oops ...',
		path: '/notfound',
	},
}
for (let name in pages) {
	pages[name].name = name
}
export default pages

export function getTitle(page, payload) {
	if (typeof(page.title) === 'function')
		return page.title(payload)
	return page.title
}

// Set up a routes object that can be used by redux-first-router.
const routes = {}
for (let name in pages) {
	if (pages[name].path)
		routes[name] = pages[name].path
}
export { routes }