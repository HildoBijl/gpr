// GaussianProcess represents a Gaussian process and handles all the math related to it.

import math from 'mathjs'

import { applyFunctionToPairs, deepClone, getRange, getMinimum, getMaximum } from '../util.js'
import { logDet, multiplyMatrices, mergeMatrices, arrayAsColumn, arrayAsRow, scalarAsMatrix, choleskyDecomposition, getGaussianRand, getGaussianSampleFromCholesky, removeRow, removeColumn } from '../math.js'
import GaussianDistribution from '../gaussianDistribution.js'
// ToDo: implement getSample with math functions like getRand, cholesky and such.

const randomVectorLength = 15 // The number of numbers in a random vector, used for generating samples.

export default class GaussianProcess {
	/*
	 * constructor creates a GP object. It can take any GP state to set itself up. This GP state contains all data relevant to a GP, but does not have support matrices and such that this GP object will have. Parameters include:
	 * - meanData [object]: see the getMeanFunction for further documentation.
	 * - covarianceData [object]: see the getCovarianceFunction for further documentation.
	 * - measurements [array]: an array of measurements, where each consists of:
	 *   - input [number/array/object]: an input that can be fed to the mean and covariance functions.
	 *   - output [number]: the output for the given input.
	 *   - outputNoise [number]: the variance for the given measurement.
	 */
	constructor(state = {}) {
		// Apply the state that we have been given.
		this.state = {}
		this.applyState(state)
	}

	/*
	 * applyState takes the given GP state and completely builds up this GP object from scratch based on that data. It removes any data that was present previously, so it completely overrides the old GP.
	 */
	applyState(state = {}) {
		// First of all remove all measurements currently present.
		this.removeAllMeasurements()

		// Apply mean and covariance functions.
		this.applyMeanFunction(state.meanData)
		this.applyCovarianceFunction(state.covarianceData)

		// Add all the measurements given in the state.
		this.state.defaultOutputNoiseVariance = state.defaultOutputNoiseVariance // Store the default output noise, if given.
		if (state.measurements)
			this.addMeasurement(state.measurements)

		// Set number of samples to zero.
		this.setNumSamples(0)

		// TODO: also load all other stuff. When doing this, also add it to the clone function below to be cloned.
	}

	/*
	 * getState returns the state of this GP. It's all the data needed to rebuild the GP from scratch.
	 */
	getState() {
		return this.state
	}

	/*
	 * getClone makes a clone of this GP object. When doing this, it doesn't only copy the state, but also internal matrices and such.
	 */
	getClone() {
		return new this.constructor(deepClone(this.getState()))
	}

	/*
	 * reset erases all measurements that have been added to the Gaussian process, returning it to the state it had just after being initialized.
	 */
	removeAllMeasurements() {
		this.state.measurements = []
		this.Kmm = [] // The covariance matrix for the measurements.
		this.Kn = [] // The covariance matrix, including noise. This is the matrix that is going to be inverted.
		this.Kni = [] // The inverted covariance matrix including noise.
	}

	/*
	 * applyMeanFunction sets up a new mean function for the GP.
	 */
	applyMeanFunction(meanData) {
		this.state.meanData = meanData
		this.meanFunction = meanData ? getMeanFunction(meanData) : getDefaultMeanFunction()
		// ToDo: reevaluate all matrices.
	}

	/*
	 * applyCovarianceFunction sets up a new covariance function for the GP.
	 */
	applyCovarianceFunction(covarianceData) {
		this.state.covarianceData = covarianceData
		this.covarianceFunction = covarianceData ? getCovarianceFunction(covarianceData) : getDefaultCovarianceFunction()
		// ToDo: reevaluate all matrices.
	}

