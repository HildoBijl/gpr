import GP from '../../../../logic/GaussianProcess/GaussianProcess.js'

// The plot in the first section showing how stuff gradually changes.
const gradualId = 'gradual'
const gradualInitial = {
	gp: {
		meanData: {
			type: 'Constant',
			m: 2,
		},
		covarianceData: {
			type: 'SquaredExponential',
			Vx: 0.5 ** 2,
			Vy: 0.5 ** 2,
		},
		measurements: [
			{
				input: 2,
				output: 2,
			},
			{
				input: 4,
				output: 4,
			},
		],
		defaultOutputNoiseVariance: 0.0001,
		samples: [GP.generateSample()],
	}
}
export { gradualId, gradualInitial }

// The plots for the later sections.
const priorId = 'gaussianDistributionIdea'
const t1 = 3 // 9:00. (There's a shift of six hours in the axis.)
const t2 = 5 // 11:00.
const minM = -2 // The minimum mean.
const maxM = 6 // The maximum mean.
const initialM = (maxM + minM) / 2
const minL = 0.4 // The minimum length scale.
const maxL = 6 // The maximum length scale.
const initialL = (maxL + minL) / 2
const maxC = 0.99 // The maximum correlation.
const measuredTemperature = 2
const blockStepSize = 1 // The size of the hover blocks in the plot.
const temperatureRange = { min: -6, max: 10 }
const probabilityRange = { min: 0, max: 0.16 }
const timeRange = { min: -1, max: 7 }
const priorInitial = { // The initial datastore data.
	m: initialM,
	l: initialL,
	c3: 0.5, // The initial correlation between 8:00 and 9:00.
	c5: 0.5, // The initial correlation between 8:00 and 11:00.
	gp: {
		measurements: [
			{
				input: 2,
				output: measuredTemperature,
			},
		],
		defaultOutputNoiseVariance: 0.0001,
	}
}
export { priorId, priorInitial, t1, t2, measuredTemperature, minM, maxM, minL, maxL, maxC, blockStepSize, temperatureRange, probabilityRange, timeRange }