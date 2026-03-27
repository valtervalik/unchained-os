'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { MetricCard } from '@/components/modules/metric-card'
import { ScoreSlider } from '@/components/modules/score-slider'
import { calcDeal, calcQualitative, calcProjections, calcScenarios, fmtCurrency, fmtPct, fmt, decisionBg } from '@/lib/calculations'
import { useStore } from '@/lib/store'
import type { DealAnalyzerInputs, QualitativeScores, ProjectionMode } from '@/lib/types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { AlertTriangle, Save, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

const DEFAULT_INPUTS: DealAnalyzerInputs = {
  monthlyRevenue: 100000,
  expectedRevenueIncrease: 30000,
  currentMargin: 15,
  optimizedMargin: 25,
  investment: 150000,
  ownershipPct: 30,
}

const DEFAULT_QUAL: QualitativeScores = {
  product: 3, market: 3, margins: 3, owner: 3, scalability: 3, risk: 3,
}

function NumberInput({ label, value, onChange, prefix, suffix, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-zinc-400 text-xs uppercase tracking-wide">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">{prefix}</span>}
        <Input
          type="number"
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={`bg-zinc-800 border-zinc-700 text-white ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">{suffix}</span>}
      </div>
    </div>
  )
}

export default function DealAnalyzerPage() {
  const router = useRouter()
  const addDeal = useStore(s => s.addDeal)

  const [inputs, setInputs] = useState<DealAnalyzerInputs>(DEFAULT_INPUTS)
  const [qual, setQual] = useState<QualitativeScores>(DEFAULT_QUAL)
  const [mode, setMode] = useState<ProjectionMode>('Linear')
  const [dealName, setDealName] = useState('')
  const [industry, setIndustry] = useState('')

  const setI = (k: keyof DealAnalyzerInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const setQ = (k: keyof QualitativeScores) => (v: number) => setQual(p => ({ ...p, [k]: v }))

  const calc = calcDeal(inputs)
  const qualResult = calcQualitative(qual)
  const qm = qualResult.projectionMultiplier

  const proj3 = calcProjections(inputs, mode, 3, qm)
  const proj6 = calcProjections(inputs, mode, 6, qm)
  const proj12 = calcProjections(inputs, mode, 12, qm)
  const scenarios = calcScenarios(inputs, qm)

  const chartData12 = proj12.map(p => ({
    month: `M${p.month}`,
    revenue: Math.round(p.revenue),
    profit: Math.round(p.profit),
    investorIncome: Math.round(p.investorIncome),
    cumulative: Math.round(p.cumulative),
  }))

  const scenarioChart = scenarios.map(s => ({
    name: s.type,
    monthly: Math.round(s.calculations.investorMonthlyIncome),
    payback: s.calculations.paybackPeriod === Infinity ? 99 : Math.round(s.calculations.paybackPeriod),
  }))

  function handleSave() {
    if (!dealName.trim()) { toast.error('Enter a deal name'); return }
    if (qualResult.autoReject) { toast.error('Cannot save: owner score auto-reject'); return }
    const deal = addDeal(inputs, qual, { name: dealName.trim(), industry: industry.trim(), stage: 'Lead' })
    toast.success(`Deal "${deal.name}" saved to pipeline`)
    router.push('/pipeline')
  }

  return (
    <AppLayout title="Deal Analyzer">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Save bar */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Deal name..."
              value={dealName}
              onChange={e => setDealName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white w-56"
            />
            <Input
              placeholder="Industry..."
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white w-44"
            />
            <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 gap-2">
              <Save className="w-4 h-4" /> Save to Pipeline
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left: inputs */}
          <div className="xl:col-span-1 space-y-4">

            {/* Module A Inputs */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" /> Financial Inputs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <NumberInput label="Monthly Revenue (R)" value={inputs.monthlyRevenue} onChange={setI('monthlyRevenue')} prefix="$" />
                <NumberInput label="Expected Revenue Increase (ΔR)" value={inputs.expectedRevenueIncrease} onChange={setI('expectedRevenueIncrease')} prefix="$" />
                <NumberInput label="Current Margin" value={inputs.currentMargin} onChange={setI('currentMargin')} suffix="%" step={0.5} />
                <NumberInput label="Optimized Margin (M2)" value={inputs.optimizedMargin} onChange={setI('optimizedMargin')} suffix="%" step={0.5} />
                <NumberInput label="Investment (I)" value={inputs.investment} onChange={setI('investment')} prefix="$" />
                <NumberInput label="Ownership %" value={inputs.ownershipPct} onChange={setI('ownershipPct')} suffix="%" step={0.5} />
              </CardContent>
            </Card>

            {/* Module B Inputs */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-300">Qualitative Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <ScoreSlider label="Product" value={qual.product} onChange={setQ('product')} />
                <ScoreSlider label="Market" value={qual.market} onChange={setQ('market')} />
                <ScoreSlider label="Margins" value={qual.margins} onChange={setQ('margins')} warning />
                <ScoreSlider label="Owner" value={qual.owner} onChange={setQ('owner')} critical />
                <ScoreSlider label="Scalability" value={qual.scalability} onChange={setQ('scalability')} warning />
                <ScoreSlider label="Risk (lower = less risk)" value={qual.risk} onChange={setQ('risk')} />
              </CardContent>
            </Card>
          </div>

          {/* Right: results */}
          <div className="xl:col-span-2 space-y-4">

            {/* Decision Banner */}
            <div className={`rounded-xl border p-4 ${decisionBg(calc.decision)}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold opacity-70 mb-1">Decision</p>
                  <p className="text-3xl font-black tracking-tight">{calc.decision}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-70 mb-1">Payback Period</p>
                  <p className="text-2xl font-bold">
                    {isFinite(calc.paybackPeriod) ? `${fmt(calc.paybackPeriod, 1)} mo` : '∞'}
                  </p>
                </div>
              </div>
            </div>

            {qualResult.warnings.length > 0 && (
              <div className="space-y-2">
                {qualResult.warnings.map((w, i) => (
                  <Alert key={i} className="bg-yellow-500/10 border-yellow-500/30 text-yellow-300">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{w}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Generated Profit" value={fmtCurrency(calc.generatedProfit)} sub="Monthly" />
              <MetricCard label="Investor Income" value={fmtCurrency(calc.investorMonthlyIncome)} sub="Per month" />
              <MetricCard label="Qual. Score" value={`${qualResult.totalScore}/30`} sub={`×${fmt(qualResult.projectionMultiplier, 2)} adj`} />
              <MetricCard label="Proj. Multiplier" value={fmtPct((qualResult.projectionMultiplier - 1) * 100, 0)} sub="Impact" color={qualResult.projectionMultiplier >= 1 ? 'text-emerald-400' : 'text-red-400'} />
            </div>

            {/* Projections */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-zinc-300">12-Month Projection</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className={mode === 'Linear' ? 'text-white' : ''}>Linear</span>
                    <Switch checked={mode === 'Compound'} onCheckedChange={v => setMode(v ? 'Compound' : 'Linear')} />
                    <span className={mode === 'Compound' ? 'text-white' : ''}>Compound</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="chart">
                  <TabsList className="bg-zinc-800 mb-4">
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                    <TabsTrigger value="table">Table</TabsTrigger>
                  </TabsList>
                  <TabsContent value="chart">
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                          labelStyle={{ color: '#a1a1aa' }}
                          formatter={(v: unknown) => fmtCurrency(Number(v))}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" dot={false} name="Revenue" />
                        <Line type="monotone" dataKey="profit" stroke="#3b82f6" dot={false} name="Profit" />
                        <Line type="monotone" dataKey="investorIncome" stroke="#10b981" dot={false} name="Investor Income" />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  <TabsContent value="table">
                    <div className="overflow-auto max-h-56">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-zinc-500 border-b border-zinc-800">
                            <th className="text-left py-2 px-2">Month</th>
                            <th className="text-right py-2 px-2">Revenue</th>
                            <th className="text-right py-2 px-2">Profit</th>
                            <th className="text-right py-2 px-2">Inv. Income</th>
                            <th className="text-right py-2 px-2">Cumulative</th>
                            <th className="text-right py-2 px-2">ROI %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proj12.map(p => (
                            <tr key={p.month} className={`border-b border-zinc-800/50 ${p.paybackReached ? 'text-emerald-400' : 'text-zinc-300'}`}>
                              <td className="py-1.5 px-2">{p.month}</td>
                              <td className="text-right py-1.5 px-2">{fmtCurrency(p.revenue)}</td>
                              <td className="text-right py-1.5 px-2">{fmtCurrency(p.profit)}</td>
                              <td className="text-right py-1.5 px-2">{fmtCurrency(p.investorIncome)}</td>
                              <td className="text-right py-1.5 px-2">{fmtCurrency(p.cumulative)}</td>
                              <td className="text-right py-1.5 px-2">{fmtPct(p.roi)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Scenarios */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">Scenario Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {scenarios.map(s => (
                    <div key={s.type} className="bg-zinc-800 rounded-lg p-3 space-y-1">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{s.type}</p>
                      <p className="text-lg font-bold text-white">{fmtCurrency(s.calculations.investorMonthlyIncome)}<span className="text-xs font-normal text-zinc-500">/mo</span></p>
                      <p className={`text-xs font-medium ${decisionBg(s.calculations.decision)} inline-block px-1.5 py-0.5 rounded`}>
                        {s.calculations.decision}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Payback: {isFinite(s.calculations.paybackPeriod) ? `${fmt(s.calculations.paybackPeriod, 1)} mo` : '∞'}
                      </p>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={scenarioChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                      formatter={(v: unknown, name: unknown) => [name === 'payback' ? `${Number(v)} mo` : fmtCurrency(Number(v)), String(name)]}
                    />
                    <Bar dataKey="monthly" fill="#8b5cf6" name="Monthly Income" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Projection Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[{ label: '3 Months', pts: proj3 }, { label: '6 Months', pts: proj6 }, { label: '12 Months', pts: proj12 }].map(({ label, pts }) => {
                const last = pts[pts.length - 1]
                const pb = pts.find(p => p.paybackReached)
                return (
                  <Card key={label} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4">
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">{label}</p>
                      <p className="text-lg font-bold text-white">{fmtCurrency(last?.cumulative ?? 0)}</p>
                      <p className="text-xs text-zinc-500">Cumulative</p>
                      <Separator className="my-2 bg-zinc-800" />
                      <p className="text-xs text-zinc-400">{fmtCurrency(last?.investorIncome ?? 0)}/mo</p>
                      {pb ? (
                        <Badge className="mt-1 bg-emerald-500/20 text-emerald-400 border-0 text-xs">Payback M{pb.month}</Badge>
                      ) : (
                        <Badge className="mt-1 bg-zinc-700 text-zinc-500 border-0 text-xs">No payback</Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
