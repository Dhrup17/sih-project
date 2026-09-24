import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex min-h-screen w-full overflow-hidden bg-background',
      className
    )}
    {...props}
  >
    {children}
  </div>
))

Layout.displayName = 'Layout'

export default Layout