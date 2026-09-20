'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

export function Brand({ size = 'md', variant = 'default', showText = true, className }: { size?: 'sm' | 'md' | 'lg'; variant?: 'default' | 'light'; showText?: boolean; className?: string }) {
  const dim = size === 'sm' ? 28 : size === 'lg' ? 44 : 36
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
  const subSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[10px]' : 'text-[9px]'
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <Image
        src="/avas-icon.svg"
        alt="The AVAS"
        width={dim}
        height={dim}
        className="shrink-0 rounded-[22%]"
        priority
      />
      {showText && (
        <div className="leading-none">
          <div className={cn('font-display tracking-tight', textSize, variant === 'light' ? 'text-white' : 'text-avas-blue')}>
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
