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
    deathChancePerGeneration: 0.2,
    offspringMigrationChance: 0.0001, 
    adultMigrationChance: 0.0001,

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
    ip: 'https://73.19.38.112:8888'
};

