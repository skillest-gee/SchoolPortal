import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { designSystem } from '@/lib/design-system'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  gradient: 'emerald' | 'blue' | 'violet' | 'amber' | 'rose' | 'green' | 'purple' | 'orange' | 'red'
  subtitle?: string
  className?: string
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  gradient,
  subtitle,
  className = ''
}: StatsCardProps) {
  const gradientClasses = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    violet: 'from-violet-500 to-violet-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  }

  const textColorClasses = {
    emerald: 'text-emerald-100',
    blue: 'text-blue-100',
    violet: 'text-violet-100',
    amber: 'text-amber-100',
    rose: 'text-rose-100',
    green: 'text-green-100',
    purple: 'text-purple-100',
    orange: 'text-orange-100',
    red: 'text-red-100',
  }

  return (
    <Card className={`bg-gradient-to-br ${gradientClasses[gradient]} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`${textColorClasses[gradient]} text-sm font-medium`}>{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className={`${textColorClasses[gradient]} text-xs mt-1`}>{subtitle}</p>
            )}
          </div>
          <div className="p-3 bg-white/20 rounded-full">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
