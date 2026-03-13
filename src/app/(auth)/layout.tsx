export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">FlowSpace</p>
            <p className="text-xs text-slate-400 -mt-0.5">Team Collaboration</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
