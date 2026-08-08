'use client';

import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildMemberHref, type BenchmarkScope } from '@/lib/benchmark-scope';

interface PublisherRadarProps {
  id: number;
  name: string;
  score: number;
  dimensions: {
    provenance: number;
    people: number;
    organizations: number;
    funding: number;
    access: number;
  };
  scope: BenchmarkScope;
  onClose: () => void;
}

const DIMENSION_LABELS: Record<string, { label: string; description: string }> = {
  provenance: { label: 'Provenance', description: 'References, update policies, similarity check' },
  people: { label: 'People', description: 'ORCID coverage' },
  organizations: { label: 'Organizations', description: 'Affiliations and ROR IDs' },
  funding: { label: 'Funding', description: 'Funder registry and award numbers' },
  access: { label: 'Access', description: 'Licenses, full-text links, abstracts' },
};

export function PublisherRadar({ id, name, score, dimensions, scope, onClose }: PublisherRadarProps) {
  const data = Object.entries(dimensions).map(([key, value]) => ({
    dimension: DIMENSION_LABELS[key]?.label || key,
    value,
    fullMark: 100,
  }));

  const strongest = Object.entries(dimensions).sort((a, b) => b[1] - a[1])[0];
  const weakest = Object.entries(dimensions).sort((a, b) => a[1] - b[1])[0];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 truncate max-w-[280px]">{name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">{score}</span>
            <span className="text-sm text-gray-400">/100</span>
            <span className="text-xs font-medium text-gray-500">index</span>
          </div>
          <Link href={buildMemberHref(id, scope)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1">
            View full profile <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Dimension Profile</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} tickCount={5} />
              <Radar
                name={name}
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 space-y-3">
          {Object.entries(dimensions).map(([key, value]) => {
            const info = DIMENSION_LABELS[key];
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{info?.label || key}</span>
                  <span className="text-sm font-mono text-gray-500">{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : value >= 20 ? 'bg-orange-500' : 'bg-red-500'
                    )}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{info?.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Highest coverage</span>
            <span className="font-medium text-green-700">
              {DIMENSION_LABELS[strongest[0]]?.label} ({strongest[1]}%)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Largest coverage gap</span>
            <span className="font-medium text-red-700">
              {DIMENSION_LABELS[weakest[0]]?.label} ({weakest[1]}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