	/* 
	 * getPrediction returns the predicted distribution of the GP for the given test points. Parameters include:
	 * - input [array] is the input-values for which we want to get the prior. (It can also be a number, in which case all the results are numbers too.)
	 * - joint [optional boolean; default false] sets whether we want the outcome to be a joint (multivariate) distribution of all output values, or simply separate individual distributions. The latter is default, as it saves space/time. The first may be used when we require samples from a distribution.
	 * The output is an object containing:
	 * - input [array] is the set of input-values that were given. Nothing is done with them.
	 * - mean [array] is the set of mean output values.
	 * - covariance [matrix] is the covariance matrix for the output values. It's only given when includeCovariance is set to true.
	 * - standardDeviation [array] is the standard deviations for the output values.
	 */
	getPrediction(param) {
		// Check input.
		if (!param)
			throw new Error('Missing parameters object: the getPrior function was called without a parameters object.')
		if (param.input === undefined)
			throw new Error('Missing parameter: no parameter "input" was passed to the getPrior function.')

		// Check if we actually have measurements.
		const n = this.state.measurements.length // Number of measurements.
		if (n === 0)
			return this.getPrior(param)

		// If we do not want a joint distribution, we can simply deal with the points one by one.
		const joint = param.joint && Array.isArray(param.input)
		let input = param.input // Short notation for the test input points.
		if (!joint) {
			if (Array.isArray(input)) {
				// We separately predict each point.
				return input.map(input => this.getPrediction({
					...param,
					input,
				}))
			} else {
				input = [input] // The rest of the script expects the input to be an array.
			}
		}

		// Set up necessary matrices.
		const xm = this.getMeasurementInputs()
		const Kms = applyFunctionToPairs(this.covarianceFunction, xm, input)
		const Kss = applyFunctionToPairs(this.covarianceFunction, input)
		const Ksm = math.transpose(Kms)

		// Calculate inferences.
		const ym = this.getMeasurementOutputs()
		const beta = math.multiply(Ksm, this.Kni) // Ksm/(Kmm + Sn).
		const mean = math.multiply(beta, ym)
		const covariance = math.subtract(Kss, math.multiply(beta, Kms))

		// Set up final result.
		return {
			input: param.input,
			output: (joint ?
				new GaussianDistribution(mean, covariance) :
				new GaussianDistribution(mean[0], covariance[0][0]) // We didn't want a joint distribution, and we also didn't get an array of input points. Just return a single distribution as output.
			),
		}
	}
	// TODO: IMPLEMENT ABOVE FUNCTION THROUGH A WORKER. IT RETURNS A PROMISE FOR THE RESULT.

	/* 
	 * getPrior returns the prior distribution of the GP for the given test points. So that's the distribution when no measurements at all have been added. The set-up is identical as that of getPrediction.
	 */
	getPrior(param) {
		// Check input.
		if (!param)
			throw new Error('Missing parameters object: the getPrior function was called without a parameters object.')
		if (param.input === undefined)
			throw new Error('Missing parameter: no parameter "input" was passed to the getPrior function.')

		// If we do not want a joint distribution, we can simply deal with the points one by one.
		const joint = param.joint && Array.isArray(param.input)
		let input = param.input // Short notation for the test input points.
		if (!joint) {
			if (Array.isArray(input)) {
				// We separately predict each point.
				return input.map(input => this.getPrior({
					...param,
					input,
				}))
			} else {
				input = [input] // The rest of the script expects the input to be an array.
			}
		}

		// Find the prior mean and covariance matrix.
		const mean = input.map(x => this.meanFunction(x))
		const covariance = applyFunctionToPairs(this.covarianceFunction, input)

		// Set up final result.
		return {
			input: param.input,
			output: (joint ?
				new GaussianDistribution(mean, covariance) :
				new GaussianDistribution(mean[0], covariance[0][0]) // We didn't want a joint distribution, and we also didn't get an array of input points. Just return a single distribution as output.
			),
		}
	}
	// TODO IN FUTURE: IMPLEMENT ABOVE FUNCTION THROUGH A WORKER. IT RETURNS A PROMISE FOR THE RESULT.

	/*
	 * Returns the log-likelihood of the measurements. A base-e logarithm is used.
	 */
	getLogLikelihood() {
		// If there are no measurements, we have a likelihood of 1 (100%).
		const n = this.state.measurements.length
		if (n === 0)
			return 1

		// Calculate the log-likelihood.
		const ym = this.getMeasurementOutputs()
		return -0.5 * n * Math.log(2 * Math.PI) - 0.5 * logDet(this.Kn) - 0.5 * math.multiply(math.divide(ym, this.Kn), ym)
	}

