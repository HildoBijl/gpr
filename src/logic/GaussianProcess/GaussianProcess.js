// GaussianProcess represents a Gaussian process and handles all the math related to it.

import math from 'mathjs'

import { applyFunctionToPairs } from '../util.js'
import { logDet, multiplyMatrices, mergeMatrices, arrayAsColumn, arrayAsRow, scalarAsMatrix } from '../math.js'
import GaussianDistribution from '../gaussianDistribution.js'
// ToDo: implement getSample with math functions like getRand, cholesky and such.

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
		this.applyState(state)
	}

	/*
	 * applyState takes the given GP state and completely builds up this GP object from scratch based on that data. It removes any data that was present previously, so it completely overrides the old GP.
	 */
	applyState(state = {}) {
		window.math = math // TODO REMOVE
		// First of all remove all measurements currently present.
		this.removeAllMeasurements()

		// Apply mean and covariance functions.
		this.applyMeanFunction(state.meanData)
		this.applyCovarianceFunction(state.covarianceData)

		// Add all the measurements given in the state.
		this.defaultOutputNoiseVariance = state.defaultOutputNoiseVariance // Store the default output noise, if given.
		if (state.measurements)
			this.addMeasurement(state.measurements)

		// TODO: also load all other stuff.
	}

	/*
	 * reset erases all measurements that have been added to the Gaussian process, returning it to the state it had just after being initialized.
	 */
	removeAllMeasurements() {
		this.measurements = []
		this.Kmm = [] // The covariance matrix for the measurements.
		this.Kn = [] // The covariance matrix, including noise. This is the matrix that is going to be inverted.
		this.Kni = [] // The inverted covariance matrix including noise.
	}

	/*
	 * applyMeanFunction sets up a new mean function for the GP.
	 */
	applyMeanFunction(meanData) {
		this.meanData = meanData
		this.meanFunction = meanData ? getMeanFunction(meanData) : getDefaultMeanFunction()
		// ToDo: reevaluate all matrices.
	}

	/*
	 * applyCovarianceFunction sets up a new covariance function for the GP.
	 */
	applyCovarianceFunction(covarianceData) {
		this.covarianceData = covarianceData
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
		const n = this.measurements.length // Number of measurements.
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
		const n = this.measurements.length
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

		// Extract output noise (variance).
		let outputVariance
		if (measurement.output instanceof GaussianDistribution) {
			if (measurement.output.multivariate)
				throw new Error('Invalid measurement output: the Gaussian Process object was given a measurement with a multivariate Gaussian Distribution output. This is not (yet?) supported. Only univariate distributions are allowed.')
			outputVariance = measurement.output.variance
		} else {
			if (measurement.outputNoiseVariance)
				outputVariance = measurement.outputNoiseVariance
			else if (this.defaultOutputNoiseVariance)
				outputVariance = this.defaultOutputNoiseVariance
			else
				throw new Error('Unknown measurement output noise: the Gaussian Process object was given a measurement, but no outputNoiseVariance parameter was defined, nor did the GP object have a defaultOutputNoiseVariance parameter specified.')
		}

		// Add a column to matrices Kmm and the matrix-to-invert Kn.
		const newColumn = arrayAsColumn(this.measurements.map(oldMeasurement => this.covarianceFunction(oldMeasurement.input, measurement.input)))
		const newRow = arrayAsRow(this.measurements.map(oldMeasurement => this.covarianceFunction(oldMeasurement.input, measurement.input)))
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
		if (this.measurements.length === 0) {
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
		return this.measurements.push(measurement) - 1
	}

	/*
	 * getMeasurementInputs returns an array of the input values of all the given measurements.
	 */
	getMeasurementInputs() {
		return this.measurements.map(GaussianProcess.getInputFromMeasurement)
	}

	/*
	 * getMeasurementOutputs returns an array of the output values of all the given measurements.
	 */
	getMeasurementOutputs() {
		return this.measurements.map(GaussianProcess.getOutputFromMeasurement)
	}

	// Below are some static functions that are helpful when working with Gaussian Processes and its measurements.

	/*
	 * getInputFromMeasurement takes a measurement object and returns the input value from it.
	 */
	static getInputFromMeasurement(measurement) {
		return measurement.input
	}

	/*
	 * getOutputFromMeasurement takes a measurement object and returns the output value from it. We need a function, because the output can be either a number or a distribution object.
	 */
	static getOutputFromMeasurement(measurement) {
		if (measurement.output instanceof GaussianDistribution)
			return measurement.output.mean
		else
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
	return getMeanFunction({ type: 'Zero'	})
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

