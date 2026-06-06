'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  HelpCircle, 
  Share2, 
  ShieldAlert, 
  Sliders, 
  Home, 
  Save, 
  Search
} from 'lucide-react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';

interface SystemSetting {
  _id?: string;
  key: string;
  value: unknown;
  description?: string;
}

const SETTING_SCHEMAS = [
  // GENERAL
  { key: 'siteName', label: 'Site Name', group: 'general', type: 'text', default: 'Vivah Australia', desc: 'Main platform branding label' },
  { key: 'siteTagline', label: 'Site Tagline', group: 'general', type: 'text', default: 'Trusted South Asian Matrimony', desc: 'Slogan rendered on homepage and meta tags' },
  { key: 'footerText', label: 'Footer Attribution Text', group: 'general', type: 'text', default: '© 2026 Vivah Australia. All rights reserved.', desc: 'Copyright line rendered at footer' },
  
  // SUPPORT
  { key: 'supportEmail', label: 'Support Email Address', group: 'support', type: 'email', default: 'support@vivahaustralia.com.au', desc: 'Public communication contact email' },
  { key: 'supportPhone', label: 'Support Phone Number', group: 'support', type: 'text', default: '1300 000 000', desc: 'Customer helpline number' },
  { key: 'supportAddress', label: 'Corporate Address', group: 'support', type: 'text', default: 'Melbourne, Australia', desc: 'Public business location details' },
  
  // SOCIAL
  { key: 'socialFacebook', label: 'Facebook Link', group: 'social', type: 'text', default: 'https://facebook.com/vivahaustralia', desc: 'Facebook page url profile handle' },
  { key: 'socialInstagram', label: 'Instagram Profile', group: 'social', type: 'text', default: 'https://instagram.com/vivahaustralia', desc: 'Instagram url profile handle' },
  { key: 'socialLinkedin', label: 'LinkedIn Page', group: 'social', type: 'text', default: 'https://linkedin.com/company/vivahaustralia', desc: 'LinkedIn business handle' },
  { key: 'socialYoutube', label: 'YouTube Channel', group: 'social', type: 'text', default: 'https://youtube.com/vivahaustralia', desc: 'YouTube brand channel' },
  
  // PLATFORM
  { key: 'registrationEnabled', label: 'New Member Registrations', group: 'platform', type: 'boolean', default: true, desc: 'Allow new user signups to create profiles' },
  { key: 'maintenanceMode', label: 'Platform Maintenance Mode', group: 'platform', type: 'boolean', default: false, desc: 'Redirect consumers to maintenance screen' },
  { key: 'communityEnabled', label: 'Community Groups Directory', group: 'platform', type: 'boolean', default: true, desc: 'Display South Asian regional search shortcuts' },
  { key: 'membershipEnabled', label: 'Paid Subscriptions System', group: 'platform', type: 'boolean', default: true, desc: 'Turn on premium upgrades pricing table and billing' },
  
  // HOMEPAGE
  { key: 'homeStatsSnippet', label: 'Homepage Stats Summary', group: 'homepage', type: 'textarea', default: '10k+ | Verified Profiles\n100% | Privacy Controlled', desc: 'Lines formatted as: Number | Label' }
];

