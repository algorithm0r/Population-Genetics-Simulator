class Organism {
    constructor(other) {
        this.genes = [];
        for(let i = 0; i < PARAMS.numLocii; i++) {
            this.genes.push(new RealGene(other?.genes[i]));
        }
        this.genotype = this.updatePhenotype();
        this.phenotype = this.genotype;
        this.cueNoise = generateNormalSample(0,PARAMS.targetObservationalNoise)

        // cue/adjust timing state (2026-08-28): registeredCue is the measurement the
        // organism is currently acting on; pendingCues is the delay line of
        // measurements taken but not yet consumed (adjustDelay ticks from cue to
        // adjustment — a queue, so live cues with a delay pipeline correctly).
        this.registeredCue = null;
        this.pendingCues = [];
        this.cueClock = 0;
    }

    updatePhenotype() {
        let sum = 0;
        for(let i = 0; i < PARAMS.numLocii; i++) {
            sum += this.genes[i].value;
        }
        return sum;
    }

    mutate() {
        for(let i = 0; i < PARAMS.numLocii; i++) {
            if(Math.random() < PARAMS.mutationRate) this.genes[i].mutate();
        }
    }
    
    // cue event: measure the environment (with this organism's lifelong perception
    // error) and schedule the adjustment that will consume the measurement.
    // Fast path (adjustDelay 0, the default): the measurement registers immediately,
    // with no allocation — identical cost and arithmetic to the original code.
    sampleCue(target) {
        if (PARAMS.adjustDelay === 0) this.registeredCue = target + this.cueNoise;
        else this.pendingCues.push({ value: target + this.cueNoise, in: PARAMS.adjustDelay });
    }

    // adjust event: deploy plastic change toward a (possibly stale) registered cue.
    // "linear" = instant partial compensation recomputed from the genotype (idempotent
    // against a frozen cue, so with cuePeriod 0 it is a one-shot developmental norm);
    // "step" = the original bounded increment, no overshoot.
    adjustToward(cue) {
        if (PARAMS.plasticityModel === "linear") {
            this.phenotype = this.genotype + PARAMS.reactionNormSlope * (cue - this.genotype);
            return;
        }

        let difference = cue - this.phenotype;
        let sign = Math.sign(difference);

        let step = sign*Math.min(generateNormalSample(PARAMS.adaptiveStepSize, PARAMS.adaptiveStepSize), Math.abs(difference));

        this.phenotype += step;
    }

    // Cue/adjust timing architecture (2026-08-28). Defaults (cuePeriod 1,
    // adjustDelay 0, birthCue "post") reproduce the original per-tick behavior with
    // identical arithmetic and RNG draws. cuePeriod 0 = the birth cue is never
    // re-sampled (developmental registration: the organism chases the world it was
    // born into); adjustDelay d = adjustment begins d ticks after its cue.
    adapt(target) {
        const firstTick = this.cueClock === 0;
        const due = firstTick
            ? (this.registeredCue === null && this.pendingCues.length === 0)   // birth cue, unless it already fired at construction (birthCue "pre")
            : (PARAMS.cuePeriod >= 1 && this.cueClock % PARAMS.cuePeriod === 0);
        if (due) this.sampleCue(target);
        this.cueClock++;

        // delay line: a cue taken at tick T registers (and starts being acted on) at
        // tick T + adjustDelay; the queue keeps live cues from clobbering one another
        if (this.pendingCues.length) {
            while (this.pendingCues.length && this.pendingCues[0].in === 0) this.registeredCue = this.pendingCues.shift().value;
            for (const c of this.pendingCues) c.in--;
        }

        if (this.registeredCue === null) return;   // nothing to act on yet
        this.adjustToward(this.registeredCue);
    }

    // birthCue "pre": the birth cue fires at construction and (when adjustDelay is 0)
    // its adjustment is applied immediately — BEFORE the newborn's first selection
    // and birth migration. With cuePeriod 0 + the linear model this is the pure
    // Chevin/Lande developmental reaction norm: one cue, one adjustment, fixed for
    // life — and no honest-newborn window.
    developAtBirth(target) {
        this.sampleCue(target);
        if (this.registeredCue !== null) this.adjustToward(this.registeredCue);
        // with adjustDelay > 0 the birth cue sits in the delay line and its
        // adjustment fires in the tick loop, delay ticks after birth
    }

    update() {
        
    }

    draw(ctx) {
       
    }
}