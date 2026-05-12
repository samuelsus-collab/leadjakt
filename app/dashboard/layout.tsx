import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/toast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-zinc-50">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
