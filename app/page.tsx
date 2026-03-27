'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/modules/metric-card'
import { useStore } from '@/lib/store'
import { scoreDeal, fmtCurrency, fmtPct, fmt, decisionBg } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'
import { TrendingUp, AlertTriangle, Zap, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const deals = useStore(s => s.deals)
  const investors = useStore(s => s.investors)
  const alerts = useStore(s => s.alerts)

  const activeDeals = deals.filter(d => ['Active', 'Scaling'].includes(d.stage))
  const totalDeployed = activeDeals.reduce((s, d) => s + d.inputs.investment, 0)
  const totalMonthlyReturns = activeDeals.reduce((s, d) => s + d.calculations.investorMonthlyIncome, 0)
  const totalCapital = investors.reduce((s, i) => s + i.capitalCommitted, 0)
  const portfolioROI = totalDeployed > 0 ? (totalMonthlyReturns / totalDeployed) * 100 : 0
  const activeAlerts = alerts.filter(a => !a.dismissed).length

  const scores = useMemo(() => {
    if (deals.length === 0) return []
    return deals
      .map(d => ({ deal: d, score: scoreDeal(d, deals) }))
      .filter(s => !s.score.filtered)
      .sort((a, b) => b.score.totalScore - a.score.totalScore)
  }, [deals])

  const bestDeal = scores[0]

  const timeline = Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`,
    projected: Math.round(totalMonthlyReturns * (i + 1)),
  }))

  const stageData = ['Lead', 'Analyzed', 'Viable', 'Negotiation', 'Active', 'Scaling'].map(stage => ({
    name: stage,
    count: deals.filter(d => d.stage === stage).length,
  }))

  return (
    <AppLayout title="Capital Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">

        {deals.length === 0 && (
          <Card className="bg-linear-to-br from-violet-600/10 to-zinc-900 border-violet-500/20">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/20 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-violet-400" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Welcome to Unchained OS</h2>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Your private equity operating system. Start by analyzing your first deal.
              </p>
              <Link href="/deal-analyzer">
                <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                  <TrendingUp className="w-4 h-4" /> Analyze Your First Deal
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total Capital" value={fmtCurrency(totalCapital)} sub={`${investors.length} investors`} />
          <MetricCard label="Deployed" value={fmtCurrency(totalDeployed)} sub={`${activeDeals.length} active`} color="text-violet-400" />
          <MetricCard label="Monthly Returns" value={fmtCurrency(totalMonthlyReturns)} sub="Active portfolio" color="text-emerald-400" />
          <MetricCard label="Portfolio ROI" value={fmtPct(portfolioROI, 2)} sub="Per month" color={portfolioROI > 5 ? 'text-emerald-400' : 'text-zinc-300'} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total Deals" value={String(deals.length)} sub="All stages" />
          <MetricCard label="Active Alerts" value={String(activeAlerts)} sub={activeAlerts > 0 ? 'Needs attention' : 'All clear'} color={activeAlerts > 0 ? 'text-red-400' : 'text-zinc-300'} />
          <MetricCard label="Projected 12m" value={fmtCurrency(totalMonthlyReturns * 12)} sub="Based on current" color="text-blue-400" />
          <MetricCard label="Investors" value={String(investors.length)} sub="Registered" />
        </div>

        {deals.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-300">12-Month Cumulative Return Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: unknown) => fmtCurrency(Number(v))} />
                      <Area type="monotone" dataKey="projected" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} name="Cumulative" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-300">Deals by Stage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#71717a" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Deals" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {bestDeal && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-300">Top Ranked Deal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div>
                      <p className="text-xl font-bold text-white">{bestDeal.deal.name}</p>
                      <p className="text-sm text-zinc-400">{bestDeal.deal.industry} · {bestDeal.deal.stage}</p>
                    </div>
                    <div className={cn('px-3 py-1.5 rounded-lg border text-sm font-bold', decisionBg(bestDeal.deal.calculations.decision))}>
                      {bestDeal.deal.calculations.decision}
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-zinc-500">Monthly Income</p>
                        <p className="text-lg font-bold text-emerald-400">{fmtCurrency(bestDeal.deal.calculations.investorMonthlyIncome)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Payback</p>
                        <p className="text-lg font-bold text-white">{fmt(bestDeal.deal.calculations.paybackPeriod, 1)} mo</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Score</p>
                        <p className="text-lg font-bold text-violet-400">{fmt(bestDeal.score.totalScore, 0)}/100</p>
                      </div>
                    </div>
                    <Link href="/deals" className="ml-auto">
                      <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-white gap-1.5">
                        View All <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-zinc-300">Recent Deals</CardTitle>
                  <Link href="/pipeline">
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white text-xs gap-1">
                      Pipeline <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...deals].reverse().slice(0, 5).map(deal => (
                    <div key={deal.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                      <div>
                        <p className="text-sm font-medium text-white">{deal.name}</p>
                        <p className="text-xs text-zinc-500">{deal.industry} · {deal.stage}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-emerald-400">{fmtCurrency(deal.calculations.investorMonthlyIncome)}/mo</span>
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border', decisionBg(deal.calculations.decision))}>
                          {deal.calculations.decision}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {alerts.filter(a => !a.dismissed).length > 0 && (
              <Card className="bg-zinc-900 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Active Alerts ({alerts.filter(a => !a.dismissed).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {alerts.filter(a => !a.dismissed).slice(0, 4).map(alert => (
                      <div key={alert.id} className="flex items-start gap-3 py-2 border-b border-zinc-800/50">
                        <div className={cn('shrink-0 w-1.5 h-1.5 rounded-full mt-1.5',
                          alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        )} />
                        <div>
                          <p className="text-xs font-semibold text-zinc-400">{alert.dealName}</p>
                          <p className="text-sm text-zinc-300">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
