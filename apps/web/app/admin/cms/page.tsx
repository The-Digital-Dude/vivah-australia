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

  return (
    <AdminShell
      title="CMS"
      subtitle="Manage public website content, rich text blocks, homepage copy, banners, stories, testimonials, and publish state."
    >
      <div className="grid gap-6">
        <nav className="flex flex-wrap gap-2 rounded-lg border border-[#7A1E3A]/10 bg-white p-2">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => {
                setActiveSection(section.key);
                setMessage('');
              }}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                activeSection === section.key
                  ? 'bg-[#7A1E3A] text-white'
                  : 'text-[#5E6470] hover:bg-[#FFF8F1]'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {message ? (
          <p className="rounded-md border border-[#7A1E3A]/20 bg-[#FFF8F1] p-3 text-sm font-semibold text-[#7A1E3A]">
            {message}
          </p>
        ) : null}

        {activeSection === 'home' ? (
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
              setMessage(result.ok ? 'Homepage content saved.' : result.message);
              if (result.ok) setHome(parsed.data);
            }}
          />
        ) : null}

        {activeSection === 'pages' ? (
          <PageManager
            items={pages}
            pending={pending}
            setPending={setPending}
            setMessage={setMessage}
            reload={loadAll}
            request={memberRequest}
          />
        ) : null}

        {activeSection === 'blogs' ? (
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
          />
        ) : null}

        {activeSection === 'stories' ? (
          <ContentManager
            title="Success stories"
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
          />
        ) : null}

        {activeSection === 'testimonials' ? (
          <TestimonialManager
            items={testimonials}
            pending={pending}
            setPending={setPending}
            setMessage={setMessage}
            reload={loadAll}
            request={memberRequest}
          />
        ) : null}

        {activeSection === 'banners' ? (
          <BannerManager
            items={banners}
            pending={pending}
            setPending={setPending}
            setMessage={setMessage}
            reload={loadAll}
            request={memberRequest}
          />
        ) : null}
      </div>
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
      className="grid gap-5"
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
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#7A1E3A] px-5 py-2 text-sm font-semibold text-white disabled:bg-neutral-400"
        >
          {pending ? 'Saving...' : 'Save homepage'}
        </button>
      </div>
    </form>
  );
}

