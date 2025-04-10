class DataManager {
    constructor(automata) {
        this.automata = automata;

        // population data
        this.organismPopulation = [];
        this.biomePopulation = [];
        this.meanGeneValues = [];
        this.upperStdDevGeneValues = [];
        this.lowerStdDevGeneValues = [];
        this.genotypeHistogramData = [];
        this.meanGenotypeValues = [];
        this.upperStdDevGenotypeValues = [];
        this.lowerStdDevGenotypeValues = [];
        this.phenotypeHistogramData = [];
        this.meanPhenotypeValues = [];
        this.upperStdDevPhenotypeValues = [];
        this.lowerStdDevPhenotypeValues = [];
        this.genotypicVarianceValues = [];
        this.phenotypicVarianceValues = [];
        this.heritabilityValues = [];

        // Store histograms over time
        this.geneticHistogramData = [];

        // Individual cell-level data initialized with default values
        this.cellMeanGeneValues = Array(PARAMS.numRows).fill().map(() => Array(PARAMS.numCols).fill().map(() => []));
        this.cellUpperStdDevGeneValues = Array(PARAMS.numRows).fill().map(() => Array(PARAMS.numCols).fill().map(() => []));
        this.cellLowerStdDevGeneValues = Array(PARAMS.numRows).fill().map(() => Array(PARAMS.numCols).fill().map(() => []));
        this.cellHistograms = Array(PARAMS.numRows).fill().map(() => Array(PARAMS.numCols).fill().map(() => []));

        // Initialize the Histogram instance for visualization
        gameEngine.addGraph(new Graph(800, 0, [this.organismPopulation], "Organisms", 0, 0));
        gameEngine.addGraph(new Graph(800, 115, [this.biomePopulation], "Populated Biomes", 0, 64));

        let options = {
            label: "Genetic Distribution"
        };
        gameEngine.addGraph(new Histogram(800, 230, this.geneticHistogramData, options));
        gameEngine.addGraph(new Graph(800, 230, [this.meanGeneValues, this.upperStdDevGeneValues, this.lowerStdDevGeneValues], "", -PARAMS.histogramWidth, PARAMS.histogramWidth));

        let genotypeOptions = {
            label: "Genotype Distribution (Organism Level)"
        };
        gameEngine.addGraph(new Histogram(800, 345, this.genotypeHistogramData, genotypeOptions));
        gameEngine.addGraph(new Graph(800, 345, [this.meanGenotypeValues, this.upperStdDevGenotypeValues, this.lowerStdDevGenotypeValues], "", -PARAMS.histogramWidth, PARAMS.histogramWidth));

        let phenotypeOptions = {
            label: "Phenotypic Distribution"
        };
        gameEngine.addGraph(new Histogram(800, 460, this.phenotypeHistogramData, phenotypeOptions));
        gameEngine.addGraph(new Graph(800, 460, [this.meanPhenotypeValues, this.upperStdDevPhenotypeValues, this.lowerStdDevPhenotypeValues], "", -PARAMS.histogramWidth, PARAMS.histogramWidth));

        gameEngine.addGraph(new Graph(800, 575, [this.genotypicVarianceValues, this.phenotypicVarianceValues, this.heritabilityValues], "Genotypic/Phenotypic Variance (σ²) and Heritability (h²)", 0, 0));
        
        const cellWidth = PARAMS.pixelDimension / PARAMS.numCols;
        const cellHeight = PARAMS.pixelDimension / PARAMS.numRows;
        options = {
            width: cellWidth,
            height: cellHeight
        };

        for (let i = 0; i < PARAMS.numRows; i++) {
            for (let j = 0; j < PARAMS.numCols; j++) {
                automata.grid[i][j].geneHistogram = new Histogram(
                    j * cellWidth,
                    i * cellHeight,
                    this.cellHistograms[i][j],
                    options
                );
            }
        }
        // automata.cellGeneHistograms = cellGeneHistograms;
    }

    updateData() {
        const bucketCount = 20;
        const minRange = -PARAMS.histogramWidth;
        const maxRange = PARAMS.histogramWidth;
        const bucketSize = (maxRange - minRange) / bucketCount;

        // Initialize histograms and counters
        let geneHistogram = Array(bucketCount).fill(0);
        let genotypeHistogram = Array(bucketCount).fill(0);
        let phenotypeHistogram = Array(bucketCount).fill(0);

        let totalGeneValue = 0;
        let totalGenotypeValue = 0;
        let totalPhenotypeValue = 0;

        let totalGeneCount = 0;
        let totalGenotypeCount = 0;
        let totalPhenotypeCount = 0;

        let organismPop = 0;
        let biomePop = 0;

        let geneValues = [];
        let genotypeValues = [];
        let phenotypeValues = [];

        for (let i = 0; i < PARAMS.numRows; i++) {
            for (let j = 0; j < PARAMS.numCols; j++) {
                let cellHistogram = Array(bucketCount).fill(0);
                let cellMean = 0;
                let cellStdDev = 0;
                let pop = this.automata.grid[i][j].currentPopulation;

                if (pop.length > 0) {
                    organismPop += pop.length;
                    biomePop++;

                    // Process each organism
                    for (const organism of pop) {
                        // Collect genotype data (whole organism)
                        let genotypeValue = organism.genotype;
                        totalGenotypeValue += genotypeValue;
                        totalGenotypeCount++;
                        genotypeValues.push(genotypeValue);

                        let genotypeIndex = Math.floor((genotypeValue - minRange) / bucketSize);
                        if (genotypeIndex < 0) genotypeIndex = 0;
                        else if (genotypeIndex >= bucketCount) genotypeIndex = bucketCount - 1;
                        genotypeHistogram[genotypeIndex]++;

                        // Collect phenotype data
                        let phenotypeValue = organism.phenotype;
                        totalPhenotypeValue += phenotypeValue;
                        totalPhenotypeCount++;
                        phenotypeValues.push(phenotypeValue);

                        let phenotypeIndex = Math.floor((phenotypeValue - minRange) / bucketSize);
                        if (phenotypeIndex < 0) phenotypeIndex = 0;
                        else if (phenotypeIndex >= bucketCount) phenotypeIndex = bucketCount - 1;
                        phenotypeHistogram[phenotypeIndex]++;

                        // Collect gene-level data (individual genes)
                        for (const gene of organism.genes) {
                            let value = gene.value;
                            totalGeneValue += value;
                            totalGeneCount++;
                            geneValues.push(value);

                            let index = Math.floor((value - minRange) / bucketSize);
                            if (index < 0) index = 0;
                            else if (index >= bucketCount) index = bucketCount - 1;
                            geneHistogram[index]++;
                        }
                    }
                }

                // Existing updates for genetic cell-level data
                this.cellMeanGeneValues[i][j].push(cellMean);
                this.cellUpperStdDevGeneValues[i][j].push(cellMean + cellStdDev);
                this.cellLowerStdDevGeneValues[i][j].push(cellMean - cellStdDev);
                this.cellHistograms[i][j].push(cellHistogram);

                // You may want to add cell-level phenotype data as well if needed
            }
        }

        // Calculate statistics for genes
        let geneMean = totalGeneValue / totalGeneCount;
        let geneVariance = geneValues.reduce((acc, val) => acc + (val - geneMean) ** 2, 0) / totalGeneCount;
        let geneStdDev = Math.sqrt(geneVariance);

        // Calculate statistics for genotypes
        let genotypeMean = totalGenotypeValue / totalGenotypeCount;
        let genotypeVariance = genotypeValues.reduce((acc, val) => acc + (val - genotypeMean) ** 2, 0) / totalGenotypeCount;
        let genotypeStdDev = Math.sqrt(genotypeVariance);

        // Calculate statistics for phenotypes
        let phenotypeMean = totalPhenotypeValue / totalPhenotypeCount;
        let phenotypeVariance = phenotypeValues.reduce((acc, val) => acc + (val - phenotypeMean) ** 2, 0) / totalPhenotypeCount;
        let phenotypeStdDev = Math.sqrt(phenotypeVariance);

        let heritability = genotypeVariance / (genotypeVariance + phenotypeVariance);

        // Update time series data
        this.organismPopulation.push(organismPop);
        this.biomePopulation.push(biomePop);

        // Gene level
        this.geneticHistogramData.push(geneHistogram);
        this.meanGeneValues.push(geneMean);
        this.upperStdDevGeneValues.push(geneMean + geneStdDev);
        this.lowerStdDevGeneValues.push(geneMean - geneStdDev);

        // Genotype level
        this.genotypeHistogramData.push(genotypeHistogram);
        this.meanGenotypeValues.push(genotypeMean);
        this.upperStdDevGenotypeValues.push(genotypeMean + genotypeStdDev);
        this.lowerStdDevGenotypeValues.push(genotypeMean - genotypeStdDev);

        // Phenotype level
        this.phenotypeHistogramData.push(phenotypeHistogram);
        this.meanPhenotypeValues.push(phenotypeMean);
        this.upperStdDevPhenotypeValues.push(phenotypeMean + phenotypeStdDev);
        this.lowerStdDevPhenotypeValues.push(phenotypeMean - phenotypeStdDev);

        this.genotypicVarianceValues.push(genotypeVariance);
        this.phenotypicVarianceValues.push(phenotypeVariance);
        this.heritabilityValues.push(heritability);
    }

    logData() {
        const data = {
            db: PARAMS.db,
            collection: PARAMS.collection,
            data: {
                PARAMS: PARAMS,
                geneticHistogramData: this.geneticHistogramData
            }
        };

        if (socket) socket.emit("insert", data);
    }

    update() {
        // Update data each frame
        if (this.automata.generation % PARAMS.reportingPeriod === 0) this.updateData();
    }

    draw(ctx) {
        // Draw the histogram, handled by the Histogram class in the game engine
    }
}
