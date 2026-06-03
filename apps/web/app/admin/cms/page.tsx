'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  cmsBannerInputSchema,
  cmsContentInputSchema,
  cmsHomeContentSchema,
  cmsPageInputSchema,
  cmsSuccessStoryInputSchema,
  cmsTestimonialInputSchema,
} from '@vivah/shared';
import AdminShell from '../admin-shell';
import { formString, optionalString, useMemberRequest, validationMessage } from '@/lib/member-api';
import { AlertCircle, FileEdit, Trash2, ShieldAlert, Eye } from 'lucide-react';

type SectionKey = 'home' | 'pages' | 'blogs' | 'stories' | 'testimonials' | 'banners';

interface CmsPage {
  _id: string;
  slug: string;
  title: string;
  body: string;
  seoTitle?: string;
  seoDescription?: string;
  published: boolean;
  updatedAt?: string;
}

interface CmsContent {
  _id: string;
  slug: string;
  title: string;
  body: string;
  coupleName?: string;
  published: boolean;
  updatedAt?: string;
}

interface Testimonial {
  _id: string;
  name: string;
  quote: string;
  published: boolean;
}

interface Banner {
  _id: string;
  key: string;
  title?: string;
  imageUrl?: string;
  active: boolean;
}

interface HomeContent {
  hero: {
    title: string;
    subtitle: string;
    primaryAction: string;
    secondaryAction: string;
  };
  howItWorks: string[];
  safety: string[];
  faq: Array<{ question: string; answer: string }>;
  contact: {
    email: string;
    location: string;
  };
}

const emptyPage = {
  slug: '',
  title: '',
  body: '',
  seoTitle: '',
  seoDescription: '',
  published: false,
};

const emptyContent = {
  slug: '',
  title: '',
  body: '',
  coupleName: '',
  published: false,
};

const emptyTestimonial = {
  name: '',
  quote: '',
  published: false,
};

const emptyBanner = {
  key: '',
  title: '',
  imageUrl: '',
  active: true,
};

const emptyHome: HomeContent = {
  hero: {
    title: 'Vivah Australia',
    subtitle: 'A premium matrimonial platform for Australian singles and families.',
    primaryAction: 'Create profile',
    secondaryAction: 'Browse plans',
  },
  howItWorks: ['Create a profile', 'Verify your details', 'Connect with compatible matches'],
  safety: ['Manual moderation', 'Verification badges', 'Private media controls'],
  faq: [
    {
      question: 'Is Vivah Australia available nationally?',
      answer: 'Yes, the platform is designed for members across Australia.',
    },
  ],
  contact: {
    email: 'support@vivahaustralia.com.au',
    location: 'Australia',
  },
};

const sections: Array<{ key: SectionKey; label: string }> = [
  { key: 'home', label: 'Homepage' },
  { key: 'pages', label: 'Pages' },
  { key: 'blogs', label: 'Blogs' },
  { key: 'stories', label: 'Success stories' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'banners', label: 'Banners' },
];

