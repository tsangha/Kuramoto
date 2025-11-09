/**
 * Insight Detection System
 * Analyzes saved runs to detect patterns and generate educational insights
 */

import { estimateCriticalCoupling, classifyRegime } from './runMetrics';

/**
 * Detect all insights from a collection of runs
 * @param {Array} runs - Array of run objects
 * @returns {Array} Array of insight objects
 */
export function detectInsights(runs) {
  if (!runs || runs.length === 0) return [];

  const insights = [];

  // Detect phase transition
  const phaseTransitionInsight = detectPhaseTransition(runs);
  if (phaseTransitionInsight) insights.push(phaseTransitionInsight);

  // Detect topology effects
  const topologyInsight = detectTopologyEffect(runs);
  if (topologyInsight) insights.push(topologyInsight);

  // Detect noise effects
  const noiseInsight = detectNoiseEffect(runs);
  if (noiseInsight) insights.push(noiseInsight);

  // Detect hysteresis pattern
  const hysteresisInsight = detectHysteresis(runs);
  if (hysteresisInsight) insights.push(hysteresisInsight);

  // Detect parameter sweep opportunities
  const sweepSuggestion = suggestParameterSweep(runs);
  if (sweepSuggestion) insights.push(sweepSuggestion);

  return insights;
}

/**
 * Detect if runs show evidence of phase transition
 */
function detectPhaseTransition(runs) {
  // Need at least 3 runs with same network type
  const runsByNetwork = groupByNetwork(runs);

  for (const [networkType, networkRuns] of Object.entries(runsByNetwork)) {
    if (networkRuns.length < 3) continue;

    // Sort by K value
    const sortedByK = [...networkRuns].sort((a, b) => a.parameters.K - b.parameters.K);

    // Check for jump in r value as K increases
    for (let i = 0; i < sortedByK.length - 1; i++) {
      const current = sortedByK[i];
      const next = sortedByK[i + 1];

      const deltaK = next.parameters.K - current.parameters.K;
      const deltaR = next.metrics.finalR - current.metrics.finalR;

      // Large jump in r with small change in K indicates phase transition
      if (deltaK < 0.5 && deltaR > 0.4) {
        const Kc = estimateCriticalCoupling(networkType);
        const transitionK = (current.parameters.K + next.parameters.K) / 2;

        return {
          type: 'phase-transition',
          icon: '⚡',
          title: 'Phase Transition Detected!',
          description: `Your runs show a dramatic jump in synchronization around K ≈ ${transitionK.toFixed(2)}. This is the critical coupling where the system transitions from chaos to order.`,
          details: `For ${formatNetworkType(networkType)} networks, the theoretical critical coupling is K_c ≈ ${Kc.toFixed(2)}. Your observed transition at K ≈ ${transitionK.toFixed(2)} ${Math.abs(transitionK - Kc) < 0.2 ? 'matches theory perfectly' : 'shows the empirical behavior'}.`,
          action: `Try K values between ${(transitionK - 0.2).toFixed(2)} and ${(transitionK + 0.2).toFixed(2)} to map the transition precisely.`,
          priority: 'high'
        };
      }
    }
  }

  return null;
}

/**
 * Detect if different network topologies produce different outcomes
 */
function detectTopologyEffect(runs) {
  // Need runs with same K but different networks
  const runsByK = {};

  runs.forEach(run => {
    const K = run.parameters.K.toFixed(1);
    if (!runsByK[K]) runsByK[K] = [];
    runsByK[K].push(run);
  });

  for (const [K, runsAtK] of Object.entries(runsByK)) {
    const networkTypes = new Set(runsAtK.map(r => r.network.type));

    if (networkTypes.size >= 2) {
      // Calculate variance in r values
      const rValues = runsAtK.map(r => r.metrics.finalR);
      const meanR = rValues.reduce((sum, r) => sum + r, 0) / rValues.length;
      const variance = rValues.reduce((sum, r) => sum + Math.pow(r - meanR, 2), 0) / rValues.length;

      // Large variance indicates topology matters
      if (variance > 0.05) {
        const bestNetwork = runsAtK.reduce((best, run) =>
          run.metrics.finalR > best.metrics.finalR ? run : best
        );
        const worstNetwork = runsAtK.reduce((worst, run) =>
          run.metrics.finalR < worst.metrics.finalR ? run : worst
        );

        return {
          type: 'topology-effect',
          icon: '🌐',
          title: 'Network Topology Matters!',
          description: `At K = ${K}, different network structures produce vastly different synchronization levels.`,
          details: `${formatNetworkType(bestNetwork.network.type)} achieved r = ${bestNetwork.metrics.finalR.toFixed(3)}, while ${formatNetworkType(worstNetwork.network.type)} only reached r = ${worstNetwork.metrics.finalR.toFixed(3)}. This shows how network structure affects collective behavior.`,
          action: 'Try the same K value with all network types to see the full spectrum of topological effects.',
          priority: 'medium'
        };
      }
    }
  }

  return null;
}

/**
 * Detect impact of noise on synchronization
 */
