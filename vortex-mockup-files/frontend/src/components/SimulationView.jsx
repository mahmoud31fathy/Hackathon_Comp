import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Edges, Text, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';

// ─── Viewport Gizmo ───────────────────────────────────────────────────────────
const ViewportGizmo = ({ cameraStr, onSnapView }) => {
  const size = 90, cx = 45, armLen = 30;
  const azimR = (parseFloat(cameraStr.azim) * Math.PI) / 180;
  const elevR = (parseFloat(cameraStr.elev) * Math.PI) / 180;
  const project = ([wx, wy, wz]) => {
    const rx = Math.cos(azimR), rz = -Math.sin(azimR);
    const ux = Math.sin(azimR)*Math.sin(elevR), uy = Math.cos(elevR), uz = Math.cos(azimR)*Math.sin(elevR);
    return { sx: wx*rx+wz*rz, sy: -(wx*ux+wy*uy+wz*uz) };
  };
  const axes = [
    { label:'X', dir:[1,0,0], color:'#E74C3C', neg:[-1,0,0], view:'right' },
    { label:'Y', dir:[0,1,0], color:'#2ECC71', neg:[0,-1,0], view:'top' },
    { label:'Z', dir:[0,0,1], color:'#3498DB', neg:[0,0,-1], view:'front' },
  ];
  const proj = axes.map(ax=>({...ax, pos:project(ax.dir), negPos:project(ax.neg)}));
  proj.sort((a,b)=>a.pos.sy-b.pos.sy);
  return (
    <div style={{position:'absolute',top:16,right:16,zIndex:20,display:'flex',flexDirection:'column',alignItems:'center',gap:6,pointerEvents:'none'}}>
      <div style={{fontSize:10,fontFamily:'monospace',fontWeight:'bold',letterSpacing:'0.12em',color:'#00f0ff',textShadow:'0 0 8px #00f0ff',background:'rgba(0,0,0,0.5)',padding:'2px 8px',borderRadius:4,border:'1px solid rgba(0,240,255,0.2)'}}>{cameraStr.mode}</div>
      <div style={{width:size,height:size,borderRadius:'50%',background:'rgba(10,10,20,0.65)',border:'1px solid rgba(255,255,255,0.12)',boxShadow:'0 4px 24px rgba(0,0,0,0.5)',backdropFilter:'blur(8px)',position:'relative',pointerEvents:'auto'}}>
        <svg width={size} height={size} style={{position:'absolute',top:0,left:0,overflow:'visible'}}>
          {proj.map(ax=>(
            <g key={`n${ax.label}`}>
              <line x1={cx} y1={cx} x2={cx+ax.negPos.sx*armLen} y2={cx+ax.negPos.sy*armLen} stroke={ax.color} strokeWidth={1.5} strokeOpacity={0.3} strokeLinecap="round"/>
              <circle cx={cx+ax.negPos.sx*armLen} cy={cx+ax.negPos.sy*armLen} r={5.5} fill={ax.color} fillOpacity={0.35} style={{cursor:'pointer'}} onClick={()=>onSnapView(`neg-${ax.view}`)}/>
              <text x={cx+ax.negPos.sx*armLen} y={cx+ax.negPos.sy*armLen+0.5} textAnchor="middle" dominantBaseline="middle" fill={ax.color} fillOpacity={0.6} fontSize="6" fontWeight="bold" fontFamily="monospace" style={{pointerEvents:'none'}}>-{ax.label}</text>
            </g>
          ))}
          {proj.map(ax=>(
            <g key={ax.label}>
              <line x1={cx} y1={cx} x2={cx+ax.pos.sx*armLen} y2={cx+ax.pos.sy*armLen} stroke={ax.color} strokeWidth={2.5} strokeLinecap="round"/>
              <circle cx={cx+ax.pos.sx*armLen} cy={cx+ax.pos.sy*armLen} r={8} fill={ax.color} fillOpacity={0.9} style={{cursor:'pointer'}} onClick={()=>onSnapView(ax.view)}/>
              <text x={cx+ax.pos.sx*armLen} y={cx+ax.pos.sy*armLen+1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="monospace" style={{pointerEvents:'none'}}>{ax.label}</text>
            </g>
          ))}
          <circle cx={cx} cy={cx} r={3} fill="rgba(255,255,255,0.6)"/>
        </svg>
      </div>
      <div style={{fontSize:9,fontFamily:'monospace',color:'rgba(255,255,255,0.3)',pointerEvents:'none'}}>NUMPAD · CLICK AXIS</div>
    </div>
  );
};

// ─── AoA Gauge ────────────────────────────────────────────────────────────────
const AoAGauge = ({ pitchAngle }) => {
  const abs=Math.abs(pitchAngle), isStall=abs>16, isWarn=abs>10;
  const clamp=Math.max(-45,Math.min(45,pitchAngle));
  const nr=((clamp*2-90)*Math.PI)/180;
  const GCX=70,GCY=70,R=52;
  const nx=GCX+R*0.85*Math.cos(nr), ny=GCY+R*0.85*Math.sin(nr);
  const arc=(s,e,col)=>{
    const sr=((s-90)*Math.PI)/180, er=((e-90)*Math.PI)/180;
    return <path d={`M${GCX+R*Math.cos(sr)},${GCY+R*Math.sin(sr)} A${R},${R} 0 0,1 ${GCX+R*Math.cos(er)},${GCY+R*Math.sin(er)}`} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round"/>;
  };
  return (
    <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:20,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      {isStall&&<div style={{fontSize:11,fontFamily:'monospace',fontWeight:'bold',color:'#ff2200',textShadow:'0 0 12px #ff2200',background:'rgba(255,34,0,0.15)',border:'1px solid #ff2200',borderRadius:4,padding:'2px 10px',letterSpacing:'0.15em'}}>⚠ STALL</div>}
      <svg width={140} height={80} style={{overflow:'visible'}}>
        {arc(-90,90,'rgba(255,255,255,0.08)')}{arc(-90,-26,'#2ECC71')}{arc(-26,18,'#F39C12')}{arc(18,90,'#E74C3C')}
        <line x1={GCX} y1={GCY} x2={nx} y2={ny} stroke={isStall?'#ff2200':isWarn?'#F39C12':'#00f0ff'} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={GCX} cy={GCY} r={4} fill={isStall?'#ff2200':'#00f0ff'}/>
        <text x={GCX} y={GCY+20} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="monospace" fontWeight="bold">{pitchAngle>0?'+':''}{pitchAngle}° AoA</text>
      </svg>
    </div>
  );
};

// ─── Surface helper ───────────────────────────────────────────────────────────
const buildSurfaceFn = (pts) => (x) => {
  if (x<-0.5||x>0.5) return {upper:0,lower:0};
  const xn=x+0.5;
  if (pts&&pts.length>3) {
    let up=-1,lo=1;
    for (const [px,py] of pts) { if (Math.abs(px-x)<0.03){if(py>up)up=py;if(py<lo)lo=py;} }
    return {upper:up===-1?0:up, lower:lo===1?0:lo};
  }
  const t=0.12,m=0.04,p=0.4;
  const yt=5*t*(0.2969*Math.sqrt(xn+1e-9)-0.126*xn-0.3516*xn**2+0.2843*xn**3-0.1015*xn**4);
  const yc=xn<p?(m/p**2)*(2*p*xn-xn**2):(m/(1-p)**2)*(1-2*p+2*p*xn-xn**2);
  return {upper:yc+yt,lower:yc-yt};
};

// ─── Flow Particles (Vector Field) ──────────────────────────────────────────────
const FlowParticles = ({ isActive, windSpeed, pitchAngle }) => {
  const COUNT = 3000;
  const meshRef = useRef();
  const speeds = useRef(new Float32Array(COUNT));
  const yOffsets = useRef(new Float32Array(COUNT)); // their original streamline Y

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = -3 + Math.random() * 6;     // X span
      const y0       = -1.5 + Math.random() * 3.0; // Y span
      pos[i * 3 + 1] = y0;                         // Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1; // Z (slight depth)
      
      speeds.current[i] = 0.8 + Math.random() * 0.4;
      yOffsets.current[i] = y0;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!isActive || !meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array;
    const baseSpeed = (windSpeed / 50) * 1.5;
    const pitchRad = (-pitchAngle * Math.PI) / 180;
    const sinPitch = Math.sin(pitchRad);
    const cosPitch = Math.cos(pitchRad);

    for (let i = 0; i < COUNT; i++) {
      let x = pos[i * 3];
      const y0 = yOffsets.current[i];
      let y = y0;

      // Simple 2D potential-flow-like deflection around a tilted thin plate
      if (x > -1.0 && x < 1.0) {
        // Distance from center
        const r = Math.hypot(x, y0);
        if (r < 0.8) {
          // Transform strictly to airfoil local space
          const localX = x * cosPitch - y0 * sinPitch;
          const localY = x * sinPitch + y0 * cosPitch;
          
          if (localX > -0.6 && localX < 0.6) {
            // Deflect away from centerline (localY = 0)
            const thickness = 0.12 * (1 - Math.abs(localX) / 0.6); // fake teardrop
            const dist = Math.abs(localY);
            if (dist < thickness + 0.3) {
              const push = (thickness + 0.1 - dist) * 1.5;
              const sign = localY > 0 ? 1 : -1;
              y += sign * Math.max(0, push) * Math.cos(x * Math.PI/2); // blend around edges
            }
          }
        }
      }

      // Move particle
      x += baseSpeed * speeds.current[i] * delta;
      
      // Reset if offscreen
      if (x > 3.0) {
        x = -3.0;
        yOffsets.current[i] = -1.5 + Math.random() * 3.0;
        y = yOffsets.current[i];
      }

      // Smooth vertical lerp so it doesn't jump instantly
      pos[i * 3] = x;
      pos[i * 3 + 1] += (y - pos[i * 3 + 1]) * 0.15;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.015} 
        color="#00f0ff" 
        transparent 
        opacity={isActive ? 0.6 : 0} 
        blending={THREE.AdditiveBlending} 
      />
    </points>
  );
};