	/*
	 * addMeasurement will add a single measurement (when given a measurement object) or multiple measurements (when given an array of objects). A measurement must be an object having an input and an output parameter. The input parameter can be anything, but must be acceptible to the mean/covariance function. The output parameter must be a number. It returns the index of the measurement that was returned, or if an array of measurements is given, an array of the corresponding indices.
	 */
	addMeasurement(measurement) {
		// If no measurement is given, something is wrong.
		if (!measurement)
			throw new Error('Missing measurement: the function addMeasurement was called without a measurement.')

		// If we are given an array of measurements, process them one by one. 
		if (Array.isArray(measurement))
			return measurement.map(m => this.addMeasurement(m))

		// So we have an individual measurement. Verify it.
		if (!measurement.input)
			throw new Error('Missing output: the function addMeasurement was called with a measurement with no output.')
		if (!measurement.output)
			throw new Error('Missing output: the function addMeasurement was called with a measurement with no output.')

		// Process the measurement. This is to ensure that all the measurements are in the same format.
		const processedMeasurement = { input: measurement.input }
		if (measurement.output instanceof GaussianDistribution) {
			if (measurement.output.multivariate)
				throw new Error('Invalid measurement output: the Gaussian Process object was given a measurement with a multivariate Gaussian Distribution output. This is not (yet?) supported. Only univariate distributions are allowed.')
			processedMeasurement.output = measurement.output.mean
			processedMeasurement.outputNoiseVariance = measurement.output.variance
		} else {
			processedMeasurement.output = measurement.output
			if (measurement.outputNoiseVariance)
				processedMeasurement.outputNoiseVariance = measurement.outputNoiseVariance
			else if (this.defaultOutputNoiseVariance === undefined)
				throw new Error('Unknown measurement output noise: the Gaussian Process object was given a measurement, but no outputNoiseVariance parameter was defined, nor did the GP object have a defaultOutputNoiseVariance parameter specified.')
		}

		// Add a column to matrices Kmm and the matrix-to-invert Kn.
		const newColumn = arrayAsColumn(this.state.measurements.map(oldMeasurement => this.covarianceFunction(oldMeasurement.input, measurement.input)))
		const newRow = arrayAsRow(this.state.measurements.map(oldMeasurement => this.covarianceFunction(oldMeasurement.input, measurement.input)))
		const selfVariance = this.covarianceFunction(measurement.input, measurement.input)

		// Update Kmm.
		this.Kmm = mergeMatrices([
			[
				this.Kmm,
				newColumn,
			], [
				newRow,
				scalarAsMatrix(selfVariance),
			],
		])

		// Update Kn.
		const outputVariance = processedMeasurement.outputNoiseVariance || this.state.defaultOutputNoiseVariance
		this.Kn = mergeMatrices([
			[
				this.Kn,
				newColumn,
			], [
				newRow,
				scalarAsMatrix(selfVariance + outputVariance),
			],
		])

		// Update the inverse of Kn.
		if (this.state.measurements.length === 0) {
			this.Kni = scalarAsMatrix(1 / (selfVariance + outputVariance))
		} else {
			const Delta = 1 / ((selfVariance + outputVariance) - multiplyMatrices(newRow, this.Kni, newColumn))
			const rowResult = math.multiply(newRow, this.Kni)
			const columnResult = math.multiply(this.Kni, newColumn)
			this.Kni = mergeMatrices([
				[
					math.add(this.Kni, multiplyMatrices(columnResult, Delta, rowResult)),
					math.multiply(columnResult, -Delta),
				], [
					math.multiply(-Delta, rowResult),
					scalarAsMatrix(Delta),
				],
			])
		}

		// Store the measurement.
		return this.state.measurements.push(processedMeasurement) - 1
	}

