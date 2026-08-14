'use client';

/** Admin overview charts — recharts, brand palette, transform/opacity-only motion. */
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

const GREEN = '#4a5c3d';
const GREEN_SOFT = '#a3b18a';
const GOLD = '#b8860b';
const PALETTE = [GREEN, GREEN_SOFT, GOLD, '#8a3d36', '#586062', '#7d9a6b', '#c8a951'];

export function LeadsOverTime({ data }: { data: { week: string; leads: number; newsletter: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
            <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gNews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
            <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
        <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--outline)',
            borderRadius: 12,
            fontSize: 12,
          }}
        />
        <Area type="monotone" dataKey="leads" name="Leads" stroke={GREEN} strokeWidth={2} fill="url(#gLeads)" />
        <Area type="monotone" dataKey="newsletter" name="Newsletter" stroke={GOLD} strokeWidth={2} fill="url(#gNews)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SourceBreakdown({ data }: { data: { source: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 10 }}>
        <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="source" width={92} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: 'rgba(128,128,128,0.06)' }}
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--outline)',
            borderRadius: 12,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" name="Leads" radius={[0, 8, 8, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