// ─── Airfoil Mesh ─────────────────────────────────────────────────────────────
const AirfoilMesh = ({ points, showHeatmap, isSimulating, pitchAngle }) => {
  const geometry = useMemo(()=>{
    if (!points||points.length<3) return null;
    const shape=new THREE.Shape();
    shape.moveTo(points[0][0],points[0][1]);
    for (let i=1;i<points.length;i++) shape.lineTo(points[i][0],points[i][1]);
    shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:0.15,bevelEnabled:false});
    geo.center(); // Center the geometry so it rotates nicely

    if (showHeatmap) {
      const pos=geo.attributes.position.array, col=new Float32Array(pos.length);
      for (let i=0;i<pos.length/3;i++) {
        const t=pos[i*3]+0.5;
        col[i*3]=Math.max(0,1-t*1.5); col[i*3+1]=0.05; col[i*3+2]=Math.min(1,t*1.2);
      }
      geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    }
    return geo;
  },[points,showHeatmap]);
  if (!geometry) return null;

  return (
    // Rotate the mesh around the Z axis based on pitchAngle (negative because pitch up = nose up)
    <mesh geometry={geometry} rotation={[0, 0, -pitchAngle * Math.PI / 180]}>
      {showHeatmap
        ? <meshStandardMaterial vertexColors roughness={0.3} metalness={0.5} transparent opacity={0.85}/>
        : <meshStandardMaterial color={isSimulating?'#ec4899':'#0ea5e9'} transparent opacity={0.75} roughness={0.2} metalness={0.8}/>
      }
      {!showHeatmap&&<Edges linewidth={1.5} color="#00f0ff"/>}
    </mesh>
  );
};

