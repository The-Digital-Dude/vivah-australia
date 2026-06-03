'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { io, type Socket } from 'socket.io-client';
import { FileText, ImageIcon, Loader2, Paperclip, Send, Trash2, Upload } from 'lucide-react';
import {
  messageAttachmentSignUploadSchema,
  messageCreateSchema,
} from '@vivah/shared';
import { useAuth } from '@/app/auth-context';
import {
  useMemberRequest,
  validationMessage,
} from '@/lib/member-api';
import ProfileActions from '../profile-actions';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface Conversation {
  id: string;
  otherProfile?: {
    id: string;
    firstName?: string;
    age?: number;
    city?: string;
    occupation?: string;
  };
  lastMessageAt?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body?: string;
  attachments: Array<{
    attachmentType?: string;
    assetUrl?: string;
    fileName?: string;
    mimeType?: string;
  }>;
  readBy: string[];
  createdAt: string;
}

interface SignedAttachmentUploadResponse {
  attachment: {
    id: string;
    fileName?: string;
    mimeType?: string;
    attachmentType?: string;
  };
  upload: {
    provider: 'cloudinary' | 'mock';
    url: string;
    fields: Record<string, string>;
  };
}

interface PendingAttachment {
  id: string;
  fileName: string;
  attachmentType: 'IMAGE' | 'DOCUMENT';
  mimeType: string;
}

