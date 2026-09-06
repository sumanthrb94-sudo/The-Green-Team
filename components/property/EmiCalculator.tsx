'use client';

/**
 * EMI calculator — the affordability tool every portal carries. Runs on the
 * entry price with three sliders (loan share, rate, tenure). Clearly labelled
 * indicative: the real number depends on the lender and the unit.
 */
import { useMemo, useState } from 'react';
import { formatRs } from '@/lib/utils';

export function EmiCalculator({ price }: { price: number }) {
  const [pct, setPct] = useState(80);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const principal = (price * pct) / 100;
  const emi = useMemo(() => {
    const r = rate / 1200;
    const n = years * 12;
    return r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [principal, rate, years]);
  const total = emi * years * 12;
  const interest = total - principal;
  const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  return (
    <div className="rounded-3xl border border-outline/12 bg-surface-container-low p-5 md:p-6 grid md:grid-cols-[1fr_auto] gap-6">
      <div className="space-y-5">
        <Slider label="Loan amount" value={pct} min={20} max={90} step={5} onChange={setPct} display={`${formatRs(principal)} · ${pct}% of price`} />
        <Slider label="Interest rate" value={rate} min={7} max={12} step={0.1} onChange={setRate} display={`${rate.toFixed(1)}% p.a.`} />
        <Slider label="Tenure" value={years} min={5} max={30} step={1} onChange={setYears} display={`${years} years`} />
      </div>
      <div className="md:min-w-[14rem] rounded-2xl bg-primary text-on-primary p-5 flex flex-col justify-center">
        <p className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-70">Monthly EMI</p>
        <p className="font-headline font-extrabold tracking-[-0.02em] text-3xl mt-1">{inr(emi)}</p>
        <div className="mt-4 text-xs opacity-80 space-y-1">
          <p>Loan {formatRs(principal)}</p>
          <p>Interest {formatRs(interest)}</p>
          <p>Total payable {formatRs(total)}</p>
        </div>
      </div>
      <p className="md:col-span-2 text-[11px] text-secondary/60 leading-relaxed">
        Indicative only, on the entry price of {formatRs(price)}. Your actual EMI depends on the lender, your profile
        and the unit you choose.
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-secondary/50">{label}</span>
        <span className="text-sm font-semibold text-on-surface">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full accent-[#2d3a1d]"
      />
    </label>
  );
}
