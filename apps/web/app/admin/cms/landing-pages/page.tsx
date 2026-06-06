'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Globe, Plus, Trash2, Save, MapPin, BookOpen, Search, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import AdminShell from '../../admin-shell';
import { useMemberRequest, validationMessage } from '@/lib/member-api';
import { cmsLandingPageInputSchema } from '@vivah/shared';

interface LandingPage {
  _id?: string;
  slug: string;
  title: string;
  metaDescription?: string;
  city?: string;
  religion?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  customBody?: string;
  active: boolean;
}

const AUSTRALIAN_CITIES = [
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide',
  'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Hobart',
  'Geelong', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba',
];

const RELIGIONS = [
  'Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain',
  'Buddhist', 'Parsi', 'Jewish', 'Catholic', 'Protestant',
];

const emptyPage: LandingPage = {
  slug: '',
  title: '',
  metaDescription: '',
  city: '',
  religion: '',
  heroHeadline: '',
  heroSubheadline: '',
  customBody: '',
  active: true,
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function LandingPagesPage() {
  const memberRequest = useMemberRequest();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<LandingPage>(emptyPage);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const load = async () => {
    const result = await memberRequest('/api/admin/cms/landing-pages');
    if (result.ok) {
      setPages((result.data as { pages?: LandingPage[] }).pages ?? []);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase()) ||
    (p.city ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const selectPage = (p: LandingPage) => {
    setSelectedId(p._id ?? null);
    setEditor({ ...emptyPage, ...p });
    setMessage('');
    setActiveTab('editor');
  };

  const newPage = () => {
    setSelectedId(null);
    setEditor(emptyPage);
    setMessage('');
    setActiveTab('editor');
  };

  const setMsg = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleTitleChange = (val: string) => {
    setEditor(prev => ({
      ...prev,
      title: val,
      ...(!selectedId ? { slug: toSlug(val) } : {}),
    }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage('');

    const payload = {
      slug: editor.slug,
      title: editor.title,
      metaDescription: editor.metaDescription || undefined,
      city: editor.city || undefined,
      religion: editor.religion || undefined,
      heroHeadline: editor.heroHeadline || undefined,
      heroSubheadline: editor.heroSubheadline || undefined,
      customBody: editor.customBody || undefined,
      active: editor.active,
    };

    const parsed = cmsLandingPageInputSchema.safeParse(payload);
    if (!parsed.success) {
      setMsg(validationMessage(parsed.error.issues), 'error');
      setPending(false);
      return;
    }

    const path = selectedId
      ? `/api/admin/cms/landing-pages/${selectedId}`
      : '/api/admin/cms/landing-pages';
    const method = selectedId ? 'PUT' : 'POST';

    const result = await memberRequest(path, { method, body: parsed.data });
    setPending(false);

    if (result.ok) {
      setMsg(`Landing page "${editor.title}" saved.`, 'success');
      await load();
      if (!selectedId) {
        const created = (result.data as { page?: LandingPage }).page;
        if (created) setSelectedId(created._id ?? null);
      }
    } else {
      setMsg(result.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm('Delete this landing page? The URL will stop working immediately.')) return;
    setPending(true);
    const result = await memberRequest(`/api/admin/cms/landing-pages/${selectedId}`, { method: 'DELETE' });
    setPending(false);
    if (result.ok) {
      setMsg('Landing page deleted.', 'success');
      setSelectedId(null);
      setEditor(emptyPage);
      await load();
    } else {
      setMsg(result.message, 'error');
    }
  };

  const liveUrl = `/matrimony/${editor.slug || 'your-slug'}`;
  const googleTitle = editor.title || 'Page Title';
  const googleDesc = editor.metaDescription || 'No meta description set.';

  return (
    <AdminShell
      title="Landing Page Builder"
      subtitle="Create SEO-targeted city and religion matrimony pages at /matrimony/[slug] to attract organic search traffic."
    >
      <div className="space-y-6">
        {message && (
          <div className={`rounded-xl border p-3.5 text-sm font-semibold flex items-center gap-2 ${
            messageType === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          {/* LIST PANEL */}
          <div className="bg-neutral-50/50 border border-neutral-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <Globe className="size-4 text-[#A10E4D]" />
                <span>Landing Pages</span>
                <span className="ml-1 rounded-full bg-[#FFF0F3] px-2 py-0.5 text-[10px] font-bold text-[#A10E4D]">
                  {pages.length}
                </span>
              </h4>
              <button
                type="button"
                onClick={newPage}
                className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-3 text-xs font-bold text-white shadow-sm"
              >
                <Plus className="size-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search pages..."
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white pl-8 pr-3 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
              />
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {filtered.map(p => (
                <button
                  key={p._id}
                  onClick={() => selectPage(p)}
                  className={`flex w-full flex-col rounded-xl border p-3 text-left transition ${
                    selectedId === p._id
                      ? 'border-[#A10E4D] bg-white ring-1 ring-[#A10E4D]/10 shadow-sm'
                      : 'border-neutral-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 truncate max-w-[160px]">{p.title}</span>
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${p.active ? 'bg-emerald-400' : 'bg-neutral-300'}`} />
                  </div>
                  <span className="mt-0.5 text-[10px] text-neutral-400 font-mono truncate">/{p.slug}</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    {p.city && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                        <MapPin className="size-2.5" />{p.city}
                      </span>
                    )}
                    {p.religion && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                        <BookOpen className="size-2.5" />{p.religion}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="rounded-xl border border-dashed border-neutral-200 bg-white/80 p-5 text-center text-xs text-neutral-400 italic">
                  No landing pages yet. Click New to create one.
                </p>
              )}
            </div>
          </div>

          {/* EDITOR + PREVIEW */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-neutral-200">
              {(['editor', 'preview'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold capitalize transition border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-[#A10E4D] text-[#A10E4D]'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  {tab === 'editor' ? '✏️ Editor' : '🔍 SEO Preview'}
                </button>
              ))}
            </div>

            {activeTab === 'editor' ? (
              <form onSubmit={e => void handleSave(e)} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-neutral-800">
                    {selectedId ? 'Edit Landing Page' : 'Create Landing Page'}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>Preview Live</span>
                    </a>
                  </div>
                </div>

                {/* Page Identity */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Page Title *</label>
                    <input
                      value={editor.title}
                      onChange={e => handleTitleChange(e.target.value)}
                      placeholder="e.g. Sikh Matrimony in Sydney"
                      required
                      className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">URL Slug *</label>
                    <div className="flex items-center">
                      <span className="flex h-11 items-center rounded-l-xl border border-r-0 border-neutral-200 bg-neutral-50 px-3 text-xs font-bold text-neutral-400">/matrimony/</span>
                      <input
                        value={editor.slug}
                        onChange={e => setEditor(prev => ({ ...prev, slug: toSlug(e.target.value) }))}
                        placeholder="sikh-matrimony-sydney"
                        required
                        className="h-11 flex-1 rounded-r-xl border border-neutral-200 bg-white px-3 text-sm font-mono font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Targeting */}
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Audience Targeting</h5>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-bold text-neutral-700">City / Region</label>
                      <select
                        value={editor.city ?? ''}
                        onChange={e => setEditor(prev => ({ ...prev, city: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D]"
                      >
                        <option value="">Any city</option>
                        {AUSTRALIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-bold text-neutral-700">Religion / Community</label>
                      <select
                        value={editor.religion ?? ''}
                        onChange={e => setEditor(prev => ({ ...prev, religion: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D]"
                      >
                        <option value="">Any religion</option>
                        {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hero Content */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Hero Section</h5>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-neutral-700">Hero Headline</label>
                    <input
                      value={editor.heroHeadline ?? ''}
                      onChange={e => setEditor(prev => ({ ...prev, heroHeadline: e.target.value }))}
                      placeholder="e.g. Find Your Sikh Life Partner in Sydney"
                      className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-neutral-700">Hero Subheadline</label>
                    <input
                      value={editor.heroSubheadline ?? ''}
                      onChange={e => setEditor(prev => ({ ...prev, heroSubheadline: e.target.value }))}
                      placeholder="e.g. Join thousands of Sikh singles in Sydney using Vivah Australia"
                      className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                    />
                  </div>
                </div>

                {/* SEO */}
                <div className="grid gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Meta Description (SEO)</label>
                  <textarea
                    rows={2}
                    value={editor.metaDescription ?? ''}
                    onChange={e => setEditor(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="160-character summary for Google search results..."
                    className="w-full rounded-xl border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] leading-relaxed resize-none"
                  />
                  <div className="flex justify-end">
                    <span className={`text-[10px] font-bold ${(editor.metaDescription?.length ?? 0) > 160 ? 'text-rose-600' : 'text-neutral-400'}`}>
                      {editor.metaDescription?.length ?? 0}/160
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="grid gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Custom Body Content</label>
                  <textarea
                    rows={6}
                    value={editor.customBody ?? ''}
                    onChange={e => setEditor(prev => ({ ...prev, customBody: e.target.value }))}
                    placeholder="Additional page content displayed below the hero section and profile grid. Supports plain text."
                    className="w-full rounded-xl border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] leading-relaxed"
                  />
                </div>

                {/* Active Toggle + Actions */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditor(prev => ({ ...prev, active: !prev.active }))}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                      editor.active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {editor.active
                      ? <><ToggleRight className="size-4" /> Active — Page is Live</>
                      : <><ToggleLeft className="size-4" /> Inactive — Page Hidden</>
                    }
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedId && (
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        disabled={pending}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save className="size-4" />
                      <span>{pending ? 'Saving...' : selectedId ? 'Save Changes' : 'Create Page'}</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* SEO PREVIEW TAB */
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h4 className="text-sm font-bold text-neutral-800">Google Search Preview</h4>
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-5 space-y-1">
                  <p className="text-[11px] text-emerald-700 font-mono">
                    vivahaustralia.com.au {liveUrl}
                  </p>
                  <p className="text-lg font-bold text-blue-700 hover:underline cursor-pointer leading-snug">
                    {googleTitle}
                  </p>
                  <p className="text-sm text-neutral-600 leading-relaxed">{googleDesc}</p>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">SEO Checklist</h5>
                  <div className="space-y-2">
                    {[
                      { label: 'Title tag set', ok: !!editor.title },
                      { label: 'Meta description set', ok: !!editor.metaDescription },
                      { label: 'Meta description ≤ 160 chars', ok: (editor.metaDescription?.length ?? 0) <= 160 },
                      { label: 'URL slug is valid', ok: /^[a-z0-9-]+$/.test(editor.slug) },
                      { label: 'Hero headline set', ok: !!editor.heroHeadline },
                      { label: 'City or religion filter active', ok: !!(editor.city || editor.religion) },
                      { label: 'Page is active', ok: editor.active },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-2.5 text-xs">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-400'}`}>
                          {ok ? '✓' : '○'}
                        </span>
                        <span className={ok ? 'text-neutral-700 font-semibold' : 'text-neutral-400'}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 space-y-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Page Configuration</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-neutral-400">URL:</span> <span className="font-mono font-bold text-neutral-700">{liveUrl}</span></div>
                    <div><span className="text-neutral-400">City:</span> <span className="font-bold text-neutral-700">{editor.city || 'Not set'}</span></div>
                    <div><span className="text-neutral-400">Religion:</span> <span className="font-bold text-neutral-700">{editor.religion || 'Not set'}</span></div>
                    <div><span className="text-neutral-400">Status:</span> <span className={`font-bold ${editor.active ? 'text-emerald-600' : 'text-neutral-400'}`}>{editor.active ? 'Live' : 'Hidden'}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
