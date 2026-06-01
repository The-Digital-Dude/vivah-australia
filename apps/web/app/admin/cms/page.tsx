'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { cmsPageInputSchema } from '@vivah/shared';
import AdminShell from '../admin-shell';
import { formString, optionalString, useMemberRequest, validationMessage } from '@/lib/member-api';

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

const emptyEditor = {
  slug: '',
  title: '',
  body: '',
  seoTitle: '',
  seoDescription: '',
  published: false,
};

export default function AdminCmsPage() {
  const memberRequest = useMemberRequest();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState(emptyEditor);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  const selectedPage = useMemo(
    () => pages.find((page) => page._id === selectedId) ?? null,
    [pages, selectedId],
  );

  async function loadPages() {
    const result = await memberRequest('/api/admin/cms/pages');
    if (result.ok) {
      const nextPages = (result.data as { pages?: CmsPage[] }).pages ?? [];
      setPages(nextPages);
      if (!selectedId && nextPages[0]) {
        selectPage(nextPages[0]);
      }
      return;
    }
    setMessage(result.message);
  }

  function selectPage(page: CmsPage) {
    setSelectedId(page._id);
    setEditor({
      slug: page.slug,
      title: page.title,
      body: page.body,
      seoTitle: page.seoTitle ?? '',
      seoDescription: page.seoDescription ?? '',
      published: page.published,
    });
    setMessage('');
  }

  function resetEditor() {
    setSelectedId(null);
    setEditor(emptyEditor);
    setMessage('');
  }

  async function savePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');

    const form = new FormData(event.currentTarget);
    const payload = {
      slug: formString(form.get('slug')),
      title: formString(form.get('title')),
      body: formString(form.get('body')),
      seoTitle: optionalString(form.get('seoTitle')),
      seoDescription: optionalString(form.get('seoDescription')),
      published: form.get('published') === 'on',
    };
    const parsed = cmsPageInputSchema.safeParse(payload);

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      setPending(false);
      return;
    }

    const result = await memberRequest(
      selectedId ? `/api/admin/cms/pages/${selectedId}` : '/api/admin/cms/pages',
      {
        method: selectedId ? 'PATCH' : 'POST',
        body: parsed.data,
      },
    );

    setPending(false);
    setMessage(result.ok ? (selectedId ? 'Page updated.' : 'Page created.') : result.message);

    if (result.ok) {
      await loadPages();
      const saved = (result.data as { page?: CmsPage }).page;
      if (saved?._id) {
        selectPage(saved);
      }
    }
  }

  async function deletePage() {
    if (!selectedId || !window.confirm('Delete this CMS page?')) return;
    setPending(true);
    const result = await memberRequest(`/api/admin/cms/pages/${selectedId}`, { method: 'DELETE' });
    setPending(false);
    setMessage(result.ok ? 'Page deleted.' : result.message);
    if (result.ok) {
      resetEditor();
      await loadPages();
    }
  }

  useEffect(() => {
    void loadPages();
  }, []);

  return (
    <AdminShell
      title="CMS pages"
      subtitle="Create, edit, publish, preview, and remove static website content without deployment."
    >
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <section className="rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Pages</h2>
            <button
              type="button"
              onClick={resetEditor}
              className="rounded-md border border-[#7A1E3A]/20 bg-white px-3 py-2 text-sm font-semibold text-[#7A1E3A]"
            >
              New page
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {pages.map((page) => (
              <button
                key={page._id}
                type="button"
                onClick={() => selectPage(page)}
                className={`rounded-md border p-3 text-left text-sm ${
                  selectedId === page._id
                    ? 'border-[#7A1E3A] bg-white'
                    : 'border-[#7A1E3A]/10 bg-white/70 hover:bg-white'
                }`}
              >
                <span className="block font-semibold">{page.title}</span>
                <span className="mt-1 block text-xs text-[#5E6470]">
                  /pages/{page.slug} · {page.published ? 'Published' : 'Draft'}
                </span>
              </button>
            ))}
            {pages.length === 0 ? (
              <p className="rounded-md border border-dashed border-[#7A1E3A]/20 bg-white p-4 text-sm text-[#5E6470]">
                No CMS pages yet.
              </p>
            ) : null}
          </div>
        </section>

        <form onSubmit={(event) => void savePage(event)} className="grid gap-4">
          {message ? (
            <p className="rounded-md border border-[#7A1E3A]/20 bg-[#FFF8F1] p-3 text-sm font-semibold text-[#7A1E3A]">
              {message}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Slug"
              name="slug"
              value={editor.slug}
              onChange={(value) => setEditor((current) => ({ ...current, slug: value }))}
              placeholder="privacy-policy"
            />
            <Field
              label="Title"
              name="title"
              value={editor.title}
              onChange={(value) => setEditor((current) => ({ ...current, title: value }))}
              placeholder="Privacy Policy"
            />
          </div>

          <label className="grid gap-2 text-sm font-semibold text-[#232323]">
            Body
            <textarea
              name="body"
              value={editor.body}
              onChange={(event) =>
                setEditor((current) => ({ ...current, body: event.target.value }))
              }
              rows={14}
              className="rounded-md border border-[#7A1E3A]/20 px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#7A1E3A]"
              placeholder="Write the page content here."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="SEO title"
              name="seoTitle"
              value={editor.seoTitle}
              onChange={(value) => setEditor((current) => ({ ...current, seoTitle: value }))}
              placeholder="Vivah Australia Privacy Policy"
            />
            <Field
              label="SEO description"
              name="seoDescription"
              value={editor.seoDescription}
              onChange={(value) => setEditor((current) => ({ ...current, seoDescription: value }))}
              placeholder="How Vivah Australia protects member privacy."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#7A1E3A]/10 p-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input
                name="published"
                type="checkbox"
                checked={editor.published}
                onChange={(event) =>
                  setEditor((current) => ({ ...current, published: event.target.checked }))
                }
              />
              Published
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedPage?.published ? (
                <Link
                  href={`/pages/${selectedPage.slug}`}
                  target="_blank"
                  className="rounded-md border border-[#7A1E3A]/20 px-4 py-2 text-sm font-semibold text-[#7A1E3A]"
                >
                  Preview
                </Link>
              ) : null}
              {selectedId ? (
                <button
                  type="button"
                  onClick={() => void deletePage()}
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
                {pending ? 'Saving...' : selectedId ? 'Save changes' : 'Create page'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminShell>
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
  name: string;
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
