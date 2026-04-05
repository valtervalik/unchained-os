'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Deal, Investor, Alert, DealAnalyzerInputs, QualitativeScores, MonthlyActual, DealStage } from './types'
import { calcDeal, calcQualitative, calcProjections, calcScenarios } from './calculations'

// ─── Helper: build full deal from inputs ──────────────────────────────────

function buildDeal(
  inputs: DealAnalyzerInputs,
  qualitative: QualitativeScores,
  overrides: Partial<Deal> = {},
): Omit<Deal, 'id' | 'createdAt'> & { id?: string; createdAt?: string } {
  const calculations = calcDeal(inputs)
  const qualitativeResult = calcQualitative(qualitative)
  const qm = qualitativeResult.projectionMultiplier

  return {
    name: 'New Deal',
    industry: '',
    stage: 'Lead' as DealStage,
    notes: '',
    inputs,
    qualitative,
    calculations,
    qualitativeResult,
    projections: {
      linear3m: calcProjections(inputs, 'Linear', 3, qm),
      linear6m: calcProjections(inputs, 'Linear', 6, qm),
      linear12m: calcProjections(inputs, 'Linear', 12, qm),
      compound3m: calcProjections(inputs, 'Compound', 3, qm),
      compound6m: calcProjections(inputs, 'Compound', 6, qm),
      compound12m: calcProjections(inputs, 'Compound', 12, qm),
    },
    scenarios: calcScenarios(inputs, qm),
    actuals: [],
    ...overrides,
  }
}

// ─── Store Interface ──────────────────────────────────────────────────────

interface OsStore {
  deals: Deal[]
  investors: Investor[]
  alerts: Alert[]

  // Deal CRUD
  addDeal: (inputs: DealAnalyzerInputs, qualitative: QualitativeScores, meta: Partial<Deal>) => Deal
  updateDeal: (id: string, inputs: DealAnalyzerInputs, qualitative: QualitativeScores, meta: Partial<Deal>) => void
  deleteDeal: (id: string) => void
  updateDealStage: (id: string, stage: DealStage) => void
  addActual: (dealId: string, actual: MonthlyActual) => void
  removeActual: (dealId: string, month: number, year: number) => void

  // Investor CRUD
  addInvestor: (investor: Omit<Investor, 'id' | 'createdAt'>) => Investor
  updateInvestor: (id: string, data: Partial<Investor>) => void
  deleteInvestor: (id: string) => void
  allocateToDeal: (investorId: string, dealId: string, amount: number, ownershipPct: number) => void

  // Alerts
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'dismissed'>) => void
  dismissAlert: (id: string) => void
  clearAlerts: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useStore = create<OsStore>()(
  persist(
    (set, get) => ({
      deals: [],
      investors: [],
      alerts: [],

      addDeal: (inputs, qualitative, meta) => {
        const deal: Deal = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          ...buildDeal(inputs, qualitative, meta),
        } as Deal
        set(s => ({ deals: [...s.deals, deal] }))
        return deal
      },

      updateDeal: (id, inputs, qualitative, meta) => {
        set(s => ({
          deals: s.deals.map(d =>
            d.id !== id
              ? d
              : {
                  ...d,
                  ...buildDeal(inputs, qualitative, { ...meta, actuals: d.actuals }),
                  id,
                  createdAt: d.createdAt,
                } as Deal,
          ),
        }))
      },

      deleteDeal: (id) => set(s => ({ deals: s.deals.filter(d => d.id !== id) })),

      updateDealStage: (id, stage) =>
        set(s => ({
          deals: s.deals.map(d => d.id === id ? { ...d, stage } : d),
        })),

      addActual: (dealId, actual) =>
        set(s => ({
          deals: s.deals.map(d =>
            d.id !== dealId
              ? d
              : {
                  ...d,
                  actuals: [
                    ...d.actuals.filter(a => !(a.month === actual.month && a.year === actual.year)),
                    actual,
                  ].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month),
                },
          ),
        })),

      removeActual: (dealId, month, year) =>
        set(s => ({
          deals: s.deals.map(d =>
            d.id !== dealId
              ? d
              : { ...d, actuals: d.actuals.filter(a => !(a.month === month && a.year === year)) },
          ),
        })),

      addInvestor: (data) => {
        const investor: Investor = { id: uuidv4(), createdAt: new Date().toISOString(), ...data }
        set(s => ({ investors: [...s.investors, investor] }))
        return investor
      },

      updateInvestor: (id, data) =>
        set(s => ({
          investors: s.investors.map(i => i.id === id ? { ...i, ...data } : i),
        })),

      deleteInvestor: (id) => set(s => ({ investors: s.investors.filter(i => i.id !== id) })),

      allocateToDeal: (investorId, dealId, amount, ownershipPct) =>
        set(s => ({
          investors: s.investors.map(i => {
            if (i.id !== investorId) return i
            const existing = i.allocations.find(a => a.dealId === dealId)
            const allocations = existing
              ? i.allocations.map(a => a.dealId === dealId ? { ...a, amount, ownershipPct } : a)
              : [...i.allocations, { dealId, amount, ownershipPct }]
            const capitalDeployed = allocations.reduce((sum, a) => sum + a.amount, 0)
            return { ...i, allocations, capitalDeployed }
          }),
        })),

      addAlert: (alert) =>
        set(s => ({
          alerts: [
            { ...alert, id: uuidv4(), createdAt: new Date().toISOString(), dismissed: false },
            ...s.alerts,
          ],
        })),

      dismissAlert: (id) =>
        set(s => ({
          alerts: s.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a),
        })),

      clearAlerts: () => set({ alerts: [] }),
    }),
    { name: 'unchained-deal-analyzer' },
  ),
)
