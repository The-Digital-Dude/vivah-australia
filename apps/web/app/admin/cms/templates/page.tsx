'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Mail, MessageSquare, Bell, Save, Play, Eye, FileEdit, Trash2, HelpCircle } from 'lucide-react';
import AdminShell from '../../admin-shell';
import { useMemberRequest, validationMessage } from '@/lib/member-api';
import { cmsTemplateInputSchema } from '@vivah/shared';

interface Template {
  _id?: string;
  key: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  subject?: string;
  body: string;
  variables: string[];
}

const TEMPLATE_PRESETS = [
  { key: 'WELCOME', name: 'Welcome Email/Notification', type: 'EMAIL', defaultSubject: 'Welcome to Vivah Australia!', defaultVariables: ['firstName'] },
  { key: 'VERIFY_EMAIL', name: 'Verify Email Address', type: 'EMAIL', defaultSubject: 'Verify your email address', defaultVariables: ['firstName', 'verifyUrl'] },
  { key: 'PASSWORD_RESET', name: 'Password Reset Request', type: 'EMAIL', defaultSubject: 'Reset your password', defaultVariables: ['firstName', 'resetUrl'] },
  { key: 'INTEREST_RECEIVED', name: 'Interest Received Alert', type: 'EMAIL', defaultSubject: 'Someone is interested in you!', defaultVariables: ['firstName', 'senderName', 'senderAge', 'senderCity'] },
  { key: 'INTEREST_ACCEPTED', name: 'Interest Accepted Notification', type: 'EMAIL', defaultSubject: 'Your match accepted your interest!', defaultVariables: ['firstName', 'partnerName'] },
  { key: 'VERIFICATION_APPROVED', name: 'Verification Approved Notification', type: 'EMAIL', defaultSubject: 'Your profile has been fully verified!', defaultVariables: ['firstName', 'badgeLevel'] },
  { key: 'VERIFICATION_REJECTED', name: 'Verification Rejected Alert', type: 'EMAIL', defaultSubject: 'Action required: Verification updates', defaultVariables: ['firstName', 'reason'] },
  { key: 'PAYMENT_SUCCESS', name: 'Payment Success Receipt', type: 'EMAIL', defaultSubject: 'Your payment was successful', defaultVariables: ['firstName', 'planName', 'amountPaid'] },
  { key: 'PAYMENT_FAILED', name: 'Payment Failed Warning', type: 'EMAIL', defaultSubject: 'Payment unsuccessful - action required', defaultVariables: ['firstName', 'planName'] }
];

