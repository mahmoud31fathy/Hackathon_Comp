import React, { useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, Text, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';

// Component to track camera angle and display it
const CameraTracker = ({ setCameraStr, cameraMode, setCameraMode }) => {
  const { camera, controls } = useThree();
  
  // Real-time tracker for the View Point overlay
  useFrame(() => {
    if (!controls) return;
    
    // Position relative to target
    const dx = camera.position.x - controls.target.x;
    const dy = camera.position.y - controls.target.y;
    const dz = camera.position.z - controls.target.z;

    const distance = Math.hypot(dx, dy, dz) || 1;
    
    // Elev: angle above the XZ plane in ThreeJS = asin(dy / dist)
    const elev = Math.asin(dy / distance) * (180 / Math.PI);
    
    // Azim: angle in the XZ plane. atan2(dx, dz)
    const azim = Math.atan2(dx, dz) * (180 / Math.PI);

    setCameraStr({
      elev: elev.toFixed(1),
      azim: azim.toFixed(1),
      mode: cameraMode
    });
  });

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

// Replicating Python `draw_origin_arrows`
const OriginArrows = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* X Axis - Red */}
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
        <cylinderGeometry args={[0.015, 0.015, 1]} />
        <meshBasicMaterial color="#E74C3C" />
      </mesh>
      <mesh position={[1.05, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
        <coneGeometry args={[0.04, 0.15]} />
        <meshBasicMaterial color="#E74C3C" />
      </mesh>
      <Text position={[1.2, 0, 0]} color="#E74C3C" fontSize={0.15} fontWeight="bold">X</Text>

      {/* Y Axis - Green (In our rotated group, Y goes forward into the screen matching Matplotlib depth) */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1]} />
        <meshBasicMaterial color="#2ECC71" />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <coneGeometry args={[0.04, 0.15]} />
        <meshBasicMaterial color="#2ECC71" />
      </mesh>
      <Text position={[0, 1.2, 0]} color="#2ECC71" fontSize={0.15} fontWeight="bold">Y</Text>

      {/* Z Axis - Blue (In our rotated group, Z goes Up matching Matplotlib altitude) */}
      <mesh position={[0, 0, 0.5]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1]} />
        <meshBasicMaterial color="#3498DB" />
      </mesh>
      <mesh position={[0, 0, 1.05]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.04, 0.15]} />
        <meshBasicMaterial color="#3498DB" />
      </mesh>
      <Text position={[0, 0, 1.2]} color="#3498DB" fontSize={0.15} fontWeight="bold">Z</Text>
    </group>
  );
};

const SimulationView = ({ isSimulating, activeShape }) => {
  const [cameraMode, setCameraMode] = useState('PERSPECTIVE');
  const [cameraStr, setCameraStr] = useState({ elev: '28.0', azim: '-55.0', mode: 'PERSPECTIVE' });

  return (
    <div className="relative w-full h-full min-h-[400px] glass-panel flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Subtle Grid - CSS */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50 z-0"></div>
      
      {/* Top Left - Active Shape Name */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <h2 className="text-xl font-bold tracking-widest text-[var(--color-brand-100)] uppercase mt-2">Active Target</h2>
        <div className="text-xs text-[var(--color-accent-blue)] font-mono mt-1 flex items-center gap-2">
          {activeShape?.name || 'NONE'}
          <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-[var(--color-accent-pink)] animate-pulse shadow-[0_0_10px_var(--color-accent-pink)]' : 'bg-transparent'}`}></span>
        </div>
      </div>

      {/* Top Right - View Point Data (Blender Mode) */}
      <div className="absolute top-4 right-6 z-10 pointer-events-none text-right">
        <h2 className="text-lg font-bold tracking-widest text-[var(--color-accent-neon)] uppercase mt-2">
          [ {cameraStr.mode} ]
        </h2>
        <div className="text-sm text-brand-300 font-mono mt-1 bg-black/40 px-3 py-1 rounded backdrop-blur-sm border border-[var(--color-accent-blue)]/20 shadow-lg">
          ELEV: {cameraStr.elev}° <span className="text-white/20 mx-1">|</span> AZIM: {cameraStr.azim}°
        </div>
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
          
          <CameraTracker setCameraStr={setCameraStr} cameraMode={cameraMode} setCameraMode={setCameraMode} />

          {/* Group to perfectly align ThreeJS coordinates with Python/Matplotlib [Y=forward, Z=up] */}
          <group rotation={[-Math.PI / 2, 0, 0]}>
            
            {/* Origin Arrows exactly at 0,0,0 */}
            <OriginArrows />

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
              <Text position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]} color="#64748b" fontSize={0.1} anchorX="center" anchorY="middle">
                Empty Workspace
              </Text>
            )}

          </group>
        </Canvas>
      </div>

    </div>
  );
};

export default SimulationView;