// ─── Camera Tracker ───────────────────────────────────────────────────────────
const CameraTracker = ({ setCameraStr, cameraMode, setCameraMode, snapRef, turntableActive }) => {
  const { camera, controls } = useThree();
  useEffect(()=>{
    snapRef.current=(view)=>{
      if (!controls) return;
      const d=camera.position.distanceTo(controls.target), t=controls.target;
      const map={front:[t.x,t.y,t.z+d],right:[t.x+d,t.y,t.z],top:[t.x,t.y+d,t.z],'neg-front':[t.x,t.y,t.z-d],'neg-right':[t.x-d,t.y,t.z],'neg-top':[t.x,t.y-d,t.z]};
      if (map[view]) { camera.position.set(...map[view]); controls.update(); }
    };
  },[camera,controls,snapRef]);

  useFrame((_,delta)=>{
    if (!controls) return;
    if (turntableActive) { camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),delta*0.4); controls.update(); }
    const dx=camera.position.x-controls.target.x, dy=camera.position.y-controls.target.y, dz=camera.position.z-controls.target.z;
    const dist=Math.hypot(dx,dy,dz)||1;
    setCameraStr({elev:(Math.asin(dy/dist)*(180/Math.PI)).toFixed(1),azim:(Math.atan2(dx,dz)*(180/Math.PI)).toFixed(1),mode:cameraMode});
  });

  useEffect(()=>{
    const kd=(e)=>{
      if (!controls) return;
      const d=camera.position.distanceTo(controls.target), t=controls.target;
      switch(e.code){
        case 'Numpad5': case 'Digit5': setCameraMode(p=>p==='PERSPECTIVE'?'ORTHOGRAPHIC':'PERSPECTIVE'); break;
        case 'Numpad1': case 'Digit1': camera.position.set(t.x,t.y,t.z+d); controls.update(); break;
        case 'Numpad3': case 'Digit3': camera.position.set(t.x+d,t.y,t.z); controls.update(); break;
        case 'Numpad7': case 'Digit7': camera.position.set(t.x,t.y+d,t.z); controls.update(); break;
        case 'Numpad9': case 'Digit9': { const o=camera.position.clone().sub(t).negate(); camera.position.copy(t).add(o); controls.update(); break; }
        case 'NumpadDecimal': case 'Period': controls.target.set(0,0,0); controls.update(); break;
        default: break;
      }
    };
    window.addEventListener('keydown',kd);
    return ()=>window.removeEventListener('keydown',kd);
  },[camera,controls,setCameraMode]);
  return null;
};

