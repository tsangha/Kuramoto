/**
 * Preset Scenarios for Kuramoto Model
 * Phase-transition focused configurations for studying nonlinear dynamics
 */

export const presets = {
  // ========================================
  // CATEGORY A: CRITICAL PHENOMENA
  // ========================================

  'subcritical-chaos': {
    name: 'Subcritical Chaos',
    category: 'critical',
    description: 'Below the critical coupling - oscillators drift independently',
    watchFor: 'Order parameter r stays near 0.1-0.3, incoherent wandering',
    icon: '🌊',
    parameters: {
      N: 50,
      K: 0.3,
      noiseLevel: 0,
      phaseLag: 0
    },
    network: {
      type: 'all-to-all',
      params: {}
    },
    note: 'K < K_c ≈ 0.64 - Below phase transition threshold'
  },

  'critical-point': {
    name: 'Critical Point',
    category: 'critical',
    description: 'Exactly at the bifurcation - watch order emerge from chaos',
    watchFor: 'Slow fluctuations in r, critical slowing down, metastable clusters',
    icon: '⚡',
    parameters: {
      N: 50,
      K: 0.64,
      noiseLevel: 0,
      phaseLag: 0
    },
    network: {
      type: 'all-to-all',
      params: {}
    },
    note: 'K = K_c - System at the edge of phase transition!'
  },

  'supercritical-emergence': {
    name: 'Supercritical Emergence',
    category: 'critical',
    description: 'Just above threshold - collective behavior emerges',
    watchFor: 'r jumps to 0.5-0.7 as synchronized cluster forms',
    icon: '✨',
    parameters: {
      N: 50,
      K: 1.0,
      noiseLevel: 0,
      phaseLag: 0
    },
    network: {
      type: 'all-to-all',
      params: {}
    },
    note: 'K ≈ 1.5·K_c - Weak synchronization emerges'
  },

  'hysteresis-bistability': {
    name: 'Bistable Regime',
    category: 'critical',
    description: 'Hysteresis zone - history matters! Try increasing/decreasing K',
    watchFor: 'Different outcomes depending on whether you increase or decrease K',
    icon: '🔄',
    parameters: {
      N: 50,
      K: 0.8,
      noiseLevel: 0.05,
      phaseLag: 0
    },
    network: {
      type: 'all-to-all',
      params: {}
    },
    note: 'Use +/- keys to explore hysteresis loop'
  },

  // ========================================
  // CATEGORY B: NETWORK TOPOLOGY EFFECTS
  // ========================================

  'ring-subcritical': {
    name: 'Ring: Subcritical',
    category: 'topology',
    description: 'Ring topology needs much higher K_c than all-to-all',
    watchFor: 'Even at K=2.0, r remains low due to local-only coupling',
    icon: '⭕',
    parameters: {
      N: 60,
      K: 2.0,
      noiseLevel: 0,
      phaseLag: 0
    },
    network: {
      type: 'ring',
      params: {
        k: 2
      }
    },
    note: 'K << K_c(ring) - Topology dramatically affects critical point'
  },

  'small-world-boost': {
    name: 'Small-World Boost',
    category: 'topology',
    description: 'Few random shortcuts drastically lower K_c (Watts-Strogatz effect)',
    watchFor: 'Shortcuts create fast synchronization pathways, r increases',
    icon: '🌐',
    parameters: {
      N: 60,
      K: 1.5,
      noiseLevel: 0,
      phaseLag: 0
    },
    network: {
      type: 'small-world',
      params: {
        k: 4,
        rewiringProb: 0.1
      }
    },
    note: 'Just 10% rewiring enables sync at much lower K'
  },

  'scale-free-hubs': {
    name: 'Hub Synchronization',
    category: 'topology',
    description: 'Highly-connected hubs act as pacemakers',
    watchFor: 'Hubs synchronize first, then entrain peripheral nodes',
    icon: '🕸️',
    parameters: {
      N: 70,
      K: 1.2,
      noiseLevel: 0,
      phaseLag: 0
    },
    network: {
      type: 'scale-free',
      params: {
        m: 2
      }
    },
    note: 'Scale-free networks sync via hub entrainment'
  },

  // ========================================
  // CATEGORY C: COMPLEX NONLINEAR DYNAMICS
  // ========================================

  'chimera-state': {
    name: 'Chimera State',
    category: 'complex',
    description: 'Coexistence of sync and async - the ultimate paradox!',
    watchFor: 'Stable pattern: part of network syncs, part stays chaotic',
    icon: '🐉',
    parameters: {
      N: 100,
      K: 1.5,
      noiseLevel: 0,
      phaseLag: 0.1
    },
    network: {
      type: 'ring',
      params: {
        k: 8
      }
    },
    note: 'Non-local coupling creates chimera states'
  },

  'noise-induced-switching': {
    name: 'Noise-Induced Transition',
    category: 'complex',
    description: 'Stochastic resonance near K_c - noise triggers sync bursts',
    watchFor: 'r fluctuates wildly, occasional sync bursts from thermal noise',
    icon: '🎲',
    parameters: {
      N: 50,
      K: 0.5,
      noiseLevel: 0.4,
      phaseLag: 0
    },
    network: {
      type: 'all-to-all',
      params: {}
    },
    note: 'Noise can induce temporary synchronization near criticality'
  },

  'frustrated-coupling': {
    name: 'Phase-Lag Frustration',
    category: 'complex',
    description: 'Time delays prevent full synchronization (α ≈ π/2)',
    watchFor: 'Strong coupling but r plateaus below 1.0 - cant achieve full sync',
    icon: '⏱️',
    parameters: {
      N: 50,
      K: 2.5,
      noiseLevel: 0,
      phaseLag: 1.57
    },
    network: {
      type: 'all-to-all',
      params: {}
    },
    note: 'α = π/2 creates maximum frustration - sync impossible'
  }
};

/**
 * Preset categories with metadata
 */
export const categories = {
  critical: {
    name: 'Critical Phenomena',
    description: 'Explore the phase transition from chaos to order',
    icon: '⚡'
  },
  topology: {
    name: 'Network Effects',
    description: 'How network structure affects synchronization',
    icon: '🌐'
  },
  complex: {
    name: 'Complex Dynamics',
    description: 'Chimera states, noise effects, and frustration',
    icon: '🐉'
  }
};

/**
 * Get preset by ID
 */
export function getPreset(id) {
  return presets[id];
}

/**
 * Get all preset IDs
 */
export function getPresetIds() {
  return Object.keys(presets);
}

/**
 * Get all presets as array
 */
export function getPresetArray() {
  return Object.entries(presets).map(([id, preset]) => ({
    id,
    ...preset
  }));
}

/**
 * Get presets grouped by category
 */
export function getPresetsByCategory() {
  const grouped = {
    critical: [],
    topology: [],
    complex: []
  };

  Object.entries(presets).forEach(([id, preset]) => {
    grouped[preset.category].push({ id, ...preset });
  });

  return grouped;
}
