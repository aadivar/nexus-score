'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface DimensionRadarProps {
  dimensions: {
    provenance: number;
    people: number;
    organizations: number;
    funding: number;
    access: number;
  };
}

export function DimensionRadar({ dimensions }: DimensionRadarProps) {
  const data = [
    { dimension: 'Provenance', value: dimensions.provenance },
    { dimension: 'People', value: dimensions.people },
    { dimension: 'Organizations', value: dimensions.organizations },
    { dimension: 'Funding', value: dimensions.funding },
    { dimension: 'Access', value: dimensions.access },
  ];

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Dimension Profile</h3>
      <p className="mt-1 text-sm text-gray-500">Visual overview of metadata coverage across all five dimensions.</p>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} tickCount={5} />
            <Radar
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