export default function AdminCmsPage() {
  const memberRequest = useMemberRequest();
  const [activeSection, setActiveSection] = useState<SectionKey>('home');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [home, setHome] = useState<HomeContent>(emptyHome);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [blogs, setBlogs] = useState<CmsContent[]>([]);
  const [stories, setStories] = useState<CmsContent[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Custom confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<{
    path: string;
    id: string;
    label: string;
  } | null>(null);

  async function loadAll() {
    const [homeResult, pageResult, blogResult, storyResult, testimonialResult, bannerResult] =
      await Promise.all([
        memberRequest('/api/admin/cms/home'),
        memberRequest('/api/admin/cms/pages'),
        memberRequest('/api/admin/cms/blogs'),
        memberRequest('/api/admin/cms/success-stories'),
        memberRequest('/api/admin/cms/testimonials'),
        memberRequest('/api/admin/cms/banners'),
      ]);

    if (homeResult.ok) {
      setHome((homeResult.data as { content?: HomeContent }).content ?? emptyHome);
    }
    if (pageResult.ok) setPages((pageResult.data as { pages?: CmsPage[] }).pages ?? []);
    if (blogResult.ok) setBlogs((blogResult.data as { blogs?: CmsContent[] }).blogs ?? []);
    if (storyResult.ok) setStories((storyResult.data as { stories?: CmsContent[] }).stories ?? []);
    if (testimonialResult.ok) {
      setTestimonials(
        (testimonialResult.data as { testimonials?: Testimonial[] }).testimonials ?? [],
      );
    }
    if (bannerResult.ok) setBanners((bannerResult.data as { banners?: Banner[] }).banners ?? []);

    const failed = [
      homeResult,
      pageResult,
      blogResult,
      storyResult,
      testimonialResult,
      bannerResult,
    ].find((result) => !result.ok);
    if (failed) setMessage(failed.message);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function executeDelete() {
    if (!deleteTarget) return;
    const { path, id, label } = deleteTarget;
    setPending(true);
    const result = await memberRequest(`${path}/${id}`, { method: 'DELETE' });
    setPending(false);
    setDeleteTarget(null);
    setMessage(result.ok ? `${label} was deleted.` : result.message);
    if (result.ok) await loadAll();
  }

  return (
    <AdminShell
      title="Content Management"
      subtitle="Edit homepage copy, publish blog posts, configure marketing banners, testimonials, and static page content."
    >
      <div className="space-y-6">
        {/* TABS NAVBAR */}
        <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-4">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => {
                setActiveSection(section.key);
                setMessage('');
              }}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                activeSection === section.key
                  ? 'bg-[#A10E4D] text-white shadow-sm'
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {message && (
          <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-[#A10E4D]" />
            <span>{message}</span>
          </div>
        )}

        {/* CMS SECTION PANEL RENDERS */}
        {activeSection === 'home' && (
          <HomeEditor
            home={home}
            pending={pending}
            onSave={async (nextHome) => {
              setPending(true);
              setMessage('');
              const parsed = cmsHomeContentSchema.safeParse(nextHome);
              if (!parsed.success) {
                setMessage(validationMessage(parsed.error.issues));
                setPending(false);
                return;
              }
              const result = await memberRequest('/api/admin/cms/home', {
                method: 'PUT',
                body: parsed.data,
              });
              setPending(false);
              setMessage(result.ok ? 'Homepage copy updated successfully.' : result.message);
              if (result.ok) setHome(parsed.data);
            }}
          />
        )}

        {activeSection === 'pages' && (
          <PageManager
            items={pages}
            pending={pending}
            setPending={setPending}
            setMessage={setMessage}
            reload={loadAll}
            request={memberRequest}
            onDeleteTrigger={(id, label) => setDeleteTarget({ path: '/api/admin/cms/pages', id, label })}
          />
        )}

        {activeSection === 'blogs' && (
          <ContentManager
            title="Blogs"
            items={blogs}
            emptyEditor={emptyContent}
            collectionLabel="Blog"
            listPath="/api/admin/cms/blogs"
            schema={cmsContentInputSchema}
            pending={pending}
            setPending={setPending}
            setMessage={setMessage}
            reload={loadAll}
            request={memberRequest}
            onDeleteTrigger={(id, label) => setDeleteTarget({ path: '/api/admin/cms/blogs', id, label })}
          />
        )}

        {activeSection === 'stories' && (
          <ContentManager
            title="Success Stories"
            items={stories}
            emptyEditor={emptyContent}
            collectionLabel="Success story"
            listPath="/api/admin/cms/success-stories"
            schema={cmsSuccessStoryInputSchema}
            showCoupleName
            pending={pending}
            setPending={setPending}
            setMessage={setMessage}
            reload={loadAll}
            request={memberRequest}
            onDeleteTrigger={(id, label) => setDeleteTarget({ path: '/api/admin/cms/success-stories', id, label })}
          />
        )}

        {activeSection === 'testimonials' && (
          <TestimonialManager
            items={testimonials}
            pending={pending}
            setPending={setPending}
            setMessage={setMessage}
            reload={loadAll}
            request={memberRequest}
            onDeleteTrigger={(id, label) => setDeleteTarget({ path: '/api/admin/cms/testimonials', id, label })}
          />
        )}

        {activeSection === 'banners' && (
          <BannerManager
            items={banners}
            pending={pending}
            setPending={setPending}
            setMessage={setMessage}
            reload={loadAll}
            request={memberRequest}
            onDeleteTrigger={(id, label) => setDeleteTarget({ path: '/api/admin/cms/banners', id, label })}
          />
        )}
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setDeleteTarget(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
            aria-label="Close Dialog"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-neutral-900">
              Confirm Resource Deletion
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Are you sure you want to permanently delete this {deleteTarget.label.toLowerCase()}?
            </p>

            <div className="mt-4 flex gap-2.5 items-start bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-800 leading-relaxed">
                <strong>Warning:</strong> Deleting CMS nodes instantly affects public page routing and invalidates static caching indexes.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-neutral-250 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => void executeDelete()}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm"
                type="button"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function HomeEditor({
  home,
  onSave,
  pending,
}: Readonly<{
  home: HomeContent;
  onSave: (home: HomeContent) => Promise<void>;
  pending: boolean;
}>) {
  const [editor, setEditor] = useState({
    ...home.hero,
    howItWorks: home.howItWorks.join('\n'),
    safety: home.safety.join('\n'),
    faq: home.faq.map((item) => `${item.question} | ${item.answer}`).join('\n'),
    email: home.contact.email,
    location: home.contact.location,
  });

  useEffect(() => {
    setEditor({
      ...home.hero,
      howItWorks: home.howItWorks.join('\n'),
      safety: home.safety.join('\n'),
      faq: home.faq.map((item) => `${item.question} | ${item.answer}`).join('\n'),
      email: home.contact.email,
      location: home.contact.location,
    });
  }, [home]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const nextHome: HomeContent = {
          hero: {
            title: editor.title,
            subtitle: editor.subtitle,
            primaryAction: editor.primaryAction,
            secondaryAction: editor.secondaryAction,
          },
          howItWorks: lines(editor.howItWorks),
          safety: lines(editor.safety),
          faq: lines(editor.faq).map((line) => {
            const [question, ...answerParts] = line.split('|');
            return { question: (question ?? '').trim(), answer: answerParts.join('|').trim() };
          }),
          contact: { email: editor.email, location: editor.location },
        };
        void onSave(nextHome);
      }}
      className="grid gap-5 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Hero title"
          value={editor.title}
          onChange={(title) => setEditor((current) => ({ ...current, title }))}
        />
        <Field
          label="Hero subtitle"
          value={editor.subtitle}
          onChange={(subtitle) => setEditor((current) => ({ ...current, subtitle }))}
        />
        <Field
          label="Primary action"
          value={editor.primaryAction}
          onChange={(primaryAction) => setEditor((current) => ({ ...current, primaryAction }))}
        />
        <Field
          label="Secondary action"
          value={editor.secondaryAction}
          onChange={(secondaryAction) => setEditor((current) => ({ ...current, secondaryAction }))}
        />
        <Field
          label="Contact email"
          value={editor.email}
          onChange={(email) => setEditor((current) => ({ ...current, email }))}
        />
        <Field
          label="Contact location"
          value={editor.location}
          onChange={(location) => setEditor((current) => ({ ...current, location }))}
        />
      </div>
      <TextBlock
        label="How it works"
        value={editor.howItWorks}
        onChange={(howItWorks) => setEditor((current) => ({ ...current, howItWorks }))}
        help="One item per line."
      />
      <TextBlock
        label="Safety points"
        value={editor.safety}
        onChange={(safety) => setEditor((current) => ({ ...current, safety }))}
        help="One item per line."
      />
      <TextBlock
        label="FAQ preview"
        value={editor.faq}
        onChange={(faq) => setEditor((current) => ({ ...current, faq }))}
        help="One question and answer per line, separated by |."
      />
      <div className="flex justify-end pt-2 border-t border-neutral-100">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-5 py-2.5 text-sm font-bold text-white disabled:bg-neutral-400 shadow-sm"
        >
          {pending ? 'Saving Changes...' : 'Save Homepage Copy'}
        </button>
      </div>
    </form>
  );
}

interface ManagerPropsExtended<T> extends ManagerProps<T> {
  onDeleteTrigger: (id: string, label: string) => void;
}

function PageManager({
  items,
  pending,
  reload,
  request,
  setMessage,
  setPending,
  onDeleteTrigger,
}: Readonly<ManagerPropsExtended<CmsPage>>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState(emptyPage);
  const selectedPage = useMemo(
    () => items.find((page) => page._id === selectedId) ?? null,
    [items, selectedId],
  );

  function selectItem(item: CmsPage) {
    setSelectedId(item._id);
    setEditor({
      slug: item.slug,
      title: item.title,
      body: item.body,
      seoTitle: item.seoTitle ?? '',
      seoDescription: item.seoDescription ?? '',
      published: item.published,
    });
    setMessage('');
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <ContentList
        items={items}
        selectedId={selectedId}
        title="Pages"
        onNew={() => {
          setSelectedId(null);
          setEditor(emptyPage);
        }}
        onSelect={selectItem}
        labelFor={(item) => item.title}
        metaFor={(item) => `/pages/${item.slug} · ${item.published ? 'Published' : 'Draft'}`}
      />
      <form
        onSubmit={(event) =>
          void savePage(event, {
            selectedId,
            editor,
            request,
            reload,
            setMessage,
            setPending,
          })
        }
        className="grid gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Page Slug"
            name="slug"
            value={editor.slug}
            onChange={(slug) => setEditor((current) => ({ ...current, slug }))}
          />
          <Field
            label="Page Title"
            name="title"
            value={editor.title}
            onChange={(title) => setEditor((current) => ({ ...current, title }))}
          />
        </div>
        <RichTextEditor
          value={editor.body}
          onChange={(body) => setEditor((current) => ({ ...current, body }))}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="SEO Page Title"
            name="seoTitle"
            value={editor.seoTitle}
            onChange={(seoTitle) => setEditor((current) => ({ ...current, seoTitle }))}
          />
          <Field
            label="SEO Meta Description"
            name="seoDescription"
            value={editor.seoDescription}
            onChange={(seoDescription) => setEditor((current) => ({ ...current, seoDescription }))}
          />
        </div>
        <ActionBar
          selectedId={selectedId}
          pending={pending}
          published={editor.published}
          publishLabel="Publish Page (Visible publicly)"
          onPublishedChange={(published) => setEditor((current) => ({ ...current, published }))}
          onDelete={() => selectedId && onDeleteTrigger(selectedId, 'Page')}
          submitLabel={selectedId ? 'Save Changes' : 'Create Page'}
          {...(selectedPage?.published ? { preview: `/pages/${selectedPage.slug}` } : {})}
        />
      </form>
    </div>
  );
}

interface ContentManagerPropsExtended extends ManagerPropsExtended<CmsContent> {
  collectionLabel: string;
  emptyEditor: typeof emptyContent;
  listPath: string;
  schema: typeof cmsContentInputSchema | typeof cmsSuccessStoryInputSchema;
  showCoupleName?: boolean;
  title: string;
}

function ContentManager({
  collectionLabel,
  emptyEditor: initialEmptyEditor,
  items,
  listPath,
  pending,
  reload,
  request,
  schema,
  setMessage,
  setPending,
  showCoupleName = false,
  title,
  onDeleteTrigger,
}: Readonly<ContentManagerPropsExtended>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState(initialEmptyEditor);

  function selectItem(item: CmsContent) {
    setSelectedId(item._id);
    setEditor({
      slug: item.slug,
      title: item.title,
      body: item.body,
      coupleName: item.coupleName ?? '',
      published: item.published,
    });
    setMessage('');
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <ContentList
        items={items}
        selectedId={selectedId}
        title={title}
        onNew={() => {
          setSelectedId(null);
          setEditor(initialEmptyEditor);
        }}
        onSelect={selectItem}
        labelFor={(item) => item.title}
        metaFor={(item) => `${item.slug} · ${item.published ? 'Published' : 'Draft'}`}
      />
      <form
        onSubmit={(event) =>
          void saveContent(event, {
            collectionLabel,
            editor,
            listPath,
            reload,
            request,
            schema,
            selectedId,
            setMessage,
            setPending,
            showCoupleName,
          })
        }
        className="grid gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="URL Slug"
            name="slug"
            value={editor.slug}
            onChange={(slug) => setEditor((current) => ({ ...current, slug }))}
          />
          <Field
            label="Resource Title"
            name="title"
            value={editor.title}
            onChange={(nextTitle) => setEditor((current) => ({ ...current, title: nextTitle }))}
          />
          {showCoupleName ? (
            <Field
              label="Couple Names"
              name="coupleName"
              value={editor.coupleName}
              onChange={(coupleName) => setEditor((current) => ({ ...current, coupleName }))}
            />
          ) : null}
        </div>
        <RichTextEditor
          value={editor.body}
          onChange={(body) => setEditor((current) => ({ ...current, body }))}
        />
        <ActionBar
          selectedId={selectedId}
          pending={pending}
          published={editor.published}
          publishLabel="Publish to live catalog"
          onPublishedChange={(published) => setEditor((current) => ({ ...current, published }))}
          onDelete={() => selectedId && onDeleteTrigger(selectedId, collectionLabel)}
          submitLabel={selectedId ? 'Save Changes' : `Create ${collectionLabel}`}
        />
      </form>
    </div>
  );
}

function TestimonialManager({
  items,
  pending,
  reload,
  request,
  setMessage,
  setPending,
  onDeleteTrigger,
}: Readonly<ManagerPropsExtended<Testimonial>>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState(emptyTestimonial);

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <ContentList
        items={items}
        selectedId={selectedId}
        title="Testimonials"
        onNew={() => {
          setSelectedId(null);
          setEditor(emptyTestimonial);
        }}
        onSelect={(item) => {
          setSelectedId(item._id);
          setEditor({ name: item.name, quote: item.quote, published: item.published });
        }}
        labelFor={(item) => item.name}
        metaFor={(item) => (item.published ? 'Published' : 'Draft')}
      />
      <form
        onSubmit={(event) =>
          void saveTestimonial(event, {
            editor,
            reload,
            request,
            selectedId,
            setMessage,
            setPending,
          })
        }
        className="grid gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm"
      >
        <Field
          label="Name / Attribution"
          name="name"
          value={editor.name}
          onChange={(name) => setEditor((current) => ({ ...current, name }))}
        />
        <TextBlock
          label="Quote Text"
          name="quote"
          value={editor.quote}
          onChange={(quote) => setEditor((current) => ({ ...current, quote }))}
        />
        <ActionBar
          selectedId={selectedId}
          pending={pending}
          published={editor.published}
          publishLabel="Visible on testimonials sections"
          onPublishedChange={(published) => setEditor((current) => ({ ...current, published }))}
          onDelete={() => selectedId && onDeleteTrigger(selectedId, 'Testimonial')}
          submitLabel={selectedId ? 'Save Changes' : 'Create Testimonial'}
        />
      </form>
    </div>
  );
}

