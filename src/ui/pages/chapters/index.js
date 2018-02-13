import React from 'react'

// Define some size settings.

const size = { // The width and height of chapter blocks inside the content tree. These should match the width and height inside CSS.
	x: 320,
	y: 80,
}

const margin = { // The margins used in horizontal and vertical directions between blocks in the tree. Note that the y-margin may be used twice if there is a horizontal line running between blocks.
	x: 20,
	y: 20,
}
const cornerRadius = 16 // The radius of the corners in the content tree.

// Define all the chapters. There are a few important parameters to define.
// - title is the text shown in the chapter block of the content tree.
// - description is the extra text shown in the content tree when a user clicks on a chapter.
// - sections is an array with section titles, used for navigation purposes.
// - parent is an array of the chapters that need to be learned before you can start this chapter. It is used to draw lines in the content tree.
// - tree is the coordinates of this chapter inside the content tree. The x-coordinate always denotes the middle of the block, while the y-coordinate denotes the top of the block.

const chapters = {}

chapters.whatisgpr = {
	title: 'What is Gaussian process regression?',
	description: (
		<div>
			<p>This opening chapter glances over some of the things you can do with Gaussian process regression. We can approximate functions, find structure in data, make predictions based on previous data, and much more.</p>
			<p>Keep in mind: we're not going to study how any of it works just yet. That's for the later chapters. This chapter is just a sneak peek, but a very important one to start with.</p>
		</div>
	),
	sections: [
		'What is regression?',
		'A distribution over functions',
		'Finding structure in data',
	],
	parents: [],
	position: {
		x: 0,
		y: 0,
	},
}

chapters.fundamentalassumptions = {
	title: 'Fundamental assumptions to describe a distribution over functions',
	description: (
		<div>
			<p>A Gaussian process can be seen as a distribution over functions. But not just any types of functions: only specific types. To get there, we must define which functions we would accept (i.e., consider "likely") and which ones we do not.</p>
			<p>That's what this chapter is about. We're going to start with examining what functions we want to get, and then step by step define their distribution.</p>
		</div>
	),
	sections: [
		'Why make assumptions?',
		'A single value',
		'Two values',
		'Infinitely many values',
	],
	parents: [chapters.whatisgpr],
	position: {
		x: chapters.whatisgpr.position.x,
		y: chapters.whatisgpr.position.y + size.y + margin.y,
	},
}

chapters.samplingfunctions = {
	title: 'Sampling functions from a Gaussian process',
	description: (
		<div>
			<p>One way to look at a Gaussian process is as a distribution over functions. And if it is a distribution, then we can draw samples from this distribution. This is called 'sampling', and in this small add-on chapter we figure out how it works.</p>
		</div>
	),
	parents: [chapters.fundamentalassumptions],
	position: {
		x: chapters.fundamentalassumptions.position.x - (size.x + margin.x),
		y: chapters.fundamentalassumptions.position.y + size.y + 2*margin.y,
	},
}

chapters.addingdata = {
	title: 'Adding measurement data to make predictions',
	description: (
		<div>
			<p>We have defined our distribution over function. The real power of Gaussian process regression comes out when we add measurement data. By only picking the functions from our distribution matching the data, we can make predictions.</p>
			<p>We're going to study the case without measurement noise first. Taking into account noise is just a small extra step, which we take right after. We'll also study various ways to intuitively grasp the concept of Gaussian process regression.</p>
		</div>
	),
	sections: [
		'One measurement, one prediction',
		'Multiple measurements,\n multiple predictions',
		'Measurement noise',
		'An alternative view:\n merging distributions',
	],
	parents: [chapters.fundamentalassumptions],
	position: {
		x: chapters.samplingfunctions.position.x + (size.x + margin.x),
		y: chapters.samplingfunctions.position.y,
	},
}

