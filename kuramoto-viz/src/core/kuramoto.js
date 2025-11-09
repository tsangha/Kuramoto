/**
 * Kuramoto Model Engine
 * Implements the coupled oscillator dynamics with RK4 integration
 */

export class KuramotoModel {
  constructor(config = {}) {
    this.N = config.N || 50; // Number of oscillators
    this.K = config.K || 2.0; // Coupling strength
    this.dt = config.dt || 0.05; // Time step
    this.noiseLevel = config.noiseLevel || 0.0;
    this.phaseLag = config.phaseLag || 0.0; // α parameter for time delays

    // State variables
    this.theta = new Float32Array(this.N); // Current phases
    this.omega = new Float32Array(this.N); // Natural frequencies
    this.adjacency = null; // Network adjacency matrix

    // History for plotting
    this.time = 0;
    this.history = {
      time: [],
      orderParameter: [],
      phases: []
    };
    this.maxHistoryLength = 10000; // Increased to keep more history for full context view

    this.initialize();
  }

  /**
   * Initialize oscillators with random phases and frequencies
   */
  initialize() {
    // Random initial phases in [-π, π]
    for (let i = 0; i < this.N; i++) {
      this.theta[i] = (Math.random() * 2 - 1) * Math.PI;
      // Natural frequencies from normal distribution N(0, 1)
      this.omega[i] = this.randomNormal(0, 1);
    }

    // Reset time and history
    this.time = 0;
    this.history = {
      time: [],
      orderParameter: [],
      phases: []
    };
  }

  /**
   * Generate random number from normal distribution (Box-Muller transform)
   */
  randomNormal(mean = 0, stdDev = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Compute derivatives dθ/dt for all oscillators
   * dθ_i/dt = ω_i + η_i(t) + (1/N) × Σ_j S_ij × sin(θ_j - θ_i - α)
   */
  computeDerivatives(theta) {
    const dtheta = new Float32Array(this.N);

    for (let i = 0; i < this.N; i++) {
      // Natural frequency term
      dtheta[i] = this.omega[i];

      // Noise term
      if (this.noiseLevel > 0) {
        dtheta[i] += this.noiseLevel * this.randomNormal(0, 0.1);
      }

      // Coupling term
      let coupling = 0;
      for (let j = 0; j < this.N; j++) {
        if (i !== j) {
          const S_ij = this.adjacency ? this.adjacency[i][j] : 1.0;
          coupling += S_ij * Math.sin(theta[j] - theta[i] - this.phaseLag);
        }
      }

      // Normalize by N for all-to-all, or by degree for sparse networks
      dtheta[i] += (this.K / this.N) * coupling;
    }

    return dtheta;
  }

  /**
   * RK4 integration step
   */
  step() {
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
      // Wrap phases to [-π, π]
      while (this.theta[i] > Math.PI) this.theta[i] -= 2 * Math.PI;
      while (this.theta[i] < -Math.PI) this.theta[i] += 2 * Math.PI;
    }

    this.time += dt;
    this.recordHistory();
  }

  /**
   * Calculate order parameter r(t)
   * r = |1/N × Σ_j e^(iθ_j)|
   */
  calculateOrderParameter() {
    let sumReal = 0;
    let sumImag = 0;

    for (let i = 0; i < this.N; i++) {
      sumReal += Math.cos(this.theta[i]);
      sumImag += Math.sin(this.theta[i]);
    }

    sumReal /= this.N;
    sumImag /= this.N;

    return Math.sqrt(sumReal * sumReal + sumImag * sumImag);
  }

  /**
   * Record current state to history
   */
  recordHistory() {
    const r = this.calculateOrderParameter();

    this.history.time.push(this.time);
    this.history.orderParameter.push(r);
    this.history.phases.push([...this.theta]);

    // Keep full history for complete timeline view
    // User can reset simulation if memory becomes an issue
  }

  /**
   * Update model parameters
   */
  updateParameters(params) {
    if (params.K !== undefined) this.K = params.K;
    if (params.noiseLevel !== undefined) this.noiseLevel = params.noiseLevel;
    if (params.phaseLag !== undefined) this.phaseLag = params.phaseLag;
    if (params.dt !== undefined) this.dt = params.dt;

    // If N changes, reinitialize
    if (params.N !== undefined && params.N !== this.N) {
      this.N = params.N;
      this.theta = new Float32Array(this.N);
      this.omega = new Float32Array(this.N);
      this.initialize();
    }
  }

  /**
   * Set network adjacency matrix
   */
  setNetwork(adjacencyMatrix) {
    this.adjacency = adjacencyMatrix;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      theta: [...this.theta],
      omega: [...this.omega],
      time: this.time,
      orderParameter: this.calculateOrderParameter(),
      N: this.N,
      K: this.K
    };
  }
}