function BannerManager({
  items,
  pending,
  reload,
  request,
  setMessage,
  setPending,
  onDeleteTrigger,
}: Readonly<ManagerPropsExtended<Banner>>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState(emptyBanner);

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <ContentList
        items={items}
        selectedId={selectedId}
        title="Banners"
        onNew={() => {
          setSelectedId(null);
          setEditor(emptyBanner);
        }}
        onSelect={(item) => {
          setSelectedId(item._id);
          setEditor({
            key: item.key,
            title: item.title ?? '',
            imageUrl: item.imageUrl ?? '',
            active: item.active,
          });
        }}
        labelFor={(item) => item.title || item.key}
        metaFor={(item) => `${item.key} · ${item.active ? 'Active' : 'Inactive'}`}
      />
      <form
        onSubmit={(event) =>
          void saveBanner(event, {
            editor,
            reload,
            request,
            selectedId,
            setMessage,
            setPending,
          })
        }
        className="grid gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="System Key (Routing name)"
            name="key"
            value={editor.key}
            onChange={(key) => setEditor((current) => ({ ...current, key }))}
          />
          <Field
            label="Banner Label / Title"
            name="title"
            value={editor.title}
            onChange={(title) => setEditor((current) => ({ ...current, title }))}
          />
        </div>
        <Field
          label="Creative Asset Image URL"
          name="imageUrl"
          value={editor.imageUrl}
          onChange={(imageUrl) => setEditor((current) => ({ ...current, imageUrl }))}
        />
        <ActionBar
          selectedId={selectedId}
          pending={pending}
          published={editor.active}
          publishLabel="Active (Rendering across target views)"
          onPublishedChange={(active) => setEditor((current) => ({ ...current, active }))}
          onDelete={() => selectedId && onDeleteTrigger(selectedId, 'Banner')}
          submitLabel={selectedId ? 'Save Changes' : 'Create Banner'}
        />
      </form>
    </div>
  );
}

