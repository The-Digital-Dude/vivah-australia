'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Tag, Plus, Trash2, Save, Copy, Check, ToggleLeft, ToggleRight, Percent, Calendar, Search, AlertCircle } from 'lucide-react';
import AdminShell from '../../admin-shell';
import { useMemberRequest, validationMessage } from '@/lib/member-api';
import { cmsPromotionInputSchema } from '@vivah/shared';

interface Promotion {
  _id?: string;
  code: string;
  label: string;
  discountPercent: number;
  expiresAt?: string;
  targetPlans?: string[];
  maxUses?: number;
  usedCount: number;
  active: boolean;
  createdAt?: string;
}

type EditorState = {
  _id?: string;
  code: string;
  label: string;
  discountPercent: number;
  expiresAt: string;
  targetPlans: string[];
  maxUses: number | '';
  usedCount: number;
  active: boolean;
};

const emptyEditor: EditorState = {
  code: '',
  label: '',
  discountPercent: 20,
  expiresAt: '',
  targetPlans: [],
  maxUses: '',
  usedCount: 0,
  active: true,
};

const PLAN_OPTIONS = ['SILVER_MONTHLY', 'SILVER_QUARTERLY', 'GOLD_MONTHLY', 'GOLD_QUARTERLY', 'PLATINUM_MONTHLY', 'PLATINUM_QUARTERLY'];

function getPromoStatus(promo: Promotion): { label: string; color: string } {
  if (!promo.active) return { label: 'Inactive', color: 'text-neutral-500 bg-neutral-100' };
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return { label: 'Expired', color: 'text-rose-700 bg-rose-50' };
  if (promo.maxUses && promo.usedCount >= promo.maxUses) return { label: 'Exhausted', color: 'text-orange-700 bg-orange-50' };
  return { label: 'Active', color: 'text-emerald-700 bg-emerald-50' };
}

