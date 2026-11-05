// ============================================================
// SHIFTShield 2.0 — Design System: Tabs
// ============================================================

import { createContext, useContext, useState } from 'react'
import { clsx } from 'clsx'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue>({ activeTab: '', setActiveTab: () => {} })

interface TabsProps {
  defaultTab: string
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={clsx('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: React.ReactNode
  className?: string
  variant?: 'line' | 'pill'
}

export function TabList({ children, className, variant = 'line' }: TabListProps) {
  return (
    <div className={clsx(
      'flex',
      variant === 'line'
        ? 'border-b border-gray-200 gap-1'
        : 'bg-gray-100 rounded-lg p-1 gap-1',
      className
    )}>
      {children}
    </div>
  )
}

interface TabProps {
  value: string
  children: React.ReactNode
  icon?: React.ReactNode
}

export function Tab({ value, children, icon }: TabProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={clsx(
        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg',
        'transition-all duration-150 focus:outline-none',
        isActive
          ? 'text-primary border-b-2 border-primary bg-transparent -mb-px'
          : 'text-secondary hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent -mb-px'
      )}
    >
      {icon}
      {children}
    </button>
  )
}

interface TabPanelProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== value) return null
  return <div className={clsx('animate-fade-in', className)}>{children}</div>
}

export function useTabContext() {
  return useContext(TabsContext)
}
