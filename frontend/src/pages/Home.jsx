import React, { useState, useEffect } from 'react';
import ShapeCard from '../components/ShapeCard';
import ControlSlider from '../components/ControlSlider';
import SimulationView from '../components/SimulationView';
import DataChart from '../components/DataChart';
import { Box, Circle, Hexagon, Plane } from 'lucide-react';

const SHAPES = [
  { id: 'cube', name: '3D Cube', type: '3D Geometry', icon: <Box /> },
  { id: 'sphere', name: '3D Sphere', type: '3D Geometry', icon: <Circle /> },
];

const MOCK_DATA = [
  { time: '0s', drag: 10, lift: 5 },
  { time: '2s', drag: 15, lift: 15 },
  { time: '4s', drag: 18, lift: 25 },
  { time: '6s', drag: 25, lift: 30 },
  { time: '8s', drag: 22, lift: 45 },
  { time: '10s', drag: 28, lift: 50 },
];

const Home = () => {
  const [activeShapeId, setActiveShapeId] = useState(null);
  const [windSpeed, setWindSpeed] = useState(50);
  const [particleCount, setParticleCount] = useState(1000);
  const [pitchAngle, setPitchAngle] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [chartData, setChartData] = useState([]);

  const activeShape = SHAPES.find(s => s.id === activeShapeId);

  useEffect(() => {
    if (!activeShapeId) return;
    
    setIsSimulating(true);
    // Simulate API calculation time
    const timer = setTimeout(() => {
      setIsSimulating(false);
      
      // Generate dynamically shifting data based on sliders
      const data = MOCK_DATA.map(d => ({
        time: d.time,
        drag: d.drag * (windSpeed / 50) + (Math.abs(pitchAngle) / 8) + (particleCount / 5000),
        lift: d.lift * (windSpeed / 50) * (pitchAngle !== 0 ? (pitchAngle + 20) / 10 : 1.5)
      }));
      setChartData(data);
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeShapeId, windSpeed, pitchAngle, particleCount]);

  return (
    <div className="flex flex-col h-full gap-6 max-w-[1800px] mx-auto w-full">
      
      {/* 3-Column Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
        
        {/* Left: Shape Library */}
        <div className="col-span-1 glass-panel p-4 flex flex-col gap-4 max-h-[600px]">
          <h2 className="text-sm font-mono tracking-widest text-[var(--color-accent-neon)] uppercase mb-2 flex-shrink-0">Geometry Library</h2>
          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {SHAPES.map(shape => (
              <ShapeCard 
                key={shape.id}
                {...shape}
                active={activeShapeId === shape.id}
                onClick={setActiveShapeId}
              />
            ))}
          </div>
        </div>

        {/* Center: Main Viewport */}
        <div className="col-span-1 lg:col-span-2 relative">
          <SimulationView 
             isSimulating={isSimulating} 
             activeShape={activeShape} 
             windSpeed={windSpeed}
             particleCount={particleCount}
          />
        </div>

        {/* Right: Controls & Results */}
        <div className="col-span-1 glass-panel p-6 flex flex-col max-h-[600px]">
          <h2 className="text-sm font-mono tracking-widest text-[var(--color-accent-blue)] uppercase mb-6 flex-shrink-0">Environment Params</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <ControlSlider 
              label="Wind Speed" 
              value={windSpeed} 
              min={0} 
              max={300} 
              unit="m/s" 
              onChange={setWindSpeed} 
              accent="neon" 
            />
            <ControlSlider 
              label="Particle Count" 
              value={particleCount} 
              min={100} 
              max={10000} 
              unit="pt" 
              onChange={setParticleCount} 
              accent="pink" 
            />
            <ControlSlider 
              label="Pitch Angle" 
              value={pitchAngle} 
              min={-45} 
              max={45} 
              unit="°" 
              onChange={setPitchAngle} 
              accent="blue" 
            />
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 flex-shrink-0">
             <h2 className="text-sm font-mono tracking-widest text-[var(--color-accent-pink)] uppercase mb-4">Live Metrics</h2>
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-brand-900/50 p-3 rounded-lg border border-white/5">
                 <div className="text-xs text-brand-400 mb-1">DRAG (Cd)</div>
                 <div className="text-xl font-bold font-mono text-white">{isSimulating || !chartData.length ? '--' : chartData[chartData.length-1].drag.toFixed(2)}</div>
               </div>
               <div className="bg-brand-900/50 p-3 rounded-lg border border-white/5">
                 <div className="text-xs text-brand-400 mb-1">LIFT (Cl)</div>
                 <div className="text-xl font-bold font-mono text-[var(--color-accent-neon)] neon-text">{isSimulating || !chartData.length ? '--' : chartData[chartData.length-1].lift.toFixed(2)}</div>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[250px] flex-shrink-0">
         <DataChart data={chartData} title="Drag Force Integration" dataKey="drag" strokeColor="var(--color-accent-pink)" />
         <DataChart data={chartData} title="Lift Force Trajectory" dataKey="lift" strokeColor="var(--color-accent-neon)" />
      </div>

    </div>
  );
};

export default Home;
