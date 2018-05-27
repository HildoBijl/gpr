// GaussianDistribution represents (guess what) a Gaussian distribution! It is initialized with a mean and (co)variance. When given a scalar mean and variance, we have a scalar distribution. When given a vector mean and matrix covariance, we have a multivariate Gaussian distribution.

import math from 'mathjs'

import { choleskyDecomposition, getGaussianRand, getGaussianSampleFromCholesky } from './math.js'

export default class GaussianDistribution {
	/*
	 * constructor creates a Gaussian distribution object. It requires a mean and a (co)variance. When given scalars, we get a scalar Gaussian distribution. All resulting values from functions will be scalars. When given a mean vector and matrix covariance, we get a multivariate Gaussian distributions. Output parameters, like samples, will be vectors too. Which type of distribution we have can be checked through the 'multivariate' [boolean] property.
	 */
	constructor(mean, variance) {
		// Check the type of parameter that we have.
		this.multivariate = Array.isArray(mean)

		// Check the input.
		if (this.multivariate) {
			if (!Array.isArray(variance))
				throw new Error('Invalid distribution variance: the given covariance matrix does not have type array.')
			if (!Array.isArray(variance[0]))
				throw new Error('Invalid distribution variance: the given covariance matrix is not a matrix. The array does not have sub-arrays.')
			if (variance.length !== variance[0].length)
				throw new Error(`Invalid distribution variance: the number of rows (${variance.length}) and columns (${variance[0].length}) of the covariance matrix do not match.`)
			if (mean.length !== variance.length)
				throw new Error(`Invalid distribution variance: the mean vector (${mean.length} elements) and the covariance matrix (${variance.length} rows) do not match in size.`)
		} else {
			if (Array.isArray(variance))
				throw new Error('Invalid distribution variance: the mean (scalar) and variance (array/matrix) do not match.')
		}

		// Save the input.
		this.mean = mean
		this.variance = variance
	}
	
	/*
	 * pdf returns the probability density for a given input point. As such, it acts as the probability density function.
	 */
	pdf(input) {
		if (this.multivariate) {
			// Check input.
			if (!Array.isArray(input))
				throw new Error('Invalid pdf input: received a scalar value while expecting a vector (array).')
			if (input.length !== this.mean.length)
				throw new Error(`Invalid pdf input: the input (size ${input.length}) and distribution (size ${this.mean.length}) do not match.`)

			// Find the scaling constant, if we haven't already done so.
			if (this.scalingConstant === undefined)
				this.scalingConstant = Math.sqrt(Math.pow(2*Math.PI, this.mean.length) * math.det(this.variance))

			// Calculate result.
			const deviation = math.subtract(input, this.mean)
			return Math.exp(-0.5*math.multiply(math.divide(deviation, this.variance), deviation)) / this.scalingConstant
		} else {
			// Check input.
			if (Array.isArray(input))
				throw new Error('Invalid pdf input: received a vector (array) while expecting a scalar value.')

			// Calculate result.
			return Math.exp(-((input - this.mean) ** 2) / (2*this.variance)) / Math.sqrt(2*Math.PI*this.variance)
		}
	}

	/*
	 * getSample returns a sample from the given distribution.
	 */
	getSample() {
		// First find the Cholesky decomposition of the variance. Then use it to generate a sample.
		if (this.multivariate) {
			if (!this.chol)
				this.chol = choleskyDecomposition(this.variance)
			return getGaussianSampleFromCholesky(this.mean, this.chol)
		} else {
			if (!this.chol)
				this.chol = Math.sqrt(this.variance) // The Cholesky decomposition of the variance. For scalars, this is simply the standard deviation.
			return this.mean + getGaussianRand()*this.chol
		}
		// TODO: VERIFY IF THIS FUNCTION WORKS PROPERLY FOR LARGER INPUTS. IT WILL PROBABLY FAIL FOR DISTRIBUTIONS ABOVE 20 ELEMENTS, MAYBE EVEN AT TIME ALSO FOR ABOVE 15 ELEMENTS. POSSIBLY WE SHOULD CHECK FOR THIS?
	}
}