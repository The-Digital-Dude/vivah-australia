'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { cmsBlogInputSchema } from '@vivah/shared';
import AdminShell from '../admin-shell';
import BlogRichTextEditor from './blog-rich-text-editor';
import { formString, useMemberRequest, validationMessage } from '@/lib/member-api';
import {
  AlertCircle,
  FileEdit,
  Trash2,
  ShieldAlert,
  ImagePlus,
  Loader2,
  X,
  Search,
} from 'lucide-react';

interface Blog {
  _id: string;
  slug: string;
  title: string;
  body: string;
  published: boolean;
  updatedAt?: string;
  coverImage?: string;
  tags?: string[];
  readTimeMinutes?: number;
  author?: string;
  seoTitle?: string;
  seoDescription?: string;
}

const emptyBlog = {
  slug: '',
  title: '',
  body: '',
  published: false,
  coverImage: '',
  tags: [] as string[],
  readTimeMinutes: 3,
  author: '',
  seoTitle: '',
  seoDescription: '',
};

export default function AdminCmsPage() {
  const memberRequest = useMemberRequest();
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  // Custom confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  async function loadAll() {
    const result = await memberRequest('/api/admin/cms/blogs');
    if (result.ok) {
      setBlogs((result.data as { blogs?: Blog[] }).blogs ?? []);
    } else {
      setMessage(result.message);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function executeDelete() {
    if (!deleteTarget) return;
    const { id, label } = deleteTarget;
    setPending(true);
    const result = await memberRequest(`/api/admin/cms/blogs/${id}`, { method: 'DELETE' });
    setPending(false);
    setDeleteTarget(null);
    setMessage(result.ok ? `${label} was deleted.` : result.message);
    if (result.ok) await loadAll();
  }

  return (
    <AdminShell
      title="Blog Management"
      subtitle="Write, publish, and manage blog posts — including cover images, authors, tags, and SEO metadata."
    >
      <div className="space-y-6">
        {message && (
          <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-[#A10E4D]" />
            <span>{message}</span>
          </div>
        )}

        <BlogManager
          items={blogs}
          pending={pending}
          setPending={setPending}
          setMessage={setMessage}
          reload={loadAll}
          request={memberRequest}
          onDeleteTrigger={(id, label) => setDeleteTarget({ id, label })}
        />
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
            <h3 className="text-lg font-bold text-neutral-900">Confirm Resource Deletion</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Are you sure you want to permanently delete this {deleteTarget.label.toLowerCase()}?
            </p>

            <div className="mt-4 flex gap-2.5 items-start bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-800 leading-relaxed">
                <strong>Warning:</strong> Deleting a published blog instantly removes it from the
                public site and invalidates static caching indexes.
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

interface BlogManagerProps {
  items: Blog[];
  pending: boolean;
  reload: () => Promise<void>;
  request: ReturnType<typeof useMemberRequest>;
  setMessage: (message: string) => void;
  setPending: (pending: boolean) => void;
  onDeleteTrigger: (id: string, label: string) => void;
}

function BlogManager({
  items,
  pending,
  reload,
  request,
  setMessage,
  setPending,
  onDeleteTrigger,
}: Readonly<BlogManagerProps>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState(emptyBlog);
  // Tracks whether the slug was manually edited, so auto-population from the
  // title only happens until the admin takes over the slug field.
  const [slugEdited, setSlugEdited] = useState(false);

  const uploadImage = useMemo(() => (file: File) => uploadCmsImage(file, request), [request]);

  function selectItem(item: Blog) {
    setSelectedId(item._id);
    setSlugEdited(true);
    setEditor({
      slug: item.slug,
      title: item.title,
      body: item.body,
      published: item.published,
      coverImage: item.coverImage ?? '',
      tags: item.tags ?? [],
      readTimeMinutes: item.readTimeMinutes ?? 3,
      author: item.author ?? '',
      seoTitle: item.seoTitle ?? '',
      seoDescription: item.seoDescription ?? '',
    });
    setMessage('');
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr] xl:items-start">
      <ContentList
        items={items}
        selectedId={selectedId}
        title="Blogs"
        className="xl:sticky xl:top-6"
        onNew={() => {
          setSelectedId(null);
          setSlugEdited(false);
          setEditor(emptyBlog);
        }}
        onSelect={selectItem}
        labelFor={(item) => item.title}
        metaFor={(item) => `${item.slug} · ${item.published ? 'Published' : 'Draft'}`}
      />
      <form
        onSubmit={(event) =>
          void saveBlog(event, {
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
        {/* SEO METADATA — kept at the top, visually separated from the rest */}
        <div className="grid gap-3 rounded-2xl border border-[#A10E4D]/20 bg-[#FFF0F3]/40 p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#A10E4D]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#A10E4D]">
              SEO Metadata
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="SEO Meta Title"
              name="seoTitle"
              placeholder="Defaults to the blog title"
              value={editor.seoTitle || ''}
              onChange={(seoTitle) => setEditor((current) => ({ ...current, seoTitle }))}
            />
            <Field
              label="SEO Meta Description"
              name="seoDescription"
              placeholder="Shown in search results (150–160 characters)"
              value={editor.seoDescription || ''}
              onChange={(seoDescription) => setEditor((current) => ({ ...current, seoDescription }))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Blog Title"
            name="title"
            value={editor.title}
            onChange={(nextTitle) =>
              setEditor((current) => ({
                ...current,
                title: nextTitle,
                // Auto-derive the slug from the title until the admin edits it.
                slug: slugEdited ? current.slug : slugify(nextTitle),
              }))
            }
          />
          <Field
            label="URL Slug"
            name="slug"
            value={editor.slug}
            onChange={(slug) => {
              setSlugEdited(true);
              setEditor((current) => ({ ...current, slug: slugify(slug) }));
            }}
          />
          <Field
            label="Author"
            name="author"
            placeholder="e.g. Priya Sharma"
            value={editor.author || ''}
            onChange={(author) => setEditor((current) => ({ ...current, author }))}
          />
          <Field
            label="Tags (comma separated)"
            name="tags"
            value={(editor.tags || []).join(', ')}
            onChange={(tagsStr) =>
              setEditor((current) => ({
                ...current,
                tags: tagsStr
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              }))
            }
          />
          <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
            <span className="uppercase tracking-wider text-neutral-400">Read Time (Minutes)</span>
            <input
              type="number"
              name="readTimeMinutes"
              value={editor.readTimeMinutes || 3}
              onChange={(e) =>
                setEditor((current) => ({
                  ...current,
                  readTimeMinutes: parseInt(e.target.value) || 3,
                }))
              }
              className="h-9 w-full rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] transition"
            />
          </div>
        </div>
        <CoverImageUploader
          value={editor.coverImage || ''}
          uploadImage={uploadImage}
          onChange={(coverImage) => setEditor((current) => ({ ...current, coverImage }))}
          setMessage={setMessage}
        />
        <BlogRichTextEditor
          value={editor.body}
          onChange={(body) => setEditor((current) => ({ ...current, body }))}
          uploadImage={uploadImage}
        />
        <ActionBar
          selectedId={selectedId}
          pending={pending}
          published={editor.published}
          publishLabel="Publish to live catalog"
          onPublishedChange={(published) => setEditor((current) => ({ ...current, published }))}
          onDelete={() => selectedId && onDeleteTrigger(selectedId, 'Blog')}
          submitLabel={selectedId ? 'Save Changes' : 'Create Blog'}
        />
      </form>
    </div>
  );
}

async function saveBlog(
  event: FormEvent<HTMLFormElement>,
  options: {
    editor: typeof emptyBlog;
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
    published: options.editor.published,
    coverImage: options.editor.coverImage || undefined,
    tags: options.editor.tags,
    readTimeMinutes: options.editor.readTimeMinutes,
    author: options.editor.author || undefined,
    seoTitle: options.editor.seoTitle || undefined,
    seoDescription: options.editor.seoDescription || undefined,
  };
  const parsed = cmsBlogInputSchema.safeParse(payload);
  if (!parsed.success) {
    options.setMessage(validationMessage(parsed.error.issues));
    options.setPending(false);
    return;
  }
  const result = await options.request(
    options.selectedId ? `/api/admin/cms/blogs/${options.selectedId}` : '/api/admin/cms/blogs',
    { method: options.selectedId ? 'PATCH' : 'POST', body: parsed.data },
  );
  options.setPending(false);
  options.setMessage(result.ok ? 'Blog changes saved.' : result.message);
  if (result.ok) await options.reload();
}

const LIST_PAGE_SIZE = 5;

function ContentList<T extends { _id: string }>({
  className,
  items,
  labelFor,
  metaFor,
  onNew,
  onSelect,
  selectedId,
  title,
}: Readonly<{
  className?: string;
  items: T[];
  labelFor: (item: T) => string;
  metaFor: (item: T) => string;
  onNew: () => void;
  onSelect: (item: T) => void;
  selectedId: string | null;
  title: string;
}>) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / LIST_PAGE_SIZE));

  // Keep the current page in range when the list shrinks (e.g. after a delete).
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const start = page * LIST_PAGE_SIZE;
  const visibleItems = items.slice(start, start + LIST_PAGE_SIZE);

  return (
    <section
      className={`rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-4 ${className ?? ''}`}
    >
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
      <div className="space-y-2">
        {visibleItems.map((item) => (
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
            <span className="text-xs font-bold text-neutral-800 truncate w-full">
              {labelFor(item)}
            </span>
            <span className="mt-1 text-[10px] font-semibold text-neutral-450">{metaFor(item)}</span>
          </button>
        ))}
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-white/80 p-5 text-center text-xs text-neutral-400 italic">
            No blog posts yet.
          </p>
        )}
      </div>
      {items.length > LIST_PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0}
            className="rounded-lg border border-neutral-250 px-2.5 py-1.5 text-[11px] font-bold text-neutral-600 hover:bg-white disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-[11px] font-semibold text-neutral-500">
            Page {page + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
            disabled={page >= pageCount - 1}
            className="rounded-lg border border-neutral-250 px-2.5 py-1.5 text-[11px] font-bold text-neutral-600 hover:bg-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}

function ActionBar({
  onDelete,
  onPublishedChange,
  pending,
  publishLabel,
  published,
  selectedId,
  submitLabel,
}: Readonly<{
  onDelete: () => void;
  onPublishedChange: (published: boolean) => void;
  pending: boolean;
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
        className="h-9 w-full rounded-xl border border-neutral-250 bg-white px-3.5 text-xs font-semibold text-neutral-700 placeholder-neutral-400 outline-none focus:border-[#A10E4D] transition"
      />
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CmsUploadResponse {
  upload: {
    provider: 'gcs' | 'mock';
    method: 'POST' | 'PUT';
    url: string;
    fields: Record<string, string>;
  };
}

// Signs an upload with the API, pushes the file to the storage provider
// (Google Cloud Storage in production, local mock storage in dev) and returns the URL.
async function uploadCmsImage(file: File, request: ReturnType<typeof useMemberRequest>) {
  const signed = await request('/api/admin/cms/cover-image/sign', {
    method: 'POST',
    body: { fileName: file.name, mimeType: file.type, fileSizeBytes: file.size },
  });
  if (!signed.ok) {
    throw new Error(signed.message);
  }

  const { upload } = signed.data as CmsUploadResponse;

  // Blog covers are public: the GCS signed URL is signed with a public-read ACL
  // header, which the client must echo. Harmless for local mock storage.
  const response = await fetch(upload.url, {
    method: 'PUT',
    body: file,
    headers:
      upload.provider === 'gcs'
        ? { 'Content-Type': file.type, 'x-goog-acl': 'public-read' }
        : { 'Content-Type': file.type },
  });
  if (!response.ok) {
    throw new Error('Image upload failed.');
  }
  return upload.url.split('?')[0] ?? upload.url;
}

function CoverImageUploader({
  onChange,
  setMessage,
  uploadImage,
  value,
}: Readonly<{
  onChange: (url: string) => void;
  setMessage: (message: string) => void;
  uploadImage: (file: File) => Promise<string>;
  value: string;
}>) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    setMessage('');
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cover image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-1.5 text-xs font-bold text-neutral-800">
      <span className="uppercase tracking-wider text-neutral-400">Cover Image</span>
      {value ? (
        <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Cover preview" className="aspect-[16/9] w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-950/60 text-white hover:bg-neutral-950/80"
            aria-label="Remove cover image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex w-full max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-neutral-500 transition hover:border-[#A10E4D] hover:bg-[#FFF0F3]/40">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#A10E4D]" />
          ) : (
            <ImagePlus className="h-5 w-5 text-[#A10E4D]" />
          )}
          <span className="text-xs font-semibold">
            {uploading ? 'Uploading…' : 'Click to upload a cover image'}
          </span>
          <span className="text-[10px] font-medium text-neutral-400">
            JPG, PNG, WEBP or GIF · up to 10MB
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}
