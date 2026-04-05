'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { fmtCurrency, fmtPct, fmt, decisionBg, calcRevenueDev } from '@/lib/calculations'
import type { Deal } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FileText, Download, Printer, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function MonthlyReport() {
  const deals = useStore(s => s.deals)
  const investors = useStore(s => s.investors)
  const now = new Date()

  const activeDeals = deals.filter(d => ['Active', 'Scaling'].includes(d.stage))
  const totalDeployed = activeDeals.reduce((s, d) => s + d.inputs.investment, 0)
  const totalMonthlyReturns = activeDeals.reduce((s, d) => s + d.calculations.investorMonthlyIncome, 0)
  const totalCapital = investors.reduce((s, i) => s + i.capitalCommitted, 0)
  const portfolioROI = totalDeployed > 0 ? (totalMonthlyReturns / totalDeployed) * 100 : 0

  return (
    <div className="space-y-8 font-mono text-sm" id="monthly-report">
      {/* Header */}
      <div className="border-b border-zinc-700 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">MONTHLY PORTFOLIO REPORT</h1>
            <p className="text-zinc-500 mt-1">{MONTHS[now.getMonth()]} {now.getFullYear()} · Generated {now.toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-600 uppercase tracking-widest">Unchained Deal Analyzer</p>
            <p className="text-xs text-zinc-600">Private Equity Deal Analyzer</p>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Executive Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800 rounded-xl overflow-hidden">
          {[
            { label: 'Total Capital', value: fmtCurrency(totalCapital) },
            { label: 'Capital Deployed', value: fmtCurrency(totalDeployed) },
            { label: 'Monthly Returns', value: fmtCurrency(totalMonthlyReturns) },
            { label: 'Portfolio ROI', value: fmtPct(portfolioROI, 2) + '/mo' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-900 p-4">
              <p className="text-xs text-zinc-600 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Pipeline Summary */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Pipeline Summary</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {['Lead', 'Analyzed', 'Viable', 'Negotiation', 'Active', 'Scaling', 'Exit', 'Failed'].map(stage => (
            <div key={stage} className="bg-zinc-800 rounded-lg p-3 text-center">
              <p className="text-xl font-black text-white">{deals.filter(d => d.stage === stage).length}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{stage}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Deal Breakdown */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Deal Breakdown ({deals.length} total)</h2>
        {deals.length === 0 ? (
          <p className="text-zinc-600">No deals in portfolio</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-600 text-xs uppercase tracking-wide">
                <th className="text-left pb-2 px-2">Deal</th>
                <th className="text-left pb-2 px-2">Stage</th>
                <th className="text-right pb-2 px-2">Investment</th>
                <th className="text-right pb-2 px-2">Own.%</th>
                <th className="text-right pb-2 px-2">Monthly</th>
                <th className="text-right pb-2 px-2">Payback</th>
                <th className="text-right pb-2 px-2">Qual</th>
                <th className="text-left pb-2 px-2">Decision</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {deals.map(d => (
                <tr key={d.id} className="border-b border-zinc-800/40">
                  <td className="py-2 px-2">
                    <p className="text-white font-medium">{d.name}</p>
                    <p className="text-xs text-zinc-600">{d.industry}</p>
                  </td>
                  <td className="py-2 px-2 text-xs">{d.stage}</td>
                  <td className="py-2 px-2 text-right">{fmtCurrency(d.inputs.investment)}</td>
                  <td className="py-2 px-2 text-right">{d.inputs.ownershipPct}%</td>
                  <td className="py-2 px-2 text-right">{fmtCurrency(d.calculations.investorMonthlyIncome)}</td>
                  <td className="py-2 px-2 text-right">
                    {isFinite(d.calculations.paybackPeriod) ? `${fmt(d.calculations.paybackPeriod, 1)} mo` : '∞'}
                  </td>
                  <td className="py-2 px-2 text-right">{d.qualitativeResult.totalScore}/30</td>
                  <td className="py-2 px-2">
                    <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded border', decisionBg(d.calculations.decision))}>
                      {d.calculations.decision}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Separator className="bg-zinc-800" />

      {/* Investor Summary */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Investor Summary</h2>
        {investors.length === 0 ? (
          <p className="text-zinc-600">No investors registered</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-600 text-xs uppercase tracking-wide">
                <th className="text-left pb-2 px-2">Investor</th>
                <th className="text-right pb-2 px-2">Committed</th>
                <th className="text-right pb-2 px-2">Deployed</th>
                <th className="text-right pb-2 px-2">Remaining</th>
                <th className="text-right pb-2 px-2">Utilization</th>
                <th className="text-right pb-2 px-2">Deals</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {investors.map(inv => (
                <tr key={inv.id} className="border-b border-zinc-800/40">
                  <td className="py-2 px-2 font-medium text-white">{inv.name}</td>
                  <td className="py-2 px-2 text-right">{fmtCurrency(inv.capitalCommitted)}</td>
                  <td className="py-2 px-2 text-right">{fmtCurrency(inv.capitalDeployed)}</td>
                  <td className="py-2 px-2 text-right">{fmtCurrency(inv.capitalCommitted - inv.capitalDeployed)}</td>
                  <td className="py-2 px-2 text-right">
                    {inv.capitalCommitted > 0 ? fmtPct((inv.capitalDeployed / inv.capitalCommitted) * 100, 1) : '0%'}
                  </td>
                  <td className="py-2 px-2 text-right">{inv.allocations.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 pt-4 text-xs text-zinc-600">
        <p>Report generated by Unchained Deal Analyzer · {now.toISOString()} · Confidential</p>
      </div>
    </div>
  )
}

function DealReport({ deal }: { deal: Deal }) {
  const now = new Date()
  const proj12 = deal.projections.linear12m

  return (
    <div className="space-y-8 font-mono text-sm">
      {/* Header */}
      <div className="border-b border-zinc-700 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">{deal.name.toUpperCase()}</h1>
            <p className="text-zinc-500">Deal Report · {now.toLocaleDateString()}</p>
            {deal.industry && <p className="text-zinc-500">{deal.industry}</p>}
          </div>
          <div className={cn('px-3 py-1.5 rounded-lg border text-sm font-bold', decisionBg(deal.calculations.decision))}>
            {deal.calculations.decision}
          </div>
        </div>
      </div>

      {/* Financial overview */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Financial Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800 rounded-xl overflow-hidden">
          {[
            { label: 'Investment', value: fmtCurrency(deal.inputs.investment) },
            { label: 'Ownership', value: fmtPct(deal.inputs.ownershipPct) },
            { label: 'Monthly Income', value: fmtCurrency(deal.calculations.investorMonthlyIncome) },
            { label: 'Payback Period', value: isFinite(deal.calculations.paybackPeriod) ? `${fmt(deal.calculations.paybackPeriod, 1)} mo` : 'N/A' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-900 p-4">
              <p className="text-xs text-zinc-600 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Qualitative */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Qualitative Analysis</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Product', v: deal.qualitative.product },
            { label: 'Market', v: deal.qualitative.market },
            { label: 'Margins', v: deal.qualitative.margins },
            { label: 'Owner', v: deal.qualitative.owner },
            { label: 'Scalability', v: deal.qualitative.scalability },
            { label: 'Risk', v: deal.qualitative.risk },
          ].map(({ label, v }) => (
            <div key={label} className="bg-zinc-800 rounded-lg p-3 text-center">
              <p className="text-lg font-black text-white">{v}/5</p>
              <p className="text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-zinc-400">Total Score: <span className="text-white font-bold">{deal.qualitativeResult.totalScore}/30</span></p>
        {deal.qualitativeResult.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {deal.qualitativeResult.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-yellow-400 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator className="bg-zinc-800" />

      {/* Scenarios */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Scenario Analysis</h2>
        <div className="grid grid-cols-3 gap-3">
          {deal.scenarios.map(s => (
            <div key={s.type} className="bg-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">{s.type}</p>
              <p className="text-base font-bold text-white">{fmtCurrency(s.calculations.investorMonthlyIncome)}/mo</p>
              <p className={cn('text-xs font-medium mt-1', decisionBg(s.calculations.decision).split(' ')[1])}>
                {s.calculations.decision}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Payback: {isFinite(s.calculations.paybackPeriod) ? `${fmt(s.calculations.paybackPeriod, 1)} mo` : '∞'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Projected vs Actual */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Performance (Projected vs Actual)</h2>
        {deal.actuals.length === 0 ? (
          <p className="text-zinc-600">No actual data logged</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-600 text-xs uppercase">
                <th className="text-left pb-2 px-2">Period</th>
                <th className="text-right pb-2 px-2">Proj. Revenue</th>
                <th className="text-right pb-2 px-2">Actual Revenue</th>
                <th className="text-right pb-2 px-2">Dev. %</th>
                <th className="text-right pb-2 px-2">Proj. Income</th>
                <th className="text-right pb-2 px-2">Actual Income</th>
                <th className="text-right pb-2 px-2">Ratio</th>
                <th className="text-left pb-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {deal.actuals.map(a => {
                const proj = proj12[a.month - 1]
                const dev = proj ? calcRevenueDev(a.revenue, proj.revenue) : null
                const ratio = proj ? a.investorIncome / proj.investorIncome : null
                return (
                  <tr key={`${a.year}-${a.month}`} className="border-b border-zinc-800/40">
                    <td className="py-2 px-2">{MONTHS[a.month - 1]} {a.year}</td>
                    <td className="py-2 px-2 text-right">{proj ? fmtCurrency(proj.revenue) : '—'}</td>
                    <td className="py-2 px-2 text-right">{fmtCurrency(a.revenue)}</td>
                    <td className={cn('py-2 px-2 text-right', dev !== null ? (dev >= 0 ? 'text-emerald-400' : 'text-red-400') : '')}>
                      {dev !== null ? fmtPct(dev, 1) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right">{proj ? fmtCurrency(proj.investorIncome) : '—'}</td>
                    <td className="py-2 px-2 text-right">{fmtCurrency(a.investorIncome)}</td>
                    <td className={cn('py-2 px-2 text-right', ratio !== null ? (ratio > 1 ? 'text-emerald-400' : ratio < 0.8 ? 'text-red-400' : 'text-yellow-400') : '')}>
                      {ratio !== null ? `${fmt(ratio, 2)}x` : '—'}
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {ratio !== null ? (
                        ratio > 1
                          ? <span className="text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Outperform</span>
                          : ratio < 0.8
                          ? <span className="text-red-400 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Risk</span>
                          : <span className="text-yellow-400 flex items-center gap-1"><Minus className="w-3 h-3" /> On Track</span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 pt-4 text-xs text-zinc-600">
        <p>Deal Report — {deal.name} · {now.toISOString()} · Confidential — Unchained Deal Analyzer</p>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const deals = useStore(s => s.deals)
  const [reportType, setReportType] = useState<'monthly' | 'deal'>('monthly')
  const [selectedDeal, setSelectedDeal] = useState(deals[0]?.id ?? '')

  const deal = deals.find(d => d.id === selectedDeal)

  function handlePrint() {
    window.print()
  }

  return (
    <AppLayout title="Automated Reporting">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Controls */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setReportType('monthly')}
                className={reportType === 'monthly' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}
              >
                Monthly Report
              </Button>
              <Button
                size="sm"
                onClick={() => setReportType('deal')}
                className={reportType === 'deal' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}
              >
                Deal Report
              </Button>
            </div>

            {reportType === 'deal' && (
              <Select value={selectedDeal} onValueChange={v => { if (v) setSelectedDeal(v) }}>
                <SelectTrigger className="w-52 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select deal..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {deals.map(d => (
                    <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="border-zinc-700 text-zinc-400 hover:text-white gap-2">
                <Printer className="w-3.5 h-3.5" /> Print / Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report content */}
        <Card className="bg-zinc-950 border-zinc-800 print:border-0 print:shadow-none">
          <CardContent className="p-8">
            {reportType === 'monthly' && <MonthlyReport />}
            {reportType === 'deal' && deal && <DealReport deal={deal} />}
            {reportType === 'deal' && !deal && (
              <p className="text-center text-zinc-600 py-16">Select a deal to generate its report</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