chapters.lineartransformations = {
	title: 'Linear transformations of a Gaussian process',
	description: (
		<div>
			<p>Functions can be transformed. We can shift them horizontally, vertically, multiply them, and so forth. These are all linear operations. But we can also take their derivatives and integrals, which are also linear operations.</p>
			<p>With a Gaussian process being a distribution over functions, we can do the same to Gaussian processes. How does it affect them? Specifically, how does it affect their mean and covariance functions? That's what we'll study in this add-on chapter.</p>
		</div>
	),
	parents: [chapters.fundamentalassumptions],
	position: {
		x: chapters.addingdata.position.x + (size.x + margin.x),
		y: chapters.addingdata.position.y,
	},
}

chapters.hyperparameters = {
	title: 'Finding length scales: tuning the hyperparameters',
	description: (
		<div>
			<p>Previously, we have assumed that nearby input points result in similar function values. But what does 'nearby' mean? This depends on our length scales, which are part of our set of hyperparameters. We can define these length scales ourselves, but we can also get them from our data.</p>
			<p>The key is studying the so-called likelihood. The likelihood is a measure of how well our measurement data corresponds with our assumptions. By optimizing it, we can automatically find which length scales correspond the best with our measurement data.</p>
		</div>
	),
	parents: [chapters.addingdata],
	position: {
		x: chapters.addingdata.position.x - 3*(size.x + margin.x),
		y: chapters.addingdata.position.y + size.y + 2*margin.y,
	},
}

chapters.covariancefunctions = {
	title: 'Finding structure in data: tuning the covariance function',
	description: (
		<div>
			<p>A Gaussian process can be seen as a distribution over functions. The covariance function describes what kinds of functions we get. So far we have seen one, but there are many more! We will study several, and see how they are useful in describing certain types of data.</p>
			<p>But there's more. By optimizing the likelihood, we can also find which covariance function works well and which one does not. This allows us to automatically tune the covariance function, and hence automatically find structure in our measurement data.</p>
		</div>
	),
	parents: [chapters.hyperparameters],
	position: {
		x: chapters.hyperparameters.position.x,
		y: chapters.hyperparameters.position.y + (size.y + margin.y),
	},
}

chapters.multidimensionalinput = {
	title: 'Approximating functions with multiple inputs',
	description: (
		<div>
			<p>So far we have approximated functions with only a single input and a single output. In real life, many functions have multiple inputs. Gaussian process regression works equally well for those. There are only a few minor differences.</p>
			<p>In this chapter we study exactly what the differences are. We look at how the covariance function changes, what to do with the extra hyperparameters, and most of all how everything is actually still exactly the same.</p>
		</div>
	),
	parents: [chapters.addingdata],
	position: {
		x: chapters.hyperparameters.position.x + (size.x + margin.x),
		y: chapters.hyperparameters.position.y,
	},
}

chapters.multidimensionaloutput = {
	title: 'Approximating functions with multiple outputs',
	description: (
		<div>
			<p>Just like functions can have multiple inputs, they can also have multiple outputs. Of course Gaussian process regression can deal with this too, but there are two ways of doing say. This chapter studies both.</p>
			<p>We first look into a method that takes into account correlations between outputs. This is a straightforward extension, but it does not result in efficient calculations. So instead, we also look into decoupling the outputs, which usually works a lot better.</p>
		</div>
	),
	parents: [chapters.multidimensionalinput],
	position: {
		x: chapters.multidimensionalinput.position.x,
		y: chapters.multidimensionalinput.position.y + (size.y + margin.y),
	},
}

chapters.sparsemethods = {
	title: 'Speeding up the algorithm: applying sparse methods',
	description: (
		<div>
			<p>Gaussian process regression has a cubic runtime. In other words, if we get ten times more measurement data, we need a thousand times more calculation time. This does not scale well. The solution? Sparse methods.</p>
			<p>The main idea is to split the regression step up into two steps. First we find the distribution for certain pre-specified input points. Then we use this to make our predictions. If we then also split up our measurement data in small subgroups, we can save ourselves a lot of computations, for only a minor reduction in accuracy.</p>
		</div>
	),
	parents: [chapters.addingdata],
	position: {
		x: chapters.multidimensionalinput.position.x + (size.x + margin.x),
		y: chapters.multidimensionalinput.position.y,
	},
}

