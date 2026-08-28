const PatternMetadata = {
    // Spatial patterns
    uniform: {
        name: "Uniform",
        description: "All cells identical",
        parameters: {
            baseEnvironment: { 
                type: "number", 
                default: 0, 
                min: -100, 
                max: 100, 
                step: 1,
                description: "Target Phenotype" 
            }
        }
    },
    gradient: {
        name: "Gradient",
        description: "Linear gradient based on position",
        parameters: {
            gradientStrength: { 
                type: "number", 
                default: 5, 
                min: 0, 
                max: 50, 
                step: 1,
                description: "Step between cells" 
            }
        }
    },
    
    // Temporal patterns
    static: {
        name: "Static",
        description: "No change over time",
        parameters: {}
    },
    linear: {
        name: "Linear",
        description: "Change at a constant rate",
        parameters: {
            changeRate: { 
                type: "number", 
                default: 50, 
                min: 0, 
                max: 1000, 
                step: 1,
                description: "Change per 10000 generations" 
            }
        }
    },
    cycling: {
        name: "Cycling",
        description: "Sinusoidal environmental oscillation",
        parameters: {
            cycleAmplitude: {
                type: "number",
                default: 50,
                min: 0,
                max: 100,
                step: 1,
                description: "Maximum of cycle"
            },
            cyclePeriod: {
                type: "number",
                default: 1000,
                min: 10,
                max: 10000,
                step: 10,
                description: "Generations to complete one cycle"
            }
        }
    },

    // Realistic-environment models (added 2026-08-28)
    composite: {
        name: "Cycle + Trend",
        description: "Sinusoidal oscillation riding a linear trend (seasonality on a warming ramp)",
        parameters: {
            changeRate: { type: "number", default: 50, min: 0, max: 1000, step: 1, description: "Trend change per 10000 generations" },
            cycleAmplitude: { type: "number", default: 6, min: 0, max: 100, step: 1, description: "Cycle amplitude" },
            cyclePeriod: { type: "number", default: 500, min: 10, max: 10000, step: 10, description: "Generations per cycle" }
        }
    },
    plateau: {
        name: "Ramp then plateau",
        description: "Linear change up to a total excursion, then constant (finite trend)",
        parameters: {
            changeRate: { type: "number", default: 160, min: 0, max: 1000, step: 1, description: "Change per 10000 generations during the ramp" },
            plateauAt: { type: "number", default: 10, min: 0, max: 200, step: 1, description: "Total excursion at which change stops" }
        }
    },
    rednoise: {
        name: "Red noise",
        description: "Autocorrelated stochastic environment (AR(1)/Ornstein-Uhlenbeck around 0)",
        parameters: {
            autocorrelation: { type: "number", default: 0.99, min: 0, max: 0.9999, step: 0.0001, description: "Per-generation autocorrelation φ" },
            stationarySD: { type: "number", default: 5, min: 0, max: 50, step: 0.5, description: "Long-run SD of the environment" }
        }
    }
};

// Update the generator functions to use the new parameter names
const PatternGenerators = {
    uniform: (options = {}) => {
        const value = options.baseEnvironment ?? 0;
        return {
            getValue: (position) => value
        };
    },
    
    gradient: (options = {}) => {
        const strength = options.gradientStrength ?? 5;
        return {
            getValue: (position) => (position.row - position.col) * strength
        };
    },
    
    random: (options = {}) => {
        const range = options.spatialRandomRange ?? 5;
        const values = new Map();
        
        return {
            getValue: (position) => {
                const key = `${position.row},${position.col}`;
                if (!values.has(key)) {
                    values.set(key, (Math.random() * 2 - 1) * range);
                }
                return values.get(key);
            }
        };
    },
    
    static: () => ({
        getValue: (position, time) => 0
    }),
    
    linear: (options = {}) => {
        const rate = options.changeRate ?? 50;
        
        return {
            getValue: (position, time) => time * rate / 10000
        };
    },
    
    cycling: (options = {}) => {
        const amplitude = options.cycleAmplitude ?? 50;
        const period = options.cyclePeriod ?? 10000;

        return {
            getValue: (position, time) => Math.sin(2 * Math.PI * time / period) * amplitude
        };
    },

    // cycle riding a linear trend — the climate-change shape (seasonality on a ramp)
    composite: (options = {}) => {
        const rate = options.changeRate ?? 50;
        const amplitude = options.cycleAmplitude ?? 6;
        const period = options.cyclePeriod ?? 500;
        return {
            getValue: (position, time) => time * rate / 10000 + Math.sin(2 * Math.PI * time / period) * amplitude
        };
    },

    // finite trend: ramp at changeRate until the total excursion plateauAt, then hold
    plateau: (options = {}) => {
        const rate = options.changeRate ?? 160;
        const cap = options.plateauAt ?? 10;
        return {
            getValue: (position, time) => Math.min(time * rate / 10000, cap)
        };
    },

    // AR(1) red noise around 0: x_t = phi*x_{t-1} + innovationSD*N(0,1), with
    // innovationSD chosen so the stationary SD equals stationarySD. The series is
    // computed lazily and cached per integer generation, so every cell sees the same
    // environment and runs stay deterministic under the seeded RNG.
    rednoise: (options = {}) => {
        const phi = options.autocorrelation ?? 0.99;
        const sd = options.stationarySD ?? 5;
        const innovationSD = sd * Math.sqrt(1 - phi * phi);
        const cache = [0];   // x_0 = 0 (start at the long-run mean)
        return {
            getValue: (position, time) => {
                const t = Math.max(0, Math.floor(time));
                while (cache.length <= t) {
                    cache.push(phi * cache[cache.length - 1] + generateNormalSample(0, innovationSD));
                }
                return cache[t];
            }
        };
    }
};

// Factory function
function createPattern(type, options = {}) {
    const generator = PatternGenerators[type] || PatternGenerators.static;
    return generator(options);
}