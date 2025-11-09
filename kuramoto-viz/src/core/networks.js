/**
 * Network Topology Generators
 * Creates various network structures for oscillator coupling
 */

/**
 * Create all-to-all (fully connected) network
 */
export function createAllToAll(N) {
  const adjacency = Array(N).fill(null).map(() => Array(N).fill(0));

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i !== j) {
        adjacency[i][j] = 1;
      }
    }
  }

  return {
    adjacency,
    edges: getAllEdges(adjacency, N),
    type: 'all-to-all'
  };
}

/**
 * Create random (Erdős-Rényi) network
 */
export function createRandom(N, probability = 0.1) {
  const adjacency = Array(N).fill(null).map(() => Array(N).fill(0));

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (Math.random() < probability) {
        adjacency[i][j] = 1;
        adjacency[j][i] = 1; // Undirected
      }
    }
  }

  return {
    adjacency,
    edges: getAllEdges(adjacency, N),
    type: 'random',
    probability
  };
}

/**
 * Create small-world (Watts-Strogatz) network
 */
export function createSmallWorld(N, k = 4, rewiringProb = 0.1) {
  const adjacency = Array(N).fill(null).map(() => Array(N).fill(0));

  // Step 1: Create ring lattice with k nearest neighbors
  for (let i = 0; i < N; i++) {
    for (let j = 1; j <= k / 2; j++) {
      const neighbor1 = (i + j) % N;
      const neighbor2 = (i - j + N) % N;

      adjacency[i][neighbor1] = 1;
      adjacency[neighbor1][i] = 1;

      if (neighbor2 !== neighbor1) {
        adjacency[i][neighbor2] = 1;
        adjacency[neighbor2][i] = 1;
      }
    }
  }

  // Step 2: Rewire edges with probability p
  const edges = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (adjacency[i][j] === 1) {
        edges.push([i, j]);
      }
    }
  }

  for (const [i, j] of edges) {
    if (Math.random() < rewiringProb) {
      // Remove old edge
      adjacency[i][j] = 0;
      adjacency[j][i] = 0;

      // Add new random edge
      let newTarget = Math.floor(Math.random() * N);
      let attempts = 0;
      while ((newTarget === i || adjacency[i][newTarget] === 1) && attempts < 100) {
        newTarget = Math.floor(Math.random() * N);
        attempts++;
      }

      if (attempts < 100) {
        adjacency[i][newTarget] = 1;
        adjacency[newTarget][i] = 1;
      }
    }
  }

  return {
    adjacency,
    edges: getAllEdges(adjacency, N),
    type: 'small-world',
    k,
    rewiringProb
  };
}

/**
 * Create scale-free (Barabási-Albert) network
 */
export function createScaleFree(N, m = 2) {
  const adjacency = Array(N).fill(null).map(() => Array(N).fill(0));

  // Start with a small complete graph
  const m0 = Math.min(m + 1, N);
  for (let i = 0; i < m0; i++) {
    for (let j = i + 1; j < m0; j++) {
      adjacency[i][j] = 1;
      adjacency[j][i] = 1;
    }
  }

  // Add remaining nodes with preferential attachment
  for (let i = m0; i < N; i++) {
    const degrees = new Array(i).fill(0);
    let totalDegree = 0;

    // Calculate degrees
    for (let j = 0; j < i; j++) {
      for (let k = 0; k < i; k++) {
        degrees[j] += adjacency[j][k];
      }
      totalDegree += degrees[j];
    }

    // Attach to m existing nodes with probability proportional to degree
    const targets = new Set();
    while (targets.size < Math.min(m, i)) {
      const rand = Math.random() * totalDegree;
      let sum = 0;

      for (let j = 0; j < i; j++) {
        sum += degrees[j];
        if (sum >= rand && !targets.has(j)) {
          targets.add(j);
          break;
        }
      }

      // Fallback: add random node if preferential attachment fails
      if (targets.size < Math.min(m, i)) {
        targets.add(Math.floor(Math.random() * i));
      }
    }

    // Create edges
    for (const target of targets) {
      adjacency[i][target] = 1;
      adjacency[target][i] = 1;
    }
  }

  return {
    adjacency,
    edges: getAllEdges(adjacency, N),
    type: 'scale-free',
    m
  };
}

/**
 * Create ring lattice network
 */
export function createRing(N, k = 2) {
  const adjacency = Array(N).fill(null).map(() => Array(N).fill(0));

  for (let i = 0; i < N; i++) {
    for (let j = 1; j <= k; j++) {
      const neighbor = (i + j) % N;
      adjacency[i][neighbor] = 1;
      adjacency[neighbor][i] = 1;
    }
  }

  return {
    adjacency,
    edges: getAllEdges(adjacency, N),
    type: 'ring',
    k
  };
}

/**
 * Helper function to get all edges from adjacency matrix
 */
function getAllEdges(adjacency, N) {
  const edges = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (adjacency[i][j] === 1) {
        edges.push({ source: i, target: j });
      }
    }
  }
  return edges;
}

/**
 * Calculate network statistics
 */
export function calculateNetworkStats(adjacency, N) {
  const degrees = new Array(N).fill(0);

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      degrees[i] += adjacency[i][j];
    }
  }

  const avgDegree = degrees.reduce((a, b) => a + b, 0) / N;
  const maxDegree = Math.max(...degrees);
  const minDegree = Math.min(...degrees);

  return {
    avgDegree,
    maxDegree,
    minDegree,
    degrees
  };
}
