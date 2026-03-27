'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { fmtCurrency, fmtPct, fmt } from '@/lib/calculations'
import type { Investor } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Plus, Trash2, UserPlus, Link2 } from 'lucide-react'
import { toast } from 'sonner'

function InvestorCard({ investor }: { investor: Investor }) {
  const deals = useStore(s => s.deals)
  const deleteInvestor = useStore(s => s.deleteInvestor)
  const allocateToDeal = useStore(s => s.allocateToDeal)

  const [showAlloc, setShowAlloc] = useState(false)
  const [allocDeal, setAllocDeal] = useState('')
  const [allocAmt, setAllocAmt] = useState('')
  const [allocOwn, setAllocOwn] = useState('')

  const remaining = investor.capitalCommitted - investor.capitalDeployed
  const roi = investor.capitalDeployed > 0
    ? investor.allocations.reduce((s, a) => {
        const d = deals.find(x => x.id === a.dealId)
        return s + (d ? d.calculations.investorMonthlyIncome : 0)
      }, 0)
    : 0

  const totalReturns = roi // monthly
  const roiPct = investor.capitalDeployed > 0 ? (roi / investor.capitalDeployed) * 100 : 0

  function handleAllocate() {
    if (!allocDeal || !allocAmt || !allocOwn) { toast.error('Fill all fields'); return }
    const amt = Number(allocAmt)
    if (amt > remaining) { toast.error('Exceeds remaining capital'); return }
    allocateToDeal(investor.id, allocDeal, amt, Number(allocOwn))
    toast.success('Allocation added')
    setAllocDeal('')
    setAllocAmt('')
    setAllocOwn('')
    setShowAlloc(false)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-white">{investor.name}</CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">Since {new Date(investor.createdAt).toLocaleDateString()}</p>
          </div>
          <Button size="icon" variant="ghost" className="text-zinc-600 hover:text-red-400 h-7 w-7"
            onClick={() => { deleteInvestor(investor.id); toast.success('Investor removed') }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capital stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-0.5">Committed</p>
            <p className="text-sm font-bold text-white">{fmtCurrency(investor.capitalCommitted)}</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-0.5">Deployed</p>
            <p className="text-sm font-bold text-violet-400">{fmtCurrency(investor.capitalDeployed)}</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-0.5">Remaining</p>
            <p className="text-sm font-bold text-emerald-400">{fmtCurrency(remaining)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Capital utilization</span>
            <span>{investor.capitalCommitted > 0 ? fmtPct((investor.capitalDeployed / investor.capitalCommitted) * 100, 1) : '0%'}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full">
            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${investor.capitalCommitted > 0 ? Math.min(100, (investor.capitalDeployed / investor.capitalCommitted) * 100) : 0}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-0.5">Monthly Returns</p>
            <p className="text-sm font-bold text-emerald-400">{fmtCurrency(totalReturns)}</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-0.5">Portfolio ROI</p>
            <p className="text-sm font-bold text-blue-400">{fmtPct(roiPct, 2)}/mo</p>
          </div>
        </div>

        {/* Allocations */}
        {investor.allocations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Deal Allocations</p>
            {investor.allocations.map(a => {
              const deal = deals.find(d => d.id === a.dealId)
              if (!deal) return null
              const monthlyIncome = deal.calculations.investorMonthlyIncome * (a.ownershipPct / deal.inputs.ownershipPct)
              const perfRatio = deal.actuals.length > 0
                ? (deal.actuals[deal.actuals.length - 1].investorIncome / (deal.projections.linear12m[deal.actuals.length - 1]?.investorIncome ?? 1))
                : null

              return (
                <div key={a.dealId} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm text-white font-medium">{deal.name}</p>
                    <p className="text-xs text-zinc-500">{a.ownershipPct}% · {fmtCurrency(a.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-400">{fmtCurrency(monthlyIncome)}/mo</p>
                    {perfRatio !== null && (
                      <p className={cn('text-xs', perfRatio > 1 ? 'text-emerald-400' : 'text-red-400')}>
                        {fmt(perfRatio, 2)}x
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Allocate to deal */}
        <div>
          {!showAlloc ? (
            <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white w-full gap-2"
              onClick={() => setShowAlloc(true)}>
              <Link2 className="w-3.5 h-3.5" /> Allocate to Deal
            </Button>
          ) : (
            <div className="space-y-2">
              <Select value={allocDeal} onValueChange={v => { if (v) setAllocDeal(v) }}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                  <SelectValue placeholder="Select deal..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {deals.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">$</span>
                  <Input type="number" placeholder="Amount" value={allocAmt} onChange={e => setAllocAmt(e.target.value)} className="pl-5 bg-zinc-800 border-zinc-700 text-white text-sm h-8" />
                </div>
                <div className="relative w-24">
                  <Input type="number" placeholder="Own %" value={allocOwn} onChange={e => setAllocOwn(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white text-sm h-8" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAllocate} className="bg-violet-600 hover:bg-violet-700 flex-1 text-xs h-7">Allocate</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAlloc(false)} className="text-zinc-500 text-xs h-7">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function InvestorsPage() {
  const investors = useStore(s => s.investors)
  const addInvestor = useStore(s => s.addInvestor)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', capitalCommitted: '' })

  function handleAdd() {
    if (!form.name.trim() || !form.capitalCommitted) { toast.error('Fill all fields'); return }
    addInvestor({
      name: form.name.trim(),
      capitalCommitted: Number(form.capitalCommitted),
      capitalDeployed: 0,
      allocations: [],
    })
    toast.success('Investor added')
    setForm({ name: '', capitalCommitted: '' })
    setShowForm(false)
  }

  const totalCommitted = investors.reduce((s, i) => s + i.capitalCommitted, 0)
  const totalDeployed = investors.reduce((s, i) => s + i.capitalDeployed, 0)

  return (
    <AppLayout title="Investors">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Investors</p>
              <p className="text-2xl font-bold text-white">{investors.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Committed</p>
              <p className="text-2xl font-bold text-white">{fmtCurrency(totalCommitted)}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Deployed</p>
              <p className="text-2xl font-bold text-violet-400">{fmtCurrency(totalDeployed)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Add investor */}
        <div className="flex items-center gap-3">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700 gap-2">
              <UserPlus className="w-4 h-4" /> Add Investor
            </Button>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800 flex-1">
              <CardContent className="p-4 flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Investor name" className="bg-zinc-800 border-zinc-700 text-white w-48" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Capital Committed</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                    <Input type="number" value={form.capitalCommitted} onChange={e => setForm(f => ({ ...f, capitalCommitted: e.target.value }))} className="pl-7 bg-zinc-800 border-zinc-700 text-white w-40" />
                  </div>
                </div>
                <Button onClick={handleAdd} className="bg-violet-600 hover:bg-violet-700">Add</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)} className="text-zinc-500">Cancel</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Investor cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {investors.map(inv => <InvestorCard key={inv.id} investor={inv} />)}
          {investors.length === 0 && (
            <Card className="bg-zinc-900 border-zinc-800 col-span-full">
              <CardContent className="py-16 text-center text-zinc-500">No investors yet. Add your first investor.</CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
