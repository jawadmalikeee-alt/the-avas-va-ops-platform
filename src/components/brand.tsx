'use client'

import { cn } from '@/lib/utils'

export function Brand({ size = 'md', variant = 'default', showText = true, className }: { size?: 'sm' | 'md' | 'lg'; variant?: 'default' | 'light'; showText?: boolean; className?: string }) {
  const dim = size === 'sm' ? 28 : size === 'lg' ? 40 : 32
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
  const subSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[10px]' : 'text-[9px]'
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <svg width={dim} height={dim} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <rect width="32" height="32" rx="6" fill="#1a1f3d" />
        <path d="M9 22L16 8L23 22M12 17H20" stroke="#c9a961" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showText && (
        <div className="leading-none">
          <div className={cn('font-display font-bold tracking-tight', textSize, variant === 'light' ? 'text-white' : 'text-navy')}>
            THE AVAS
          </div>
          <div className={cn('font-medium uppercase tracking-[0.18em] mt-0.5', subSize, variant === 'light' ? 'text-white/50' : 'text-muted-foreground')}>
            VA Operations
          </div>
        </div>
      )}
    </div>
  )
}
