import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { FeatureScores } from '../../types/investigation';

interface RadarProps {
  scores: FeatureScores;
  vesselName: string;
}

export const AttributionRadarChart: React.FC<RadarProps> = ({ scores, vesselName }) => {
  const data = [
    { subject: 'Spatial', value: scores.spatial, fullMark: 100 },
    { subject: 'Temporal', value: scores.temporal, fullMark: 100 },
    { subject: 'Trajectory', value: scores.trajectory, fullMark: 100 },
    { subject: 'Behaviour', value: scores.behaviour, fullMark: 100 },
    { subject: 'Relevance', value: scores.vessel_relevance, fullMark: 100 },
  ];

  return (
    <div className="w-full h-48 font-mono text-[10px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 8 }}
            stroke="#1e293b"
          />
          <Radar
            name={vesselName}
            dataKey="value"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
