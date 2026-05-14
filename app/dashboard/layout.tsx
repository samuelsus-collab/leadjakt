import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/toast'
import { KeyboardShortcuts } from '@/components/layout/KeyboardShortcuts'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <KeyboardShortcuts />
      <div className="flex h-screen overflow-hidden bg-zinc-50">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
