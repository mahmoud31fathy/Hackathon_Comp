import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, Text, PerspectiveCamera, OrthographicCamera, GizmoHelper, useGizmoContext } from '@react-three/drei';
import * as THREE from 'three';

// Component to manage keyboard shortcuts
const CameraTracker = ({ cameraMode, setCameraMode }) => {
  const { camera, controls } = useThree();

  // Keyboard shortcut bindings replicating Blender POV functionality
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!controls) return;
      
      const distance = camera.position.distanceTo(controls.target);

      switch(e.code) {
        case 'Numpad5':
        case 'Digit5':
          // Toggle Projection
          setCameraMode(prev => prev === 'PERSPECTIVE' ? 'ORTHOGRAPHIC' : 'PERSPECTIVE');
          break;
        case 'Numpad1':
        case 'Digit1':
          // Front View (Snap to +Z)
          camera.position.set(controls.target.x, controls.target.y, controls.target.z + distance);
          controls.update();
          break;
        case 'Numpad3':
        case 'Digit3': 
          // Right View (Snap to +X)
          camera.position.set(controls.target.x + distance, controls.target.y, controls.target.z);
          controls.update();
          break;
        case 'Numpad7':
        case 'Digit7': 
          // Top View (Snap to +Y)
          camera.position.set(controls.target.x, controls.target.y + distance, controls.target.z);
          controls.update();
          break;
        case 'Numpad9':
        case 'Digit9': 
          // Opposite / Invert View
          const offset = camera.position.clone().sub(controls.target).negate();
          camera.position.copy(controls.target).add(offset);
          controls.update();
          break;
        case 'NumpadDecimal':
        case 'Period': 
          // Frame Selected / Reset pivot
          controls.target.set(0,0,0);
          controls.update();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [camera, controls, setCameraMode]);

  return null;
};

