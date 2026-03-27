'use client'

import { useState, useMemo } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MetricCard } from '@/components/modules/metric-card'
import { useStore } from '@/lib/store'
import { scoreDeal, fmtCurrency, fmtPct, fmt } from '@/lib/calculations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Calculator, Wallet } from 'lucide-react'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#a3e635']

export default function CapitalPage() {
  const deals = useStore(s => s.deals)
  const [availableCapital, setAvailableCapital] = useState(500000)
  const [avgInvestment, setAvgInvestment] = useState(150000)

  const qualifiedDeals = useMemo(() => {
    return deals
      .map(d => ({ deal: d, score: scoreDeal(d, deals) }))
      .filter(x => !x.score.filtered)
      .sort((a, b) => b.score.totalScore - a.score.totalScore)
  }, [deals])

  const dealsPossible = avgInvestment > 0 ? Math.floor(availableCapital / avgInvestment) : 0
  const capitalPerDeal = dealsPossible > 0 ? availableCapital / dealsPossible : 0

  const distribution = qualifiedDeals.slice(0, dealsPossible).map((x, i) => ({
    name: x.deal.name,
    amount: capitalPerDeal,
    expectedMonthly: x.deal.calculations.investorMonthlyIncome,
    score: x.score.totalScore,
    color: COLORS[i % COLORS.length],
  }))

  const totalExpectedMonthly = distribution.reduce((s, d) => s + d.expectedMonthly, 0)
  const totalExpected12m = totalExpectedMonthly * 12
  const portfolioROI = availableCapital > 0 ? (totalExpectedMonthly / availableCapital) * 100 : 0

  const activeDeals = deals.filter(d => ['Active', 'Scaling'].includes(d.stage))
  const totalDeployed = activeDeals.reduce((s, d) => s + d.inputs.investment, 0)
  const totalReturns = activeDeals.reduce((s, d) => s + d.calculations.investorMonthlyIncome, 0)

  const pieData = distribution.map(d => ({ name: d.name, value: Math.round(d.amount) }))

  const barData = distribution.map(d => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
    investment: Math.round(d.amount),
    monthlyReturn: Math.round(d.expectedMonthly),
  }))

  return (
    <AppLayout title="Capital Allocation">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Active portfolio overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total Deployed" value={fmtCurrency(totalDeployed)} sub="Active deals" />
          <MetricCard label="Monthly Returns" value={fmtCurrency(totalReturns)} sub="Active portfolio" />
          <MetricCard label="Active Deals" value={String(activeDeals.length)} sub="In portfolio" />
          <MetricCard label="Remaining Capital" value={fmtCurrency(Math.max(0, availableCapital - totalDeployed))} sub="Available" />
        </div>

        {/* Capital allocation engine */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-violet-400" /> Capital Allocation Engine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs uppercase tracking-wide">Total Capital Available</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                  <Input
                    type="number"
                    value={availableCapital}
                    onChange={e => setAvailableCapital(Number(e.target.value))}
                    className="pl-7 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs uppercase tracking-wide">Avg. Investment per Deal</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                  <Input
                    type="number"
                    value={avgInvestment}
                    onChange={e => setAvgInvestment(Number(e.target.value))}
                    className="pl-7 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <div className="bg-violet-600/20 border border-violet-500/30 rounded-xl p-4 w-full">
                  <p className="text-xs text-violet-400 uppercase tracking-wide mb-1">Deals Possible</p>
                  <p className="text-3xl font-black text-white">{dealsPossible}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{fmtCurrency(capitalPerDeal)} per deal</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Expected Monthly Return</p>
                <p className="text-xl font-bold text-emerald-400">{fmtCurrency(totalExpectedMonthly)}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Expected 12m Return</p>
                <p className="text-xl font-bold text-emerald-400">{fmtCurrency(totalExpected12m)}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Portfolio ROI</p>
                <p className="text-xl font-bold text-violet-400">{fmtPct(portfolioROI, 2)}/mo</p>
              </div>
            </div>

            {distribution.length > 0 ? (
              <>
                <Separator className="bg-zinc-800 mb-4" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Distribution</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: unknown) => fmtCurrency(Number(v))} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Investment vs Return</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#71717a" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: unknown) => fmtCurrency(Number(v))} />
                        <Bar dataKey="investment" fill="#8b5cf6" name="Investment" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="monthlyReturn" fill="#10b981" name="Monthly Return" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {distribution.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-sm text-white font-medium">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-zinc-400">{fmtCurrency(d.amount)}</span>
                        <span className="text-emerald-400">{fmtCurrency(d.expectedMonthly)}/mo</span>
                        <span className="text-violet-400">Score {fmt(d.score, 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-zinc-600 text-sm">
                {qualifiedDeals.length === 0
                  ? 'No qualified deals available. Analyze deals first.'
                  : 'Capital allocation will appear once you set available capital.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
