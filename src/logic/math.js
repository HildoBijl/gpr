// Contains various useful mathematical support functions.

import math from 'mathjs'
import gaussian from 'gaussian'
import ct from 'cholesky-tools'

/*
 * Matrix stuff.
 */

// choleskyDecomposition(A) returns the Cholesky decomposition of a symmetric positive definite matrix A. That is, the lower diagonal matrix such that L*L^T = A. It may fail for large (say, 20 by 20) matrices, in which case an automatic work-around (that may slightly distort results) is applied.
export function choleskyDecomposition(A) {
  // Use the CholeskyTools package to get a Cholesky decomposition. Note that this may fail due to numerical reasons.
  let chol = ct.cholesky(A)

  // If the Cholesky decomposition did fail, increase the diagonal and try again. Every iteration, increase the addition to the diagonal addition until it works.
  for (let i = -30; isNaN(chol[chol.length-1][chol.length-1]); i++) {
    const newA = A.map((row, rowIndex) => row.map((value, colIndex) => { // Clone the array and add e^i to the diagonal.
      return (rowIndex === colIndex ? value + Math.pow(Math.E, i) : value)
    }))
    chol = choleskyDecomposition(newA) // Let's try the Cholesky decomposition again.
  }

  // Return the final result.
  return chol
}

// logDet(A) returns log(det(A)) (the logarithm of the determinant) of a positive definite matrix A. A base e logarithm is used. It does this in a more efficient and numerically stable way than by first calculating det(A) and then taking the logarithm. To be precise, it first calculates the LU-decomposition of the matrix, and then uses that to calculate the logarithm of the determinant.
export function logDet(A) {
  // This uses the LU-decomposition algorithm from https://github.com/mljs/matrix/blob/master/src/dc/lu.js.
  const lu = A.map(row => row.map(elem => elem))
  const rows = lu[0].length
  const columns = lu.length
  const pivotVector = new Array(rows)
  let pivotSign = 1
  let i, j, k, p, s, t, v
  let LUcolj, kmax

  for (i = 0; i < rows; i++) {
    pivotVector[i] = i
  }

  LUcolj = new Array(rows)

  for (j = 0; j < columns; j++) {
    for (i = 0; i < rows; i++) {
      LUcolj[i] = lu[i][j]
    }
    for (i = 0; i < rows; i++) {
      kmax = Math.min(i, j)
      s = 0;
      for (k = 0; k < kmax; k++) {
        s += lu[i][k] * LUcolj[k]
      }
      LUcolj[i] -= s
      lu[i][j] = LUcolj[i]
    }

    p = j
    for (i = j + 1; i < rows; i++) {
      if (Math.abs(LUcolj[i]) > Math.abs(LUcolj[p])) {
        p = i
      }
    }

    if (p !== j) {
      for (k = 0; k < columns; k++) {
        t = lu[p][k]
        lu[p][k] = lu[j][k]
        lu[j][k] = t
      }

      v = pivotVector[p]
      pivotVector[p] = pivotVector[j]
      pivotVector[j] = v

      pivotSign = -pivotSign
    }

    if (j < rows && lu[j][j] !== 0) {
      for (i = j + 1; i < rows; i++) {
        lu[i][j] = lu[i][j] / lu[j][j]
      }
    }
  }

  // Verify that the matrix has a positive determinant.
  let currentSign = 1
  for (j = 0; j < columns; j++) {
    currentSign *= sign(lu[j][j])
  }
  if (currentSign <= 0)
    throw new Error('The function logDet was called on a matrix with a non-positive determinant. Could not properly obtain a result.')

  // Calculate the final result, the logDet, by adding up the logarithms of the diagonal elements of the LU decomposition.
  let determinant = 0
  for (j = 0; j < columns; j++) {
    determinant += Math.log(Math.abs(lu[j][j]))
  }
  return determinant
}

// multiplyMatrices allows the multiplication of multiple matrices in one function through a single function call. Multiplication goes from left to right.
export function multiplyMatrices(...matrices) {
  let result = matrices[0]
  for (let i = 1; i < matrices.length; i++)
    result = math.multiply(result, matrices[i])
  return result
}

