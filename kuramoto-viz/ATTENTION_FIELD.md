# Kuramoto Attention Field

## Overview

The Attention Field extension uses Kuramoto oscillator dynamics to model visual attention in a simulated sensory environment. This implementation combines concepts from computational neuroscience, specifically:

- **Stimulus-driven coupling**: Oscillators synchronize based on external stimulus intensity
- **Feature binding**: Oscillators representing similar features (color, etc.) synchronize together
- **Dynamic tracking**: The network can lock onto and track moving objects

## Theoretical Background

### The Model

The attention field consists of Kuramoto oscillators arranged on a 2D grid, representing a sensory field (analogous to a retina). Each oscillator's dynamics are governed by:

```
dθ_ij/dt = ω_ij + K_stim × S_ij × Σ_kl W_ijkl × sin(θ_kl - θ_ij) + K_feat × Σ_kl F_ijkl × sin(θ_kl - θ_ij)
```

Where:
- `θ_ij` = phase of oscillator at grid position (i,j)
- `ω_ij` = natural frequency
- `S_ij` = stimulus intensity at location (i,j)
- `W_ijkl` = spatial coupling weight (Gaussian decay with distance)
- `F_ijkl` = feature similarity between positions (i,j) and (k,l)
- `K_stim` = stimulus-driven coupling strength
- `K_feat` = feature binding coupling strength

### Key Concepts

1. **Stimulus-Driven Coupling**: Areas with strong stimulus input form synchronized clusters, representing attended regions

2. **Feature Binding**: Locations with similar features (color, brightness, etc.) preferentially synchronize, solving the "binding problem" - how the brain binds different features into coherent objects

3. **Attention as Synchrony**: Local phase coherence (measured by the order parameter) represents attention strength at each location

4. **Dynamic Tracking**: As objects move, the synchronized oscillator clusters follow them, demonstrating emergent tracking behavior

## Using the Application

### Switching Modes

Use the toggle in the top-right to switch between:
- **Kuramoto Model**: Original oscillator network visualization
- **Attention Field**: New attention/tracking simulation

### Controls

**Play/Pause/Reset**: Standard simulation controls

**Parameters**:
- `K_stim`: Stimulus-driven coupling strength (higher = stronger attention to stimuli)
- `K_feat`: Feature binding strength (higher = stronger grouping by similarity)
- `Noise Level`: Neural noise level
- `Spatial Range`: Neighborhood size for coupling

**Adding Objects**:
1. Click "Add Object"
2. Configure:
   - Radius: Object size
   - Intensity: Stimulus strength
   - Velocity X/Y: Motion direction
   - Hue/Brightness: Visual features (mapped to RGB)
3. Click "Add"

### Visualization Modes

**3D View**:
- Grid height/color shows attention strength
- Colored spheres = stimulus objects
- Green reticles = tracked objects (>60% attention)

**Heat Map**:
- Red/Yellow = High attention
- Blue = Stimulus presence
- White circles = Object boundaries
- Arrows = Object velocity

**Phase Mode**:
- Color hue = oscillator phase
- Shows synchronization patterns
- Similar colors = synchronized regions

## Interpretation

### What to Look For

1. **Attention Locking**: When you add an object, watch oscillators near it synchronize (similar phases/colors in phase mode, high values in heat map)

2. **Feature Binding**: Objects with similar colors cause their respective grid regions to synchronize together

3. **Dynamic Tracking**: As objects move, the synchronized "attention blob" follows them smoothly

4. **Multi-Object Tracking**: Multiple objects can be tracked simultaneously if coupling is strong enough

5. **Competition**: When objects are close or coupling is weak, attention may oscillate between them

### Tracked Objects

Green reticles indicate "tracked" objects where local attention exceeds 60%. The percentage shows attention strength.

## Experiments to Try

1. **Single Object Tracking**:
   - Add one object with moderate velocity
   - Increase K_stim to strengthen tracking
   - Observe phase coherence following the object

2. **Feature Pop-Out**:
   - Add multiple objects with same color
   - Add one object with different color
   - The different-colored object should attract more attention (pop-out effect)

3. **Motion Tracking**:
   - Add fast-moving objects
   - Adjust coupling strengths to maintain tracking
   - Observe limits of tracking speed

4. **Binding by Similarity**:
   - Add two red objects and two blue objects
   - Observe how similar-colored regions synchronize even at distance
   - This demonstrates feature-based binding

5. **Attention Capacity**:
   - Gradually add more objects
   - Find the limit where tracking breaks down
   - Relates to limited attention capacity

## Technical Details

### Grid Structure
- Default: 32×32 grid (1024 oscillators)
- Each cell can respond to stimulus and synchronize with neighbors
- Spatial coupling uses Gaussian falloff

### Features
- 3D feature space (RGB)
- Feature similarity computed via cosine similarity
- Only high-similarity pairs (>0.5) contribute to feature binding

### Performance
- RK4 integration for accuracy
- Spatial weights precomputed for speed
- History limited to last 500 frames

## References

This implementation is inspired by:

- **Binding by synchrony hypothesis** (von der Malsburg, 1981)
- **Oscillatory attention models** (Niebur et al., 1993)
- **Kuramoto model for neural synchronization** (Kuramoto, 1984)
- **Feature integration theory** (Treisman & Gelade, 1980)

## Implementation Files

- `src/core/attentionField.js` - Main simulation engine
- `src/components/AttentionField3D.jsx` - 3D visualization
- `src/components/AttentionHeatMap.jsx` - 2D heat map
- `src/components/AttentionControlPanel.jsx` - UI controls
- `src/AttentionApp.jsx` - Main application component
