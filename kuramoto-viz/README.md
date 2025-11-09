# Kuramoto Model Visualization

An interactive web application for exploring synchronization phenomena in coupled oscillator systems using the Kuramoto model.

## Features

### Interactive Visualizations
- **Phase Circle**: Real-time visualization of oscillator phases on a circle with color-coded phases
- **Network Topology**: Interactive force-directed graph showing network structure
- **Time Series**: Order parameter evolution showing synchronization over time
- **Order Parameter Vector**: Visual representation of collective synchronization

### Tunable Parameters
- **Coupling Strength (K)**: Control the strength of interactions between oscillators
- **Number of Oscillators (N)**: Adjust population size from 10 to 100
- **Noise Level**: Add stochastic fluctuations to model realistic systems
- **Phase Lag (α)**: Introduce time delays in coupling

### Network Topologies
- **All-to-All**: Fully connected network (global coupling)
- **Random (Erdős-Rényi)**: Stochastic connections with tunable probability
- **Small-World (Watts-Strogatz)**: Local clustering with long-range shortcuts
- **Scale-Free (Barabási-Albert)**: Hub-based networks with preferential attachment
- **Ring Lattice**: Local nearest-neighbor coupling

### Educational Content
- Mathematical model equations
- Explanation of synchronization phenomena
- Real-world examples (fireflies, neurons, power grids)
- Network topology comparisons
- Interactive tips for exploration

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **D3.js** - Network graphs and time series plotting
- **p5.js** - Creative phase circle visualization
- **TailwindCSS** - Styling
- **RK4 Integration** - Numerical simulation of differential equations

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## The Kuramoto Model

The Kuramoto model describes synchronization in populations of coupled oscillators:

```
dθᵢ/dt = ωᵢ + (K/N) × Σⱼ sin(θⱼ - θᵢ)
```

Where:
- **θᵢ** = phase of oscillator i
- **ωᵢ** = natural frequency
- **K** = coupling strength
- **N** = number of oscillators

### Order Parameter

The order parameter **r(t)** measures global synchronization:

```
r(t) = |1/N × Σⱼ e^(iθⱼ)|
```

- **r = 0**: Complete incoherence
- **r = 1**: Perfect synchronization

## Usage Tips

1. **Observe Phase Transitions**: Start with low K and gradually increase to see the onset of synchronization
2. **Compare Topologies**: Switch between network types to see how structure affects synchronization
3. **Add Noise**: Introduce stochasticity to model biological systems
4. **Watch the Red Arrow**: The order parameter vector grows as synchronization increases
5. **Color Coding**: Oscillators with similar phases have similar colors

## Real-World Applications

- **Biological Systems**: Neural oscillations, cardiac pacemaker cells, circadian rhythms
- **Physics**: Coupled pendulums, Josephson junctions, laser arrays
- **Chemistry**: Chemical oscillators (Belousov-Zhabotinsky reaction)
- **Engineering**: Power grid frequency synchronization
- **Nature**: Firefly flashing, cricket chirping

## Key References

1. Acebrón et al. (2005). "The Kuramoto model: A simple paradigm for synchronization phenomena". *Reviews of Modern Physics* 77: 137–185.

2. Strogatz (2000). "From Kuramoto to Crawford: Exploring the onset of synchronization in populations of coupled oscillators". *Physica D* 143 (1–4): 1–20

3. Bullmore & Sporns (2009). "Complex brain networks: graph-theoretical analysis of structural and functional systems". *Nature Reviews Neuroscience* 10: 186-198

## Project Structure

```
kuramoto-viz/
├── src/
│   ├── components/          # React components
│   │   ├── PhaseCircle.jsx      # p5.js circular visualization
│   │   ├── NetworkGraph.jsx     # D3.js network graph
│   │   ├── TimeSeries.jsx       # D3.js time series plots
│   │   ├── ControlPanel.jsx     # Parameter controls
│   │   └── InfoPanel.jsx        # Educational content
│   ├── core/               # Simulation engine
│   │   ├── kuramoto.js         # RK4 integration & model
│   │   └── networks.js         # Network topology generators
│   ├── App.jsx             # Main application
│   └── index.css           # Global styles
├── public/                 # Static assets
└── package.json
```

## License

This project is open source and available under the MIT License.

## Acknowledgments

Based on the original Kuramoto model research and MATLAB implementations. Built as an educational tool to make synchronization phenomena accessible and interactive.