function RichTextEditor({
  onChange,
  value,
}: Readonly<{ value: string; onChange: (value: string) => void }>) {
  const [preview, setPreview] = useState(false);

  function wrap(prefix: string, suffix = prefix) {
    onChange(`${value}${value ? '\n' : ''}${prefix}Selected text${suffix}`);
  }

  return (
    <div className="grid gap-2 text-xs font-bold text-neutral-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2">
        <span className="uppercase tracking-wider text-neutral-400">Page Content Block</span>
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => wrap('**')} className={toolbarButtonClass}>
            Bold
          </button>
          <button type="button" onClick={() => wrap('_')} className={toolbarButtonClass}>
            Italic
          </button>
          <button
            type="button"
            onClick={() => onChange(`${value}${value ? '\n' : ''}## Heading`)}
            className={toolbarButtonClass}
          >
            Heading
          </button>
          <button
            type="button"
            onClick={() => onChange(`${value}${value ? '\n' : ''}- List item`)}
            className={toolbarButtonClass}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setPreview((current) => !current)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[10px] font-bold text-neutral-700 bg-white hover:bg-neutral-50"
          >
            {preview ? 'Edit Source' : 'Visual Preview'}
          </button>
        </div>
      </div>
      {preview ? (
        <div className="min-h-[220px] rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-medium leading-relaxed text-neutral-600">
          {value.split('\n').map((line, index) => (
            <p
              key={`${line}-${index}`}
              className={line.startsWith('## ') ? 'text-sm font-bold text-neutral-800 mt-2 mb-1' : 'mb-1'}
            >
              {line.replace(/^## /, '').replace(/\*\*/g, '').replace(/_/g, '') || '\u00a0'}
            </p>
          ))}
        </div>
      ) : (
        <textarea
          name="body"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={10}
          className="w-full rounded-xl border border-neutral-250 p-3.5 text-xs font-semibold text-neutral-700 placeholder-neutral-450 outline-none focus:border-[#A10E4D] leading-relaxed"
          placeholder="Use Markdown shortcuts or toolbar actions above to format core page details..."
        />
      )}
    </div>
  );
}

function ContentList<T extends { _id: string }>({
  items,
  labelFor,
  metaFor,
  onNew,
  onSelect,
  selectedId,
  title,
}: Readonly<{
  items: T[];
  labelFor: (item: T) => string;
  metaFor: (item: T) => string;
  onNew: () => void;
  onSelect: (item: T) => void;
  selectedId: string | null;
  title: string;
}>) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2">
        <h4 className="text-sm font-bold text-neutral-800">{title}</h4>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex h-8 items-center gap-1 rounded-xl bg-white border border-[#A10E4D]/10 hover:bg-[#FFF0F3] px-3 text-xs font-bold text-[#A10E4D]"
        >
          <FileEdit className="h-3.5 w-3.5" />
          <span>New</span>
        </button>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {items.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => onSelect(item)}
            className={`flex w-full flex-col rounded-xl border p-3.5 text-left transition ${
              selectedId === item._id
                ? 'border-[#A10E4D] bg-white ring-1 ring-[#A10E4D]/10 shadow-sm'
                : 'border-neutral-200/60 bg-white/70 hover:bg-white'
            }`}
          >
            <span className="text-xs font-bold text-neutral-800 truncate w-full">{labelFor(item)}</span>
            <span className="mt-1 text-[10px] font-semibold text-neutral-450">{metaFor(item)}</span>
          </button>
        ))}
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-white/80 p-5 text-center text-xs text-neutral-400 italic">
            No CMS assets available.
          </p>
        )}
      </div>
    </section>
  );
}