chapters.onlinemethods = {
	title: 'Online learning: adding measurement data as we go',
	description: (
		<div>
			<p>In some applications, you start with all available data. In others, you obtain data as you go. When we get new measurement data, we could of course start all our calculations over from scratch. Or we can incorporate the data in a clever way, and save ourselves a ton of computations.</p>
			<p>Naturally this chapter focuses on the latter idea. For all of the algorithms we have seen so far (both regular and sparse Gaussian process regression) we figure out how to add data on the fly. We especially focus on grasping these ideas in an intuitive way.</p>
		</div>
	),
	parents: [chapters.sparsemethods],
	position: {
		x: chapters.sparsemethods.position.x,
		y: chapters.sparsemethods.position.y + (size.y + margin.y),
	},
}

chapters.stochastictestinputs = {
	title: 'Using stochastic (noisy) test input points',
	description: (
		<div>
			<p>Suppose you're approximating a function. With Gaussian process regression you can, for any given input point, find the posterior distribution of the corresponding function value. But what if you don't exactly know the input you're dealing with? You only know its distribution?</p>
			<p>In this case things become a whole lot more complicated. It requires integrating (marginalizing) over all possible input points. When the input point has a Gaussian distribution, we can analytically find the posterior mean and covariance. This chapter explains how to do that.</p>
		</div>
	),
	parents: [chapters.addingdata],
	position: {
		x: chapters.sparsemethods.position.x + (size.x + margin.x),
		y: chapters.sparsemethods.position.y,
	},
}

chapters.stochasticmeasurementinputs = {
	title: 'Using stochastic (noisy) measurement input points',
	description: (
		<div>
			<p>Suppose we're approximating a function. When measuring this function, there may be noise on the output. But there may just as well be noise on the input point we're trying to apply. When this happens, Gaussian process regression is unable to deal with this.</p>
			<p>This chapter studies the exact problems we run into when dealing with this problem. In addition, we look at a few workarounds. We study a few approximations that allow us to still take into account stochastic measurement input points.</p>
		</div>
	),
	parents: [chapters.stochastictestinputs],
	position: {
		x: chapters.stochastictestinputs.position.x,
		y: chapters.stochastictestinputs.position.y + (size.y + margin.y),
	},
}

chapters.gpoptimization = {
	title: 'Optimizing a Gaussian process: the maximum distribution',
	description: (
		<div>
			<p>A function has a maximum. It may be a local maximum or a global maximum, but there are always peaks. A Gaussian process is a distribution over functions. As such, the maximum of this Gaussian process is not a fixed number. It also has a distribution: the so-called maximum distribution.</p>
			<p>This chapter is about finding that distribution. We start off by finding it through brute-force methods. Subsequently, we look at some more efficient methods, so-called particle methods, that allow us to approximate the maximum distribution.</p>
		</div>
	),
	parents: [chapters.addingdata],
	position: {
		x: chapters.stochastictestinputs.position.x + (size.x + margin.x),
		y: chapters.stochastictestinputs.position.y,
	},
}

chapters.functionoptimization = {
	title: 'Bayesian optimization of unknown functions',
	description: (
		<div>
			<p>Suppose that we have some unknown function. We want to find its maximum, but every measurement is expensive. It's then crucial to do the right measurements, that maximize the amount of information given. This is what Bayesian optimization is all about.</p>
			<p>There are actually two types of optimization problems: error minimization and regret minimization. We study various methods to tackle these problems and look at which method works well for which problem.</p>
		</div>
	),
	parents: [chapters.gpoptimization],
	position: {
		x: chapters.gpoptimization.position.x,
		y: chapters.gpoptimization.position.y + (size.y + margin.y),
	},
}

chapters.measuringlinearrelationships = {
	title: 'Measuring linear relationships between function values',
	description: (
		<div>
			<p>In most applications, when you're trying to approximate a function, you measure actual function values (perhaps with some noise). However, in some applications you instead measure linear relationships between function values. For instance, 'Three times this function value plus two times that function value is eighteen.'</p>
			<p>This chapter studies this exact problem. As it turns out, we can still do regression well enough in such cases. All we need is the appropriate matrix transformations, and everything will work as normal once more.</p>
		</div>
	),
	parents: [chapters.addingdata],
	position: {
		x: chapters.gpoptimization.position.x + (size.x + margin.x),
		y: chapters.gpoptimization.position.y,
	},
}

