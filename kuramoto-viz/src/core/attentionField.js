/**
 * Attention Field Model
 * Kuramoto oscillators on a 2D sensory field with stimulus-driven coupling and feature binding
 *
 * Model equations:
 * dθ_ij/dt = ω_ij + K_stim × S_ij × Σ_kl W_ijkl × sin(θ_kl - θ_ij) + K_feat × Σ_kl F_ijkl × sin(θ_kl - θ_ij)
 *
 * Where:
 * - S_ij = stimulus intensity at location (i,j)
 * - W_ijkl = spatial coupling weight (decreases with distance)
 * - F_ijkl = feature similarity between (i,j) and (k,l)
 */

export class AttentionFieldModel {
  constructor(config = {}) {
    // Grid dimensions
    this.gridSize = config.gridSize || 32; // 32x32 grid
    this.N = this.gridSize * this.gridSize;

    // Base Kuramoto parameters (shared with network mode)
    this.K = config.K || 2.0; // Base coupling strength
    this.dt = config.dt || 0.05;
    this.noiseLevel = config.noiseLevel || 0.0;
    this.phaseLag = config.phaseLag || 0.0;

    // Attention-specific parameters
    this.K_stim = config.K_stim || 1.5; // Stimulus-driven coupling strength multiplier
    this.K_feat = config.K_feat || 2.0; // Feature binding coupling strength

    // Spatial coupling parameters
    this.spatialRange = config.spatialRange || 4; // Coupling neighborhood size
    this.spatialDecay = config.spatialDecay || 0.3; // Exponential decay constant

    // Network topology
    this.networkType = config.networkType || 'spatial'; // 'spatial', 'all-to-all', 'ring', 'small-world', 'scale-free', 'random'
    this.networkParams = config.networkParams || {}; // Additional params for network generation
    this.adjacency = null; // Network adjacency matrix (overrides spatial weights if set)

    // Feature dimensions
    this.numFeatures = config.numFeatures || 3; // e.g., [hue, brightness, motion]

    // State variables
    this.theta = new Float32Array(this.N); // Phases
    this.omega = new Float32Array(this.N); // Natural frequencies
    this.stimulus = new Float32Array(this.N); // Stimulus intensity field
    this.features = Array(this.N).fill(null).map(() => new Float32Array(this.numFeatures));

    // Moving stimuli (objects to track)
    this.stimulusObjects = [];

    // History
    this.time = 0;
    this.history = {
      time: [],
      attentionMap: [], // Synchronization strength by location
      trackedObjects: [] // Which objects are being tracked
    };

    // Precompute spatial coupling weights
    this.spatialWeights = this.computeSpatialWeights();

    this.initialize();
  }

  /**
   * Initialize oscillators and stimulus field
   */
  initialize() {
    // Random initial phases
    for (let i = 0; i < this.N; i++) {
      this.theta[i] = (Math.random() * 2 - 1) * Math.PI;
      this.omega[i] = this.randomNormal(0, 0.5); // Small frequency spread
      this.stimulus[i] = 0.0; // Start with no stimulus
    }

    // Initialize features as neutral
    for (let i = 0; i < this.N; i++) {
      for (let f = 0; f < this.numFeatures; f++) {
        this.features[i][f] = 0.5; // Neutral feature values
      }
    }

    this.time = 0;
    this.history = {
      time: [],
      attentionMap: [],
      trackedObjects: []
    };
  }