function ActionBar({
  onDelete,
  onPublishedChange,
  pending,
  preview,
  publishLabel,
  published,
  selectedId,
  submitLabel,
}: Readonly<{
  onDelete: () => void;
  onPublishedChange: (published: boolean) => void;
  pending: boolean;
  preview?: string;
  publishLabel: string;
  published: boolean;
  selectedId: string | null;
  submitLabel: string;
}>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 mt-2">
      <label className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600">
        <input
          type="checkbox"
          checked={published}
          onChange={(event) => onPublishedChange(event.target.checked)}
          className="rounded-lg border-neutral-300 text-[#A10E4D] focus:ring-[#A10E4D]/30 h-4.5 w-4.5"
        />
        <span>{publishLabel}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {preview && (
          <Link
            href={preview}
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#A10E4D]/20 bg-white px-3.5 text-xs font-bold text-[#A10E4D] hover:bg-[#FFF0F3] shadow-sm transition"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Live Link</span>
          </Link>
        )}
        {selectedId && (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 text-rose-700 px-3.5 text-xs font-bold hover:bg-rose-50 disabled:opacity-40 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-4.5 py-2 text-xs font-bold text-white disabled:bg-neutral-400 shadow-sm transition"
        >
          {pending ? 'Saving Changes...' : submitLabel}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  onChange,
  placeholder,
  value,
}: Readonly<{
  label: string;
  name?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}>) {
  return (
    <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
      <span className="uppercase tracking-wider text-neutral-400">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 placeholder-neutral-400 outline-none focus:border-[#A10E4D] transition"
      />
    </div>
  );
}

function TextBlock({
  help,
  label,
  name,
  onChange,
  value,
}: Readonly<{
  help?: string;
  label: string;
  name?: string;
  onChange: (value: string) => void;
  value: string;
}>) {
  return (
    <div className="grid gap-1.5 text-xs font-bold text-neutral-850">
      <span className="uppercase tracking-wider text-neutral-400">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        className="w-full rounded-xl border border-neutral-250 p-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition leading-relaxed"
      />
      {help && <span className="text-[10px] text-neutral-450 font-medium">{help}</span>}
    </div>
  );
}

interface ManagerProps<T> {
  items: T[];
  pending: boolean;
  reload: () => Promise<void>;
  request: ReturnType<typeof useMemberRequest>;
  setMessage: (message: string) => void;
  setPending: (pending: boolean) => void;
}

export interface ContentManagerProps extends ManagerProps<CmsContent> {
  collectionLabel: string;
  emptyEditor: typeof emptyContent;
  listPath: string;
  schema: typeof cmsContentInputSchema | typeof cmsSuccessStoryInputSchema;
  showCoupleName?: boolean;
  title: string;
}

const toolbarButtonClass =
  'rounded-lg border border-neutral-250 bg-white px-2.5 py-1 text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 transition';

async function savePage(
  event: FormEvent<HTMLFormElement>,
  options: {
    editor: typeof emptyPage;
    reload: () => Promise<void>;
    request: ReturnType<typeof useMemberRequest>;
    selectedId: string | null;
    setMessage: (message: string) => void;
    setPending: (pending: boolean) => void;
  },
) {
  event.preventDefault();
  options.setPending(true);
  options.setMessage('');
  const form = new FormData(event.currentTarget);
  const payload = {
    slug: formString(form.get('slug')),
    title: formString(form.get('title')),
    body: options.editor.body,
    seoTitle: optionalString(form.get('seoTitle')),
    seoDescription: optionalString(form.get('seoDescription')),
    published: options.editor.published,
  };
  const parsed = cmsPageInputSchema.safeParse(payload);
  if (!parsed.success) {
    options.setMessage(validationMessage(parsed.error.issues));
    options.setPending(false);
    return;
  }
  const result = await options.request(
    options.selectedId ? `/api/admin/cms/pages/${options.selectedId}` : '/api/admin/cms/pages',
    { method: options.selectedId ? 'PATCH' : 'POST', body: parsed.data },
  );
  options.setPending(false);
  options.setMessage(result.ok ? 'Static Page changes updated successfully.' : result.message);
  if (result.ok) await options.reload();
}

async function saveContent(
  event: FormEvent<HTMLFormElement>,
  options: {
    collectionLabel: string;
    editor: typeof emptyContent;
    listPath: string;
    reload: () => Promise<void>;
    request: ReturnType<typeof useMemberRequest>;
    schema: typeof cmsContentInputSchema | typeof cmsSuccessStoryInputSchema;
    selectedId: string | null;
    setMessage: (message: string) => void;
    setPending: (pending: boolean) => void;
    showCoupleName?: boolean;
  },
) {
  event.preventDefault();
  options.setPending(true);
  options.setMessage('');
  const form = new FormData(event.currentTarget);
  const payload = {
    slug: formString(form.get('slug')),
    title: formString(form.get('title')),
    body: options.editor.body,
    ...(options.showCoupleName ? { coupleName: optionalString(form.get('coupleName')) } : {}),
    published: options.editor.published,
  };
  const parsed = options.schema.safeParse(payload);
  if (!parsed.success) {
    options.setMessage(validationMessage(parsed.error.issues));
    options.setPending(false);
    return;
  }
  const result = await options.request(
    options.selectedId ? `${options.listPath}/${options.selectedId}` : options.listPath,
    { method: options.selectedId ? 'PATCH' : 'POST', body: parsed.data },
  );
  options.setPending(false);
  options.setMessage(result.ok ? `${options.collectionLabel} changes saved.` : result.message);
  if (result.ok) await options.reload();
}

async function saveTestimonial(
  event: FormEvent<HTMLFormElement>,
  options: {
    editor: typeof emptyTestimonial;
    reload: () => Promise<void>;
    request: ReturnType<typeof useMemberRequest>;
    selectedId: string | null;
    setMessage: (message: string) => void;
    setPending: (pending: boolean) => void;
  },
) {
  event.preventDefault();
  options.setPending(true);
  options.setMessage('');
  const form = new FormData(event.currentTarget);
  const parsed = cmsTestimonialInputSchema.safeParse({
    name: formString(form.get('name')),
    quote: formString(form.get('quote')),
    published: options.editor.published,
  });
  if (!parsed.success) {
    options.setMessage(validationMessage(parsed.error.issues));
    options.setPending(false);
    return;
  }
  const result = await options.request(
    options.selectedId
      ? `/api/admin/cms/testimonials/${options.selectedId}`
      : '/api/admin/cms/testimonials',
    { method: options.selectedId ? 'PATCH' : 'POST', body: parsed.data },
  );
  options.setPending(false);
  options.setMessage(result.ok ? 'Member testimonial details updated.' : result.message);
  if (result.ok) await options.reload();
}

async function saveBanner(
  event: FormEvent<HTMLFormElement>,
  options: {
    editor: typeof emptyBanner;
    reload: () => Promise<void>;
    request: ReturnType<typeof useMemberRequest>;
    selectedId: string | null;
    setMessage: (message: string) => void;
    setPending: (pending: boolean) => void;
  },
) {
  event.preventDefault();
  options.setPending(true);
  options.setMessage('');
  const form = new FormData(event.currentTarget);
  const parsed = cmsBannerInputSchema.safeParse({
    key: formString(form.get('key')),
    title: optionalString(form.get('title')),
    imageUrl: optionalString(form.get('imageUrl')),
    active: options.editor.active,
  });
  if (!parsed.success) {
    options.setMessage(validationMessage(parsed.error.issues));
    options.setPending(false);
    return;
  }
  const result = await options.request(
    options.selectedId ? `/api/admin/cms/banners/${options.selectedId}` : '/api/admin/cms/banners',
    { method: options.selectedId ? 'PATCH' : 'POST', body: parsed.data },
  );
  options.setPending(false);
  options.setMessage(result.ok ? 'Banner asset details updated.' : result.message);
  if (result.ok) await options.reload();
}

function lines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}