function PageManager({
  items,
  pending,
  reload,
  request,
  setMessage,
  setPending,
}: Readonly<ManagerProps<CmsPage>>) {
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
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
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
        className="grid gap-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Slug"
            name="slug"
            value={editor.slug}
            onChange={(slug) => setEditor((current) => ({ ...current, slug }))}
          />
          <Field
            label="Title"
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
            label="SEO title"
            name="seoTitle"
            value={editor.seoTitle}
            onChange={(seoTitle) => setEditor((current) => ({ ...current, seoTitle }))}
          />
          <Field
            label="SEO description"
            name="seoDescription"
            value={editor.seoDescription}
            onChange={(seoDescription) => setEditor((current) => ({ ...current, seoDescription }))}
          />
        </div>
        <ActionBar
          selectedId={selectedId}
          pending={pending}
          published={editor.published}
          publishLabel="Published"
          onPublishedChange={(published) => setEditor((current) => ({ ...current, published }))}
          onDelete={() =>
            void deleteItem(
              '/api/admin/cms/pages',
              selectedId,
              'CMS page',
              request,
              reload,
              setMessage,
              setPending,
            )
          }
          {...(selectedPage?.published ? { preview: `/pages/${selectedPage.slug}` } : {})}
          submitLabel={selectedId ? 'Save changes' : 'Create page'}
        />
      </form>
    </div>
  );
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
}: Readonly<ContentManagerProps>) {
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
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
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
        className="grid gap-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Slug"
            name="slug"
            value={editor.slug}
            onChange={(slug) => setEditor((current) => ({ ...current, slug }))}
          />
          <Field
            label="Title"
            name="title"
            value={editor.title}
            onChange={(nextTitle) => setEditor((current) => ({ ...current, title: nextTitle }))}
          />
          {showCoupleName ? (
            <Field
              label="Couple name"
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
          publishLabel="Published"
          onPublishedChange={(published) => setEditor((current) => ({ ...current, published }))}
          onDelete={() =>
            void deleteItem(
              listPath,
              selectedId,
              collectionLabel,
              request,
              reload,
              setMessage,
              setPending,
            )
          }
          submitLabel={selectedId ? 'Save changes' : `Create ${collectionLabel.toLowerCase()}`}
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
}: Readonly<ManagerProps<Testimonial>>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState(emptyTestimonial);

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
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
        className="grid gap-4"
      >
        <Field
          label="Name"
          name="name"
          value={editor.name}
          onChange={(name) => setEditor((current) => ({ ...current, name }))}
        />
        <TextBlock
          label="Quote"
          name="quote"
          value={editor.quote}
          onChange={(quote) => setEditor((current) => ({ ...current, quote }))}
        />
        <ActionBar
          selectedId={selectedId}
          pending={pending}
          published={editor.published}
          publishLabel="Published"
          onPublishedChange={(published) => setEditor((current) => ({ ...current, published }))}
          onDelete={() =>
            void deleteItem(
              '/api/admin/cms/testimonials',
              selectedId,
              'Testimonial',
              request,
              reload,
              setMessage,
              setPending,
            )
          }
          submitLabel={selectedId ? 'Save changes' : 'Create testimonial'}
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
}: Readonly<ManagerProps<Banner>>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState(emptyBanner);

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
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
        className="grid gap-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Key"
            name="key"
            value={editor.key}
            onChange={(key) => setEditor((current) => ({ ...current, key }))}
          />
          <Field
            label="Title"
            name="title"
            value={editor.title}
            onChange={(title) => setEditor((current) => ({ ...current, title }))}
          />
        </div>
        <Field
          label="Image URL"
          name="imageUrl"
          value={editor.imageUrl}
          onChange={(imageUrl) => setEditor((current) => ({ ...current, imageUrl }))}
        />
        <ActionBar
          selectedId={selectedId}
          pending={pending}
          published={editor.active}
          publishLabel="Active"
          onPublishedChange={(active) => setEditor((current) => ({ ...current, active }))}
          onDelete={() =>
            void deleteItem(
              '/api/admin/cms/banners',
              selectedId,
              'Banner',
              request,
              reload,
              setMessage,
              setPending,
            )
          }
          submitLabel={selectedId ? 'Save changes' : 'Create banner'}
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
    <div className="grid gap-2 text-sm font-semibold text-[#232323]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>Body</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => wrap('**')} className={toolbarButtonClass}>
            B
          </button>
          <button type="button" onClick={() => wrap('_')} className={toolbarButtonClass}>
            I
          </button>
          <button
            type="button"
            onClick={() => onChange(`${value}${value ? '\n' : ''}## Heading`)}
            className={toolbarButtonClass}
          >
            H
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
            className={toolbarButtonClass}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>
      {preview ? (
        <div className="min-h-[260px] rounded-md border border-[#7A1E3A]/20 bg-white px-3 py-2 text-sm font-normal leading-7 text-[#5E6470]">
          {value.split('\n').map((line, index) => (
            <p
              key={`${line}-${index}`}
              className={line.startsWith('## ') ? 'text-lg font-semibold text-[#232323]' : ''}
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
          rows={14}
          className="rounded-md border border-[#7A1E3A]/20 px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#7A1E3A]"
          placeholder="Write rich content with headings, bold text, lists, and paragraphs."
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
    <section className="rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onNew}
          className="rounded-md border border-[#7A1E3A]/20 bg-white px-3 py-2 text-sm font-semibold text-[#7A1E3A]"
        >
          New
        </button>
      </div>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => onSelect(item)}
            className={`rounded-md border p-3 text-left text-sm ${
              selectedId === item._id
                ? 'border-[#7A1E3A] bg-white'
                : 'border-[#7A1E3A]/10 bg-white/70 hover:bg-white'
            }`}
          >
            <span className="block font-semibold">{labelFor(item)}</span>
            <span className="mt-1 block text-xs text-[#5E6470]">{metaFor(item)}</span>
          </button>
        ))}
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-[#7A1E3A]/20 bg-white p-4 text-sm text-[#5E6470]">
            Nothing has been created yet.
          </p>
        ) : null}
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#7A1E3A]/10 p-4">
      <label className="inline-flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={published}
          onChange={(event) => onPublishedChange(event.target.checked)}
        />
        {publishLabel}
      </label>
      <div className="flex flex-wrap gap-2">
        {preview ? (
          <Link
            href={preview}
            target="_blank"
            className="rounded-md border border-[#7A1E3A]/20 px-4 py-2 text-sm font-semibold text-[#7A1E3A]"
          >
            Preview
          </Link>
        ) : null}
        {selectedId ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
          >
            Delete
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#7A1E3A] px-5 py-2 text-sm font-semibold text-white disabled:bg-neutral-400"
        >
          {pending ? 'Saving...' : submitLabel}
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
    <label className="grid gap-2 text-sm font-semibold text-[#232323]">
      {label}
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-sm font-normal outline-none focus:border-[#7A1E3A]"
      />
    </label>
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
    <label className="grid gap-2 text-sm font-semibold text-[#232323]">
      {label}
      <textarea
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        className="rounded-md border border-[#7A1E3A]/20 px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#7A1E3A]"
      />
      {help ? <span className="text-xs font-normal text-[#5E6470]">{help}</span> : null}
    </label>
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

interface ContentManagerProps extends ManagerProps<CmsContent> {
  collectionLabel: string;
  emptyEditor: typeof emptyContent;
  listPath: string;
  schema: typeof cmsContentInputSchema | typeof cmsSuccessStoryInputSchema;
  showCoupleName?: boolean;
  title: string;
}

const toolbarButtonClass =
  'rounded-md border border-[#7A1E3A]/20 px-3 py-1 text-xs font-semibold text-[#7A1E3A] hover:bg-[#FFF8F1]';

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
  options.setMessage(result.ok ? 'Page saved.' : result.message);
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
  options.setMessage(result.ok ? `${options.collectionLabel} saved.` : result.message);
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
  options.setMessage(result.ok ? 'Testimonial saved.' : result.message);
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
  options.setMessage(result.ok ? 'Banner saved.' : result.message);
  if (result.ok) await options.reload();
}

async function deleteItem(
  path: string,
  selectedId: string | null,
  label: string,
  request: ReturnType<typeof useMemberRequest>,
  reload: () => Promise<void>,
  setMessage: (message: string) => void,
  setPending: (pending: boolean) => void,
) {
  if (!selectedId || !window.confirm(`Delete this ${label.toLowerCase()}?`)) return;
  setPending(true);
  const result = await request(`${path}/${selectedId}`, { method: 'DELETE' });
  setPending(false);
  setMessage(result.ok ? `${label} deleted.` : result.message);
  if (result.ok) await reload();
}

function lines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}
