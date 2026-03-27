'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { fmtCurrency, fmt, decisionBg } from '@/lib/calculations'
import type { Deal, DealStage } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronLeft, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const STAGES: DealStage[] = ['Lead', 'Analyzed', 'Viable', 'Negotiation', 'Active', 'Scaling', 'Exit', 'Failed']

const STAGE_COLORS: Record<DealStage, string> = {
  Lead: 'border-zinc-600 bg-zinc-800/50',
  Analyzed: 'border-blue-500/40 bg-blue-500/5',
  Viable: 'border-violet-500/40 bg-violet-500/5',
  Negotiation: 'border-orange-500/40 bg-orange-500/5',
  Active: 'border-emerald-500/40 bg-emerald-500/5',
  Scaling: 'border-cyan-500/40 bg-cyan-500/5',
  Exit: 'border-zinc-500/40 bg-zinc-500/5',
  Failed: 'border-red-500/40 bg-red-500/5',
}

const STAGE_BADGE: Record<DealStage, string> = {
  Lead: 'bg-zinc-700 text-zinc-300',
  Analyzed: 'bg-blue-500/20 text-blue-400',
  Viable: 'bg-violet-500/20 text-violet-400',
  Negotiation: 'bg-orange-500/20 text-orange-400',
  Active: 'bg-emerald-500/20 text-emerald-400',
  Scaling: 'bg-cyan-500/20 text-cyan-400',
  Exit: 'bg-zinc-500/20 text-zinc-300',
  Failed: 'bg-red-500/20 text-red-400',
}

