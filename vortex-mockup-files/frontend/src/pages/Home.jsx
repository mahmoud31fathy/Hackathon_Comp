import React, { useState, useEffect, useRef } from 'react';
import ShapeCard from '../components/ShapeCard';
import ControlSlider from '../components/ControlSlider';
import SimulationView from '../components/SimulationView';
import DataChart from '../components/DataChart';
import { Box, Circle, Upload, Mountain, Globe, Wind } from 'lucide-react';

// ─── NACA 4412 coordinate generator ──────────────────────────────────────────
const computeNACA4412 = () => {
  const m=0.04, p=0.4, t=0.12, N=50;
  const upper=[], lower=[];
  for (let i=0; i<=N; i++) {
    const x=(1-Math.cos(Math.PI*i/N))/2;
    const xn=Math.max(0,x);
    const yt=5*t*(0.2969*Math.sqrt(xn+1e-9)-0.126*xn-0.3516*xn**2+0.2843*xn**3-0.1015*xn**4);
    const yc=xn<p?(m/p**2)*(2*p*xn-xn**2):(m/(1-p)**2)*(1-2*p+2*p*xn-xn**2);
    const dyc=xn<p?(2*m/p**2)*(p-xn):(2*m/(1-p)**2)*(p-xn);
    const theta=Math.atan(dyc);
    upper.push([xn-yt*Math.sin(theta)-0.5, yc+yt*Math.cos(theta)]);
    lower.push([xn+yt*Math.sin(theta)-0.5, yc-yt*Math.cos(theta)]);
  }
  return [...upper, ...lower.slice(1).reverse()];
};

const NACA4412_POINTS = computeNACA4412();

// ─── Environment presets ──────────────────────────────────────────────────────
const ENV_PRESETS = {
  standard: { label:'Standard Air', sublabel:'Sea Level', icon:<Globe size={13}/>, density:1.225, windSpeed:50,  particleCount:1000, color:'#00f0ff' },
  highAlt:  { label:'High Altitude', sublabel:'~10 km',   icon:<Mountain size={13}/>, density:0.414, windSpeed:80, particleCount:500,  color:'#a78bfa' },
};

// ─── Shapes library ───────────────────────────────────────────────────────────
const SHAPES = [
  { id:'naca4412', name:'NACA 4412', type:'Airfoil · Built-in', icon:<Wind size={18}/>, airfoilData: NACA4412_POINTS },
  { id:'cube',     name:'3D Cube',   type:'3D Geometry',         icon:<Box size={18}/> },
  { id:'sphere',   name:'3D Sphere', type:'3D Geometry',         icon:<Circle size={18}/> },
];

const MOCK_DATA = [
  {time:'0s',  drag:10, lift:5 },
  {time:'2s',  drag:15, lift:15},
  {time:'4s',  drag:18, lift:25},
  {time:'6s',  drag:25, lift:30},
  {time:'8s',  drag:22, lift:45},
  {time:'10s', drag:28, lift:50},
];

// ─── Parse .dat airfoil ───────────────────────────────────────────────────────
const parseAirfoilDat = (text) => {
  const points = [];
  for (const line of text.split('\n').map(l=>l.trim()).filter(Boolean)) {
    if (line.startsWith('#')||isNaN(parseFloat(line.split(/\s+/)[0]))) continue;
    const parts=line.split(/[\s,]+/);
    if (parts.length>=2) {
      const x=parseFloat(parts[0]), y=parseFloat(parts[1]);
      if (!isNaN(x)&&!isNaN(y)) points.push([x,y]);
    }
  }
  if (points.length<3) return null;
  const minX=Math.min(...points.map(p=>p[0])), maxX=Math.max(...points.map(p=>p[0]));
  const chord=(maxX-minX)||1;
  return points.map(([x,y])=>[(x-minX)/chord-0.5, y/chord]);
};

// ─── Preset Button ────────────────────────────────────────────────────────────
const PresetButton = ({ preset, active, onClick }) => (
  <button onClick={onClick} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'8px 6px',borderRadius:10,border:`1px solid ${active?preset.color:'rgba(255,255,255,0.08)'}`,background:active?`${preset.color}18`:'rgba(255,255,255,0.03)',cursor:'pointer',transition:'all 0.25s',boxShadow:active?`0 0 14px ${preset.color}33`:'none',color:active?preset.color:'rgba(255,255,255,0.45)',fontFamily:'monospace'}}>
    <span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:'bold',letterSpacing:'0.08em'}}>{preset.icon}{preset.label}</span>
    <span style={{fontSize:9,opacity:0.6}}>{preset.sublabel}</span>
    <span style={{fontSize:9,marginTop:2,opacity:active?0.85:0.4}}>ρ = {preset.density} kg/m³</span>
  </button>
);

