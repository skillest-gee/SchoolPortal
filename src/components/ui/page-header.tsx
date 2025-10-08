import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { designSystem, getModuleStyles } from '@/lib/design-system'

interface PageHeaderProps {
  title: string
  description?: string
  module?: keyof typeof designSystem.modules
  showBackButton?: boolean
  backUrl?: string
  actions?: React.ReactNode
  className?: string
}

export default function PageHeader({
  title,
  description,
  module = 'dashboard',
  showBackButton = true,
  backUrl,
  actions,
  className = ''
}: PageHeaderProps) {
  const router = useRouter()
  const moduleStyles = getModuleStyles(module)

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  return (
    <header className={`bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="bg-white/50 hover:bg-white/80 border-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className={`text-3xl font-bold ${moduleStyles.headerGradient}`}>
                {title}
              </h1>
              {description && (
                <p className="text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center space-x-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
