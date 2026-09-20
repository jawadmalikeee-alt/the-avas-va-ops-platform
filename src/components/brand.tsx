'use client'

import { cn } from '@/lib/utils'

export function Brand({ size = 'md', showText = true, className }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean; className?: string }) {
  const dim = size === 'sm' ? 24 : size === 'lg' ? 36 : 30
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <rect width="24" height="24" rx="5" fill="#0F172A" />
        <path d="M7 16L12 6L17 16M9 13H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showText && (
        <div className={cn('font-display font-semibold tracking-tight leading-none', textSize)}>
          <span className="text-foreground">The AVAS</span>
        </div>
      )}
    </div>
  )
}
