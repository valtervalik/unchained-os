import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  color?: string
  className?: string
}

export function MetricCard({ label, value, sub, color, className }: MetricCardProps) {
  return (
    <Card className={cn('bg-zinc-900 border-zinc-800', className)}>
      <CardContent className="p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
        <p className={cn('text-2xl font-bold text-white', color)}>{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}
