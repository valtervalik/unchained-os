'use client'

import { useMemo } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MetricCard } from '@/components/modules/metric-card'
import { useStore } from '@/lib/store'
import { scoreDeal, fmtCurrency, fmtPct, fmt } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function FundPage() {
  const deals = useStore(s => s.deals)
  const investors = useStore(s => s.investors)

  const activeDeals = deals.filter(d => ['Active', 'Scaling'].includes(d.stage))
  const totalCapital = investors.reduce((s, i) => s + i.capitalCommitted, 0)
  const totalDeployed = investors.reduce((s, i) => s + i.capitalDeployed, 0)
  const totalReturns = activeDeals.reduce((s, d) => s + d.calculations.investorMonthlyIncome, 0)
  const avgROI = totalDeployed > 0 ? (totalReturns / totalDeployed) * 100 : 0

  const scores = useMemo(() => {
    if (deals.length === 0) return []
    return deals.map(d => ({ deal: d, score: scoreDeal(d, deals) }))
  }, [deals])

  const bestDeal = scores.filter(s => !s.score.filtered).sort((a, b) => b.score.totalScore - a.score.totalScore)[0]
  const worstDeal = scores.filter(s => !s.score.filtered).sort((a, b) => a.score.totalScore - b.score.totalScore)[0]

  // Investor performance
  const investorPerf = investors.map(inv => {
    const monthlyIncome = inv.allocations.reduce((s, a) => {
      const deal = deals.find(d => d.id === a.dealId)
      if (!deal) return s
      return s + deal.calculations.investorMonthlyIncome * (a.ownershipPct / deal.inputs.ownershipPct)
    }, 0)
    const roi = inv.capitalDeployed > 0 ? (monthlyIncome / inv.capitalDeployed) * 100 : 0
    const bestAlloc = inv.allocations
      .map(a => ({ alloc: a, deal: deals.find(d => d.id === a.dealId) }))
      .filter(x => x.deal)
      .sort((a, b) => b.deal!.calculations.investorMonthlyIncome - a.deal!.calculations.investorMonthlyIncome)[0]
    return { investor: inv, monthlyIncome, roi, bestAlloc }
  })

  // Portfolio over time (simulate 12 months)
  const portfolioTimeline = Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`,
    cumulative: Math.round(totalReturns * (i + 1)),
    deployed: Math.round(totalDeployed),
  }))

  // Stage distribution
  const stageDist = ['Lead', 'Analyzed', 'Viable', 'Negotiation', 'Active', 'Scaling', 'Exit', 'Failed'].map(stage => ({
    name: stage,
    value: deals.filter(d => d.stage === stage).length,
  })).filter(x => x.value > 0)

  return (
    <AppLayout title="Fund Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Global metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total Capital" value={fmtCurrency(totalCapital)} sub={`${investors.length} investors`} />
          <MetricCard label="Total Deployed" value={fmtCurrency(totalDeployed)} sub={`${activeDeals.length} active deals`} />
          <MetricCard label="Monthly Returns" value={fmtCurrency(totalReturns)} sub="All active deals" color="text-emerald-400" />
          <MetricCard label="Avg. Portfolio ROI" value={fmtPct(avgROI, 2)} sub="Per month" color="text-violet-400" />
        </div>

        {/* Best/worst deals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestDeal && (
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-5">
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide mb-2">Best Performing Deal</p>
                <p className="text-xl font-bold text-white">{bestDeal.deal.name}</p>
                <p className="text-sm text-zinc-400 mb-3">{bestDeal.deal.industry}</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-zinc-600 text-xs">Score</p><p className="text-white font-bold">{fmt(bestDeal.score.totalScore, 0)}/100</p></div>
                  <div><p className="text-zinc-600 text-xs">Monthly</p><p className="text-emerald-400 font-bold">{fmtCurrency(bestDeal.deal.calculations.investorMonthlyIncome)}</p></div>
                  <div><p className="text-zinc-600 text-xs">Payback</p><p className="text-white font-bold">{fmt(bestDeal.deal.calculations.paybackPeriod, 1)} mo</p></div>
                </div>
              </CardContent>
            </Card>
          )}
          {worstDeal && worstDeal.deal.id !== bestDeal?.deal.id && (
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-5">
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-2">Lowest Score Deal</p>
                <p className="text-xl font-bold text-white">{worstDeal.deal.name}</p>
                <p className="text-sm text-zinc-400 mb-3">{worstDeal.deal.industry}</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-zinc-600 text-xs">Score</p><p className="text-white font-bold">{fmt(worstDeal.score.totalScore, 0)}/100</p></div>
                  <div><p className="text-zinc-600 text-xs">Monthly</p><p className="text-red-400 font-bold">{fmtCurrency(worstDeal.deal.calculations.investorMonthlyIncome)}</p></div>
                  <div><p className="text-zinc-600 text-xs">Payback</p><p className="text-white font-bold">{fmt(worstDeal.deal.calculations.paybackPeriod, 1)} mo</p></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Cumulative returns chart */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-300">Projected Cumulative Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={portfolioTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: unknown) => fmtCurrency(Number(v))} />
                  <Area type="monotone" dataKey="cumulative" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} name="Cumulative" />
                  <Area type="monotone" dataKey="deployed" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeDasharray="4 4" name="Deployed" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Deal stage distribution */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-300">Pipeline Stage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stageDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {stageDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Investor performance table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-300">Investor Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {investors.length === 0 ? (
              <p className="text-center text-zinc-600 py-8">No investors yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                    <th className="pb-2 px-2">Investor</th>
                    <th className="pb-2 px-2 text-right">Committed</th>
                    <th className="pb-2 px-2 text-right">Deployed</th>
                    <th className="pb-2 px-2 text-right">Remaining</th>
                    <th className="pb-2 px-2 text-right">Monthly Returns</th>
                    <th className="pb-2 px-2 text-right">ROI /mo</th>
                    <th className="pb-2 px-2">Best Deal</th>
                    <th className="pb-2 px-2 text-right">Deals</th>
                  </tr>
                </thead>
                <tbody>
                  {investorPerf.map(({ investor, monthlyIncome, roi, bestAlloc }) => (
                    <tr key={investor.id} className="border-b border-zinc-800/50">
                      <td className="py-2.5 px-2 font-medium text-white">{investor.name}</td>
                      <td className="py-2.5 px-2 text-right text-zinc-300">{fmtCurrency(investor.capitalCommitted)}</td>
                      <td className="py-2.5 px-2 text-right text-violet-400">{fmtCurrency(investor.capitalDeployed)}</td>
                      <td className="py-2.5 px-2 text-right text-zinc-300">{fmtCurrency(investor.capitalCommitted - investor.capitalDeployed)}</td>
                      <td className="py-2.5 px-2 text-right text-emerald-400">{fmtCurrency(monthlyIncome)}</td>
                      <td className="py-2.5 px-2 text-right text-blue-400">{fmtPct(roi, 2)}</td>
                      <td className="py-2.5 px-2 text-zinc-300">{bestAlloc?.deal?.name ?? '—'}</td>
                      <td className="py-2.5 px-2 text-right text-zinc-400">{investor.allocations.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Deal income breakdown */}
        {activeDeals.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-300">Active Deal Income Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activeDeals.map(d => ({ name: d.name.slice(0, 12), income: Math.round(d.calculations.investorMonthlyIncome), investment: Math.round(d.inputs.investment) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: unknown) => fmtCurrency(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" fill="#10b981" name="Monthly Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="investment" fill="#8b5cf6" name="Investment" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