	/*
	 * removeMeasurement removes the measurement with the given index. It returns the removed measurement. It cannot be passed multiple indices, because then things get confusing due to changing indices.
	 */
	removeMeasurement(index) {
		// Check the arguments.
		if (!this.state.measurements)
			throw new Error(`Invalid function call: the order was given to remove measurement "${index}", but there are no measurements yet.`)
		if (index < 0 || index >= this.state.measurements.length)
			throw new Error(`Invalid measurement index: the order was given to remove measurement "${index}", but there are only "${this.state.measurements.length}" measurements.`)

		// Verify if this is the last measurement.
		if (this.state.measurements.length === 1) {
			const measurement = this.state.measurements[0]
			this.removeAllMeasurements()
			return measurement
		}

		window.math = math // TODO REMOVE
		window.removeRow = removeRow
		window.removeColumn = removeColumn
		window.mergeMatrices = mergeMatrices
		window.arrayAsColumn = arrayAsColumn
		window.arrayAsRow = arrayAsRow
		window.scalarAsMatrix = scalarAsMatrix

		// We first apply a reverse matrix update to Kni. This uses the theory from https://math.stackexchange.com/questions/1248220/find-the-inverse-of-a-submatrix-of-a-given-matrix.
		let vi = removeRow(this.Kni, index) // Get the row from the inverted matrix.
		const ai = scalarAsMatrix(vi.splice(index, 1)[0]) // Ensure we have the row without the specific element in it.
		vi = arrayAsRow(vi) // Put the array in row matrix form.
		const ui = arrayAsColumn(removeColumn(this.Kni, index)) // Get the column from the inverted matrix.
		let v = removeRow(this.Kn, index) // Do the same for the regular matrix.
		v = arrayAsRow(v)
		const u = arrayAsColumn(removeColumn(this.Kn, index))
		const z = new Array(this.state.measurements.length - 1).fill(0) // An array filled with zeros.
		// We apply KniNew = Kni + [ui, Kni] * [1,0;0,u] * (I - [0,v;1,0]*[ai,ui;vi,Kni]*[1,0;0,u])^{-1} * [0,v;1,0] * [vi; Kni].
		const U = mergeMatrices([[scalarAsMatrix(1), scalarAsMatrix(0)], [arrayAsColumn(z), u]])
		const V = mergeMatrices([[scalarAsMatrix(0), v], [scalarAsMatrix(1), arrayAsRow(z)]])
		this.Kni = math.add(
			this.Kni,
			math.multiply(
				math.multiply(
					math.multiply(
						math.multiply(
							mergeMatrices([[ui, this.Kni]]),
							U
						),
						math.inv(
							math.subtract(
								[[1, 0], [0, 1]],
								math.multiply(
									math.multiply(
										V,
										mergeMatrices([[ai, vi], [ui, this.Kni]])
									),
									U
								)
							)
						)
					),
					V
				),
				mergeMatrices([[vi], [this.Kni]])
			)
		)

		// Remove the measurement from the remaining parameters.
		removeRow(this.Kmm)
		removeColumn(this.Kmm)

		// Return the measurement.
		return this.state.measurements.splice(index, 1)[0]
	}


	/*
	 * setNumSamples sets how many samples should be present in this GP. These are then stored so that, if measurements are added/removed, the samples are still similar.
	 */
	setNumSamples(numSamples) {
		// Ensure that there is a samples array.
		if (!this.state.samples)
			this.state.samples = []

		// Add samples as long as necessary.
		while (this.state.samples.length < numSamples) {
			this.state.samples.push(getGaussianRand(randomVectorLength))
		}

		// Remove samples as long as necessary.
		while (this.state.samples.length > numSamples) {
			this.state.samples.pop()
		}
	}

	/*
	 * refreshSamples changes (remakes) the samples that are present in this GP.
	 */
	refreshSamples() {
		this.state.samples = this.state.samples.map(() => getGaussianRand(randomVectorLength))
	}

	/*
	 * getSamples returns all current samples for the GP. It uses the random vectors stored in the GP (in this.state.samples) to generate them. It does kind of cheat with the math. After all, the math is complex (Cholesky decompositions and such) and only work for a small number of points (up to roughly 20, depending on the circumstances) because otherwise numerical problems occur. To work around this, we only take a sample of a small number of points for our first sample part. Then we take this sample part, add them as measurements to our GP, and find its mean, which is to be considered the actual sample. It's not fully legit, but it comes as close as we can get, and at least it gives a smooth line without numerical problems.
	 */
	getSamples(param) {
		// Check the input.
		if (!param)
			throw new Error('Invalid argument: the getSamples function was called with an invalid or missing argument.')
		if (!Array.isArray(param.input))
			throw new Error('Missing input parameter: the getSamples function was given a parameter that did not have an "input" parameter with all the sample input points.')

		// Generate a Cholesky decomposition for the given input.
		const numPoints = 15 // If this number gets higher, then the Cholesky decomposition is likely to fail.
		const sampleInput = getRange(getMinimum(param.input), getMaximum(param.input), numPoints)
		const predictionPart = this.getPrediction({
			input: sampleInput,
			joint: true,
		})
		const chol = choleskyDecomposition(predictionPart.output.variance)

		// ToDo: just add the measurements once, and only change the output vector with the new samples.

		// For each sample random vector, generate the sample part from the random vector and use it to come up with a full sample.
		const Kni = deepClone(this.Kni) // Store a copy of Kni to prevent drifts due to numerical innacuracies.
		const samples = (this.state.samples || []).map(randomVector => {
			const samplePart = getGaussianSampleFromCholesky(predictionPart.output.mean, chol, randomVector)
			const extraMeasurements = sampleInput.map((input, i) => ({
				input,
				output: samplePart[i],
				outputNoiseVariance: (this.defaultOutputNoiseVariance || 0.1) / 10000,
			}))
			const indices = this.addMeasurement(extraMeasurements)
			const prediction = this.getPrediction({ input: param.input }).map(measurement => measurement.output.mean)
			while (indices.length > 0) // Remove measurements again to ensure we don't mess up the GP.
				this.removeMeasurement(indices.pop())
			return prediction
		})
		this.Kni = Kni // Restore the copied Kni matrix.
		return samples
	}

