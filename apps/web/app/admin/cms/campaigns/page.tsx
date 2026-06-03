'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Megaphone, Plus, Trash2, Save, ToggleLeft, ToggleRight, AlertCircle, Info, Zap, Calendar, Eye } from 'lucide-react';
import AdminShell from '../../admin-shell';
import { useMemberRequest, validationMessage } from '@/lib/member-api';
import { cmsCampaignBannerInputSchema } from '@vivah/shared';

interface CampaignBanner {
  _id?: string;
  key: string;
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
  type: 'INFO' | 'WARNING' | 'PROMO';
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  segment: 'ALL' | 'PREMIUM' | 'FREE';
}

const emptyBanner: CampaignBanner = {
  key: '',
  message: '',
  ctaLabel: '',
  ctaHref: '',
  type: 'INFO',
  active: true,
  startsAt: '',
  endsAt: '',
  segment: 'ALL',
};

const TYPE_CONFIG = {
  INFO: { label: 'Info', icon: Info, bg: 'bg-blue-600', text: 'text-white', iconColor: 'text-blue-200', badgeBg: 'bg-blue-100 text-blue-700' },
  WARNING: { label: 'Warning', icon: AlertCircle, bg: 'bg-amber-500', text: 'text-white', iconColor: 'text-amber-200', badgeBg: 'bg-amber-100 text-amber-700' },
  PROMO: { label: 'Promo', icon: Zap, bg: 'bg-[#A10E4D]', text: 'text-white', iconColor: 'text-pink-300', badgeBg: 'bg-[#FFF0F3] text-[#A10E4D]' },
};

