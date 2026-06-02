'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, ReactNode, useEffect, useRef } from 'react';
import { useAuth } from '@/app/auth-context';
import AdminGuard from './admin-guard';
import {
  Grid2x2,
  BarChart3,
  Users2,
  UserSquare2,
  ShieldCheck,
  Image as ImageIcon,
  AlertTriangle,
  Sliders,
  AlertOctagon,
  CreditCard,
  FileText,
  Globe,
  History,
  Menu,
  X,
  Search,
  Bell,
  ChevronRight,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Grid2x2 },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users2 },
      { label: 'Profiles', href: '/admin/profiles', icon: UserSquare2 },
    ],
  },
  {
    title: 'Trust & Safety',
    items: [
      { label: 'Verifications', href: '/admin/verifications', icon: ShieldCheck },
      { label: 'Media Review', href: '/admin/media', icon: ImageIcon },
      { label: 'Reports', href: '/admin/reports', icon: AlertTriangle },
      { label: 'Moderation', href: '/admin/moderation', icon: Sliders },
      { label: 'Fraud Detection', href: '/admin/fraud', icon: AlertOctagon },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'CMS', href: '/admin/cms', icon: FileText },
      { label: 'Community', href: '/admin/community', icon: Globe },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
    ],
  },
];

export default function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearToken } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6">
        <div className="flex h-16 items-center px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-white text-lg tracking-wider">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37] text-[#7A1F2B] font-extrabold shadow">
              V
            </span>
            <span>VIVAH ADMIN</span>
          </Link>
        </div>
        <nav className="space-y-6 px-3">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <span className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                        active
                          ? 'bg-[#7A1F2B] text-white shadow-sm shadow-[#7A1F2B]/10'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className={`h-4.5 w-4.5 ${active ? 'text-[#D4AF37]' : 'text-neutral-500 group-hover:text-white'}`} />
                        {item.label}
                      </span>
                      {active && <ChevronRight className="h-3.5 w-3.5 text-[#D4AF37]" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-neutral-800 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-rose-450 transition"
          type="button"
        >
          <LogOut className="h-4.5 w-4.5 text-neutral-500" />
          <span>Exit Panel</span>
        </button>
      </div>
    </div>
  );

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-neutral-50 text-neutral-800 antialiased font-sans">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-neutral-800 bg-neutral-900 text-white lg:block">
          {navContent}
        </aside>

        {/* MOBILE SIDEBAR (SHEET) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <button
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm"
              aria-label="Close Navigation"
            />
            {/* Menu container */}
            <aside className="relative flex w-64 max-w-xs flex-col bg-neutral-900 text-white shadow-2xl animate-in slide-in-from-left duration-250">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-4 rounded-xl border border-neutral-800 p-2 text-neutral-400 hover:text-white hover:bg-neutral-800"
                aria-label="Close Navigation"
              >
                <X className="h-4 w-4" />
              </button>
              {navContent}
            </aside>
          </div>
        )}

        {/* WORKSPACE AREA */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* HEADER */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-6 backdrop-blur shadow-sm">
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-50 lg:hidden"
                aria-label="Open Navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Breadcrumb & Section Name */}
              <div className="hidden sm:block">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Operations Console
                </span>
              </div>
            </div>

            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-4">
              {/* Notification/Queue Indicator */}
              <div className="relative">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                  type="button"
                  aria-label="Alerts"
                >
                  <Bell className="h-4.5 w-4.5" />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#7A1F2B] ring-2 ring-white" />
                </button>
              </div>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-neutral-250 p-1.5 pr-2.5 hover:bg-neutral-50 text-left transition"
                  type="button"
                  aria-label="User Account"
                >
                  <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-[#7A1F2B] text-[11px] font-bold text-white shadow-sm">
                    OP
                  </div>
                  <span className="hidden text-xs font-bold text-neutral-700 md:inline-block">
                    Admin Operator
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-1.5 w-48 origin-top-right rounded-xl border border-neutral-250 bg-white p-1 shadow-lg ring-1 ring-black/5">
                    <div className="px-3 py-2 border-b border-neutral-100 text-xs">
                      <p className="font-bold text-neutral-850">Role</p>
                      <p className="text-neutral-500">Super Administrator</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* PAGE BODY */}
          <main className="flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto max-w-6xl space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
                  Admin CRM
                </p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-900">{title}</h1>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{subtitle}</p>
              </div>
              <div className="mt-6">{children}</div>
            </div>
          </main>
        </div>

      </div>
    </AdminGuard>
  );
}