// mergeMatrices receives matrices in block form. So it may receive [[A,B],[C,D]], in which A,B,C,D are also matrices. So the input is usually a four-dimensional array. It returns the corresponding two-dimensional array of the merged matrix.
export function mergeMatrices(blocks) {
  // Check the input.
  if (!Array.isArray(blocks))
    throw new Error('Invalid input type: the given parameter was not a matrix of blocks. It is not of type array.')
  // Check the number of rows.
  blocks.forEach(matrices => {
    if (!Array.isArray(matrices))
      throw new Error('Invalid input type: the given parameter was not a matrix of blocks. One of the array elements is not an array.')
    matrices.forEach(matrix => {
      if (matrix.length !== matrices[0].length)
        throw new Error(`Invalid input size: the number of rows of one matrix (${matrices[0].length}) do not match with the number of rows of another (${matrix.length}).`)
    })
  })
  // Check the number of columns.
  blocks[0].forEach((block,blockIndex) => {
    blocks.forEach(matrices => {
      if (block.length !== 0 && matrices[blockIndex].length !== 0 && block[0].length !== matrices[blockIndex][0].length) // Matrices with zero rows are ignored, as we cannot find the number of columns they have.
        throw new Error(`Invalid input size: the number of columns of one matrix (${block[0].length}) do not match with the number of rows of another (${matrices[blockIndex][0].length}).`)
    })
  })
  
  // Assemble the matrix.
  const result = []
  blocks.forEach(matrices => {
    matrices[0].forEach((_,rowIndex) => {
      const row = []
      matrices.forEach(matrix => {
        matrix[rowIndex].forEach(v => row.push(v))
      })
      result.push(row)
    })
  })
  return result
}

// arrayAsColumn turns an array into a column vector.
export function arrayAsColumn(vector) {
  if (!Array.isArray(vector))
    throw new Error('Invalid input: expected an array but did not get one.')
  return vector.map(v => [v])
}

// arrayAsRow turns an array into a row vector.
export function arrayAsRow(vector) {
  if (!Array.isArray(vector))
    throw new Error('Invalid input: expected an array but did not get one.')
  return [vector]
}

// scalarAsMatrix turns a scalar into a one by one matrix.
export function scalarAsMatrix(scalar) {
  return [[scalar]]
}

// removeRow removes a row from a matrix. The given matrix (through pass by reference) is adjusted, and the removed row is returned as array.
export function removeRow(matrix, row) {
  return matrix.splice(row, 1)[0]
}

// removeColumn removes a column from a matrix. The given matrix (through pass by reference) is adjusted, and the removed column is returned as array.
export function removeColumn(matrix, col) {
  return matrix.map(row => row.splice(col, 1)[0])
}

/*
 * Probability theory stuff.
 */

const gaussianDist = gaussian(0, 1) // We need this one to generate Gaussian number samples.

// getGaussianRand(n) returns an array of n normally distributed random variables. If no number is given, it returns a single scalar number instead. All numbers have zero mean, unit variance and are independent. If you want non-zero mean, just add the mean. If you want a non-unit variance, multiply the numbers. If you want a specific covariance matrix, use getGaussianSample.
export function getGaussianRand(n) {
  if (n === undefined)
    return gaussianDist.ppf(Math.random())
  return (new Array(n)).fill(0).map(() => getGaussianRand())
}

// getGaussianSample(mu, Sigma, randomVector) returns a sample of a Gaussian distribution with mean mu and covariance Sigma. It either generates its own random vector (if randomVector is not given) or a randomVector (generated through getGaussianRand) may be given to ensure the same result. Note: it may fail for large (say, 20 elements) distributions.
export function getGaussianSample(mu, Sigma, randomVector) {
  const chol = choleskyDecomposition(Sigma)
  return getGaussianSampleFromCholesky(mu, chol, randomVector)
}

// getGaussianSampleFromCholesky(mu, chol, randomVector) returns a sample of a Gaussian distribution with mean mu and covariance matrix Sigma = chol*chol^T, where chol is the Cholesky decomposition of sigma. This is useful if you need multiple samples from the same distribution. Use it instead of getGaussianSample, to prevent that function from having to calculate the Cholesky decomposition every single time. It either generates its own random vector (if randomVector is not given) or a randomVector (generated through getGaussianRand) may be given to ensure the same result.
export function getGaussianSampleFromCholesky(mu, chol, randomVector) {
  if (randomVector && randomVector.length !== mu.length)
    throw new Error(`Invalid input: the getGaussianSampleFromCholesky got a random vector with length ${randomVector.length} but the mean vector mu has length ${mu.length}. These numbers should match.`)
  return math.add(mu, math.multiply(chol, randomVector || getGaussianRand(mu.length))) // mu + chol*rand(n,1).
}

/*
 * Other stuff.
 */

// sign(n) returns the sign of the number n. So 1 for positive numbers, -1 for negative numbers and 0 for 0.
export function sign(n) {
  if (n > 0)
    return 1
  if (n < 0)
    return -1
  return 0
}