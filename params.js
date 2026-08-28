var PARAMS = {
    // sim
    updatesPerDraw: 1,

    // automata
    pixelDimension: 800,
    numRows: 8,
    numCols: 8,

    // environmental patterns
    spatialVariance: 5,
    temporalVariance: 0.005,
    temporalPeriod: 1,

    // population
    numOrganisms: 100,
    initialMean: 0,
    initialVariation: 1,
    maxOffspring: 5,
    targetValue: 0,
    reproductionVariance: 2,
    populationSoftCap: 100, 

    // organism
    numLocii: 100,
    mutationRate: 0.05,
    mutationRange: 0.025,
    targetObservationalNoise: 0.1,
    adaptiveStepSize: 0.5,
    plasticityModel: "step",     // "step" (bounded within-lifetime acclimation, original) | "linear" (instant reaction norm, Chevin-style control)
    reactionNormSlope: 0.5,      // linear model only: fraction of the observed offset compensated
    deathChancePerGeneration: 0.2,
    offspringMigrationChance: 0.0001,
    adultMigrationChance: 0.0001,
    worldEdges: "torus",         // "torus" (wrap, original) | "island" (edge hops cancelled — required for gradient worlds, which have a wrap seam)
    needMigrationScale: 0,       // informed migration: emigration prob rises with local mismatch (0 = off, original behavior)
    fitTargetedMigration: false, // informed migration: destination = best-match cell among home+neighbors (false = uniform random, original)
    sexualReproduction: false,

    // data gathering
    reportingPeriod: 50,
    epoch: 150000,

    // graphs
    histogramWidth: 10,
    graphHeight: 100,
    graphWidth: 400,

    // database
    db: "populationGeneticsDB",
    collection: "test",
    ip: 'https://research.climbinggiants.com:8888'   // shared socket.io -> MongoDB server
};

function loadParameters() {
    PARAMS.numRows = parseInt(document.getElementById("numRows").value);
    PARAMS.numCols = parseInt(document.getElementById("numCols").value);

    // Population parameters
    // PARAMS.numOrganisms = parseInt(document.getElementById("numOrganisms").value);
    PARAMS.maxOffspring = parseInt(document.getElementById("maxOffspring").value);
    PARAMS.targetVariance = parseFloat(document.getElementById("targetVariance").value);
    PARAMS.initialVariation = parseFloat(document.getElementById("initialVariation").value);
    PARAMS.reproductionVariance = parseFloat(document.getElementById("reproductionVariance").value);
    PARAMS.populationSoftCap = parseInt(document.getElementById("populationSoftCap").value);

    // Organism parameters
    PARAMS.numLocii = parseInt(document.getElementById("numLocii").value);
    PARAMS.mutationRate = parseFloat(document.getElementById("mutationRate").value);
    PARAMS.mutationRange = parseFloat(document.getElementById("mutationRange").value);
    PARAMS.deathChancePerGeneration = parseFloat(document.getElementById("deathChancePerGeneration").value);
    PARAMS.offspringMigrationChance = parseFloat(document.getElementById("offspringMigrationChance").value);
    PARAMS.adultMigrationChance = parseFloat(document.getElementById("adultMigrationChance").value);
    PARAMS.adaptiveStepSize = parseFloat(document.getElementById("adaptiveStepSize").value);
    PARAMS.targetObservationalNoise = parseFloat(document.getElementById("targetObservationalNoise").value);
    PARAMS.sexualReproduction = document.getElementById('sexualReproduction').checked;
    
    // Environment dynamics parameters
    const spatialType = document.getElementById('environmentPattern').value;
    const temporalType = document.getElementById('environmentDynamics').value;
    
    // Environment parameters from dynamic fields
    PARAMS.environmentPatterns = {
        spatial: {
            type: spatialType,
            parameters: {}
        },
        temporal: {
            type: temporalType,
            parameters: {}
        }
    };
    
    // Read spatial parameters
    if (PatternMetadata[spatialType]) {
        for (const paramName of Object.keys(PatternMetadata[spatialType].parameters)) {
            const inputId = `spatial_${paramName}`;
            const input = document.getElementById(inputId);
            if (input) {
                PARAMS.environmentPatterns.spatial.parameters[paramName] = 
                    parseFloat(input.value);
            }
        }
    }
    
    // Read temporal parameters
    if (PatternMetadata[temporalType]) {
        for (const paramName of Object.keys(PatternMetadata[temporalType].parameters)) {
            const inputId = `temporal_${paramName}`;
            const input = document.getElementById(inputId);
            if (input) {
                PARAMS.environmentPatterns.temporal.parameters[paramName] = 
                    parseFloat(input.value);
            }
        }
    }

    console.log(PARAMS);
}