function DealCard({ deal }: { deal: Deal }) {
  const updateStage = useStore(s => s.updateDealStage)
  const deleteDeal = useStore(s => s.deleteDeal)
  const stageIdx = STAGES.indexOf(deal.stage)

  function advance() {
    if (stageIdx < STAGES.length - 1) {
      updateStage(deal.id, STAGES[stageIdx + 1])
      toast.success(`${deal.name} → ${STAGES[stageIdx + 1]}`)
    }
  }
  function retreat() {
    if (stageIdx > 0) {
      updateStage(deal.id, STAGES[stageIdx - 1])
    }
  }
  function remove() {
    deleteDeal(deal.id)
    toast.success(`${deal.name} deleted`)
  }

  return (
    <div className={cn('rounded-xl border p-3 space-y-2 transition-colors', STAGE_COLORS[deal.stage])}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-white text-sm truncate">{deal.name}</p>
          <p className="text-xs text-zinc-500 truncate">{deal.industry || '—'}</p>
        </div>
        <span className={cn('text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0', STAGE_BADGE[deal.stage])}>
          {deal.stage}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div>
          <span className="text-zinc-600">Investment </span>
          <span className="text-zinc-300">{fmtCurrency(deal.inputs.investment)}</span>
        </div>
        <div>
          <span className="text-zinc-600">Own. </span>
          <span className="text-zinc-300">{deal.inputs.ownershipPct}%</span>
        </div>
        <div>
          <span className="text-zinc-600">Monthly </span>
          <span className="text-zinc-300">{fmtCurrency(deal.calculations.investorMonthlyIncome)}</span>
        </div>
        <div>
          <span className="text-zinc-600">Payback </span>
          <span className="text-zinc-300">
            {isFinite(deal.calculations.paybackPeriod) ? `${fmt(deal.calculations.paybackPeriod, 1)} mo` : '∞'}
          </span>
        </div>
        <div>
          <span className="text-zinc-600">Qual </span>
          <span className="text-zinc-300">{deal.qualitativeResult.totalScore}/30</span>
        </div>
        <div className={cn('font-semibold', decisionBg(deal.calculations.decision).split(' ')[1])}>
          {deal.calculations.decision}
        </div>
      </div>

      <div className="flex items-center gap-1 pt-1">
        <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-500 hover:text-white" onClick={retreat} disabled={stageIdx === 0}>
          <ChevronLeft className="w-3 h-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-500 hover:text-white" onClick={advance} disabled={stageIdx === STAGES.length - 1}>
          <ChevronRight className="w-3 h-3" />
        </Button>
        <div className="flex-1" />
        <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-600 hover:text-red-400" onClick={remove}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const deals = useStore(s => s.deals)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

  const byStage = STAGES.reduce<Record<DealStage, Deal[]>>((acc, stage) => {
    acc[stage] = deals.filter(d => d.stage === stage)
    return acc
  }, {} as Record<DealStage, Deal[]>)

  const totalDeployed = deals.filter(d => ['Active', 'Scaling'].includes(d.stage)).reduce((s, d) => s + d.inputs.investment, 0)
  const totalIncome = deals.filter(d => ['Active', 'Scaling'].includes(d.stage)).reduce((s, d) => s + d.calculations.investorMonthlyIncome, 0)

  return (
    <AppLayout title="CRM Pipeline">
      <div className="max-w-full space-y-5">

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Deals" value={String(deals.length)} />
          <StatCard label="Active Deals" value={String(deals.filter(d => d.stage === 'Active').length)} />
          <StatCard label="Capital Deployed" value={fmtCurrency(totalDeployed)} />
          <StatCard label="Monthly Income" value={fmtCurrency(totalIncome)} />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant={view === 'kanban' ? 'default' : 'outline'} onClick={() => setView('kanban')} className={view === 'kanban' ? 'bg-violet-600' : 'border-zinc-700 text-zinc-400'}>Kanban</Button>
          <Button size="sm" variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')} className={view === 'list' ? 'bg-violet-600' : 'border-zinc-700 text-zinc-400'}>List</Button>
          <Link href="/deal-analyzer">
            <Button size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> New Deal
            </Button>
          </Link>
        </div>

        {/* Kanban */}
        {view === 'kanban' && (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <div key={stage} className="shrink-0 w-56 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className={cn('text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded', STAGE_BADGE[stage])}>
                    {stage}
                  </span>
                  <span className="text-xs text-zinc-600">{byStage[stage].length}</span>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {byStage[stage].map(deal => <DealCard key={deal.id} deal={deal} />)}
                  {byStage[stage].length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-700">Empty</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {view === 'list' && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                    <th className="py-3 px-4">Deal</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4 text-right">Investment</th>
                    <th className="py-3 px-4 text-right">Monthly</th>
                    <th className="py-3 px-4 text-right">Payback</th>
                    <th className="py-3 px-4 text-right">Qual</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map(deal => {
                    const stageIdx = STAGES.indexOf(deal.stage)
                    const updateStage = useStore.getState().updateDealStage
                    const deleteDeal = useStore.getState().deleteDeal
                    return (
                      <tr key={deal.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="py-2.5 px-4">
                          <p className="font-medium text-white">{deal.name}</p>
                          <p className="text-xs text-zinc-500">{deal.industry}</p>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', STAGE_BADGE[deal.stage])}>
                            {deal.stage}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-zinc-300">{fmtCurrency(deal.inputs.investment)}</td>
                        <td className="py-2.5 px-4 text-right text-zinc-300">{fmtCurrency(deal.calculations.investorMonthlyIncome)}</td>
                        <td className="py-2.5 px-4 text-right text-zinc-300">
                          {isFinite(deal.calculations.paybackPeriod) ? `${fmt(deal.calculations.paybackPeriod, 1)} mo` : '∞'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-zinc-300">{deal.qualitativeResult.totalScore}/30</td>
                        <td className="py-2.5 px-4">
                          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border', decisionBg(deal.calculations.decision))}>
                            {deal.calculations.decision}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-500 hover:text-white"
                              onClick={() => stageIdx < STAGES.length - 1 && updateStage(deal.id, STAGES[stageIdx + 1])}>
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-600 hover:text-red-400"
                              onClick={() => { deleteDeal(deal.id); toast.success(`${deal.name} deleted`) }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {deals.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-zinc-600">No deals in pipeline</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  )
}
