'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface RadarDimensions {
  provenance: number;
  people: number;
  organizations: number;
  funding: number;
  access: number;
}

interface DimensionRadarProps {
  historical: RadarDimensions | null;
  current: RadarDimensions | null;
  scopeLabel: string;
}

function RadarProfile({
  title,
  subtitle,
  dimensions,
  color,
}: {
  title: string;
  subtitle: string;
  dimensions: RadarDimensions | null;
  color: string;
}) {
  const data = dimensions
    ? [
        { dimension: 'Provenance', value: dimensions.provenance },
        { dimension: 'People', value: dimensions.people },
        { dimension: 'Organizations', value: dimensions.organizations },
        { dimension: 'Funding', value: dimensions.funding },
        { dimension: 'Access', value: dimensions.access },
      ]
    : [];

  return (
    <section className="min-w-0 p-3 sm:p-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
      </div>
      {dimensions ? (
        <div className="mt-2 h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
              <PolarGrid stroke="var(--color-rule)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: 'var(--color-neutral)' }} />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 8, fill: 'var(--color-muted)' }}
                tickCount={5}
              />
              <Radar
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-56 items-center justify-center text-center text-sm text-gray-500 sm:h-64">
          No profile is available for this era.
        </div>
      )}
    </section>
  );
}

export function DimensionRadar({ historical, current, scopeLabel }: DimensionRadarProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm print:break-inside-avoid">
      <div className="border-b px-4 py-4 sm:px-6">
        <h3 className="text-lg font-semibold text-gray-900">Dimension Profile</h3>
        <p className="mt-1 text-sm text-gray-500">{scopeLabel} · the same five dimensions in each era</p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <RadarProfile
          title="Backfile"
          subtitle="Older records"
          dimensions={historical}
          color="var(--color-neutral)"
        />
        <RadarProfile
          title="Current"
          subtitle={`${currentYear - 2}–${currentYear}`}
          dimensions={current}
          color="var(--color-signal)"
        />
      </div>
    </div>
  );
}