// ─── Viewport Button ──────────────────────────────────────────────────────────
const VBtn = ({label,active,disabled,onClick,color='#00f0ff'})=>(
  <button onClick={onClick} disabled={disabled} style={{fontFamily:'monospace',fontSize:'10px',fontWeight:'bold',letterSpacing:'0.1em',padding:'5px 11px',borderRadius:5,cursor:disabled?'not-allowed':'pointer',border:`1px solid ${active?color:'rgba(255,255,255,0.15)'}`,background:active?`${color}22`:'rgba(0,0,0,0.5)',color:active?color:'rgba(255,255,255,0.5)',boxShadow:active?`0 0 10px ${color}44`:'none',transition:'all 0.2s',backdropFilter:'blur(6px)',opacity:disabled?0.35:1}}>
    {label}
  </button>
);

// ─── Main SimulationView ──────────────────────────────────────────────────────
const SimulationView = ({ isSimulating, activeShape, pitchAngle=0, windSpeed=50, airfoilPoints=null, flowActive=false, onFlowToggle }) => {
  const [cameraMode, setCameraMode] = useState('PERSPECTIVE');
  const [cameraStr, setCameraStr]   = useState({elev:'28.0',azim:'-55.0',mode:'PERSPECTIVE'});
  const [showHeatmap, setShowHeatmap]     = useState(false);
  const [turntableActive, setTurntable]   = useState(false);
  const snapRef = useRef(null);
  const handleSnap = useCallback((v)=>{ if(snapRef.current) snapRef.current(v); },[]);

  const hasShape = !!activeShape||!!airfoilPoints;
  // airfoil points: prefer custom upload, then built-in shape data
  const airfoilPts = airfoilPoints || activeShape?.airfoilData || null;

  return (
    <div className="relative w-full h-full min-h-[400px] glass-panel flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50 z-0"/>

      {/* Top Left */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <h2 className="text-xl font-bold tracking-widest text-[var(--color-brand-100)] uppercase mt-2">Active Target</h2>
        <div className="text-xs text-[var(--color-accent-blue)] font-mono mt-1 flex items-center gap-2">
          {airfoilPoints?'IMPORTED AIRFOIL':activeShape?.name||'NONE'}
          <span className={`w-2 h-2 rounded-full ${isSimulating?'bg-[var(--color-accent-pink)] animate-pulse shadow-[0_0_10px_var(--color-accent-pink)]':'bg-transparent'}`}/>
        </div>
      </div>

      <ViewportGizmo cameraStr={cameraStr} onSnapView={handleSnap}/>
      <AoAGauge pitchAngle={pitchAngle}/>

      {/* Toolbar bottom-left */}
      <div style={{position:'absolute',bottom:16,left:16,zIndex:20,display:'flex',gap:6,flexWrap:'wrap'}}>
        <VBtn label={flowActive?'⏸ PAUSE FLOW':'▶ START FLOW'} active={flowActive} disabled={!hasShape} onClick={onFlowToggle} color="#00f0ff"/>
        <VBtn label="⬡ HEATMAP" active={showHeatmap} disabled={!hasShape} onClick={()=>setShowHeatmap(p=>!p)} color="#ff6600"/>
        <VBtn label="⟳ TURNTABLE" active={turntableActive} disabled={!hasShape} onClick={()=>setTurntable(p=>!p)} color="#a78bfa"/>
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0 cursor-crosshair">
        <Canvas>
          {cameraMode==='PERSPECTIVE'
            ?<PerspectiveCamera makeDefault position={[3,2,4]} fov={28}/>
            :<OrthographicCamera makeDefault position={[3,2,4]} zoom={120} near={-100} far={100}/>
          }
          <ambientLight intensity={0.5}/>
          <directionalLight position={[10,10,5]} intensity={1}/>
          <OrbitControls target={[0,0,0]} enableDamping dampingFactor={0.05} maxDistance={100} minDistance={0.1} makeDefault/>
          <CameraTracker setCameraStr={setCameraStr} cameraMode={cameraMode} setCameraMode={setCameraMode} snapRef={snapRef} turntableActive={turntableActive}/>

          <group rotation={[-Math.PI/2,0,0]}>
            {/* Fluid Particles — tied to flowActive, NOT isSimulating → no orbit bug */}
            <FlowParticles isActive={flowActive} windSpeed={windSpeed} pitchAngle={pitchAngle}/>

            {airfoilPts&&<AirfoilMesh points={airfoilPts} showHeatmap={showHeatmap} isSimulating={isSimulating} pitchAngle={pitchAngle}/>}

            {activeShape&&!airfoilPts&&(
              <group>
                {isSimulating&&<mesh><sphereGeometry args={[0.55,32,32]}/><meshBasicMaterial color="#ec4899" transparent opacity={0.15} wireframe/></mesh>}
                {activeShape.id==='cube'&&(
                  <mesh>
                    <boxGeometry args={[0.8,0.8,0.8]}/>
                    <meshStandardMaterial color={showHeatmap?'#ff3300':isSimulating?'#ec4899':'#0ea5e9'} transparent opacity={0.6} roughness={0.2} metalness={0.8}/>
                    <Edges linewidth={2} color="#00f0ff"/>
                  </mesh>
                )}
                {activeShape.id==='sphere'&&(
                  <mesh>
                    <sphereGeometry args={[0.5,32,32]}/>
                    <meshStandardMaterial color={showHeatmap?'#0055ff':isSimulating?'#ec4899':'#0ea5e9'} transparent opacity={0.6} roughness={0.2} metalness={0.8}/>
                  </mesh>
                )}
              </group>
            )}

            {!hasShape&&(
              <Text position={[0,0,0]} rotation={[Math.PI/2,0,0]} color="#64748b" fontSize={0.1} anchorX="center" anchorY="middle">Empty Workspace</Text>
            )}
          </group>
        </Canvas>
      </div>
    </div>
  );
};

export default SimulationView;