function detectNoiseEffect(runs) {
  // Find runs with same parameters except noise
  const noiseRuns = runs.filter(r => r.parameters.noiseLevel > 0);
  const cleanRuns = runs.filter(r => r.parameters.noiseLevel === 0);

  if (noiseRuns.length === 0 || cleanRuns.length === 0) return null;

  // Find matching pairs (same K, N, network, different noise)
  for (const noisyRun of noiseRuns) {
    const matchingClean = cleanRuns.find(clean =>
      Math.abs(clean.parameters.K - noisyRun.parameters.K) < 0.1 &&
      clean.parameters.N === noisyRun.parameters.N &&
      clean.network.type === noisyRun.network.type
    );

    if (matchingClean) {
      const rDrop = matchingClean.metrics.finalR - noisyRun.metrics.finalR;

      if (rDrop > 0.2) {
        return {
          type: 'noise-effect',
          icon: '🎲',
          title: 'Noise Disrupts Synchronization',
          description: `Adding ${(noisyRun.parameters.noiseLevel * 100).toFixed(0)}% noise reduced synchronization by ${(rDrop * 100).toFixed(0)}%.`,
          details: `Clean system: r = ${matchingClean.metrics.finalR.toFixed(3)}, With noise: r = ${noisyRun.metrics.finalR.toFixed(3)}. Stochastic fluctuations can prevent oscillators from locking together.`,
          action: 'Near the critical point, even small noise can have dramatic effects. Try noise levels from 0 to 0.5 to see the transition.',
          priority: 'medium'
        };
      }
    }
  }

  return null;
}

/**
 * Detect hysteresis or bistability
 */
function detectHysteresis(runs) {
  // Look for runs with similar K in the critical region but different final r
  const criticalRuns = runs.filter(run => {
    const regime = classifyRegime(run.parameters.K, run.network.type);
    return regime === 'critical';
  });

  if (criticalRuns.length < 2) return null;

  // Group by K value (within tolerance)
  const kGroups = {};
  criticalRuns.forEach(run => {
    const kBin = Math.round(run.parameters.K * 10) / 10;
    if (!kGroups[kBin]) kGroups[kBin] = [];
    kGroups[kBin].push(run);
  });

  for (const [k, group] of Object.entries(kGroups)) {
    if (group.length >= 2) {
      const rValues = group.map(r => r.metrics.finalR);
      const maxR = Math.max(...rValues);
      const minR = Math.min(...rValues);

      // Large spread suggests bistability
      if (maxR - minR > 0.3) {
        return {
          type: 'hysteresis',
          icon: '🔄',
          title: 'Bistability Detected!',
          description: `At K ≈ ${k}, you observed both high (r = ${maxR.toFixed(3)}) and low (r = ${minR.toFixed(3)}) synchronization states.`,
          details: 'This is hysteresis! In the critical region, history matters. The system can settle into different stable states depending on initial conditions or the path taken through parameter space.',
          action: 'Try approaching this K value from both directions: increase from subcritical and decrease from supercritical to see the hysteresis loop.',
          priority: 'high'
        };
      }
    }
  }

  return null;
}

/**
 * Suggest next parameter to explore
 */
function suggestParameterSweep(runs) {
  if (runs.length < 2) {
    return {
      type: 'suggestion',
      icon: '💡',
      title: 'Start Your Parameter Journey',
      description: 'You have a few saved runs. Try loading different presets to explore parameter space!',
      details: 'Recommended path: Start with "Subcritical Chaos", then "Critical Point", then "Supercritical Emergence" to see the phase transition.',
      action: 'Press P to open presets and select one from the Critical Phenomena category.',
      priority: 'low'
    };
  }

  // Check if user has explored K range
  const kValues = runs.map(r => r.parameters.K);
  const minK = Math.min(...kValues);
  const maxK = Math.max(...kValues);
  const kRange = maxK - minK;

  if (kRange < 1.0) {
    return {
      type: 'suggestion',
      icon: '🎯',
      title: 'Expand Your K Range',
      description: `Your runs span K = ${minK.toFixed(2)} to ${maxK.toFixed(2)}. Try a wider range to see the full phase diagram!`,
      details: 'The phase transition typically occurs around K = 0.6-0.8 for all-to-all networks. Explore from K = 0 to K = 2 to see the full picture.',
      action: 'Use the +/- keys to adjust K, saving runs at different values.',
      priority: 'medium'
    };
  }

  // Check if user has tried different networks
  const networkTypes = new Set(runs.map(r => r.network.type));
  if (networkTypes.size === 1) {
    const currentType = [...networkTypes][0];
    return {
      type: 'suggestion',
      icon: '🌐',
      title: 'Explore Network Topologies',
      description: `All your runs use ${formatNetworkType(currentType)} networks. Try different topologies to see how structure affects dynamics!`,
      details: 'Different networks have different critical couplings. Ring networks need much higher K than all-to-all. Small-world networks are intermediate.',
      action: 'In the control panel, change the network topology and run the same K values.',
      priority: 'medium'
    };
  }

  return null;
}

/**
 * Group runs by network type
 */
function groupByNetwork(runs) {
  const groups = {};
  runs.forEach(run => {
    const type = run.network.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(run);
  });
  return groups;
}

/**
 * Format network type for display
 */
function formatNetworkType(type) {
  const names = {
    'all-to-all': 'All-to-All',
    'ring': 'Ring',
    'small-world': 'Small-World',
    'scale-free': 'Scale-Free',
    'random': 'Random'
  };
  return names[type] || type;
}