export default function SettingsManagerPage() {
  const memberRequest = useMemberRequest();
  const [, setSettings] = useState<SystemSetting[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [editedValues, setEditedValues] = useState<Record<string, unknown>>({});

  const loadSettings = async () => {
    setPending(true);
    const result = await memberRequest('/api/admin/settings');
    setPending(false);
    if (result.ok) {
      const loaded: SystemSetting[] = (result.data as { settings?: SystemSetting[] }).settings ?? [];
      setSettings(loaded);
      
      // Initialize editedValues state
      const initialValues: Record<string, unknown> = {};
      SETTING_SCHEMAS.forEach(schema => {
        const found = loaded.find(s => s.key === schema.key);
        initialValues[schema.key] = found ? found.value : schema.default;
      });
      setEditedValues(initialValues);
    } else {
      setMessage(result.message);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSaveSetting = async (key: string) => {
    const value = editedValues[key];
    setPending(true);
    setMessage('');
    
    // Validation
    const schema = SETTING_SCHEMAS.find(s => s.key === key);
    if (schema?.type === 'email' && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setMessage('Invalid email address format.');
      setPending(false);
      return;
    }

    const result = await memberRequest(`/api/admin/settings/${key}`, {
      method: 'PUT',
      body: {
        value,
        description: schema?.desc ?? ''
      }
    });
    
    setPending(false);
    if (result.ok) {
      setMessage(`Setting "${schema?.label || key}" saved successfully.`);
      await loadSettings();
    } else {
      setMessage(result.message);
    }
  };

  const handleToggleBoolean = async (key: string, currentValue: boolean) => {
    const nextValue = !currentValue;
    setEditedValues(prev => ({ ...prev, [key]: nextValue }));
    
    // Auto-save boolean flags instantly for snappy UX
    setPending(true);
    const schema = SETTING_SCHEMAS.find(s => s.key === key);
    const result = await memberRequest(`/api/admin/settings/${key}`, {
      method: 'PUT',
      body: {
        value: nextValue,
        description: schema?.desc ?? ''
      }
    });
    setPending(false);
    if (result.ok) {
      setMessage(`Toggled "${schema?.label || key}" status.`);
      await loadSettings();
    } else {
      setMessage(result.message);
    }
  };

  const filteredSchemas = useMemo(() => {
    return SETTING_SCHEMAS.filter(s => {
      const matchGroup = s.group === activeGroup;
      const matchSearch = searchQuery === '' || 
                          s.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.key.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [activeGroup, searchQuery]);

  const GROUPS = [
    { key: 'general', name: 'General Settings', icon: Globe },
    { key: 'support', name: 'Support Details', icon: HelpCircle },
    { key: 'social', name: 'Social Handles', icon: Share2 },
    { key: 'platform', name: 'Platform Flags', icon: Sliders },
    { key: 'homepage', name: 'Home Content', icon: Home }
  ];

  return (
    <AdminShell
      title="System Settings Control Center"
      subtitle="Manage global variables, contact emails, social channels, and toggle core platform features."
    >
      <div className="space-y-6">
        {message && (
          <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <span>{message}</span>
          </div>
        )}

        {/* Audit Disclaimer Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3.5 items-start">
          <ShieldAlert className="size-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900">Security & Compliance Notice</h4>
            <p className="text-[10px] text-amber-800 mt-1 leading-relaxed">
              You are altering global config settings. All modifications, toggles, and updates are logged in the 
              system audit database with your administrator account signature for compliance reviews.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* CATEGORIES SIDEBAR */}
          <div className="flex flex-col gap-1">
            {GROUPS.map(g => {
              const IconComponent = g.icon;
              const isActive = activeGroup === g.key;
              return (
                <button
                  key={g.key}
                  onClick={() => {
                    setActiveGroup(g.key);
                    setMessage('');
                  }}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition ${
                    isActive 
                      ? 'bg-[#A10E4D] text-white shadow-sm'
                      : 'text-neutral-500 hover:bg-neutral-100 bg-transparent'
                  }`}
                >
                  <IconComponent className="size-4 shrink-0" />
                  <span>{g.name}</span>
                </button>
              );
            })}
          </div>

          {/* MAIN SETTINGS FORM */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-4">
              <h3 className="text-base font-bold text-neutral-900">
                {GROUPS.find(g => g.key === activeGroup)?.name}
              </h3>
              
              <div className="relative max-w-xs w-full">
                <Search className="size-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter settings..."
                  className="h-9 w-full rounded-lg border border-neutral-250 bg-white pl-9 pr-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D]"
                />
              </div>
            </div>

            <div className="divide-y divide-neutral-150">
              {filteredSchemas.map(setting => {
                const value = editedValues[setting.key];
                
                return (
                  <div key={setting.key} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start gap-4">
                    <div className="md:w-1/3 space-y-1">
                      <label className="text-xs font-bold text-neutral-800 block">
                        {setting.label}
                      </label>
                      <span className="text-[10px] text-neutral-400 font-semibold block uppercase">
                        {setting.key}
                      </span>
                      <p className="text-[10px] text-neutral-500 leading-relaxed max-w-xs pt-1">
                        {setting.desc}
                      </p>
                    </div>

                    <div className="flex-1">
                      {setting.type === 'boolean' ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => void handleToggleBoolean(setting.key, !!value)}
                            disabled={pending}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              value ? 'bg-emerald-600' : 'bg-neutral-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                value ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-semibold text-neutral-600">
                            {value ? 'Active / Enabled' : 'Inactive / Disabled'}
                          </span>
                        </div>
                      ) : setting.type === 'textarea' ? (
                        <div className="space-y-3">
                          <textarea
                            rows={4}
                            value={(value as string) || ''}
                            onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                            className="w-full rounded-xl border border-neutral-250 p-3 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] leading-relaxed"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSaveSetting(setting.key)}
                            disabled={pending}
                            className="rounded-lg bg-[#A10E4D] hover:bg-[#890B40] px-4 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                          >
                            <Save className="size-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type={setting.type}
                            value={(value as string) || ''}
                            onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                            className="h-10 flex-1 rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSaveSetting(setting.key)}
                            disabled={pending}
                            className="rounded-lg bg-[#A10E4D] hover:bg-[#890B40] px-4 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 shrink-0"
                          >
                            <Save className="size-3.5" />
                            <span>Save</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredSchemas.length === 0 && (
                <p className="py-6 text-center text-xs text-neutral-400 italic">
                  No configuration settings matched your filter query.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
