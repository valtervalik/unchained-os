'use client'

import { useMemo } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/lib/store'
import { scoreDeal, fmtCurrency, fmtPct, fmt, decisionBg } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

export default function DealsPage() {
  const deals = useStore(s => s.deals)

  const scores = useMemo(() => {
    if (deals.length === 0) return []
    return deals
      .map(d => ({ deal: d, score: scoreDeal(d, deals) }))
      .sort((a, b) => b.score.totalScore - a.score.totalScore)
  }, [deals])

  const best = scores.find(s => !s.score.filtered)

  return (
    <AppLayout title="Deal Comparator">
      <div className="max-w-7xl mx-auto space-y-6">

        {deals.length === 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-16 text-center text-zinc-500">
              <p className="text-lg font-medium mb-2">No deals yet</p>
              <p className="text-sm">Analyze a deal first to see it here.</p>
            </CardContent>
          </Card>
        )}

        {best && (
          <Card className="bg-linear-to-r from-violet-600/20 to-violet-500/10 border-violet-500/30">
            <CardContent className="p-5 flex items-center gap-4">
              <Trophy className="w-8 h-8 text-violet-400 shrink-0" />
              <div>
                <p className="text-xs text-violet-400 font-semibold uppercase tracking-wide">Best Deal</p>
                <p className="text-xl font-bold text-white">{best.deal.name}</p>
                <p className="text-sm text-zinc-400">{best.deal.industry} · Score: {fmt(best.score.totalScore, 1)}/100</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-zinc-500 mb-0.5">Monthly Income</p>
                <p className="text-xl font-bold text-emerald-400">{fmtCurrency(best.deal.calculations.investorMonthlyIncome)}</p>
                <p className="text-xs text-zinc-500">Payback {fmt(best.deal.calculations.paybackPeriod, 1)} mo</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ranked table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-300">Ranked Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800 text-left">
                    <th className="pb-2 px-2">#</th>
                    <th className="pb-2 px-2">Deal</th>
                    <th className="pb-2 px-2">Decision</th>
                    <th className="pb-2 px-2 text-right">Investment</th>
                    <th className="pb-2 px-2 text-right">Monthly</th>
                    <th className="pb-2 px-2 text-right">Payback</th>
                    <th className="pb-2 px-2 text-right">ROI Score</th>
                    <th className="pb-2 px-2 text-right">Qual Score</th>
                    <th className="pb-2 px-2 text-right">Total</th>
                    <th className="pb-2 px-2 text-right">Cap. Eff.</th>
                    <th className="pb-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map(({ deal, score }, i) => (
                    <tr key={deal.id} className={cn(
                      'border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30',
                      score.filtered ? 'opacity-40' : '',
                      i === 0 && !score.filtered ? 'bg-violet-600/5' : '',
                    )}>
                      <td className="py-2.5 px-2 font-bold text-zinc-400">{score.filtered ? '—' : i + 1}</td>
                      <td className="py-2.5 px-2">
                        <p className="font-medium text-white">{deal.name}</p>
                        <p className="text-xs text-zinc-500">{deal.industry}</p>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-semibold border', decisionBg(deal.calculations.decision))}>
                          {deal.calculations.decision}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-zinc-300">{fmtCurrency(deal.inputs.investment)}</td>
                      <td className="py-2.5 px-2 text-right text-zinc-300">{fmtCurrency(deal.calculations.investorMonthlyIncome)}</td>
                      <td className="py-2.5 px-2 text-right text-zinc-300">
                        {isFinite(deal.calculations.paybackPeriod) ? `${fmt(deal.calculations.paybackPeriod, 1)} mo` : '∞'}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <ScoreBar value={score.roiScore} />
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <ScoreBar value={score.qualitativeScore} />
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-white">{fmt(score.totalScore, 1)}</td>
                      <td className="py-2.5 px-2 text-right text-zinc-300">{fmtPct(score.capitalEfficiency * 100, 2)}</td>
                      <td className="py-2.5 px-2">
                        {score.filtered ? (
                          <Badge variant="destructive" className="text-xs">{score.filterReason}</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Qualified</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Score breakdown cards */}
        {scores.filter(s => !s.score.filtered).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scores.filter(s => !s.score.filtered).slice(0, 6).map(({ deal, score }) => {
              const radarData = [
                { metric: 'ROI', value: Math.round(score.roiScore) },
                { metric: 'Payback', value: Math.round(score.paybackScore) },
                { metric: 'Qualitative', value: Math.round(score.qualitativeScore) },
                { metric: 'Risk', value: Math.round(score.riskScore) },
              ]
              return (
                <Card key={deal.id} className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-white">{deal.name}</CardTitle>
                      <span className="text-lg font-black text-violet-400">{fmt(score.totalScore, 0)}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{deal.industry}</p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={150}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#3f3f46" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#71717a' }} />
                        <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                        <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div><span className="text-zinc-500">Monthly: </span><span className="text-white font-medium">{fmtCurrency(deal.calculations.investorMonthlyIncome)}</span></div>
                      <div><span className="text-zinc-500">Payback: </span><span className="text-white font-medium">{fmt(deal.calculations.paybackPeriod, 1)} mo</span></div>
                      <div><span className="text-zinc-500">Qual: </span><span className="text-white font-medium">{deal.qualitativeResult.totalScore}/30</span></div>
                      <div><span className="text-zinc-500">Stage: </span><span className="text-white font-medium">{deal.stage}</span></div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn('h-full rounded-full', value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500')}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 w-6 text-right">{Math.round(value)}</span>
    </div>
  )
}
