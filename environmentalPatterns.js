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
    }
};

// Factory function
function createPattern(type, options = {}) {
    const generator = PatternGenerators[type] || PatternGenerators.static;
    return generator(options);
}