function isBannerLive(b: CampaignBanner): boolean {
  if (!b.active) return false;
  const now = new Date();
  if (b.startsAt && new Date(b.startsAt) > now) return false;
  if (b.endsAt && new Date(b.endsAt) < now) return false;
  return true;
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CampaignsPage() {
  const memberRequest = useMemberRequest();
  const [banners, setBanners] = useState<CampaignBanner[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<CampaignBanner>(emptyBanner);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const load = async () => {
    const result = await memberRequest('/api/admin/cms/campaign-banners');
    if (result.ok) {
      setBanners((result.data as { banners?: CampaignBanner[] }).banners ?? []);
    }
  };

  useEffect(() => { void load(); }, []);

  const selectBanner = (b: CampaignBanner) => {
    setSelectedId(b._id ?? null);
    setEditor({
      ...emptyBanner,
      ...b,
      startsAt: b.startsAt ? b.startsAt.slice(0, 16) : '',
      endsAt: b.endsAt ? b.endsAt.slice(0, 16) : '',
    });
    setMessage('');
  };

  const setMsg = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage('');

    const payload = {
      key: editor.key,
      message: editor.message,
      ctaLabel: editor.ctaLabel || undefined,
      ctaHref: editor.ctaHref || undefined,
      type: editor.type,
      active: editor.active,
      startsAt: editor.startsAt ? new Date(editor.startsAt).toISOString() : undefined,
      endsAt: editor.endsAt ? new Date(editor.endsAt).toISOString() : undefined,
      segment: editor.segment,
    };

    const parsed = cmsCampaignBannerInputSchema.safeParse(payload);
    if (!parsed.success) {
      setMsg(validationMessage(parsed.error.issues), 'error');
      setPending(false);
      return;
    }

    const path = selectedId
      ? `/api/admin/cms/campaign-banners/${selectedId}`
      : '/api/admin/cms/campaign-banners';
    const method = selectedId ? 'PUT' : 'POST';

    const result = await memberRequest(path, { method, body: parsed.data });
    setPending(false);

    if (result.ok) {
      setMsg('Campaign banner saved.', 'success');
      await load();
    } else {
      setMsg(result.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm('Delete this campaign banner? It will be removed from the site immediately.')) return;
    setPending(true);
    const result = await memberRequest(`/api/admin/cms/campaign-banners/${selectedId}`, { method: 'DELETE' });
    setPending(false);
    if (result.ok) {
      setMsg('Banner deleted.', 'success');
      setSelectedId(null);
      setEditor(emptyBanner);
      await load();
    } else {
      setMsg(result.message, 'error');
    }
  };

  const liveBanners = banners.filter(isBannerLive);
  const typeConf = TYPE_CONFIG[editor.type];
  const TypeIcon = typeConf.icon;

  return (
    <AdminShell
      title="Campaign Banner Manager"
      subtitle="Create timed site-wide announcement strips for promotions, system notices, or feature launches."
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

        {/* Live Banner Preview Strip */}
        {liveBanners.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <Eye className="size-3.5" />
              <span>Currently Live on Site ({liveBanners.length})</span>
            </div>
            {liveBanners.map(b => {
              const conf = TYPE_CONFIG[b.type];
              const BIcon = conf.icon;
              return (
                <div key={b._id} className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${conf.bg} ${conf.text} shadow-sm`}>
                  <div className="flex items-center gap-2.5">
                    <BIcon className={`size-4 ${conf.iconColor} flex-shrink-0`} />
                    <span className="text-sm font-semibold">{b.message}</span>
                  </div>
                  {b.ctaLabel && (
                    <span className="flex-shrink-0 rounded-lg border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30 cursor-pointer">
                      {b.ctaLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          {/* LIST */}
          <div className="bg-neutral-50/50 border border-neutral-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <Megaphone className="size-4 text-[#A10E4D]" />
                <span>All Banners</span>
                <span className="ml-1 rounded-full bg-[#FFF0F3] px-2 py-0.5 text-[10px] font-bold text-[#A10E4D]">
                  {banners.length}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => { setSelectedId(null); setEditor(emptyBanner); setMessage(''); }}
                className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-3 text-xs font-bold text-white shadow-sm"
              >
                <Plus className="size-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {banners.map(b => {
                const conf = TYPE_CONFIG[b.type];
                const live = isBannerLive(b);
                return (
                  <button
                    key={b._id}
                    onClick={() => selectBanner(b)}
                    className={`flex w-full flex-col rounded-xl border p-3.5 text-left transition ${
                      selectedId === b._id
                        ? 'border-[#A10E4D] bg-white ring-1 ring-[#A10E4D]/10 shadow-sm'
                        : 'border-neutral-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${conf.badgeBg}`}>
                        {conf.label}
                      </span>
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${live ? 'bg-emerald-400' : 'bg-neutral-300'}`} title={live ? 'Live' : 'Inactive'} />
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-neutral-800 line-clamp-2">{b.message}</p>
                    <p className="mt-1 text-[10px] text-neutral-400 font-mono">{b.key}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[9px] text-neutral-400">
                      <span>Seg: {b.segment}</span>
                      {b.endsAt && <span>Ends: {formatDate(b.endsAt)}</span>}
                    </div>
                  </button>
                );
              })}
              {banners.length === 0 && (
                <p className="rounded-xl border border-dashed border-neutral-200 bg-white/80 p-5 text-center text-xs text-neutral-400 italic">
                  No campaign banners yet.
                </p>
              )}
            </div>
          </div>

          {/* EDITOR */}
          <div className="space-y-4">
            {/* Live Banner Preview */}
            {editor.message && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Eye className="size-3.5" /> Banner Preview
                </p>
                <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${typeConf.bg} ${typeConf.text} shadow-sm`}>
                  <div className="flex items-center gap-2.5">
                    <TypeIcon className={`size-4 ${typeConf.iconColor} flex-shrink-0`} />
                    <span className="text-sm font-semibold">{editor.message}</span>
                  </div>
                  {editor.ctaLabel && (
                    <span className="flex-shrink-0 rounded-lg border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold">
                      {editor.ctaLabel}
                    </span>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={e => void handleSave(e)} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h4 className="text-sm font-bold text-neutral-800">
                {selectedId ? 'Edit Banner' : 'Create Banner'}
              </h4>

              {/* Key + Type */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Banner Key *</label>
                  <input
                    value={editor.key}
                    onChange={e => setEditor(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="e.g. launch-promo-june"
                    required
                    disabled={!!selectedId}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 font-mono text-sm font-bold text-neutral-700 outline-none focus:border-[#A10E4D] disabled:bg-neutral-50 disabled:text-neutral-400 transition"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Banner Type *</label>
                  <div className="flex gap-2">
                    {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map(t => {
                      const conf = TYPE_CONFIG[t];
                      const TIcon = conf.icon;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEditor(prev => ({ ...prev, type: t }))}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                            editor.type === t
                              ? `${conf.bg} ${conf.text} border-transparent`
                              : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                          }`}
                        >
                          <TIcon className="size-3.5" />
                          {conf.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Banner Message *</label>
                <input
                  value={editor.message}
                  onChange={e => setEditor(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="e.g. 🎉 Launch Special — 20% off all Gold plans this week!"
                  required
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                />
                <div className="flex justify-end">
                  <span className={`text-[10px] font-bold ${editor.message.length > 500 ? 'text-rose-600' : 'text-neutral-400'}`}>
                    {editor.message.length}/500
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">CTA Button Label</label>
                  <input
                    value={editor.ctaLabel ?? ''}
                    onChange={e => setEditor(prev => ({ ...prev, ctaLabel: e.target.value }))}
                    placeholder="e.g. Upgrade Now"
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">CTA Link URL</label>
                  <input
                    value={editor.ctaHref ?? ''}
                    onChange={e => setEditor(prev => ({ ...prev, ctaHref: e.target.value }))}
                    placeholder="e.g. /membership"
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                  />
                </div>
              </div>

              {/* Schedule + Segment */}
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> Schedule & Targeting
                </h5>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-neutral-700">Starts At</label>
                    <input
                      type="datetime-local"
                      value={editor.startsAt ?? ''}
                      onChange={e => setEditor(prev => ({ ...prev, startsAt: e.target.value }))}
                      className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D]"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-neutral-700">Ends At</label>
                    <input
                      type="datetime-local"
                      value={editor.endsAt ?? ''}
                      onChange={e => setEditor(prev => ({ ...prev, endsAt: e.target.value }))}
                      className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D]"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-neutral-700">Show To</label>
                    <select
                      value={editor.segment}
                      onChange={e => setEditor(prev => ({ ...prev, segment: e.target.value as CampaignBanner['segment'] }))}
                      className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D]"
                    >
                      <option value="ALL">All Visitors</option>
                      <option value="FREE">Free Members Only</option>
                      <option value="PREMIUM">Premium Members Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
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
                    ? <><ToggleRight className="size-4" /> Banner is Active</>
                    : <><ToggleLeft className="size-4" /> Banner is Inactive</>
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
                    <span>{pending ? 'Saving...' : selectedId ? 'Save Changes' : 'Create Banner'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
