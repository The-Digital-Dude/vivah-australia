'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import {
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  SquareCode,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Underline,
  Link2,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  ImagePlus,
  Loader2,
} from 'lucide-react';

interface BlogRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  uploadImage: (file: File) => Promise<string>;
}

export default function BlogRichTextEditor({
  value,
  onChange,
  uploadImage,
}: Readonly<BlogRichTextEditorProps>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } },
      }),
      Image.configure({ HTMLAttributes: { class: 'rounded-xl' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'tiptap-prose min-h-[260px] w-full px-4 py-3 text-sm font-medium leading-relaxed text-neutral-700 outline-none',
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  // Sync external value changes (e.g. selecting a different post / "New").
  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="grid gap-2 text-xs font-bold text-neutral-800">
        <span className="uppercase tracking-wider text-neutral-400">Page Content Block</span>
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-neutral-250 bg-neutral-50 text-neutral-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
    );
  }

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', previous ?? 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  async function handleImageFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      editor?.chain().focus().setImage({ src: url }).run();
    } catch {
      // Surface nothing here; the page-level uploader reports failures.
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="grid gap-2 text-xs font-bold text-neutral-800">
      <span className="uppercase tracking-wider text-neutral-400">Page Content Block</span>
      <div className="overflow-hidden rounded-xl border border-neutral-250 bg-white focus-within:border-[#A10E4D]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-neutral-100 bg-neutral-50/70 px-2 py-1.5">
          <ToolGroup>
            <ToolButton
              label="Undo"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo2 className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Redo"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo2 className="h-3.5 w-3.5" />
            </ToolButton>
          </ToolGroup>

          <Divider />

          <ToolGroup>
            <ToolButton
              label="Heading 1"
              active={editor.isActive('heading', { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Heading 2"
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Heading 3"
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Bullet list"
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Ordered list"
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Task list"
              active={editor.isActive('taskList')}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
            >
              <ListChecks className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Blockquote"
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Code block"
              active={editor.isActive('codeBlock')}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              <SquareCode className="h-3.5 w-3.5" />
            </ToolButton>
          </ToolGroup>

          <Divider />

          <ToolGroup>
            <ToolButton
              label="Bold"
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Italic"
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Strikethrough"
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Inline code"
              active={editor.isActive('code')}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Underline"
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <Underline className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton label="Link" active={editor.isActive('link')} onClick={setLink}>
              <Link2 className="h-3.5 w-3.5" />
            </ToolButton>
          </ToolGroup>

          <Divider />

          <ToolGroup>
            <ToolButton
              label="Superscript"
              active={editor.isActive('superscript')}
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
            >
              <SuperscriptIcon className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Subscript"
              active={editor.isActive('subscript')}
              onClick={() => editor.chain().focus().toggleSubscript().run()}
            >
              <SubscriptIcon className="h-3.5 w-3.5" />
            </ToolButton>
          </ToolGroup>

          <Divider />

          <ToolGroup>
            <ToolButton
              label="Align left"
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Align center"
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Align right"
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Justify"
              active={editor.isActive({ textAlign: 'justify' })}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            >
              <AlignJustify className="h-3.5 w-3.5" />
            </ToolButton>
          </ToolGroup>

          <Divider />

          <ToolGroup>
            <ToolButton
              label="Highlight"
              active={editor.isActive('highlight')}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
            >
              <Highlighter className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              label="Insert image"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
            </ToolButton>
          </ToolGroup>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImageFile(file);
        }}
      />
    </div>
  );
}

function ToolGroup({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-neutral-200" />;
}

function ToolButton({
  active,
  children,
  disabled,
  label,
  onClick,
}: Readonly<{
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition disabled:opacity-30 ${
        active
          ? 'border-[#A10E4D]/30 bg-[#FFF0F3] text-[#A10E4D]'
          : 'border-transparent text-neutral-600 hover:bg-neutral-100'
      }`}
    >
      {children}
    </button>
  );
}