	/*
	 * getMeasurements returns an array of measurement objects. These measurements should be considered as read-only and not be adjusted, or funny stuff might happen.
	 */
	getMeasurements() {
		return this.state.measurements
	}

	/*
	 * getMeasurementInputs returns an array of the input values of all the given measurements.
	 */
	getMeasurementInputs() {
		return this.state.measurements.map(GaussianProcess.getInputFromMeasurement)
	}

	/*
	 * getMeasurementOutputs returns an array of the output values of all the given measurements.
	 */
	getMeasurementOutputs() {
		return this.state.measurements.map(GaussianProcess.getOutputFromMeasurement)
	}

	// Below are some static functions that are helpful when working with Gaussian Processes and its measurements.

	/*
	 * getInputFromMeasurement takes a measurement object and returns the input value from it.
	 */
	static getInputFromMeasurement(measurement) {
		return measurement.input
	}

	/*
	 * getOutputFromMeasurement takes a measurement object and returns the output value from it.
	 */
	static getOutputFromMeasurement(measurement) {
		return measurement.output
	}

	// TODO: SORT OUT THE FUNCTIONS BELOW.
	/*
		predictFromPreviousPrediction(xs, prediction) {
			// Set up shorter notation.
			const xu = prediction.x
			const muu = prediction.mu
			const Suu = prediction.Sigma
			const lx = this.lx
			const ly = this.ly
	
			// Set up basic matrices.
			const Kuu = covariance(xu, xu, lx, ly)
			const Kus = covariance(xu, xs, lx, ly)
			const Kss = covariance(xs, xs, lx, ly)
			const Ksu = math.transpose(Kus)
	
			// Do the inference thing.
			const beta = math.divide(Ksu,Kuu)
			const mus = math.multiply(beta, muu)
			const Sigma = math.subtract(Kss, math.multiply(math.multiply(beta,math.subtract(Kuu,Suu)), math.transpose(beta)))
			const std = math.diag(Sigma).map(std => Math.sqrt(std))
	
			return {
				x: xs,
				mu: mus,
				Sigma,
				std,
			}
		}
	
		getSample(x, canvas) {
			// Okay, we kind of cheat. Because the math is complex (Cholesky decompositions and such) and only work for a small number of points (up to roughly 21, depending on the circumstances) we only take a sample of a small number of points for our first sample. Then we take this sample, construct a new GP out of it, and find its mean, which is to be considered the actual sample. It's not fully legit, but it comes as close as we can get, and at least it gives a smooth line.
	
			// So, first take a small sample.
			const nSample = 21
			const sampleX = getRange(x[0], x[x.length - 1], nSample)
			const samplePrediction = this.predict(sampleX)
			const sampleY = math.add(samplePrediction.mu, math.multiply(chol(samplePrediction.Sigma), getRand(nSample)))
	
			// Then make a new GP with this sample as "measurements" with very little measurement noise.
			const sampleGP = new GP({
				lx: this.lx,
				ly: this.ly,
				sy: this.ly / 100,
				xm: sampleX,
				ym: sampleY,
			})
			const prediction = sampleGP.predict(x)
			return {
				x,
				y: prediction.mu
			}
		}
	
		plotSample(sample, canvas, color = '#11dd55') {
			// We draw the given sample line.
			const ctx = canvas.getContext('2d')
			ctx.beginPath()
			sample.x.forEach((v, i) => (i === 0 ?
				ctx.moveTo(sample.x[i], canvas.height / 2 - sample.y[i]) :
				ctx.lineTo(sample.x[i], canvas.height / 2 - sample.y[i])
			))
			ctx.strokeStyle = color
			ctx.lineWidth = 3
			ctx.stroke()
		}*/
}