function formatDate(d?: string) {
  if (!d) return 'Never';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PromotionsPage() {
  const memberRequest = useMemberRequest();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = async () => {
    const result = await memberRequest('/api/admin/cms/promotions');
    if (result.ok) {
      setPromotions((result.data as { promotions?: Promotion[] }).promotions ?? []);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = promotions.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectPromo = (p: Promotion) => {
    setSelectedId(p._id ?? null);
    setEditor({
      ...emptyEditor,
      ...p,
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 16) : '',
      targetPlans: p.targetPlans ?? [],
      maxUses: p.maxUses ?? '',
    });
    setMessage('');
  };

  const setMsg = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage('');

    const payload = {
      code: editor.code.toUpperCase().trim(),
      label: editor.label,
      discountPercent: editor.discountPercent,
      expiresAt: editor.expiresAt ? new Date(editor.expiresAt).toISOString() : undefined,
      targetPlans: editor.targetPlans.length ? editor.targetPlans : undefined,
      maxUses: editor.maxUses !== '' ? editor.maxUses : undefined,
      active: editor.active,
    };

    const parsed = cmsPromotionInputSchema.safeParse(payload);
    if (!parsed.success) {
      setMsg(validationMessage(parsed.error.issues), 'error');
      setPending(false);
      return;
    }

    const path = selectedId
      ? `/api/admin/cms/promotions/${selectedId}`
      : '/api/admin/cms/promotions';
    const method = selectedId ? 'PUT' : 'POST';

    const result = await memberRequest(path, { method, body: parsed.data });
    setPending(false);

    if (result.ok) {
      setMsg(`Promotion "${editor.code}" saved successfully.`, 'success');
      await load();
    } else {
      setMsg(result.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm('Delete this promotion code? Members using this code will no longer receive the discount.')) return;
    setPending(true);
    const result = await memberRequest(`/api/admin/cms/promotions/${selectedId}`, { method: 'DELETE' });
    setPending(false);
    if (result.ok) {
      setMsg('Promotion deleted.', 'success');
      setSelectedId(null);
      setEditor(emptyEditor);
      await load();
    } else {
      setMsg(result.message, 'error');
    }
  };

  const togglePlan = (plan: string) => {
    setEditor(prev => {
      const plans = prev.targetPlans ?? [];
      return {
        ...prev,
        targetPlans: plans.includes(plan)
          ? plans.filter(p => p !== plan)
          : [...plans, plan],
      };
    });
  };

  return (
    <AdminShell
      title="Promotions & Coupon Manager"
      subtitle="Create discount codes that members can apply on the membership page before subscribing."
    >
      <div className="space-y-6">
        {message && (
          <div className={`rounded-xl border p-3.5 text-sm font-semibold flex items-center gap-2 ${
            messageType === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {messageType === 'error' && <AlertCircle className="size-4 flex-shrink-0" />}
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          {/* LIST */}
          <div className="bg-neutral-50/50 border border-neutral-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <Tag className="size-4 text-[#A10E4D]" />
                <span>Coupon Codes</span>
                <span className="ml-1 rounded-full bg-[#FFF0F3] px-2 py-0.5 text-[10px] font-bold text-[#A10E4D]">
                  {promotions.length}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => { setSelectedId(null); setEditor(emptyEditor); setMessage(''); }}
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
                placeholder="Search codes..."
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white pl-8 pr-3 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filtered.map(p => {
                const status = getPromoStatus(p);
                return (
                  <button
                    key={p._id}
                    onClick={() => selectPromo(p)}
                    className={`flex w-full flex-col rounded-xl border p-3.5 text-left transition ${
                      selectedId === p._id
                        ? 'border-[#A10E4D] bg-white ring-1 ring-[#A10E4D]/10 shadow-sm'
                        : 'border-neutral-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-extrabold text-neutral-900 tracking-wider">{p.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-neutral-500 truncate">{p.label}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-neutral-400 font-semibold">
                      <span className="flex items-center gap-0.5">
                        <Percent className="size-3" />{p.discountPercent}% off
                      </span>
                      {p.maxUses && (
                        <span>{p.usedCount}/{p.maxUses} used</span>
                      )}
                      {p.expiresAt && (
                        <span className="flex items-center gap-0.5">
                          <Calendar className="size-3" />{formatDate(p.expiresAt)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="rounded-xl border border-dashed border-neutral-200 bg-white/80 p-5 text-center text-xs text-neutral-400 italic">
                  No promotion codes yet.
                </p>
              )}
            </div>
          </div>

          {/* EDITOR */}
          <form onSubmit={e => void handleSave(e)} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h4 className="text-sm font-bold text-neutral-800 border-b border-neutral-100 pb-3">
              {selectedId ? 'Edit Promotion Code' : 'Create Promotion Code'}
            </h4>

            {/* Code + Label */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Coupon Code *</label>
                <div className="relative">
                  <input
                    value={editor.code}
                    onChange={e => setEditor(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. VIVAH20"
                    required
                    disabled={!!selectedId}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 pr-10 font-mono text-base font-extrabold tracking-widest text-neutral-900 outline-none focus:border-[#A10E4D] disabled:bg-neutral-50 disabled:text-neutral-400 transition"
                  />
                  {editor.code && (
                    <button
                      type="button"
                      onClick={() => void copyCode(editor.code)}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-[#A10E4D] transition"
                    >
                      {copiedCode === editor.code ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">Uppercase letters, numbers, hyphens only. Cannot be changed after creation.</p>
              </div>
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Internal Label *</label>
                <input
                  value={editor.label}
                  onChange={e => setEditor(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Launch Month Promo"
                  required
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                />
              </div>
            </div>

            {/* Discount + Expiry + Max Uses */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Discount % *</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editor.discountPercent}
                    onChange={e => setEditor(prev => ({ ...prev, discountPercent: Number(e.target.value) }))}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 pr-8 text-xl font-extrabold text-[#A10E4D] outline-none focus:border-[#A10E4D] transition"
                  />
                  <Percent className="absolute right-3 top-3.5 size-4 text-neutral-400" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Expires At</label>
                <input
                  type="datetime-local"
                  value={editor.expiresAt ?? ''}
                  onChange={e => setEditor(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Max Uses</label>
                <input
                  type="number"
                  min={1}
                  value={editor.maxUses === '' ? '' : editor.maxUses}
                  onChange={e => setEditor(prev => ({ ...prev, maxUses: e.target.value ? Number(e.target.value) : '' }))}
                  placeholder="Unlimited"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition placeholder:text-neutral-300"
                />
              </div>
            </div>

            {/* Plan Targeting */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Restrict to Plans (optional — blank = all plans)</label>
              <div className="flex flex-wrap gap-2">
                {PLAN_OPTIONS.map(plan => {
                  const selected = (editor.targetPlans ?? []).includes(plan);
                  return (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => togglePlan(plan)}
                      className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold transition ${
                        selected
                          ? 'border-[#A10E4D] bg-[#FFF0F3] text-[#A10E4D]'
                          : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                      }`}
                    >
                      {plan.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Card */}
            {editor.code && (
              <div className="rounded-xl border border-dashed border-[#A10E4D]/30 bg-[#FFF8FA] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A10E4D] mb-2">Coupon Preview</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-[#A10E4D]/20 bg-white px-4 py-2 shadow-sm">
                    <span className="font-mono text-lg font-extrabold tracking-widest text-neutral-800">{editor.code}</span>
                    <span className="rounded-full bg-[#A10E4D] px-2 py-0.5 text-[11px] font-bold text-white">{editor.discountPercent}% OFF</span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    <p className="font-semibold text-neutral-700">{editor.label || 'No label set'}</p>
                    <p>Expires: {formatDate(editor.expiresAt)}</p>
                    {(editor.targetPlans?.length ?? 0) > 0 && (
                      <p>Plans: {editor.targetPlans?.join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  ? <><ToggleRight className="size-4" /> Coupon is Active</>
                  : <><ToggleLeft className="size-4" /> Coupon is Inactive</>
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
                  <span>{pending ? 'Saving...' : selectedId ? 'Save Changes' : 'Create Coupon'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
