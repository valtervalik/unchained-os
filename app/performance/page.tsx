'use client'

import { useState, useMemo } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStore } from '@/lib/store'
import { calcRevenueDev, performanceLabel, fmtCurrency, fmtPct, fmt } from '@/lib/calculations'
import type { MonthlyActual } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { AlertTriangle, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { toast } from 'sonner'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function PerformancePage() {
  const deals = useStore(s => s.deals)
  const addActual = useStore(s => s.addActual)
  const removeActual = useStore(s => s.removeActual)
  const addAlert = useStore(s => s.addAlert)

  const [selectedDeal, setSelectedDeal] = useState(deals[0]?.id ?? '')
  const [form, setForm] = useState({ month: '1', year: String(new Date().getFullYear()), revenue: '', profit: '', investorIncome: '' })

  const deal = deals.find(d => d.id === selectedDeal)

  const chartData = useMemo(() => {
    if (!deal) return []
    const proj = deal.projections.linear12m
    return proj.map((p, i) => {
      const actual = deal.actuals.find(a => a.month === i + 1)
      return {
        month: `M${p.month}`,
        projRevenue: Math.round(p.revenue),
        projProfit: Math.round(p.profit),
        projIncome: Math.round(p.investorIncome),
        actualRevenue: actual?.revenue,
        actualProfit: actual?.profit,
        actualIncome: actual?.investorIncome,
      }
    })
  }, [deal])

  function handleAddActual() {
    if (!deal) return
    const month = Number(form.month)
    const year = Number(form.year)
    const revenue = Number(form.revenue)
    const profit = Number(form.profit)
    const investorIncome = Number(form.investorIncome)

    if (!revenue || !profit || !investorIncome) { toast.error('Fill in all fields'); return }

    const actual: MonthlyActual = { month, year, revenue, profit, investorIncome }
    addActual(deal.id, actual)

    // Check alerts
    const proj = deal.projections.linear12m[month - 1]
    if (proj) {
      const dev = calcRevenueDev(revenue, proj.revenue)
      if (Math.abs(dev) > 20) {
        addAlert({
          dealId: deal.id,
          dealName: deal.name,
          message: dev < 0 ? `Revenue deviation ${fmtPct(dev, 1)} — deal underperforming` : `Revenue up ${fmtPct(dev, 1)} — outperforming`,
          severity: dev < 0 ? 'critical' : 'info',
        })
      }
      const ratio = investorIncome / proj.investorIncome
      if (ratio < 0.8) {
        addAlert({ dealId: deal.id, dealName: deal.name, message: 'Payback at risk — income below projection by >20%', severity: 'warning' })
      }
    }

    toast.success('Actual data added')
    setForm(f => ({ ...f, revenue: '', profit: '', investorIncome: '' }))
  }

  const latestActual = deal?.actuals[deal.actuals.length - 1]
  const latestProj = latestActual ? deal?.projections.linear12m[latestActual.month - 1] : null

  const performanceRatio = latestActual && latestProj
    ? latestActual.investorIncome / latestProj.investorIncome
    : null

  const totalCumulative = deal?.actuals.reduce((s, a) => s + a.investorIncome, 0) ?? 0
  const paybackProgress = deal ? Math.min(100, (totalCumulative / deal.inputs.investment) * 100) : 0

  return (
    <AppLayout title="Performance Tracking">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Deal selector */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <Label className="text-zinc-400 text-sm shrink-0">Deal:</Label>
            <Select value={selectedDeal} onValueChange={v => { if (v) setSelectedDeal(v) }}>
              <SelectTrigger className="w-64 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select deal..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {deals.map(d => (
                  <SelectItem key={d.id} value={d.id} className="text-white hover:bg-zinc-800">{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {!deal && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-16 text-center text-zinc-500">Select a deal to track performance</CardContent>
          </Card>
        )}

        {deal && (
          <>
            {/* Performance metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Performance Ratio</p>
                  {performanceRatio !== null ? (
                    <>
                      <p className={cn('text-2xl font-bold', performanceRatio > 1 ? 'text-emerald-400' : performanceRatio < 1 ? 'text-red-400' : 'text-white')}>
                        {fmt(performanceRatio, 2)}x
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {performanceRatio > 1 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : performanceRatio < 1 ? <TrendingDown className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-zinc-400" />}
                        <p className="text-xs text-zinc-500">{performanceLabel(performanceRatio)}</p>
                      </div>
                    </>
                  ) : <p className="text-lg text-zinc-600">No data</p>}
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Cumulative Income</p>
                  <p className="text-2xl font-bold text-white">{fmtCurrency(totalCumulative)}</p>
                  <p className="text-xs text-zinc-500">of {fmtCurrency(deal.inputs.investment)} target</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Payback Progress</p>
                  <p className="text-2xl font-bold text-white">{fmtPct(paybackProgress, 1)}</p>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-2">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${paybackProgress}%` }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Data Points</p>
                  <p className="text-2xl font-bold text-white">{deal.actuals.length}</p>
                  <p className="text-xs text-zinc-500">months of actual data</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">Projected vs Actual — Investor Income</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                      formatter={(v: unknown) => v !== undefined ? fmtCurrency(Number(v)) : 'N/A'}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="projIncome" stroke="#8b5cf6" dot={false} strokeDasharray="4 4" name="Projected" />
                    <Line type="monotone" dataKey="actualIncome" stroke="#10b981" dot={{ r: 4 }} strokeWidth={2} name="Actual" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue chart */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">Projected vs Actual — Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: unknown) => fmtCurrency(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="projRevenue" stroke="#3b82f6" dot={false} strokeDasharray="4 4" name="Proj. Revenue" />
                    <Line type="monotone" dataKey="actualRevenue" stroke="#f59e0b" dot={{ r: 4 }} strokeWidth={2} name="Actual Revenue" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Add actual data */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">Log Actual Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">Month</Label>
                    <Select value={form.month} onValueChange={v => { if (v) setForm(f => ({ ...f, month: v })) }}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {MONTHS.map((m, i) => (
                          <SelectItem key={i} value={String(i + 1)} className="text-white">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">Year</Label>
                    <Input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">Revenue ($)</Label>
                    <Input type="number" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">Profit ($)</Label>
                    <Input type="number" value={form.profit} onChange={e => setForm(f => ({ ...f, profit: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">Inv. Income ($)</Label>
                    <Input type="number" value={form.investorIncome} onChange={e => setForm(f => ({ ...f, investorIncome: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
                  </div>
                </div>
                <Button onClick={handleAddActual} className="mt-3 bg-violet-600 hover:bg-violet-700 gap-2">
                  <Plus className="w-4 h-4" /> Log Actual
                </Button>
              </CardContent>
            </Card>

            {/* Actuals table */}
            {deal.actuals.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-300">Actual Data Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                        <th className="pb-2 px-2">Period</th>
                        <th className="pb-2 px-2 text-right">Revenue</th>
                        <th className="pb-2 px-2 text-right">Profit</th>
                        <th className="pb-2 px-2 text-right">Inv. Income</th>
                        <th className="pb-2 px-2 text-right">Rev. Dev.</th>
                        <th className="pb-2 px-2 text-right">Perf. Ratio</th>
                        <th className="pb-2 px-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {deal.actuals.map(a => {
                        const proj = deal.projections.linear12m[a.month - 1]
                        const dev = proj ? calcRevenueDev(a.revenue, proj.revenue) : null
                        const ratio = proj ? a.investorIncome / proj.investorIncome : null
                        return (
                          <tr key={`${a.year}-${a.month}`} className="border-b border-zinc-800/50">
                            <td className="py-2 px-2 text-zinc-300">{MONTHS[a.month - 1]} {a.year}</td>
                            <td className="py-2 px-2 text-right text-zinc-300">{fmtCurrency(a.revenue)}</td>
                            <td className="py-2 px-2 text-right text-zinc-300">{fmtCurrency(a.profit)}</td>
                            <td className="py-2 px-2 text-right text-zinc-300">{fmtCurrency(a.investorIncome)}</td>
                            <td className={cn('py-2 px-2 text-right', dev !== null ? (dev >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-500')}>
                              {dev !== null ? fmtPct(dev, 1) : '—'}
                            </td>
                            <td className={cn('py-2 px-2 text-right', ratio !== null ? (ratio > 1 ? 'text-emerald-400' : ratio < 0.8 ? 'text-red-400' : 'text-yellow-400') : 'text-zinc-500')}>
                              {ratio !== null ? `${fmt(ratio, 2)}x` : '—'}
                            </td>
                            <td className="py-2 px-2">
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-600 hover:text-red-400"
                                onClick={() => removeActual(deal.id, a.month, a.year)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
