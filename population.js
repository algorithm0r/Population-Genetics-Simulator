class Population {
    constructor(row, col, populated, spatialPattern, temporalPattern) {
        this.row = row;
        this.col = col;

        this.spatialPattern = spatialPattern;
        this.temporalPattern = temporalPattern;

        this.target = this.calculateTarget(0);

        // Two separate arrays for current and next population
        this.currentPopulation = [];
        this.nextPopulation = [];

        this.populationTimeSeries = [];
        this.geneHistogram = null; // will be attached by DataManager

        this.drawState = 0;
        // 0 = quartiles
        // 1 = gene histogram

        // Initialize the current population
        if (populated) {
            for (let i = 0; i < PARAMS.numOrganisms; i++) {
                this.currentPopulation.push(new Organism());
            }
        }
    }

    toggleDisplay() {
        this.drawState = (this.drawState + 1) % 2;
    }

    averagePhenotype() {
        const totalPhenotype = this.currentPopulation.reduce((sum, organism) => sum + organism.phenotype, 0);
        return totalPhenotype / this.currentPopulation.length;
    }

    averageGenotype() {
        const totalGenotype = this.currentPopulation.reduce((sum, organism) => sum + organism.genotype, 0);
        return totalGenotype / this.currentPopulation.length;
    }

    calculateTarget(time) {
        let position = {row : this.row, col: this.col};
        return this.spatialPattern.getValue(position) + 
               this.temporalPattern.getValue(position, time);
    }
    // Advances to the next generation with potential migration
    nextGeneration() {
        if (gameEngine.click) {
            if (gameEngine.click.row === this.row && gameEngine.click.col === this.col) {
                this.toggleDisplay();
            }
        }

        this.target = this.calculateTarget(gameEngine.automata.generation);
        const variance = PARAMS.reproductionVariance;
        const maxOffspring = PARAMS.maxOffspring;
        const offspringPenalty = this.currentPopulation.length / PARAMS.populationSoftCap;

        if (gameEngine.automata.generation % PARAMS.reportingPeriod === 0) this.populationTimeSeries.push(this.currentPopulation.length);
        this.currentPopulation.forEach(org => {
            let distance = Math.abs(org.phenotype - this.target);
            org.adapt(this.target)
            let expectedOffspring = Math.max(maxOffspring * Math.max(0, Math.pow(Math.E, -distance / variance)) - offspringPenalty, 0);

            const integerOffspring = Math.floor(expectedOffspring);
            const fractionalOffspring = expectedOffspring - integerOffspring;

            for (let i = 0; i < integerOffspring; i++) {
                let offspring = new Organism(org);
                offspring.mutate();
                this.migrate(offspring, PARAMS.offspringMigrationChance);
            }

            if (Math.random() < fractionalOffspring) {
                let offspring = new Organism(org);
                offspring.mutate();
                this.migrate(offspring, PARAMS.offspringMigrationChance);
            }

            if (Math.random() >= PARAMS.deathChancePerGeneration) {
                this.migrate(org, PARAMS.adultMigrationChance);
            }

        });

        [this.currentPopulation, this.nextPopulation] = [this.nextPopulation, []];
    }

    // Handles migration by placing offspring in neighboring cells within the global grid
    migrate(offspring, chance) {
        const grid = gameEngine.automata.grid;

        if (Math.random() < chance) {
            // Define possible offsets for the Moore neighborhood (excluding the center cell)
            const neighborhoodOffsets = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1], /* [0, 0] */[0, 1],
                [1, -1], [1, 0], [1, 1]
            ];

            // Randomly select one of the 8 neighboring cells
            const [rowOffset, colOffset] = neighborhoodOffsets[Math.floor(Math.random() * neighborhoodOffsets.length)];

            // Calculate the new row and column, wrapping around the grid edges (torus behavior)
            const newRow = (this.row + rowOffset + PARAMS.numRows) % PARAMS.numRows;
            const newCol = (this.col + colOffset + PARAMS.numCols) % PARAMS.numCols;

            // Place the offspring in the selected neighboring cell
            grid[newRow][newCol].nextPopulation.push(offspring);
        } else {
            // If no migration, offspring remains in the current population
            this.nextPopulation.push(offspring);
        }
    }

    draw(ctx) {
        const cellWidth = PARAMS.pixelDimension / PARAMS.numCols;
        const cellHeight = PARAMS.pixelDimension / PARAMS.numRows;
        const margin = 6;
        const y = this.row * cellHeight;
        const x = this.col * cellWidth;

        const hasPop = this.currentPopulation.length > 0;

        // Function to map values to colors on a gradient
        const getColorForValue = (value) => {
            value = Math.max(-10 * PARAMS.targetVariance, Math.min(10 * PARAMS.targetVariance, value));
            if (value < 0) {
                const intensity = (50 + value) / 50;
                const red = Math.floor(255 * intensity);
                const green = Math.floor(255 * intensity);
                return `rgb(${red}, ${green}, 255)`;
            } else {
                const intensity = (50 - value) / 50;
                const green = Math.floor(255 * intensity);
                const blue = Math.floor(255 * intensity);
                return `rgb(255, ${green}, ${blue})`;
            }
        };

        // Calculate phenotype quartiles
        const phenotypeValues = this.currentPopulation.map(org => org.phenotype).sort((a, b) => a - b);
        const genotypeValues = this.currentPopulation.map(org => org.genotype).sort((a, b) => a - b);

        const getQuartiles = (values) => {
            const n = values.length;
            return [
                values[0], // Min
                values[Math.floor(n * 0.25)] || values[0],
                values[Math.floor(n * 0.5)] || values[0],
                values[Math.floor(n * 0.75)] || values[0],
                values[n - 1] || values[0] // Max
            ];
        };

        const phenotypeQuartiles = hasPop ? getQuartiles(phenotypeValues) : [];
        const genotypeQuartiles = hasPop ? getQuartiles(genotypeValues) : [];

        const phenotypeColors = phenotypeQuartiles.map(getColorForValue);
        const genotypeColors = genotypeQuartiles.map(getColorForValue);

        // Population bar parameters
        const maxPopulation = PARAMS.maxOffspring * PARAMS.populationSoftCap;
        const populationHeight = Math.min(this.currentPopulation.length / maxPopulation, 1) * (cellHeight - 2 * margin);
        const barWidth = 5;
        const barX = x + cellWidth / 2 - barWidth / 2;
        const barY = y + cellHeight - margin - populationHeight;

        // Divide cell into two halves (left for genotype, right for phenotype)
        const halfWidth = (cellWidth - 2 * margin) / 2;

        const chunkHeight = (cellHeight - 2 * margin) / 5;

         if (this.drawState === 0) {
            if (hasPop) {
                // Draw genotype quartiles
                genotypeColors.forEach((color, i) => {
                    ctx.fillStyle = color;
                    ctx.fillRect(x + margin, y + margin + i * chunkHeight, halfWidth, chunkHeight);
                });

                // Draw phenotype quartiles
                phenotypeColors.forEach((color, i) => {
                    ctx.fillStyle = color;
                    ctx.fillRect(x + margin + halfWidth, y + margin + i * chunkHeight, halfWidth, chunkHeight);
                });
            } else {
                // Fill with black when no population
                ctx.fillStyle = "black";
                ctx.fillRect(x + margin, y + margin, halfWidth, cellHeight - 2 * margin); // Left side for genotype
                ctx.fillRect(x + margin + halfWidth, y + margin, halfWidth, cellHeight - 2 * margin); // Right side for phenotype
            }

            // Draw population bar
            ctx.fillStyle = "rgba(128, 128, 128, 0.8)"; // Semi-transparent grey
            ctx.fillRect(barX, barY, barWidth, populationHeight);

            // Draw segments in the population bar
            const segmentHeight = (cellHeight - 2 * margin) / PARAMS.maxOffspring;
            for (let i = 1; i < PARAMS.maxOffspring; i++) {
                const segmentY = y + cellHeight - margin - i * segmentHeight;
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(barX, segmentY);
                ctx.lineTo(barX + barWidth, segmentY);
                ctx.stroke();
            }

        } else if (this.drawState === 1) {
            this.geneHistogram.draw(ctx);
        }

        // Draw a border with the target color
        ctx.strokeStyle = getColorForValue(this.target);
        ctx.lineWidth = margin;
        ctx.strokeRect(x + margin / 2, y + margin / 2, cellWidth - margin, cellHeight - margin);

    }
}