export default function MessagesClient() {
  const { token } = useAuth();
  const memberRequest = useMemberRequest();
  const socketRef = useRef<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const selectedProfileId = selected?.otherProfile?.id;

  async function loadConversations() {
    const result = await memberRequest('/api/me/conversations');
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    const items = (result.data as { conversations?: Conversation[] }).conversations ?? [];
    setConversations(items);
    setSelected((current) => current ?? items[0] ?? null);
  }

  async function loadMessages(conversationId: string) {
    const result = await memberRequest(`/api/me/conversations/${conversationId}/messages`);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessages((result.data as { messages?: Message[] }).messages ?? []);
    await memberRequest(`/api/me/conversations/${conversationId}/read`, { method: 'POST' });
  }

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!selected) {
      return;
    }
    void loadMessages(selected.id);
  }, [selected?.id]);

  useEffect(() => {
    if (!token || !selected) {
      return;
    }

    const socket = io(apiBaseUrl, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.emit('conversation:join', { conversationId: selected.id });
    socket.on('message:new', (incoming: Message) => {
      if (incoming.conversationId === selected.id) {
        setMessages((current) =>
          current.some((item) => item.id === incoming.id) ? current : [...current, incoming],
        );
      }
    });
    socket.on('typing', (event: { conversationId: string; typing: boolean }) => {
      if (event.conversationId === selected.id) {
        setTyping(event.typing ? 'Typing...' : null);
      }
    });
    socket.on('message:read', () => {
      void loadMessages(selected.id);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selected?.id, token]);

  const activeTitle = useMemo(() => {
    if (!selected?.otherProfile) {
      return 'Select a conversation';
    }
    return `${selected.otherProfile.firstName ?? 'Vivah member'}, ${
      selected.otherProfile.age ?? 'age hidden'
    }`;
  }, [selected]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      body: typeof form.get('body') === 'string' ? String(form.get('body')).trim() || undefined : undefined,
      attachments: pendingAttachments.map((attachment) => ({ attachmentId: attachment.id })),
    };
    const parsed = messageCreateSchema.safeParse(payload);

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }

    const result = await memberRequest(`/api/me/conversations/${selected.id}/messages`, {
      method: 'POST',
      body: parsed.data,
    });
    setMessage(result.message);
    if (result.ok) {
      event.currentTarget.reset();
      setPendingAttachments([]);
      await loadMessages(selected.id);
      socketRef.current?.emit('message:read', { conversationId: selected.id });
    }
  }

  async function uploadAttachment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const file = form.get('attachmentFile');

    if (!(file instanceof File)) {
      setMessage('Choose a file to attach.');
      return;
    }

    const attachmentType =
      file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';
    const parsed = messageAttachmentSignUploadSchema.safeParse({
      attachmentType,
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    });

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }

    setUploadingAttachment(true);
    setMessage(null);

    const signed = await memberRequest('/api/me/message-attachments/sign-upload', {
      method: 'POST',
      body: parsed.data,
    });

    if (!signed.ok) {
      setMessage(signed.message);
      setUploadingAttachment(false);
      return;
    }

    const signedBody = signed.data as SignedAttachmentUploadResponse;
    let assetUrl = `http://localhost:4000/api/mock-storage/${signedBody.upload.fields.public_id}`;
    let storageKey = signedBody.upload.fields.public_id;

    if (signedBody.upload.provider === 'cloudinary') {
      const cloudinaryForm = new FormData();
      Object.entries(signedBody.upload.fields).forEach(([key, value]) => {
        cloudinaryForm.append(key, value);
      });
      cloudinaryForm.append('file', file);
      const uploadResponse = await fetch(signedBody.upload.url, {
        method: 'POST',
        body: cloudinaryForm,
      });
      const uploadJson = (await uploadResponse.json()) as {
        secure_url?: string;
        public_id?: string;
        message?: string;
      };

      if (!uploadResponse.ok || !uploadJson.secure_url) {
        setMessage(uploadJson.message ?? 'Attachment upload failed.');
        setUploadingAttachment(false);
        return;
      }

      assetUrl = uploadJson.secure_url;
      storageKey = uploadJson.public_id ?? storageKey;
    }

    const completed = await memberRequest('/api/me/message-attachments/complete', {
      method: 'POST',
      body: {
        attachmentId: signedBody.attachment.id,
        assetUrl,
        storageKey,
        bytes: file.size,
      },
    });

    if (!completed.ok) {
      setMessage(completed.message);
      setUploadingAttachment(false);
      return;
    }

    setPendingAttachments((current) => [
      ...current,
      {
        id: signedBody.attachment.id,
        fileName: file.name,
        attachmentType,
        mimeType: file.type,
      },
    ]);
    setMessage('Attachment uploaded securely and ready to send.');
    setUploadingAttachment(false);
    event.currentTarget.reset();
  }

  function removePendingAttachment(id: string) {
    setPendingAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }

  async function deleteConversation() {
    if (!selected) {
      return;
    }
    const result = await memberRequest(`/api/me/conversations/${selected.id}`, {
      method: 'DELETE',
    });
    setMessage(result.message);
    if (result.ok) {
      setSelected(null);
      setMessages([]);
      await loadConversations();
    }
  }

  async function deleteMessage(id: string) {
    const result = await memberRequest(`/api/me/messages/${id}`, { method: 'DELETE' });
    setMessage(result.message);
    if (result.ok && selected) {
      await loadMessages(selected.id);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-[#F0D6DA] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#232323]">Conversations</h2>
        <div className="mt-4 grid gap-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelected(conversation)}
              className={`rounded-md border p-3 text-left ${
                selected?.id === conversation.id
                  ? 'border-[#7A1E3A] bg-[#FFF8F1]'
                  : 'border-[#F0D6DA] bg-white'
              }`}
            >
              <p className="font-semibold text-[#232323]">
                {conversation.otherProfile?.firstName ?? 'Vivah member'}
              </p>
              <p className="text-sm text-[#5E6470]">
                {[conversation.otherProfile?.city, conversation.otherProfile?.occupation]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </button>
          ))}
          {conversations.length === 0 ? (
            <p className="rounded-md border border-dashed border-[#D6A84F] p-4 text-sm text-[#5E6470]">
              Accepted interests will appear here.
            </p>
          ) : null}
        </div>
      </aside>

      <section className="rounded-lg border border-[#F0D6DA] bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0D6DA] p-4">
          <div>
            <h2 className="text-xl font-semibold text-[#232323]">{activeTitle}</h2>
            <p className="text-sm text-[#5E6470]">
              {typing ?? selected?.otherProfile?.city ?? 'Safe chat'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedProfileId ? <ProfileActions profileId={selectedProfileId} compact /> : null}
            {selected ? (
              <button
                type="button"
                onClick={() => void deleteConversation()}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#F0D6DA] px-3 text-xs font-semibold text-[#7A1E3A] hover:bg-[#FFF8F1]"
              >
                <Trash2 className="size-3.5" />
                Delete chat
              </button>
            ) : null}
          </div>
        </header>

        <div className="grid max-h-[520px] gap-3 overflow-y-auto p-4">
          {messages.map((item) => (
            <article key={item.id} className="rounded-lg bg-[#FFF8F1] p-3">
              {item.body ? <p className="text-sm leading-6 text-[#232323]">{item.body}</p> : null}
              {item.attachments.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.attachments.map((attachment, index) => (
                    <a
                      key={`${item.id}-${index}`}
                      href={attachment.assetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#F0D6DA] bg-white px-3 py-2 text-xs font-semibold text-[#7A1E3A]"
                    >
                      {attachment.attachmentType === 'DOCUMENT' ? (
                        <FileText className="size-3.5" />
                      ) : (
                        <ImageIcon className="size-3.5" />
                      )}
                      {attachment.fileName ?? 'Attachment'}
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[#5E6470]">
                <span>{new Date(item.createdAt).toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => void deleteMessage(item.id)}
                  className="font-semibold"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
          {selected && messages.length === 0 ? (
            <p className="rounded-md border border-dashed border-[#D6A84F] p-5 text-center text-sm text-[#5E6470]">
              Start the conversation after your interest has been accepted.
            </p>
          ) : null}
        </div>

        {selected ? (
          <div className="grid gap-3 border-t border-[#F0D6DA] p-4">
            <form className="grid gap-3" onSubmit={(event) => void sendMessage(event)}>
            <textarea
              name="body"
              rows={3}
              onFocus={() =>
                socketRef.current?.emit('typing', { conversationId: selected.id, typing: true })
              }
              onBlur={() =>
                socketRef.current?.emit('typing', { conversationId: selected.id, typing: false })
              }
              placeholder="Write a respectful message"
              className="rounded-md border border-[#E8D5D8] px-3 py-2 outline-none focus:border-[#7A1E3A] focus:ring-2 focus:ring-[#FDECEF]"
            />
            {pendingAttachments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pendingAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="inline-flex items-center gap-2 rounded-md border border-[#F0D6DA] bg-[#FFF8F1] px-3 py-2 text-xs font-semibold text-[#7A1E3A]"
                  >
                    {attachment.attachmentType === 'DOCUMENT' ? (
                      <FileText className="size-3.5" />
                    ) : (
                      <ImageIcon className="size-3.5" />
                    )}
                    {attachment.fileName}
                    <button type="button" onClick={() => removePendingAttachment(attachment.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <button className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-[#7A1E3A] px-5 text-sm font-semibold text-white">
              <Send className="size-4" />
              Send message
            </button>
            </form>
            <form
              className="grid gap-3 rounded-md border border-[#F0D6DA] bg-[#FFF8F1] p-3"
              onSubmit={(event) => void uploadAttachment(event)}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-[#7A1E3A]">
                <Paperclip className="size-4" />
                Secure attachment upload
              </div>
              <input
                name="attachmentFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="block w-full text-sm text-[#232323]"
              />
              <button
                type="submit"
                disabled={uploadingAttachment}
                className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-[#F0D6DA] bg-white px-4 text-sm font-semibold text-[#7A1E3A] disabled:opacity-60"
              >
                {uploadingAttachment ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {uploadingAttachment ? 'Uploading...' : 'Upload attachment'}
              </button>
            </form>
          </div>
        ) : null}

        {message ? (
          <p className="border-t border-[#F0D6DA] p-3 text-sm text-[#7A1E3A]">{message}</p>
        ) : null}
      </section>
    </div>
  );
}
