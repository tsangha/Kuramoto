import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D visualization of the attention field
 * Shows:
 * - Sensory grid with attention heat map
 * - Moving stimulus objects
 * - Phase patterns
 */

function SensoryGrid({ state, showPhase = false }) {
  const meshRef = useRef();
  const { gridSize, attentionMap, theta, stimulus } = state;

  // Create geometry for the grid
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(gridSize, gridSize, gridSize - 1, gridSize - 1);
    return geo;
  }, [gridSize]);

  // Update vertex colors based on attention or phase
  useFrame(() => {
    if (!meshRef.current || !attentionMap) return;

    const colors = new Float32Array(gridSize * gridSize * 3);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const idx = i * gridSize + j;
        const vertexIdx = idx * 3;

        if (showPhase) {
          // Color by phase using HSV
          const phase = theta[idx];
          const hue = ((phase + Math.PI) / (2 * Math.PI)); // Normalize to [0,1]
          const color = new THREE.Color();
          color.setHSL(hue, 1.0, 0.5);

          colors[vertexIdx] = color.r;
          colors[vertexIdx + 1] = color.g;
          colors[vertexIdx + 2] = color.b;
        } else {
          // Color by attention: soft pink to teal gradient
          const attention = attentionMap[idx];
          const stim = stimulus[idx];

          // Background: very light rose for no attention
          let r = 1.0;
          let g = 0.96;
          let b = 0.97;

          if (attention > 0.05) {
            // Interpolate from light pink to teal
            const t = Math.min(attention, 1.0);

            // Light pink (255, 224, 233) to teal (45, 155, 135)
            const pink = { r: 1.0, g: 0.878, b: 0.914 };
            const teal = { r: 0.176, g: 0.608, b: 0.529 };

            r = pink.r + (teal.r - pink.r) * t;
            g = pink.g + (teal.g - pink.g) * t;
            b = pink.b + (teal.b - pink.b) * t;
          }

          // Subtle stimulus highlight
          if (stim > 0.1) {
            const highlight = stim * 0.12;
            r = Math.min(1.0, r + highlight);
            g = Math.min(1.0, g + highlight);
            b = Math.min(1.0, b + highlight);
          }

          colors[vertexIdx] = r;
          colors[vertexIdx + 1] = g;
          colors[vertexIdx + 2] = b;
        }
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.attributes.color.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}

function StimulusObjects({ objects, gridSize }) {
  return (
    <>
      {objects.map((obj) => {
        // Convert grid coordinates to 3D position
        // Grid cells are indexed 0 to gridSize-1, with vertices uniformly distributed
        // PlaneGeometry spans from -gridSize/2 to +gridSize/2
        // Vertex i is at position: -gridSize/2 + i * gridSize/(gridSize-1)
        // To align with this, object at grid position obj.x maps to:
        const x = -gridSize / 2 + obj.x * gridSize / (gridSize - 1);
        const z = -gridSize / 2 + obj.y * gridSize / (gridSize - 1);
        const y = 0.5; // Hover above grid

        // Extract RGB from features (assume first 3 features are RGB)
        const color = new THREE.Color(
          obj.features[0] || 0.5,
          obj.features[1] || 0.5,
          obj.features[2] || 0.5
        );

        return (
          <group key={obj.id} position={[x, y, z]}>
            {/* Object sphere */}
            <mesh>
              <sphereGeometry args={[obj.radius * 0.3, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                transparent
                opacity={0.8}
              />
            </mesh>

            {/* Glow ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[obj.radius * 0.8, obj.radius * 1.0, 32]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Velocity indicator */}
            {(Math.abs(obj.vx) > 0.01 || Math.abs(obj.vy) > 0.01) && (
              <arrowHelper
                args={[
                  new THREE.Vector3(obj.vx, 0, obj.vy).normalize(),
                  new THREE.Vector3(0, 0, 0),
                  obj.radius,
                  0xffffff,
                  obj.radius * 0.3,
                  obj.radius * 0.2
                ]}
              />
            )}
          </group>
        );
      })}
    </>
  );
}

function TrackedObjectMarkers({ trackedObjects, gridSize }) {
  return (
    <>
      {trackedObjects.map((tracked) => {
        // Use same coordinate mapping as stimulus objects
        const x = -gridSize / 2 + tracked.position[0] * gridSize / (gridSize - 1);
        const z = -gridSize / 2 + tracked.position[1] * gridSize / (gridSize - 1);
        const y = 2;

        return (
          <group key={tracked.id} position={[x, y, z]}>
            {/* Tracking reticle */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 1.8, 32]} />
              <meshBasicMaterial color={0x00ff00} transparent opacity={0.7} />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[2.0, 2.2, 32]} />
              <meshBasicMaterial color={0x00ff00} transparent opacity={0.4} />
            </mesh>

            {/* Attention strength indicator */}
            <Text
              position={[0, 0.5, 0]}
              fontSize={0.8}
              color="#00ff00"
              anchorX="center"
              anchorY="middle"
            >
              {`${(tracked.attention * 100).toFixed(0)}%`}
            </Text>
          </group>
        );
      })}
    </>
  );
}

function Scene({ state, showPhase }) {
  if (!state || !state.attentionMap) {
    return null;
  }

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Sensory grid */}
      <SensoryGrid state={state} showPhase={showPhase} />

      {/* Stimulus objects */}
      <StimulusObjects objects={state.objects || []} gridSize={state.gridSize} />

      {/* Tracked object markers */}
      <TrackedObjectMarkers
        trackedObjects={state.trackedObjects || []}
        gridSize={state.gridSize}
      />

      {/* Grid helper */}
      <gridHelper
        args={[state.gridSize, state.gridSize, 0x444444, 0x222222]}
        position={[0, -0.1, 0]}
      />

      {/* Axes helper */}
      <axesHelper args={[5]} />

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export default function AttentionField3D({ state, showPhase = false, className = '' }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [20, 20, 20], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene state={state} showPhase={showPhase} />
      </Canvas>
    </div>
  );
}