export default function TemplateManagerPage() {
  const memberRequest = useMemberRequest();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [editor, setEditor] = useState<Template>({
    key: 'WELCOME',
    type: 'EMAIL',
    subject: 'Welcome to Vivah Australia!',
    body: 'Hi {{firstName}},\n\nWelcome to Vivah Australia! We are excited to have you on board.',
    variables: ['firstName']
  });

  // Dynamic variable values for Live Preview
  const [variableValues, setVariableValues] = useState<Record<string, string>>({
    firstName: 'Amit',
    verifyUrl: 'https://vivahaustralia.com.au/verify-email?token=test',
    resetUrl: 'https://vivahaustralia.com.au/reset-password?token=test',
    senderName: 'Priya',
    senderAge: '29',
    senderCity: 'Sydney',
    partnerName: 'Neha',
    badgeLevel: 'Gold Badge',
    reason: 'Incorrect document format',
    planName: 'Gold Monthly',
    amountPaid: '$79.00'
  });

  const loadTemplates = async () => {
    setPending(true);
    const result = await memberRequest('/api/admin/cms/templates');
    setPending(false);
    if (result.ok) {
      setTemplates((result.data as { templates?: Template[] }).templates ?? []);
    } else {
      setMessage(result.message);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchType = filterType === 'ALL' || t.type === filterType;
      const matchSearch = t.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.body.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [templates, filterType, searchQuery]);

  // Extract variables e.g. {{firstName}} from body
  const parsedVariables = useMemo(() => {
    const regex = /\{\{([a-zA-Z0-9_-]+)\}\}/g;
    const found: string[] = [];
    let match;
    while ((match = regex.exec(editor.body)) !== null) {
      if (match[1] && !found.includes(match[1])) {
        found.push(match[1]);
      }
    }
    return found;
  }, [editor.body]);

  // Render HTML / text preview
  const livePreviewContent = useMemo(() => {
    let text = editor.body;
    parsedVariables.forEach(v => {
      const value = variableValues[v] ?? `[${v}]`;
      text = text.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), value);
    });
    return text;
  }, [editor.body, parsedVariables, variableValues]);

  const selectItem = (item: Template) => {
    setSelectedId(item._id ?? null);
    setEditor({
      key: item.key,
      type: item.type,
      subject: item.subject ?? '',
      body: item.body,
      variables: item.variables || []
    });
    setMessage('');
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = TEMPLATE_PRESETS.find(p => p.key === presetKey);
    if (!preset) return;
    
    setEditor({
      key: preset.key,
      type: preset.type as 'EMAIL' | 'SMS' | 'PUSH',
      subject: preset.defaultSubject,
      body: getPresetDefaultBody(preset.key),
      variables: preset.defaultVariables
    });
  };

  const getPresetDefaultBody = (key: string) => {
    switch(key) {
      case 'WELCOME':
        return 'Hi {{firstName}},\n\nWelcome to Vivah Australia! We are thrilled to have you join our trusted South Asian matrimonial community.\n\nBest regards,\nThe Vivah Australia Team';
      case 'VERIFY_EMAIL':
        return 'Hi {{firstName}},\n\nTo complete your registration, please verify your email address by clicking the link below:\n\n{{verifyUrl}}\n\nThis link expires in 24 hours.\n\nBest regards,\nThe Vivah Australia Team';
      case 'PASSWORD_RESET':
        return 'Hi {{firstName}},\n\nWe received a request to reset your password. Use the link below to set a new password:\n\n{{resetUrl}}\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nThe Vivah Australia Team';
      case 'INTEREST_RECEIVED':
        return 'Hi {{firstName}},\n\nYou have received a new profile interest from {{senderName}}, a {{senderAge}}-year-old member from {{senderCity}}.\n\nLog in to your account to review their bio and respond.\n\nBest regards,\nThe Vivah Australia Team';
      case 'INTEREST_ACCEPTED':
        return 'Hi {{firstName}},\n\nExciting news! {{partnerName}} has accepted your interest request.\n\nYou can now start messaging them directly in your chat hub.\n\nBest regards,\nThe Vivah Australia Team';
      case 'VERIFICATION_APPROVED':
        return 'Hi {{firstName}},\n\nCongratulations! Your documents have been approved and your profile has been granted the {{badgeLevel}} status.\n\nYour profile will now receive priority visibility in match recommendations.\n\nBest regards,\nThe Vivah Australia Team';
      case 'VERIFICATION_REJECTED':
        return 'Hi {{firstName}},\n\nWe reviewed your documents but could not approve them for the following reason:\n\n{{reason}}\n\nPlease submit updated verification documents in your account settings.\n\nBest regards,\nThe Vivah Australia Team';
      case 'PAYMENT_SUCCESS':
        return 'Hi {{firstName}},\n\nThank you for your purchase! Your payment for the {{planName}} plan has been successfully processed.\n\nAmount paid: {{amountPaid}}\n\nYour account has been upgraded instantly.\n\nBest regards,\nThe Vivah Australia Team';
      case 'PAYMENT_FAILED':
        return 'Hi {{firstName}},\n\nYour recent payment attempt for the {{planName}} plan was unsuccessful.\n\nPlease log in to check your payment details or try another card to keep your premium communication benefits active.\n\nBest regards,\nThe Vivah Australia Team';
      default:
        return 'Hi {{firstName}}, ...';
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage('');

    const payload = {
      key: editor.key,
      type: editor.type,
      subject: editor.subject || undefined,
      body: editor.body,
      variables: parsedVariables
    };

    const parsed = cmsTemplateInputSchema.safeParse(payload);
    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      setPending(false);
      return;
    }

    const path = selectedId 
      ? `/api/admin/cms/templates/${selectedId}`
      : '/api/admin/cms/templates';
    const method = selectedId ? 'PUT' : 'POST';

    const result = await memberRequest(path, {
      method,
      body: parsed.data
    });

    setPending(false);
    if (result.ok) {
      setMessage('Template configuration saved.');
      await loadTemplates();
    } else {
      setMessage(result.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    setPending(true);
    const result = await memberRequest(`/api/admin/cms/templates/${selectedId}`, {
      method: 'DELETE'
    });
    setPending(false);
    
    if (result.ok) {
      setMessage('Template deleted.');
      setSelectedId(null);
      await loadTemplates();
    } else {
      setMessage(result.message);
    }
  };

  return (
    <AdminShell
      title="Notification & Template Manager"
      subtitle="Edit system-wide emails, SMS alerts, and push notifications with dynamic Handlebars variables."
    >
      <div className="space-y-6">
        {message && (
          <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <span>{message}</span>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          {/* TEMPLATE LIST PANEL */}
          <div className="bg-neutral-50/50 border border-neutral-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h4 className="text-sm font-bold text-neutral-800">System Templates</h4>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setEditor({
                    key: 'CUSTOM_TEMPLATE',
                    type: 'EMAIL',
                    subject: 'New Email Template',
                    body: 'Hi {{firstName}},\n\n...',
                    variables: ['firstName']
                  });
                }}
                className="inline-flex h-8 items-center gap-1 rounded-xl bg-white border border-[#A10E4D]/10 hover:bg-[#FFF0F3] px-3 text-xs font-bold text-[#A10E4D]"
              >
                <FileEdit className="size-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
              />

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 outline-none"
              >
                <option value="ALL">All Channels</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS Message</option>
                <option value="PUSH">Push Alert</option>
              </select>
            </div>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pt-2">
              {filteredTemplates.map(t => (
                <button
                  key={t._id}
                  onClick={() => selectItem(t)}
                  className={`flex w-full flex-col rounded-xl border p-3.5 text-left transition ${
                    selectedId === t._id
                      ? 'border-[#A10E4D] bg-white ring-1 ring-[#A10E4D]/10 shadow-sm'
                      : 'border-neutral-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    {t.type === 'EMAIL' && <Mail className="size-3.5 text-[#D4A04C]" />}
                    {t.type === 'SMS' && <MessageSquare className="size-3.5 text-[#1F9D68]" />}
                    {t.type === 'PUSH' && <Bell className="size-3.5 text-[#E74C7C]" />}
                    <span>{t.key}</span>
                  </div>
                  <span className="mt-1 text-[9px] text-neutral-450 uppercase line-clamp-1">
                    {t.subject || 'No Subject'}
                  </span>
                </button>
              ))}
              {filteredTemplates.length === 0 && (
                <p className="rounded-xl border border-dashed border-neutral-200 bg-white/80 p-5 text-center text-xs text-neutral-400 italic">
                  No templates configured.
                </p>
              )}
            </div>
          </div>

          {/* EDITOR & PREVIEW PANELS */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* EDITOR */}
            <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h4 className="text-sm font-bold text-neutral-800">Template Settings</h4>
              </div>

              {!selectedId && (
                <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                  <span className="uppercase tracking-wider text-neutral-400">Apply System Preset</span>
                  <select
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="h-11 w-full rounded-xl border border-neutral-250 bg-white px-3 text-xs font-semibold text-neutral-700 outline-none"
                  >
                    <option value="">-- Select Preset Type --</option>
                    {TEMPLATE_PRESETS.map(p => (
                      <option key={p.key} value={p.key}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                  <span className="uppercase tracking-wider text-neutral-400">Template Key</span>
                  <input
                    value={editor.key}
                    onChange={(e) => setEditor(prev => ({ ...prev, key: e.target.value }))}
                    disabled={!!selectedId}
                    placeholder="e.g. WELCOME_SMS"
                    className="h-11 w-full rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 outline-none disabled:bg-neutral-50 disabled:text-neutral-400"
                  />
                </div>
                <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                  <span className="uppercase tracking-wider text-neutral-400">Channel Type</span>
                  <select
                    value={editor.type}
                    onChange={(e) => setEditor(prev => ({ ...prev, type: e.target.value as any }))}
                    disabled={!!selectedId}
                    className="h-11 w-full rounded-xl border border-neutral-250 bg-white px-3 text-xs font-semibold text-neutral-700 outline-none disabled:bg-neutral-50"
                  >
                    <option value="EMAIL">Email Address</option>
                    <option value="SMS">SMS Notification</option>
                    <option value="PUSH">Push Alert</option>
                  </select>
                </div>
              </div>

              {editor.type === 'EMAIL' && (
                <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                  <span className="uppercase tracking-wider text-neutral-400">Email Subject Line</span>
                  <input
                    value={editor.subject || ''}
                    onChange={(e) => setEditor(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter email subject line..."
                    className="h-11 w-full rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D]"
                  />
                </div>
              )}

              <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                <span className="uppercase tracking-wider text-neutral-400">Template Body Content</span>
                <textarea
                  rows={10}
                  value={editor.body}
                  onChange={(e) => setEditor(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Enter content. Use {{variableName}} for substitutions."
                  className="w-full rounded-xl border border-neutral-250 p-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] leading-relaxed"
                />
              </div>

              <div className="flex justify-between items-center border-t border-neutral-100 pt-4">
                {selectedId && (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={pending}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-250 px-3.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="size-4" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={pending}
                  className="ml-auto rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-5 py-2.5 text-sm font-bold text-white disabled:bg-neutral-400 flex items-center gap-1.5"
                >
                  <Save className="size-4" />
                  <span>{pending ? 'Saving...' : 'Save Template'}</span>
                </button>
              </div>
            </form>

            {/* LIVE PREVIEW & VARIABLES TESTING */}
            <div className="space-y-6">
              {/* VARIABLE TESTING INPUTS */}
              {parsedVariables.length > 0 && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Live Variable Substitutions
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {parsedVariables.map(v => (
                      <div key={v} className="grid gap-1">
                        <span className="text-[10px] font-bold text-neutral-500">{`{{${v}}}`}</span>
                        <input
                          value={variableValues[v] ?? ''}
                          onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                          placeholder={`Value for ${v}`}
                          className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RENDER PREVIEW */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Live Rendering Preview
                  </h4>
                  <span className="inline-flex items-center gap-1 rounded bg-[#FFF0F3] px-2 py-0.5 text-[9px] font-bold text-[#A10E4D]">
                    <Eye className="size-3" />
                    <span>Active Preview</span>
                  </span>
                </div>

                <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 space-y-3 min-h-[200px]">
                  {editor.type === 'EMAIL' && (
                    <div className="border-b border-neutral-200/60 pb-2">
                      <div className="text-[10px] font-bold text-neutral-400 uppercase">Subject:</div>
                      <div className="text-xs font-bold text-neutral-800">{editor.subject || '(None)'}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Body Content:</div>
                    <div className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed font-semibold">
                      {livePreviewContent}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
