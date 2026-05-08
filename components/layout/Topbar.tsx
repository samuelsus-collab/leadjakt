interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="flex h-14 items-center border-b border-zinc-200 bg-white px-6">
      <h1 className="text-sm font-semibold text-zinc-900">{title}</h1>
    </header>
  )
}