chapters.sonig = {
	title: 'Efficient online Gaussian process regression with noisy inputs',
	description: (
		<div>
			<p>In previous chapters we have studied Gaussian process regression with noisy inputs, with online data acquisition, and with sparse calculation methods. We can merge these three ideas together in a single algorithm. This chapter does exactly that.</p>
			<p>The key here is to make various approximating assumptions. One by one we will look at the assumptions that we make, and figure out why they are necessary. Then we put everything together into the so-called SONIG algorithm.</p>
		</div>
	),
	parents: [chapters.multidimensionaloutput, chapters.onlinemethods, chapters.stochasticmeasurementinputs],
	position: {
		x: chapters.onlinemethods.position.x,
		y: chapters.onlinemethods.position.y + size.y + 2*margin.y,
	},
}

chapters.sisonig = {
	title: 'Online system identification through the SONIG algorithm',
	description: (
		<div>
			<p>Previously we studied the SONIG algorithm, which can apply efficient online Gaussian process regression with noisy input data. This chapter extends that method in various ways, allowing it to be applied to online System Identification applications.</p>
			<p>The key to doing so is constantly keeping track of the variances and covariances of all quantities. If we do that, we can update our models as we get new data to continuously refine our estimates. This has proven to result in very accurate System Identification results for various applications.</p>
		</div>
	),
	parents: [chapters.sonig],
	position: {
		x: chapters.sonig.position.x,
		y: chapters.sonig.position.y + (size.y + margin.y),
	},
}

// Walk through the chapters, adding some extra data.
for (let name in chapters) {
	// Add the chapter names to the chapters, so they know what their names are.
	const chapter = chapters[name]
	chapter.name = name

	// Make sure that the chapter has a children array, and ensure each block is aware of its children.
	if (!chapter.children)
		chapter.children = []
	chapter.parents.forEach(parent => {
		if (!parent.children)
			parent.children = []
		parent.children.push(chapter)
	})
}

// Turn the chapters into an array, which allows us to display them with React more easily.
const chapterArray = []
for (let name in chapters) {
	chapterArray.push(chapters[name])
}

// Calculate the tree bounding rectangle.
const initialChapter = chapterArray[0]
const left = chapterArray.reduce((min, chapter) => Math.min(min, chapter.position.x - size.x/2), initialChapter.position.x)
const right = chapterArray.reduce((max, chapter) => Math.max(max, chapter.position.x + size.x/2), initialChapter.position.x)
const top = chapterArray.reduce((min, chapter) => Math.min(min, chapter.position.y), initialChapter.position.y)
const bottom = chapterArray.reduce((max, chapter) => Math.max(max, chapter.position.y + size.y), initialChapter.position.y)
const treeRect = {
	left,
	right,
	top,
	bottom,
	width: right - left,
	height: bottom - top,
}

// Export important parameters.
export default chapters
export { size, margin, chapterArray, treeRect }

// getTreeLine returns an SVG path from one (parent) chapter to another (child) chapter.
export function getTreeLine(parent, child) {
	// Check if the blocks are aligned.
	if (parent.position.x === child.position.x)
		return <line className="treeLine" key={parent.name+'-'+child.name} x1={parent.position.x} y1={parent.position.y + size.y} x2={child.position.x} y2={child.position.y} />
	
	// Blocks are not aligned. We need to make arcs in the line.
	const direction = (child.position.x > parent.position.x ? 1 : -1)
	return <path className="treeLine" key={parent.name+'-'+child.name} d={`
		M${parent.position.x} ${parent.position.y + size.y}
		v${margin.y - cornerRadius}
		a${cornerRadius} ${cornerRadius} 0 0 ${direction === 1 ? 0 : 1} ${cornerRadius*direction} ${cornerRadius}
		h${child.position.x - parent.position.x - 2*cornerRadius*direction}
		a${cornerRadius} ${cornerRadius} 0 0 ${direction === 1 ? 1 : 0} ${cornerRadius*direction} ${cornerRadius}
		V${child.position.y}
	`} />
}
