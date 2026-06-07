function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="#2C52D8" />
      <path d="M14 5L17 13H14H11L14 5Z" fill="#fff" />
      <path d="M14 23L11 15H14H17L14 23Z" fill="#fff" opacity="0.35" />
      <circle cx="14" cy="14" r="2" fill="#fff" />
    </svg>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--pm-bg)' }}>

      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col w-[420px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1E3EAE 0%, #2C52D8 50%, #3B6BF0 100%)' }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Blobs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #7AA3FF, transparent 70%)' }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #A5C0FF, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="bg-white rounded-xl p-1.5">
              <Logo />
            </div>
            <span
              className="text-white text-lg font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
            >
              FlowPilot
            </span>
          </div>

          {/* Hero */}
          <div className="py-16">
            <h2
              className="text-5xl leading-[1.1] mb-5 text-white"
              style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300 }}
            >
              Navigate every<br />
              project with<br />
              <span className="font-semibold" style={{ color: '#A5C8FF' }}>clarity.</span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Tasks, milestones, timelines, and AI-powered insights — all in one place.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '100%', label: 'Uptime' },
              { value: 'AI', label: 'Powered' },
              { value: '∞', label: 'Projects' },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                <p className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                  {value}
                </p>
                <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Logo />
            <span
              className="text-lg font-semibold"
              style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--pm-text)' }}
            >
              FlowPilot
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
