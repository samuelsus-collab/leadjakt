import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  highlight?: 'red' | 'green'
}

export function MetricCard({ label, value, sub, highlight }: MetricCardProps) {
  return (
    <Card className={cn(highlight === 'red' && 'border-red-200', highlight === 'green' && 'border-green-200')}>
      <CardContent className="pt-5">
        <p className="text-sm text-zinc-500">{label}</p>
        <p className={cn(
          'mt-1 text-3xl font-bold',
          highlight === 'red' ? 'text-red-600' : highlight === 'green' ? 'text-green-600' : 'text-zinc-900'
        )}>
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
      </CardContent>
    </Card>
  )
}
