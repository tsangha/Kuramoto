/**
 * Run Metrics Utility
 * Calculates summary statistics from simulation history
 */

/**
 * Calculate comprehensive metrics from a model's history
 * @param {Object} history - { time: [], orderParameter: [], phases: [] }
 * @returns {Object} Metrics summary
 */
export function calculateRunMetrics(history) {
  if (!history || !history.orderParameter || history.orderParameter.length === 0) {
    return {
      finalR: 0,
      meanR: 0,
      stdR: 0,
      minR: 0,
      maxR: 0,
      settlingTime: null,
      converged: false,
      oscillating: false
    };
  }

  const r = history.orderParameter;
  const time = history.time;
  const n = r.length;

  // Basic statistics
  const finalR = r[n - 1];
  const meanR = r.reduce((sum, val) => sum + val, 0) / n;
  const variance = r.reduce((sum, val) => sum + Math.pow(val - meanR, 2), 0) / n;
  const stdR = Math.sqrt(variance);
  const minR = Math.min(...r);
  const maxR = Math.max(...r);

  // Settling time - time to reach 90% of final value and stay there
  const settlingTime = calculateSettlingTime(time, r, finalR);

  // Convergence check - has the system settled to a stable state?
  const converged = checkConvergence(r, finalR, stdR);

  // Oscillation detection - is r oscillating around a mean?
  const oscillating = detectOscillation(r);

  return {
    finalR: parseFloat(finalR.toFixed(4)),
    meanR: parseFloat(meanR.toFixed(4)),
    stdR: parseFloat(stdR.toFixed(4)),
    minR: parseFloat(minR.toFixed(4)),
    maxR: parseFloat(maxR.toFixed(4)),
    settlingTime,
    converged,
    oscillating
  };
}

/**
 * Calculate time to reach 90% of final value and stay there
 */
function calculateSettlingTime(time, r, finalR) {
  if (time.length === 0) return null;

  const threshold = 0.9 * finalR;
  const tolerance = 0.05 * finalR; // 5% tolerance band
  const sustainPeriod = Math.min(50, Math.floor(r.length * 0.1)); // Must stay settled for 10% of run

  for (let i = 0; i < r.length - sustainPeriod; i++) {
    // Check if value is above threshold
    if (r[i] >= threshold) {
      // Check if it stays in tolerance band for sustained period
      let settled = true;
      for (let j = i; j < i + sustainPeriod; j++) {
        if (Math.abs(r[j] - finalR) > tolerance) {
          settled = false;
          break;
        }
      }

      if (settled) {
        return parseFloat(time[i].toFixed(2));
      }
    }
  }

  return null; // Never settled
}

/**
 * Check if system has converged to stable state
 */
function checkConvergence(r, finalR, stdR) {
  if (r.length < 100) return false; // Need enough data

  // Check last 20% of simulation
  const checkStart = Math.floor(r.length * 0.8);
  const recentR = r.slice(checkStart);

  // Calculate variance of recent values
  const recentMean = recentR.reduce((sum, val) => sum + val, 0) / recentR.length;
  const recentVar = recentR.reduce((sum, val) => sum + Math.pow(val - recentMean, 2), 0) / recentR.length;
  const recentStd = Math.sqrt(recentVar);

  // Converged if recent variance is low
  const converged = recentStd < 0.05; // Less than 5% fluctuation

  return converged;
}

/**
 * Detect if r is oscillating
 */
function detectOscillation(r) {
  if (r.length < 100) return false;

  // Check last 50% of simulation
  const checkStart = Math.floor(r.length * 0.5);
  const recentR = r.slice(checkStart);

  // Count zero crossings of derivative
  let crossings = 0;
  for (let i = 1; i < recentR.length - 1; i++) {
    const prev = recentR[i] - recentR[i - 1];
    const next = recentR[i + 1] - recentR[i];

    // Sign change in derivative indicates local extremum
    if (prev * next < 0) {
      crossings++;
    }
  }

  // If many crossings, likely oscillating
  const crossingRate = crossings / recentR.length;
  return crossingRate > 0.05; // More than 5% of points are local extrema
}

/**
 * Calculate network statistics from adjacency matrix
 */
export function calculateNetworkStats(adjacency, N) {
  if (!adjacency || adjacency.length === 0) {
    return {
      avgDegree: 0,
      maxDegree: 0,
      minDegree: 0,
      degrees: []
    };
  }

  // Calculate degree for each node
  const degrees = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (adjacency[i][j] !== 0 && i !== j) {
        degrees[i]++;
      }
    }
  }

  const avgDegree = degrees.reduce((sum, d) => sum + d, 0) / N;
  const maxDegree = Math.max(...degrees);
  const minDegree = Math.min(...degrees);

  return {
    avgDegree: parseFloat(avgDegree.toFixed(2)),
    maxDegree,
    minDegree,
    degrees
  };
}

/**
 * Estimate critical coupling for all-to-all network
 * K_c ≈ 2/(π * g(0)) where g is frequency distribution
 * For standard normal: K_c ≈ 0.64
 */
export function estimateCriticalCoupling(networkType) {
  switch (networkType) {
    case 'all-to-all':
      return 0.64;
    case 'ring':
      return 2.0; // Much higher for local coupling
    case 'small-world':
      return 1.0; // Intermediate
    case 'scale-free':
      return 0.8; // Slightly higher than all-to-all
    case 'random':
      return 1.2; // Depends on density
    default:
      return 0.64;
  }
}

/**
 * Classify synchronization state based on final r
 */
export function classifySyncState(finalR) {
  if (finalR < 0.2) return 'incoherent';
  if (finalR < 0.5) return 'weakly synchronized';
  if (finalR < 0.8) return 'partially synchronized';
  if (finalR < 0.95) return 'strongly synchronized';
  return 'fully synchronized';
}

/**
 * Determine if run is in subcritical, critical, or supercritical regime
 */
export function classifyRegime(K, networkType) {
  const Kc = estimateCriticalCoupling(networkType);
  const ratio = K / Kc;

  if (ratio < 0.85) return 'subcritical';
  if (ratio < 1.15) return 'critical';
  return 'supercritical';
}
