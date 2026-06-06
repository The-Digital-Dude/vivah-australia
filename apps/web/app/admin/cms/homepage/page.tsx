'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Save, 
  Settings,
  Play
} from 'lucide-react';
import AdminShell from '../../admin-shell';
import { useMemberRequest, validationMessage } from '@/lib/member-api';
import { cmsSectionInputSchema } from '@vivah/shared';

interface CmsSection {
  _id?: string;
  key: string;
  pageKey: string;
  title?: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  visible: boolean;
  sortOrder: number;
  status: 'DRAFT' | 'PUBLISHED';
}

const SECTION_TYPES = [
  { key: 'hero', name: 'Hero Banner', desc: 'Main headline, subheadline, and call to action at the top' },
  { key: 'trust-strip', name: 'Trust Badge Strip', desc: 'Trust points showing privacy, safety, and security badges' },
  { key: 'stats', name: 'Platform Stats Counters', desc: 'Key figures like active members, matching rate, and locations' },
  { key: 'why-vivah', name: 'Why Choose Vivah', desc: 'Unique benefits and culture-focused advantages' },
  { key: 'how-it-works', name: 'How It Works Steps', desc: 'Step-by-step registration and communication process' },
  { key: 'testimonials', name: 'Member Testimonials', desc: 'Quotes and attribution from real users' },
  { key: 'success-stories', name: 'Success Stories', desc: 'Happy couples who met through Vivah Australia' },
  { key: 'membership-cta', name: 'Membership Upgrades Banner', desc: 'Final promotional prompt to upgrade to premium' },
  { key: 'faq', name: 'Frequently Asked Questions', desc: 'Accordion displaying top membership and safety questions' }
];

