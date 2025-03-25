//GameBoard code below
function randomInt(n) {
    return Math.floor(Math.random() * n);
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

function numArray(n) {
    let arr = [];
    for(let i = 0; i < n; i++) {
        arr.push(i);
    }
    return arr;
};

function generateNormalSample(mean = 0, stdDev = 1) {
    // box-muller transform
    let u1 = Math.random();
    let u2 = Math.random();

    let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
};

function rgb(r, g, b) {
    return "rgb(" + r + "," + g + "," + b + ")";
};

function hsl(h, s, l) {
    return "hsl(" + h + "," + s + "%," + l + "%)";
};

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
};


function databaseConnected() {
    const dbDiv = document.getElementById("db");
    dbDiv.classList.remove("db-disconnected");
    dbDiv.classList.add("db-connected");
};

function databaseDisconnected() {
    const dbDiv = document.getElementById("db");
    dbDiv.classList.remove("db-connected");
    dbDiv.classList.add("db-disconnected");
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

// Add this to util.js
function updateEnvironmentUI() {
    // Get current selections
    const spatialType = document.getElementById('environmentPattern').value;
    const temporalType = document.getElementById('environmentDynamics').value;
    
    // Get containers
    const spatialContainer = document.getElementById('spatialPatternParams');
    const temporalContainer = document.getElementById('temporalPatternParams');
    
    // Clear current parameters
    spatialContainer.innerHTML = '';
    temporalContainer.innerHTML = '';
    
    // Add spatial parameters
    const spatialMeta = PatternMetadata[spatialType];
    if (spatialMeta) {
        // Add title and description
        spatialContainer.innerHTML = `<p class="pattern-description">${spatialMeta.description}</p>`;
        
        // Add parameters
        for (const [paramName, paramInfo] of Object.entries(spatialMeta.parameters)) {
            const inputId = `spatial_${paramName}`;
            const paramDiv = document.createElement('div');
            paramDiv.className = 'parameter-control';
            paramDiv.innerHTML = `
                <label for="${inputId}" title="${paramInfo.description}">${paramInfo.description}:</label>
                <input type="${paramInfo.type}" id="${inputId}" 
                       value="${paramInfo.default}" min="${paramInfo.min}" 
                       max="${paramInfo.max}" step="${paramInfo.step}" />
            `;
            spatialContainer.appendChild(paramDiv);
        }
    }
    
    // Add temporal parameters
    const temporalMeta = PatternMetadata[temporalType];
    if (temporalMeta) {
        // Add title and description
        temporalContainer.innerHTML = `<p class="pattern-description">${temporalMeta.description}</p>`;
        
        // Add parameters
        for (const [paramName, paramInfo] of Object.entries(temporalMeta.parameters)) {
            const inputId = `temporal_${paramName}`;
            const paramDiv = document.createElement('div');
            paramDiv.className = 'parameter-control';
            paramDiv.innerHTML = `
                <label for="${inputId}" title="${paramInfo.description}">${paramInfo.description}:</label>
                <input type="${paramInfo.type}" id="${inputId}" 
                       value="${paramInfo.default}" min="${paramInfo.min}" 
                       max="${paramInfo.max}" step="${paramInfo.step}" />
            `;
            temporalContainer.appendChild(paramDiv);
        }
    }
}