// ─── Home ─────────────────────────────────────────────────────────────────────
const Home = () => {
  const [activeShapeId, setActiveShapeId] = useState(null);
  const [windSpeed,     setWindSpeed]     = useState(50);
  const [particleCount, setParticleCount] = useState(1000);
  const [pitchAngle,    setPitchAngle]    = useState(0);
  const [isSimulating,  setIsSimulating]  = useState(false);
  const [chartData,     setChartData]     = useState([]);
  const [airfoilPoints, setAirfoilPoints] = useState(null);
  const [airfoilName,   setAirfoilName]   = useState('');
  const [activePreset,  setActivePreset]  = useState('standard');
  const [density,       setDensity]       = useState(1.225);
  const [importError,   setImportError]   = useState('');
  const [flowActive,    setFlowActive]    = useState(false);
  const fileInputRef = useRef(null);

  const activeShape   = SHAPES.find(s=>s.id===activeShapeId);
  const hasTarget     = !!activeShape||!!airfoilPoints;
  // Airfoil points to render: custom upload takes priority over built-in
  const renderAirfoil = airfoilPoints || activeShape?.airfoilData || null;

  const applyPreset = (key) => {
    const p=ENV_PRESETS[key];
    setActivePreset(key); setDensity(p.density);
    setWindSpeed(p.windSpeed); setParticleCount(p.particleCount);
  };

  const handleFileUpload = (e) => {
    const file=e.target.files[0]; if (!file) return;
    setImportError('');
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const pts=parseAirfoilDat(ev.target.result);
      if (!pts) { setImportError('Could not parse. Ensure X Y coordinate pairs per line.'); return; }
      setAirfoilPoints(pts);
      setAirfoilName(file.name.replace(/\.[^.]+$/,'').toUpperCase());
      setActiveShapeId(null);
    };
    reader.readAsText(file);
    e.target.value='';
  };

  const clearAirfoil = () => { setAirfoilPoints(null); setAirfoilName(''); setImportError(''); };

  const handleShapeClick = (id) => {
    clearAirfoil();
    setActiveShapeId(id);
    setFlowActive(false); // reset flow when changing shape
  };

  // Simulation calc (independent of flow animation)
  useEffect(()=>{
    if (!hasTarget) return;
    setIsSimulating(true);
    const t=setTimeout(()=>{
      setIsSimulating(false);
      const df=density/1.225;
      setChartData(MOCK_DATA.map(d=>({
        time:d.time,
        drag:d.drag*(windSpeed/50)*df+(Math.abs(pitchAngle)/8)+(particleCount/5000),
        lift:d.lift*(windSpeed/50)*df*(pitchAngle!==0?(pitchAngle+20)/10:1.5),
      })));
    },2000);
    return ()=>clearTimeout(t);
  },[activeShapeId,airfoilPoints,windSpeed,pitchAngle,particleCount,density]);

  return (
    <div className="flex flex-col h-full gap-6 max-w-[1800px] mx-auto w-full">

      {/* Top 4-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">

        {/* ── Left: Library + Importer ── */}
        <div className="col-span-1 glass-panel p-4 flex flex-col gap-4 max-h-[600px]">
          <h2 className="text-sm font-mono tracking-widest text-[var(--color-accent-neon)] uppercase flex-shrink-0">Geometry Library</h2>

          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {SHAPES.map(shape=>(
              <ShapeCard key={shape.id} {...shape}
                active={activeShapeId===shape.id&&!airfoilPoints}
                onClick={handleShapeClick}
              />
            ))}
          </div>

          {/* Importer */}
          <div className="flex-shrink-0 border-t border-white/10 pt-4 flex flex-col gap-2">
            <h3 className="text-xs font-mono tracking-widest text-[var(--color-accent-blue)] uppercase">Import Airfoil</h3>
            {airfoilPoints ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-accent-neon)]/40 bg-[var(--color-accent-neon)]/5">
                <div>
                  <div className="text-xs font-bold text-[var(--color-accent-neon)] font-mono">{airfoilName||'AIRFOIL'}</div>
                  <div className="text-[10px] text-brand-400">{airfoilPoints.length} pts loaded</div>
                </div>
                <button onClick={clearAirfoil} className="text-[10px] font-mono text-[var(--color-accent-pink)] hover:text-white border border-[var(--color-accent-pink)]/40 hover:border-[var(--color-accent-pink)] px-2 py-1 rounded transition-all">✕ CLEAR</button>
              </div>
            ) : (
              <button onClick={()=>fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 hover:border-[var(--color-accent-blue)]/60 hover:bg-[var(--color-accent-blue)]/5 text-brand-400 hover:text-[var(--color-accent-blue)] text-xs font-mono tracking-wider transition-all">
                <Upload size={13}/> UPLOAD .DAT FILE
              </button>
            )}
            <input ref={fileInputRef} type="file" accept=".dat,.txt,.csv" className="hidden" onChange={handleFileUpload}/>
            {importError&&<div className="text-[10px] text-[var(--color-accent-pink)] font-mono">{importError}</div>}
            <div className="text-[9px] text-brand-400 font-mono leading-relaxed">Selig .dat format (X Y pairs). NACA coords supported.</div>
          </div>
        </div>

        {/* ── Center: Viewport ── */}
        <div className="col-span-1 lg:col-span-2">
          <SimulationView
            isSimulating={isSimulating}
            activeShape={activeShape}
            pitchAngle={pitchAngle}
            windSpeed={windSpeed}
            airfoilPoints={airfoilPoints}
            flowActive={flowActive}
            onFlowToggle={()=>setFlowActive(p=>!p)}
          />
        </div>

        {/* ── Right: Controls ── */}
        <div className="col-span-1 glass-panel p-6 flex flex-col max-h-[600px]">
          <h2 className="text-sm font-mono tracking-widest text-[var(--color-accent-blue)] uppercase mb-3 flex-shrink-0">Environment</h2>
          <div className="flex gap-2 mb-5 flex-shrink-0">
            {Object.entries(ENV_PRESETS).map(([key,preset])=>(
              <PresetButton key={key} preset={preset} active={activePreset===key} onClick={()=>applyPreset(key)}/>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4 mb-2 flex-shrink-0">
            <h2 className="text-sm font-mono tracking-widest text-[var(--color-accent-blue)] uppercase mb-4">Parameters</h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <ControlSlider label="Wind Speed"    value={windSpeed}     min={0}   max={300}   unit="m/s" onChange={setWindSpeed}     accent="neon"/>
            <ControlSlider label="Particle Count" value={particleCount} min={100} max={10000} unit="pt"  onChange={setParticleCount} accent="pink"/>
            <ControlSlider label="Pitch Angle"   value={pitchAngle}    min={-45} max={45}    unit="°"   onChange={setPitchAngle}    accent="blue"/>
          </div>

          {/* Live metrics */}
          <div className="mt-6 border-t border-white/10 pt-5 flex-shrink-0">
            <h2 className="text-sm font-mono tracking-widest text-[var(--color-accent-pink)] uppercase mb-4">Live Metrics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-900/50 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-brand-400 mb-1">DRAG (Cd)</div>
                <div className="text-xl font-bold font-mono text-white">{isSimulating||!chartData.length?'--':chartData[chartData.length-1].drag.toFixed(2)}</div>
              </div>
              <div className="bg-brand-900/50 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-brand-400 mb-1">LIFT (Cl)</div>
                <div className="text-xl font-bold font-mono text-[var(--color-accent-neon)] neon-text">{isSimulating||!chartData.length?'--':chartData[chartData.length-1].lift.toFixed(2)}</div>
              </div>
              <div className="bg-brand-900/50 p-3 rounded-lg border border-white/5 col-span-2">
                <div className="text-xs text-brand-400 mb-1">AIR DENSITY</div>
                <div className="text-sm font-bold font-mono" style={{color:ENV_PRESETS[activePreset].color}}>ρ = {density} kg/m³</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[250px] flex-shrink-0">
        <DataChart data={chartData} title="Drag Force Integration" dataKey="drag" strokeColor="var(--color-accent-pink)"/>
        <DataChart data={chartData} title="Lift Force Trajectory"  dataKey="lift" strokeColor="var(--color-accent-neon)"/>
      </div>

    </div>
  );
};

export default Home;