// These are support functions for the Gaussian Process class.

/*
 * getMeanFunction returns a mean function, given an object with data for the mean function. It should get an object with parameters:
 * - type [string]: an indicator of which mean function should be used.
 * - other parameters [varies]: hyperparameters for the given function. Which ones are needed depends on the function used. 
 */
export function getMeanFunction(meanData) {
	if (!meanData.type)
		throw new Error('Missing mean function type: tried to get the mean function, but in the mean function data no function type was given.')

	// Walk through all possible covariance function types and set up a function for the appropriate one.
	switch (meanData.type) {
		/* The zero mean function has no parameter. */
		case 'Zero': {
			// Build and return the mean function.
			return (x) => 0
		}

		/* The constant mean function has a single parameter:
		 * - m [scalar] is the constant mean value.
		 */
		case 'Constant': {
			// Check the parameters.
			if (meanData.m === undefined)
				throw new Error('Invalid mean function parameters: the value of the constant mean "m" was missing.')

			// Build and return the mean function.
			return (x) => meanData.m
		}

		// TODO: ADD MORE MEAN FUNCTIONS.

		default: {
			throw new Error(`Invalid mean function type: tried to get a mean function, but the given type ${meanData.type} is not known.`)
		}
	}
}

/*
 * getDefaultMeanFunction returns the default mean function: the zero mean function.
 */
export function getDefaultMeanFunction() {
	return getMeanFunction({ type: 'Zero' })
}

/*
 * getCovarianceFunction returns a covariance function, given an object with data for the covariance function. It should get an object with parameters:
 * - type [string]: an indicator of which covariance function should be used.
 * - other parameters [varies]: hyperparameters for the given function. Which ones are needed depends on the function used. 
 */
export function getCovarianceFunction(covarianceData) {
	if (!covarianceData.type)
		throw new Error('Missing covariance function type: tried to get the covariance function, but in the covariance function data no function type was given.')

	// Walk through all possible covariance function types and set up a function for the appropriate one.
	switch (covarianceData.type) {
		/* The squared exponential covariance function should have as parameters:
		 * - Vx [scalar (for scalar inputs) or matrix (for vector inputs)] is the variance for the input. So it's the square of the input length scale.
		 * - Vy [scalar] is the prior variance for the output. So it's the square of the output length scale.
		 */
		case 'SquaredExponential': {
			// Check the parameters.
			if (covarianceData.Vx === undefined)
				throw new Error('Invalid covariance function parameters: received no Vx parameter.')
			if (covarianceData.Vy === undefined)
				throw new Error('Invalid covariance function parameters: received no Vy parameter.')
			if (!(covarianceData.Vy > 0))
				throw new Error('Invalid covariance function parameters: the parameter Vy must be positive.')

			// Check if we received Vx as a number (and hence have scalar inputs) or as a matrix (and hence have vector inputs).
			if (Array.isArray(covarianceData.Vx)) {
				const Vxi = math.inv(covarianceData.Vx) // The inverse of the Vx matrix.
				return (x1, x2) => {
					const dx = math.subtract(x1, x2)
					return covarianceData.Vy * Math.exp(-0.5 * multiplyMatrices(dx, Vxi, dx))
				}
			} else {
				return (x1, x2) => covarianceData.Vy * Math.exp(-((x1 - x2) ** 2) / (2 * covarianceData.Vx))
			}
		}

		// TODO: ADD MORE COVARIANCE FUNCTIONS.

		default: {
			throw new Error(`Invalid covariance function type: tried to get a covariance function, but the given type ${covarianceData.type} is not known.`)
		}
	}
}

/*
 * getDefaultCovarianceFunction returns the default covariance function: the squared exponential covariance function with unit parameters.
 */
export function getDefaultCovarianceFunction() {
	return getCovarianceFunction({
		type: 'SquaredExponential',
		Vx: 1 ** 2,
		Vy: 1 ** 2,
	})
}