  /**
   * Precompute spatial coupling weights W_ijkl
   * Uses Gaussian-like decay based on distance
   */
  computeSpatialWeights() {
    const weights = new Float32Array(this.N * this.N);

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const idx1 = i * this.gridSize + j;

        for (let k = 0; k < this.gridSize; k++) {
          for (let l = 0; l < this.gridSize; l++) {
            const idx2 = k * this.gridSize + l;

            if (idx1 === idx2) {
              weights[idx1 * this.N + idx2] = 0;
              continue;
            }

            // Euclidean distance
            const dx = i - k;
            const dy = j - l;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Exponential decay with cutoff
            if (dist <= this.spatialRange) {
              weights[idx1 * this.N + idx2] = Math.exp(-this.spatialDecay * dist);
            } else {
              weights[idx1 * this.N + idx2] = 0;
            }
          }
        }
      }
    }

    return weights;
  }

  /**
   * Add a moving stimulus object to the field
   */
  addStimulusObject(obj) {
    this.stimulusObjects.push({
      id: obj.id || Math.random().toString(36),
      x: obj.x || this.gridSize / 2,
      y: obj.y || this.gridSize / 2,
      vx: obj.vx || 0,
      vy: obj.vy || 0,
      radius: obj.radius || 3,
      intensity: obj.intensity || 1.0,
      features: obj.features || Array(this.numFeatures).fill(0.5)
    });
  }

  /**
   * Update stimulus field based on object positions
   */
  updateStimulusField() {
    // Clear stimulus field
    this.stimulus.fill(0);

    // Clear features
    for (let i = 0; i < this.N; i++) {
      this.features[i].fill(0.5); // Reset to neutral
    }

    // Update object positions
    for (const obj of this.stimulusObjects) {
      obj.x += obj.vx * this.dt;
      obj.y += obj.vy * this.dt;

      // Bounce off boundaries with damping (2-cell padding zone)
      const padding = 2;
      if (obj.x < padding || obj.x >= this.gridSize - padding) {
        obj.vx *= -0.95; // Bounce with slight damping
        obj.x = Math.max(padding, Math.min(this.gridSize - padding, obj.x));
      }
      if (obj.y < padding || obj.y >= this.gridSize - padding) {
        obj.vy *= -0.95; // Bounce with slight damping
        obj.y = Math.max(padding, Math.min(this.gridSize - padding, obj.y));
      }

      // Project onto grid with Gaussian falloff
      for (let i = 0; i < this.gridSize; i++) {
        for (let j = 0; j < this.gridSize; j++) {
          const dx = i - obj.x;
          const dy = j - obj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= obj.radius * 2) {
            const idx = i * this.gridSize + j;
            const activation = obj.intensity * Math.exp(-0.5 * (dist / obj.radius) ** 2);

            // Add stimulus intensity
            this.stimulus[idx] = Math.max(this.stimulus[idx], activation);

            // Set features (blend if multiple objects overlap)
            if (activation > 0.1) {
              for (let f = 0; f < this.numFeatures; f++) {
                this.features[idx][f] = this.features[idx][f] * (1 - activation) +
                                       obj.features[f] * activation;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Compute feature similarity between two grid positions
   * Returns cosine similarity in feature space
   */
  computeFeatureSimilarity(idx1, idx2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let f = 0; f < this.numFeatures; f++) {
      const f1 = this.features[idx1][f];
      const f2 = this.features[idx2][f];
      dotProduct += f1 * f2;
      mag1 += f1 * f1;
      mag2 += f2 * f2;
    }

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  /**
   * Compute derivatives for all oscillators
   */
  computeDerivatives(theta) {
    const dtheta = new Float32Array(this.N);

    for (let idx = 0; idx < this.N; idx++) {
      // Natural frequency
      dtheta[idx] = this.omega[idx];

      // Noise
      if (this.noiseLevel > 0) {
        dtheta[idx] += this.noiseLevel * this.randomNormal(0, 0.1);
      }

      // Stimulus-driven coupling (uses network adjacency if set, otherwise spatial weights)
      let stimulusCoupling = 0;
      for (let jdx = 0; jdx < this.N; jdx++) {
        if (idx === jdx) continue;

        // Use adjacency matrix if provided, otherwise use spatial weights
        let weight;
        if (this.adjacency) {
          const i = Math.floor(idx / this.gridSize);
          const j = idx % this.gridSize;
          const k = Math.floor(jdx / this.gridSize);
          const l = jdx % this.gridSize;
          weight = this.adjacency[i * this.gridSize + j][k * this.gridSize + l];
        } else {
          weight = this.spatialWeights[idx * this.N + jdx];
        }

        if (weight > 0) {
          const stimFactor = (this.stimulus[idx] + this.stimulus[jdx]) / 2;
          stimulusCoupling += weight * stimFactor *
                             Math.sin(theta[jdx] - theta[idx] - this.phaseLag);
        }
      }

      // Feature binding coupling
      let featureCoupling = 0;
      for (let jdx = 0; jdx < this.N; jdx++) {
        if (idx === jdx) continue;

        // Use adjacency matrix if provided, otherwise use spatial weights
        let weight;
        if (this.adjacency) {
          const i = Math.floor(idx / this.gridSize);
          const j = idx % this.gridSize;
          const k = Math.floor(jdx / this.gridSize);
          const l = jdx % this.gridSize;
          weight = this.adjacency[i * this.gridSize + j][k * this.gridSize + l];
        } else {
          weight = this.spatialWeights[idx * this.N + jdx];
        }

        if (weight > 0) {
          const featureSim = this.computeFeatureSimilarity(idx, jdx);
          if (featureSim > 0.5) { // Only couple if features are similar
            featureCoupling += weight * featureSim *
                              Math.sin(theta[jdx] - theta[idx] - this.phaseLag);
          }
        }
      }

      // Total coupling: Base K * (stimulus_modulation + feature_modulation)
      dtheta[idx] += (this.K / this.N) * (this.K_stim * stimulusCoupling + this.K_feat * featureCoupling);
    }

    return dtheta;
  }

  /**
   * RK4 integration step
   */
  step() {
    // Update stimulus field from moving objects
    this.updateStimulusField();

    const dt = this.dt;
    const theta0 = new Float32Array(this.theta);

    // k1 = f(t, y)
    const k1 = this.computeDerivatives(theta0);

    // k2 = f(t + dt/2, y + dt*k1/2)
    const theta1 = new Float32Array(this.N);
    for (let i = 0; i < this.N; i++) {
      theta1[i] = theta0[i] + 0.5 * dt * k1[i];
    }
    const k2 = this.computeDerivatives(theta1);

    // k3 = f(t + dt/2, y + dt*k2/2)
    const theta2 = new Float32Array(this.N);
    for (let i = 0; i < this.N; i++) {
      theta2[i] = theta0[i] + 0.5 * dt * k2[i];
    }
    const k3 = this.computeDerivatives(theta2);

    // k4 = f(t + dt, y + dt*k3)
    const theta3 = new Float32Array(this.N);
    for (let i = 0; i < this.N; i++) {
      theta3[i] = theta0[i] + dt * k3[i];
    }
    const k4 = this.computeDerivatives(theta3);

    // y_new = y + dt/6 * (k1 + 2*k2 + 2*k3 + k4)
    for (let i = 0; i < this.N; i++) {
      this.theta[i] = theta0[i] + (dt / 6.0) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]);
      // Wrap phases
      while (this.theta[i] > Math.PI) this.theta[i] -= 2 * Math.PI;
      while (this.theta[i] < -Math.PI) this.theta[i] += 2 * Math.PI;
    }

    this.time += dt;
    this.recordHistory();
  }

  /**
   * Calculate local attention strength (synchronization) for each grid position
   */
  calculateAttentionMap() {
    const attentionMap = new Float32Array(this.N);

    for (let idx = 0; idx < this.N; idx++) {
      // Calculate local order parameter (synchronization with neighbors)
      let sumReal = 0;
      let sumImag = 0;
      let count = 0;

      for (let jdx = 0; jdx < this.N; jdx++) {
        const weight = this.spatialWeights[idx * this.N + jdx];
        if (weight > 0) {
          sumReal += Math.cos(this.theta[jdx]);
          sumImag += Math.sin(this.theta[jdx]);
          count++;
        }
      }

      if (count > 0) {
        sumReal /= count;
        sumImag /= count;
        attentionMap[idx] = Math.sqrt(sumReal * sumReal + sumImag * sumImag);
      }
    }

    return attentionMap;
  }

  /**
   * Detect which objects are being attended (tracked)
   */
  detectTrackedObjects() {
    const attentionMap = this.calculateAttentionMap();
    const tracked = [];

    for (const obj of this.stimulusObjects) {
      // Sample attention around object center
      const cx = Math.floor(obj.x);
      const cy = Math.floor(obj.y);
      let totalAttention = 0;
      let count = 0;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const i = (cx + dx + this.gridSize) % this.gridSize;
          const j = (cy + dy + this.gridSize) % this.gridSize;
          const idx = i * this.gridSize + j;
          totalAttention += attentionMap[idx];
          count++;
        }
      }

      const avgAttention = totalAttention / count;

      if (avgAttention > 0.6) { // Threshold for "attended"
        tracked.push({
          id: obj.id,
          attention: avgAttention,
          position: [obj.x, obj.y]
        });
      }
    }

    return tracked;
  }

  /**
   * Record history
   */
  recordHistory() {
    const attentionMap = this.calculateAttentionMap();
    const tracked = this.detectTrackedObjects();

    this.history.time.push(this.time);
    this.history.attentionMap.push(Array.from(attentionMap));
    this.history.trackedObjects.push(tracked);

    // Keep last 500 frames
    if (this.history.time.length > 500) {
      this.history.time.shift();
      this.history.attentionMap.shift();
      this.history.trackedObjects.shift();
    }
  }

  /**
   * Random normal distribution
   */
  randomNormal(mean = 0, stdDev = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Set network adjacency matrix
   */
  setNetwork(adjacencyMatrix, networkType = 'custom', networkParams = {}) {
    this.adjacency = adjacencyMatrix;
    this.networkType = networkType;
    this.networkParams = networkParams;
  }

  /**
   * Update parameters
   */
  updateParameters(params) {
    // Base Kuramoto parameters
    if (params.K !== undefined) this.K = params.K;
    if (params.noiseLevel !== undefined) this.noiseLevel = params.noiseLevel;
    if (params.phaseLag !== undefined) this.phaseLag = params.phaseLag;
    if (params.dt !== undefined) this.dt = params.dt;

    // Attention-specific parameters
    if (params.K_stim !== undefined) this.K_stim = params.K_stim;
    if (params.K_feat !== undefined) this.K_feat = params.K_feat;
    if (params.spatialRange !== undefined) {
      this.spatialRange = params.spatialRange;
      this.spatialWeights = this.computeSpatialWeights(); // Recompute
    }
    if (params.networkType !== undefined) {
      this.networkType = params.networkType;
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      theta: Array.from(this.theta),
      stimulus: Array.from(this.stimulus),
      attentionMap: Array.from(this.calculateAttentionMap()),
      features: this.features.map(f => Array.from(f)),
      objects: this.stimulusObjects.map(obj => ({...obj})),
      trackedObjects: this.detectTrackedObjects(),
      time: this.time,
      gridSize: this.gridSize
    };
  }
}