export default function HomepageBuilderPage() {
  const memberRequest = useMemberRequest();
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [activeSectionKey, setActiveSectionKey] = useState<string>('hero');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [editorState, setEditorState] = useState<CmsSection>({
    key: 'hero',
    pageKey: 'home',
    title: '',
    subtitle: '',
    body: '',
    imageUrl: '',
    ctaLabel: '',
    ctaHref: '',
    visible: true,
    sortOrder: 0,
    status: 'DRAFT'
  });

  const loadSections = async () => {
    setPending(true);
    const result = await memberRequest('/api/admin/cms/sections');
    setPending(false);
    if (result.ok) {
      const allSections: CmsSection[] = (result.data as { sections?: CmsSection[] }).sections ?? [];
      const homeSections = allSections
        .filter(s => s.pageKey === 'home')
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      // Initialize missing sections
      const initialized: CmsSection[] = [];
      SECTION_TYPES.forEach((type, index) => {
        const existing = homeSections.find(s => s.key === type.key);
        if (existing) {
          initialized.push(existing);
        } else {
          initialized.push({
            key: type.key,
            pageKey: 'home',
            title: '',
            subtitle: '',
            body: '',
            imageUrl: '',
            ctaLabel: '',
            ctaHref: '',
            visible: true,
            sortOrder: index,
            status: 'DRAFT'
          });
        }
      });
      // Sort again just in case
      initialized.sort((a, b) => a.sortOrder - b.sortOrder);
      setSections(initialized);
      
      const current = initialized.find(s => s.key === activeSectionKey);
      if (current) {
        setEditorState(current);
      }
    } else {
      setMessage(result.message);
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  useEffect(() => {
    const current = sections.find(s => s.key === activeSectionKey);
    if (current) {
      setEditorState(current);
    }
  }, [activeSectionKey, sections]);

  const saveSection = async (sectionToSave: CmsSection) => {
    setPending(true);
    setMessage('');
    
    const parsed = cmsSectionInputSchema.safeParse({
      key: sectionToSave.key,
      pageKey: 'home',
      title: sectionToSave.title || undefined,
      subtitle: sectionToSave.subtitle || undefined,
      body: sectionToSave.body || undefined,
      imageUrl: sectionToSave.imageUrl || undefined,
      ctaLabel: sectionToSave.ctaLabel || undefined,
      ctaHref: sectionToSave.ctaHref || undefined,
      visible: sectionToSave.visible,
      sortOrder: sectionToSave.sortOrder,
      status: sectionToSave.status
    });

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      setPending(false);
      return;
    }

    const path = sectionToSave._id 
      ? `/api/admin/cms/sections/${sectionToSave._id}`
      : '/api/admin/cms/sections';
    const method = sectionToSave._id ? 'PUT' : 'POST';

    const result = await memberRequest(path, {
      method,
      body: parsed.data
    });
    
    setPending(false);
    if (result.ok) {
      setMessage('Section updated successfully.');
      await loadSections();
    } else {
      setMessage(result.message);
    }
  };

  const toggleVisibility = async (key: string) => {
    const section = sections.find(s => s.key === key);
    if (!section) return;
    const updated = { ...section, visible: !section.visible };
    await saveSection(updated);
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newSections = [...sections];
    const itemA = newSections[index];
    const itemB = newSections[targetIndex];
    if (!itemA || !itemB) return;
    
    // Swap sortOrder
    const tempSort = itemA.sortOrder;
    itemA.sortOrder = itemB.sortOrder;
    itemB.sortOrder = tempSort;

    setPending(true);
    // Save both sections
    await Promise.all([
      saveSection(itemA),
      saveSection(itemB)
    ]);
    setPending(false);
  };

  return (
    <AdminShell
      title="Homepage Builder"
      subtitle="Configure layout order, toggle visibility, and update content sections for the consumer homepage."
    >
      <div className="space-y-6">
        {message && (
          <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <span>{message}</span>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          {/* SECTION MANAGER / REORDER PANEL */}
          <div className="bg-neutral-50/50 border border-neutral-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h4 className="text-sm font-bold text-neutral-800">Homepage Layout Map</h4>
              <Link 
                href="/" 
                target="_blank"
                className="inline-flex h-8 items-center gap-1 rounded-xl bg-white border border-[#A10E4D]/20 hover:bg-[#FFF0F3] px-3 text-xs font-bold text-[#A10E4D]"
              >
                <Play className="size-3" />
                <span>Preview Site</span>
              </Link>
            </div>

            <div className="space-y-2">
              {sections.map((section, index) => {
                const info = SECTION_TYPES.find(t => t.key === section.key);
                const isActive = activeSectionKey === section.key;
                
                return (
                  <div 
                    key={section.key}
                    className={`flex items-center gap-2 border p-3 rounded-xl transition ${
                      isActive 
                        ? 'border-[#A10E4D] bg-white ring-1 ring-[#A10E4D]/10 shadow-sm'
                        : 'border-neutral-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => void moveSection(index, 'up')}
                        disabled={index === 0 || pending}
                        className="text-neutral-450 hover:text-neutral-700 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void moveSection(index, 'down')}
                        disabled={index === sections.length - 1 || pending}
                        className="text-neutral-450 hover:text-neutral-700 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSectionKey(section.key)}
                      className="flex-1 text-left"
                    >
                      <div className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <span>{info?.name || section.key}</span>
                        {section.status === 'PUBLISHED' ? (
                          <span className="size-1.5 rounded-full bg-emerald-500" title="Published" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-amber-500" title="Draft" />
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                        {info?.desc}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => void toggleVisibility(section.key)}
                      disabled={pending}
                      className={`p-1.5 rounded-lg border transition ${
                        section.visible 
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-400 hover:bg-neutral-100'
                      }`}
                      title={section.visible ? 'Visible on site' : 'Hidden from site'}
                    >
                      {section.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EDIT FORM PANEL */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Settings className="size-5 text-[#A10E4D]" />
                <span>Configure: {SECTION_TYPES.find(t => t.key === activeSectionKey)?.name}</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {SECTION_TYPES.find(t => t.key === activeSectionKey)?.desc}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveSection(editorState);
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                  <span className="uppercase tracking-wider text-neutral-400">Section Title</span>
                  <input
                    value={editorState.title || ''}
                    onChange={(e) => setEditorState(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter section headline..."
                    className="h-11 w-full rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                  />
                </div>
                <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                  <span className="uppercase tracking-wider text-neutral-400">Section Subtitle</span>
                  <input
                    value={editorState.subtitle || ''}
                    onChange={(e) => setEditorState(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Enter section description..."
                    className="h-11 w-full rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                  />
                </div>
              </div>

              <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                <span className="uppercase tracking-wider text-neutral-400">Body Content</span>
                <textarea
                  rows={6}
                  value={editorState.body || ''}
                  onChange={(e) => setEditorState(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Enter structured body text or specific list values (format as required by the section type)..."
                  className="w-full rounded-xl border border-neutral-250 p-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition leading-relaxed"
                />
                <span className="text-[10px] text-neutral-400 font-medium">
                  {activeSectionKey === 'how-it-works' && 'Write one step per line.'}
                  {activeSectionKey === 'trust-strip' && 'Write comma-separated list of benefits/tags.'}
                  {activeSectionKey === 'stats' && 'Format: Counter Number | Metric Title (One per line)'}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                  <span className="uppercase tracking-wider text-neutral-400">Creative Image URL</span>
                  <input
                    value={editorState.imageUrl || ''}
                    onChange={(e) => setEditorState(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="h-11 w-full rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                  />
                </div>
                <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                  <span className="uppercase tracking-wider text-neutral-400">CTA Label</span>
                  <input
                    value={editorState.ctaLabel || ''}
                    onChange={(e) => setEditorState(prev => ({ ...prev, ctaLabel: e.target.value }))}
                    placeholder="e.g. Register Now"
                    className="h-11 w-full rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                  />
                </div>
                <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
                  <span className="uppercase tracking-wider text-neutral-400">CTA Href Target</span>
                  <input
                    value={editorState.ctaHref || ''}
                    onChange={(e) => setEditorState(prev => ({ ...prev, ctaHref: e.target.value }))}
                    placeholder="e.g. /register"
                    className="h-11 w-full rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-600">
                  <input
                    type="checkbox"
                    checked={editorState.visible}
                    onChange={(e) => setEditorState(prev => ({ ...prev, visible: e.target.checked }))}
                    className="rounded border-neutral-300 text-[#A10E4D] focus:ring-[#A10E4D]/30 h-4.5 w-4.5"
                  />
                  <span>Show Section on Live Site</span>
                </div>
                
                <div className="flex items-center justify-end gap-2 text-xs font-bold text-neutral-600">
                  <span className="uppercase tracking-wider text-neutral-400 mr-2">Publish Status:</span>
                  <select
                    value={editorState.status}
                    onChange={(e) => setEditorState(prev => ({ ...prev, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))}
                    className="h-9 rounded-lg border border-neutral-250 bg-white px-3 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D]"
                  >
                    <option value="DRAFT">Draft (Admin Only)</option>
                    <option value="PUBLISHED">Published (Public)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-5 py-2.5 text-sm font-bold text-white disabled:bg-neutral-400 shadow-sm flex items-center gap-1.5"
                >
                  <Save className="size-4" />
                  <span>{pending ? 'Saving...' : 'Save Section Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
