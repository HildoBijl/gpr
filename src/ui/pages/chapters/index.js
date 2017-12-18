import React from 'react'

// Define the width and height of chapter blocks inside the content tree. These should match the width and height inside CSS.
const size = {
	x: 320,
	y: 80,
}
// Define the margins used in horizontal and vertical directions between blocks in the tree. Note that the y-margin may be used twice if there is a horizontal line running between blocks.
const margin = {
	x: 20,
	y: 20,
}

// Define all the chapters. There are a few important parameters to define.
// - title is the text shown in the chapter block of the content tree.
// - description is the extra text shown in the content tree when a user clicks on a chapter.
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
	parents: [],
	tree: {
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
	parents: [chapters.whatisgpr],
	tree: {
		x: chapters.whatisgpr.tree.x,
		y: chapters.whatisgpr.tree.y + size.y + margin.y,
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
	parents: [chapters.fundamentalassumptions],
	tree: {
		x: chapters.fundamentalassumptions.tree.x,
		y: chapters.fundamentalassumptions.tree.y + size.y + 2*margin.y,
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
	tree: {
		x: chapters.addingdata.tree.x - (size.x + margin.x),
		y: chapters.addingdata.tree.y,
	},
}

chapters.lineartransformations = {
	title: 'Linear transformations of a Gaussian process',
	description: (
		<div>
			<p>Function can be transformed. We can shift them horizontally, vertically, multiply them, and so forth. But we can also take their derivatives and integrals. Those are in fact also linear operations.</p>
			<p>With a Gaussian process being a distribution over functions, we can do the same to Gaussian processes. How does it affect them? Specifically, how does it affect their mean and covariance functions? That's what we'll study in this add-on chapter.</p>
		</div>
	),
	parents: [chapters.fundamentalassumptions],
	tree: {
		x: chapters.addingdata.tree.x + (size.x + margin.x),
		y: chapters.addingdata.tree.y,
	},
}

chapters.hyperparameters = {
	title: 'Finding length scales: tuning the hyperparameters',
	description: (
		<div>
			<p>Previously, we have assumed that nearby input points result in similar function values. But what does 'nearby' mean? This depends on our length scales, which are part of our set of hyperparameters. We can define these length scales ourselves, but we can also get them from our data.</p>
			<p>The key is studying the so-called likelihood. The likelihood is a measure of how well our measurement data corresponds with out assumptions. By optimizing it, we can automatically find which length scales correspond the best with our measurement data.</p>
		</div>
	),
	parents: [chapters.addingdata],
	tree: {
		x: chapters.addingdata.tree.x - 3*(size.x + margin.x),
		y: chapters.addingdata.tree.y + size.y + 2*margin.y,
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
	tree: {
		x: chapters.hyperparameters.tree.x,
		y: chapters.hyperparameters.tree.y + (size.y + margin.y),
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
	tree: {
		x: chapters.hyperparameters.tree.x + (size.x + margin.x),
		y: chapters.hyperparameters.tree.y,
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
	tree: {
		x: chapters.multidimensionalinput.tree.x,
		y: chapters.multidimensionalinput.tree.y + (size.y + margin.y),
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
	tree: {
		x: chapters.multidimensionalinput.tree.x + (size.x + margin.x),
		y: chapters.multidimensionalinput.tree.y,
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
	tree: {
		x: chapters.sparsemethods.tree.x,
		y: chapters.sparsemethods.tree.y + (size.y + margin.y),
	},
}

chapters.stochastictestinputs = {
	title: 'Using stochastic (noisy) test input points',
	description: (
		<div>
			<p></p>
			<p></p>
		</div>
	),
	parents: [chapters.addingdata],
	tree: {
		x: chapters.sparsemethods.tree.x + (size.x + margin.x),
		y: chapters.sparsemethods.tree.y,
	},
}

chapters.stochasticmeasurementinputs = {
	title: 'Using stochastic (noisy) measurement input points',
	description: (
		<div>
			<p></p>
			<p></p>
		</div>
	),
	parents: [chapters.stochastictestinputs],
	tree: {
		x: chapters.stochastictestinputs.tree.x,
		y: chapters.stochastictestinputs.tree.y + (size.y + margin.y),
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
	tree: {
		x: chapters.stochastictestinputs.tree.x + (size.x + margin.x),
		y: chapters.stochastictestinputs.tree.y,
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
	tree: {
		x: chapters.gpoptimization.tree.x,
		y: chapters.gpoptimization.tree.y + (size.y + margin.y),
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
	tree: {
		x: chapters.gpoptimization.tree.x + (size.x + margin.x),
		y: chapters.gpoptimization.tree.y,
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
	tree: {
		x: chapters.onlinemethods.tree.x,
		y: chapters.onlinemethods.tree.y + size.y + 2*margin.y,
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
	tree: {
		x: chapters.sonig.tree.x,
		y: chapters.sonig.tree.y + (size.y + margin.y),
	},
}

// Walk through the chapters, adding some extra data.
for (var chapterName in chapters) {
	// Add the chapter names to the chapters, so they know what their names are.
	const chapter = chapters[chapterName]
	chapter.name = chapterName

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
for (var name in chapters) {
	chapterArray.push(chapters[name])
}

// Calculate the tree bounding rectangle.
const initialChapter = chapterArray[0]
const left = chapterArray.reduce((min, chapter) => Math.min(min, chapter.tree.x - size.x/2), initialChapter.tree.x)
const right = chapterArray.reduce((max, chapter) => Math.max(max, chapter.tree.x + size.x/2), initialChapter.tree.x)
const top = chapterArray.reduce((min, chapter) => Math.min(min, chapter.tree.y), initialChapter.tree.y)
const bottom = chapterArray.reduce((max, chapter) => Math.max(max, chapter.tree.y + size.y), initialChapter.tree.y)
const treeRect = {
	left,
	right,
	top,
	bottom,
	width: right - left,
	height: bottom - top,
}

export default chapters
export { size, margin, chapterArray, treeRect }