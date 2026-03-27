'use client'

import { cn } from '@/lib/utils'

interface ScoreSliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  inverse?: boolean
  critical?: boolean
  warning?: boolean
}

const DOT_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500']

export function ScoreSlider({ label, value, onChange, critical, warning }: ScoreSliderProps) {
  const dotColor = DOT_COLORS[value - 1] ?? 'bg-zinc-500'
  const pct = ((value - 1) / 4) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-300">{label}</span>
          {critical && (
            <span className="text-[10px] uppercase tracking-wide font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
              Critical
            </span>
          )}
          {warning && value < 3 && (
            <span className="text-[10px] uppercase tracking-wide font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded">
              Warning
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn('w-2.5 h-2.5 rounded-full', dotColor)} />
          <span className="text-sm font-bold text-white w-3 text-right">{value}</span>
          <span className="text-xs text-zinc-600">/5</span>
        </div>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1 rounded-full bg-zinc-700" />
        <div
          className={cn('absolute left-0 h-1 rounded-full transition-all', dotColor)}
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="relative w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-500 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-zinc-500 [&::-moz-range-thumb]:border-none"
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-600">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  )
}
