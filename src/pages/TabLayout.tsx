import { NavLink, Outlet } from 'react-router-dom';
import { Home, Tv, Film, MonitorPlay, Settings } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/live', label: 'Live', icon: Tv },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/series', label: 'Series', icon: MonitorPlay },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function TabLayout() {
  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)]">
      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      {/* Fixed bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-txt-muted)] hover:text-[var(--color-txt-secondary)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
