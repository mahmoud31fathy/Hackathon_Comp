import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DataChart = ({ data, title, dataKey, strokeColor }) => {
  return (
    <div className="w-full h-full glass-panel p-4 flex flex-col">
       <h3 className="text-xs font-semibold tracking-widest text-brand-300 uppercase mb-4">{title}</h3>
       <div className="flex-1 w-full min-h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-700)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--color-brand-400)" tick={{fill: 'var(--color-brand-300)', fontSize: 10}} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-brand-400)" tick={{fill: 'var(--color-brand-300)', fontSize: 10}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-brand-800)', borderColor: 'var(--color-brand-600)', borderRadius: '8px', color: '#e2e8f0' }}
                itemStyle={{ color: strokeColor }}
              />
              <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2} dot={false} activeDot={{ r: 6, fill: strokeColor }} />
            </LineChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
}

export default DataChart;
