'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/app/auth-context';
import AdminGuard from './admin-guard';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UserCheck,
  ShieldCheck,
  Image as ImageIcon,
  AlertTriangle,
  Sliders,
  ShieldAlert,
  CreditCard,
  FileText,
  Globe,
  History,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  Tag,
  Megaphone,
  MapPin,
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
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Profiles', href: '/admin/profiles', icon: UserCheck },
    ],
  },
  {
    title: 'Trust & Safety',
    items: [
      { label: 'Verifications', href: '/admin/verifications', icon: ShieldCheck },
      { label: 'Media Review', href: '/admin/media', icon: ImageIcon },
      { label: 'Reports', href: '/admin/reports', icon: AlertTriangle },
      { label: 'Moderation', href: '/admin/moderation', icon: Sliders },
      { label: 'Fraud Detection', href: '/admin/fraud', icon: ShieldAlert },
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
    title: 'Growth',
    items: [
      { label: 'Landing Pages', href: '/admin/cms/landing-pages', icon: MapPin },
      { label: 'Promotions', href: '/admin/cms/promotions', icon: Tag },
      { label: 'Campaigns', href: '/admin/cms/campaigns', icon: Megaphone },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings },
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
  
  // State management
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  
  // Track open states for collapsible navigation groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(target)) {
        setAlertsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Generate breadcrumb links
  const breadcrumbs = pathname.split('/').filter(Boolean);

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-[#1F1F2E] text-white">
      <div className="space-y-6 py-4">
        {/* Branding header */}
        <div className="flex h-16 items-center px-6 border-b border-white/5">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 font-bold text-white tracking-wider">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#A10E4D] to-[#E74C7C] font-extrabold shadow-lg text-white">
              V
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-widest text-neutral-100">VIVAH</span>
              <span className="text-[10px] font-bold text-[#D4A04C] tracking-[0.25em]">OPERATIONS</span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="space-y-4 px-4 overflow-y-auto max-h-[calc(100vh-12rem)] scrollbar-thin">
          {navigationGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.title] ?? false;

            return (
              <div key={group.title} className="space-y-1">
                {/* Collapsible trigger header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A04C] hover:text-white transition-colors"
                >
                  <span>{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-neutral-500" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-neutral-500" />
                  )}
                </button>

                {/* Group items (only show if not collapsed) */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pl-1.5 transition-all">
                    {group.items.map((item) => {
                      const active = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                            active
                              ? 'bg-[#A10E4D] text-white shadow-lg shadow-[#A10E4D]/25'
                              : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className={`h-4.5 w-4.5 transition-colors ${active ? 'text-[#D4A04C]' : 'text-neutral-500 group-hover:text-white'}`} />
                            {item.label}
                          </span>
                          {active && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D4A04C]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Exit actions */}
      <div className="border-t border-white/5 p-4 bg-[#181824]">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200"
          type="button"
        >
          <LogOut className="h-4.5 w-4.5 text-neutral-500 group-hover:text-rose-400" />
          <span>Exit Console</span>
        </button>
      </div>
    </div>
  );

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#FBFBFC] text-[#2F2F2F] antialiased font-sans">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-[#2F2F2F]/10 bg-[#1F1F2E] text-white lg:block">
          {navContent}
        </aside>

        {/* MOBILE SIDEBAR (Radix-like custom accessible Overlay Sheet) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-[#2F2F2F]/65 backdrop-blur-sm transition-opacity duration-300"
            />
            {/* Menu container */}
            <aside className="relative flex w-64 max-w-xs flex-col bg-[#1F1F2E] text-white shadow-2xl animate-in slide-in-from-left duration-300">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-4 rounded-xl border border-white/10 p-2 text-neutral-400 hover:text-white hover:bg-white/5 transition"
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
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#2F2F2F]/10 bg-white/95 px-6 backdrop-blur shadow-sm">
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-50 lg:hidden"
                aria-label="Open Navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Breadcrumb Navigation */}
              <nav className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                <Link href="/admin/dashboard" className="hover:text-[#A10E4D] transition">Admin</Link>
                <span>/</span>
                {breadcrumbs.slice(1).map((crumb, idx, arr) => {
                  const href = `/admin/${arr.slice(0, idx + 1).join('/')}`;
                  const label = crumb.replace('-', ' ');
                  const isLast = idx === arr.length - 1;
                  return (
                    <span key={crumb} className="flex items-center gap-2">
                      {isLast ? (
                        <span className="text-[#A10E4D] font-bold">{label}</span>
                      ) : (
                        <>
                          <Link href={href} className="hover:text-[#A10E4D] transition">{label}</Link>
                          <span>/</span>
                        </>
                      )}
                    </span>
                  );
                })}
                {breadcrumbs.length <= 1 && (
                  <span className="text-[#A10E4D] font-bold">Dashboard</span>
                )}
              </nav>
            </div>

            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative hidden max-w-xs w-56 sm:block">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search console..."
                  className="h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-xs outline-none focus:border-[#A10E4D] focus:bg-white transition"
                />
              </div>

              {/* Alerts / Actionable Queue Indicator */}
              <div className="relative" ref={alertsRef}>
                <button
                  onClick={() => setAlertsOpen(!alertsOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 relative transition-all"
                  type="button"
                  aria-label="Operations Alerts"
                >
                  <Bell className="h-4.5 w-4.5" />
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#A10E4D] ring-2 ring-white" />
                </button>

                {alertsOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <h4 className="text-xs font-extrabold text-[#2F2F2F] uppercase tracking-wider mb-2 pb-1.5 border-b border-neutral-100">
                      Operations Triage Indicators
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs p-1.5 hover:bg-neutral-50 rounded-lg">
                        <span className="text-neutral-500 font-medium">Pending Verifications</span>
                        <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">Action Needed</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-1.5 hover:bg-neutral-50 rounded-lg">
                        <span className="text-neutral-500 font-medium">Flagged Photo Queue</span>
                        <span className="rounded-full bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">Priority Review</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User operator dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-neutral-250 p-1.5 pr-2.5 hover:bg-neutral-50 text-left transition"
                  type="button"
                  aria-label="Operator Menu"
                >
                  <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-gradient-to-br from-[#A10E4D] to-[#E74C7C] text-[11px] font-bold text-white shadow-sm">
                    OP
                  </div>
                  <span className="hidden text-xs font-bold text-neutral-700 md:inline-block">
                    Operator Console
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-1.5 w-48 origin-top-right rounded-xl border border-neutral-200 bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in duration-100">
                    <div className="px-3 py-2 border-b border-neutral-100 text-xs">
                      <p className="font-extrabold text-neutral-800">Role</p>
                      <p className="text-neutral-500">System Administrator</p>
                    </div>
                    <Link href="/admin/moderation" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition">
                      <Settings className="h-4 w-4 text-neutral-500" />
                      <span>Settings</span>
                    </Link>
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
                <p className="text-xs font-bold uppercase tracking-wider text-[#A10E4D]">
                  Operations Command Center
                </p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-900">{title}</h1>
                {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{subtitle}</p>}
              </div>
              <div className="mt-6">{children}</div>
            </div>
          </main>
        </div>

      </div>
    </AdminGuard>
  );
}