// Moving Wind Particles optimized for performance
const WindParticles = ({ count, speed, isSimulating }) => {
  const pointsRef = useRef();

  // Generate particle positions randomly
  const positions = useMemo(() => {
    // Limit count to max 10,000 to maintain smooth 60fps
    const safeCount = Math.min(count, 10000); 
    const pos = new Float32Array(safeCount * 3);
    for (let i = 0; i < safeCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 10;     // X width
      pos[i + 1] = (Math.random() - 0.5) * 10; // Y depth (flow direction)
      pos[i + 2] = (Math.random() - 0.5) * 10; // Z height
    }
    return pos;
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current || !isSimulating || speed === 0) return;
    
    const posArray = pointsRef.current.geometry.attributes.position.array;
    // Speed slider maps linearly (e.g. 50m/s -> 0.5 multiplier)
    const moveAmount = (speed / 50) * delta * 5; 
    
    for (let i = 1; i < posArray.length; i += 3) {
      // Flow along Y axis (which goes into/out of screen based on our group rotation)
      // Moving towards negative Y (out of the screen)
      posArray[i] -= moveAmount; 
      
      // If particle flies past the boundary, loop it back
      if (posArray[i] < -5) {
        posArray[i] = 5;
        // Randomize X and Z slightly upon looping so it doesn't look completely static
        posArray[i - 1] = (Math.random() - 0.5) * 10; 
        posArray[i + 1] = (Math.random() - 0.5) * 10; 
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!isSimulating) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.05} 
        color="#00f0ff" 
        transparent 
        opacity={0.5} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Completely customized Gizmo matching Blender's infinite axis but adding "-x, -y, -z" per user request.
const CustomAxis = ({ color, rotation }) => (
  <group rotation={rotation}>
    <mesh position={[0.4, 0, 0]}>
      <boxGeometry args={[0.8, 0.05, 0.05]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  </group>
);

const CustomAxisHead = ({ arcStyle, label, position, tweenCamera }) => {
  const gl = useThree(state => state.gl);
  const camera = useThree(state => state.camera);
  
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.arc(32, 32, 16, 0, 2 * Math.PI);
    context.closePath();
    if (label) {
      context.fillStyle = arcStyle;
      context.fill();
      context.font = 'bold 22px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = 'black';
      context.fillText(label, 32, 32);
    } else {
      context.lineWidth = 4;
      context.strokeStyle = arcStyle;
      context.stroke();
      context.fillStyle = arcStyle;
      context.globalAlpha = 0.2;
      context.fill();
      context.globalAlpha = 1.0;
    }
    return new THREE.CanvasTexture(canvas);
  }, [arcStyle, label]);

  const [active, setActive] = useState(false);
  const scale = (active ? 1.3 : 1) * 1.1;

  const handlePointerDown = (e) => {
    e.stopPropagation();
    
    // Use the explicit position prop to create a fresh Vector3
    const clickPos = new THREE.Vector3(...position).normalize();
    
    // Extract the exact Virtual Camera position dynamically from the physical raycast event
    const camPos = e.camera.position.clone().normalize();
    
    // If the virtual camera is already aligned with this axis direction (distance ~ 0)
    if (clickPos.distanceTo(camPos) < 0.1) {
      tweenCamera(new THREE.Vector3(...position).negate()); // Flip exactly opposite!
    } else {
      tweenCamera(new THREE.Vector3(...position));
    }
  };

  return (
    <sprite
      position={position}
      scale={scale}
      onPointerOver={(e) => { e.stopPropagation(); setActive(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setActive(false); }}
      onPointerDown={handlePointerDown}
    >
      <spriteMaterial 
        map={texture} 
        alphaTest={0.3} 
        toneMapped={false} 
      />
    </sprite>
  );
};

const CustomGizmo = () => {
  const { tweenCamera } = useGizmoContext();
  const cX = '#E74C3C', cY = '#2ECC71', cZ = '#3498DB';
  
  return (
    <group scale={40}>
      {/* Positive Arms */}
      <CustomAxis color={cX} rotation={[0, 0, 0]} />
      <CustomAxis color={cY} rotation={[0, 0, Math.PI / 2]} />
      <CustomAxis color={cZ} rotation={[0, -Math.PI / 2, 0]} />
      {/* Positive Spheres with Labels */}
      <CustomAxisHead arcStyle={cX} position={[1, 0, 0]} label="X" tweenCamera={tweenCamera} />
      <CustomAxisHead arcStyle={cY} position={[0, 1, 0]} label="Y" tweenCamera={tweenCamera} />
      <CustomAxisHead arcStyle={cZ} position={[0, 0, 1]} label="Z" tweenCamera={tweenCamera} />
      
      {/* Negative Spheres (Empty Outline, no connecting arms) */}
      <CustomAxisHead arcStyle={cX} position={[-1, 0, 0]} label="" tweenCamera={tweenCamera} />
      <CustomAxisHead arcStyle={cY} position={[0, -1, 0]} label="" tweenCamera={tweenCamera} />
      <CustomAxisHead arcStyle={cZ} position={[0, 0, -1]} label="" tweenCamera={tweenCamera} />
    </group>
  );
};

const SimulationView = ({ isSimulating, activeShape, windSpeed, particleCount }) => {
  const [cameraMode, setCameraMode] = useState('PERSPECTIVE');

  return (
    <div className="relative w-full h-full min-h-[400px] glass-panel flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Subtle Grid - CSS */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50 z-0"></div>
      
      {/* Top Left - Active Shape Name */}
      <div className="absolute top-3 left-6 z-10 pointer-events-none flex items-baseline gap-3">
        <h2 className="text-lg font-bold tracking-widest text-[var(--color-brand-100)] uppercase">Active Target</h2>
        <div className="text-sm text-[var(--color-accent-blue)] font-mono flex items-center gap-2 border-l border-white/10 pl-3">
          {activeShape?.name || 'NONE'}
          <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-[var(--color-accent-pink)] animate-pulse shadow-[0_0_10px_var(--color-accent-pink)]' : 'bg-transparent'}`}></span>
        </div>
      </div>

      {/* Bottom Center - Quick Keys Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-brand-400 font-mono text-[10px] tracking-widest opacity-50">
        1:FRONT 3:RIGHT 7:TOP 5:MODE .:FRAME
      </div>

      {/* Center 3D Engine Workspace */}
      <div className="absolute inset-0 z-0 cursor-crosshair">
        <Canvas>
          {cameraMode === 'PERSPECTIVE' ? (
             <PerspectiveCamera makeDefault position={[3, 2, 4]} fov={28} />
          ) : (
             <OrthographicCamera makeDefault position={[3, 2, 4]} zoom={120} near={-100} far={100} />
          )}

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          <OrbitControls 
            target={[0, 0, 0]} 
            enableDamping 
            dampingFactor={0.05} 
            maxDistance={100}
            minDistance={0.1}
            makeDefault
          />
          
          <CameraTracker cameraMode={cameraMode} setCameraMode={setCameraMode} />

          {/* Blender-style Top-Right Orientation Gizmo */}
          <GizmoHelper
            alignment="top-right"
            margin={[50, 50]}
          >
            <CustomGizmo />
          </GizmoHelper>

          {/* Group to perfectly align ThreeJS coordinates with Python/Matplotlib [Y=forward, Z=up] */}
          {/* Note: The GizmoHelper ignores group rotations, so its Y axis will correctly show global Y (Up).
              Our local geometry uses Z as UP. For unity, we'll remove the global [-Math.PI/2] group rotation
              and just render cleanly in standard WebGL coords (Y=Up, Z=Forward/Screen). This prevents gizmo mismatch! */}

          {/* Wind Particle Engine */}
          <WindParticles count={particleCount} speed={windSpeed} isSimulating={isSimulating} />

          {/* The actual geometry visualization at 0,0,0 */}
          {activeShape && (
            <group position={[0, 0, 0]}>
              {isSimulating && (
                <mesh>
                  <sphereGeometry args={[0.55, 32, 32]} />
                  <meshBasicMaterial color="#ec4899" transparent opacity={0.15} wireframe />
                </mesh>
              )}
              
              {activeShape.id === 'cube' && (
                <mesh>
                  <boxGeometry args={[0.8, 0.8, 0.8]} />
                  <meshStandardMaterial color={isSimulating ? "#ec4899" : "#0ea5e9"} transparent opacity={0.6} roughness={0.2} metalness={0.8} />
                  <Edges linewidth={2} color="#00f0ff" />
                </mesh>
              )}
              {activeShape.id === 'sphere' && (
                <mesh>
                  <sphereGeometry args={[0.5, 32, 32]} />
                  <meshStandardMaterial color={isSimulating ? "#ec4899" : "#0ea5e9"} transparent opacity={0.6} roughness={0.2} metalness={0.8} />
                </mesh>
              )}
            </group>
          )}

          {!activeShape && (
            <Text position={[0, 0, 0]} color="#64748b" fontSize={0.1} anchorX="center" anchorY="middle">
              Empty Workspace
            </Text>
          )}

        </Canvas>
      </div>

    </div>
  );
};

export default SimulationView;
