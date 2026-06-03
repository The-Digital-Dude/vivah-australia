'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  BellOff,
  Briefcase,
  Circle,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  MessageCircleHeart,
  MoreHorizontal,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { messageAttachmentSignUploadSchema, messageCreateSchema } from '@vivah/shared';
import { useAuth } from '@/app/auth-context';
import { PremiumButton, PremiumCard } from '@/app/components';
import { useMemberRequest, validationMessage } from '@/lib/member-api';
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatRelativeTime(value?: string) {
  if (!value) {
    return 'Recently active';
  }

  const date = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor((Date.now() - date) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMessageDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MessagesClient() {
  const { token } = useAuth();
  const memberRequest = useMemberRequest();
  const socketRef = useRef<Socket | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, typing]);

  const activeTitle = useMemo(() => {
    if (!selected?.otherProfile) {
      return 'Select a conversation';
    }
    return `${selected.otherProfile.firstName ?? 'Vivah member'}, ${
      selected.otherProfile.age ?? 'age hidden'
    }`;
  }, [selected]);

  const activeSubtitle = useMemo(() => {
    if (typing) {
      return typing;
    }

    if (!selected?.otherProfile) {
      return 'Safe chat';
    }

    const details = [selected.otherProfile.city, selected.otherProfile.occupation]
      .filter(Boolean)
      .join(' • ');

    return details ? `Based in ${details}` : 'Safe chat';
  }, [selected, typing]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      body:
        typeof form.get('body') === 'string' ? String(form.get('body')).trim() || undefined : undefined,
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

    const attachmentType = file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';
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
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <PremiumCard className="rounded-[30px] p-5 shadow-[0_20px_45px_rgba(122,31,43,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
                Conversations
              </p>
              <h2 className="mt-2 font-playfair text-3xl font-semibold text-[#2F2F2F]">
                Messages
              </h2>
            </div>
            <div className="rounded-full bg-[#FFF0F3] px-3 py-1 text-xs font-semibold text-[#A10E4D]">
              {conversations.length} active
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3">
            <p className="text-sm font-semibold text-[#2F2F2F]">Search conversations</p>
            <p className="mt-1 text-xs leading-5 text-[#6B7280]">
              Accepted interests and active chats stay grouped here so you can keep serious
              conversations moving.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#FFF0F3] px-3 py-1 text-xs font-semibold text-[#A10E4D]">
              All
            </span>
            <span className="rounded-full bg-[#FFF9F5] px-3 py-1 text-xs font-semibold text-[#6B7280]">
              Safe chat
            </span>
            <span className="rounded-full bg-[#FFF9F5] px-3 py-1 text-xs font-semibold text-[#6B7280]">
              New replies
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {conversations.map((conversation) => {
              const active = selected?.id === conversation.id;
              const name = conversation.otherProfile?.firstName ?? 'Vivah member';
              const meta = [conversation.otherProfile?.city, conversation.otherProfile?.occupation]
                .filter(Boolean)
                .join(' • ');

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelected(conversation)}
                  className={cx(
                    'rounded-[24px] border p-4 text-left transition',
                    active
                      ? 'border-[#A10E4D]/16 bg-[linear-gradient(135deg,#FFF0F3_0%,#FFF9F5_100%)] shadow-[0_18px_38px_rgba(161,14,77,0.08)]'
                      : 'border-[#F0D6DA] bg-white hover:border-[#A10E4D]/12 hover:bg-[#FFF9F5]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#232323]">{name}</p>
                      <p className="mt-1 text-sm text-[#5E6470]">{meta}</p>
                    </div>
                    <span className="text-xs font-medium text-[#8B8B8B]">
                      {formatRelativeTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#6B7280]">
                    <Circle className="size-2.5 fill-[#1F6F4A] text-[#1F6F4A]" />
                    Available for respectful conversation
                  </div>
                </button>
              );
            })}
            {conversations.length === 0 ? (
              <p className="rounded-[24px] border border-dashed border-[#D6A84F] p-5 text-sm leading-6 text-[#5E6470]">
                Accepted interests will appear here.
              </p>
            ) : null}
          </div>
        </PremiumCard>
      </motion.aside>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
      >
        <PremiumCard className="overflow-hidden rounded-[30px] border border-[#F0D6DA] p-0 shadow-[0_20px_50px_rgba(122,31,43,0.08)]">
          <header className="border-b border-[#F0D6DA] bg-[linear-gradient(180deg,#FFFDFB_0%,#FFF8F1_100%)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F3] text-lg font-semibold text-[#A10E4D]">
                    {(selected?.otherProfile?.firstName ?? 'V').slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-semibold text-[#232323]">{activeTitle}</h2>
                    <p className="mt-1 text-sm text-[#5E6470]">{activeSubtitle || 'Safe chat'}</p>
                  </div>
                </div>

                {selected?.otherProfile ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0F3] px-3 py-1 text-xs font-semibold text-[#A10E4D]">
                      <MapPin className="size-3.5" />
                      {selected.otherProfile.city ?? 'Location hidden'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8EC] px-3 py-1 text-xs font-semibold text-[#9A6F1E]">
                      <Briefcase className="size-3.5" />
                      {selected.otherProfile.occupation ?? 'Occupation hidden'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FBF6] px-3 py-1 text-xs font-semibold text-[#1F6F4A]">
                      <ShieldCheck className="size-3.5" />
                      Safe, member-only messaging
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedProfileId ? <ProfileActions profileId={selectedProfileId} compact /> : null}
                {selected ? (
                  <button
                    type="button"
                    onClick={() => void deleteConversation()}
                    className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-[#F0D6DA] bg-white px-4 text-xs font-semibold text-[#7A1E3A] transition hover:bg-[#FFF8F1]"
                  >
                    <Trash2 className="size-3.5" />
                    Delete chat
                  </button>
                ) : null}
              </div>
            </div>
          </header>

          <div
            ref={messageListRef}
            className="grid max-h-[620px] gap-4 overflow-y-auto bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF9F5_100%)] px-5 py-5 sm:px-6"
          >
            {messages.map((item) => (
              <div key={item.id} className="flex justify-start">
                <article className="max-w-[85%] rounded-[24px] border border-[#F0D6DA] bg-white px-4 py-3 shadow-sm">
                    {item.body ? (
                      <p className="text-sm leading-7 text-[#232323]">{item.body}</p>
                    ) : null}

                    {item.attachments.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.attachments.map((attachment, index) => (
                          <a
                            key={`${item.id}-${index}`}
                            href={attachment.assetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-[#F0D6DA] bg-[#FFF9F5] px-3 py-2 text-xs font-semibold text-[#7A1E3A]"
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

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#7B7280]">
                      <span>
                        {formatMessageDate(item.createdAt)} · {formatMessageTime(item.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => void deleteMessage(item.id)}
                        className="font-semibold text-[#A10E4D]"
                      >
                        Delete
                      </button>
                    </div>
                </article>
              </div>
            ))}

            {selected && messages.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-[#D6A84F] bg-[#FFF9F5] p-6 text-center">
                <MessageCircleHeart className="mx-auto size-7 text-[#D4A04C]" />
                <p className="mt-3 text-sm font-semibold text-[#2F2F2F]">
                  Start the conversation after your interest has been accepted.
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  Use warm, respectful first messages and let the conversation unfold naturally.
                </p>
              </div>
            ) : null}
          </div>

          {selected ? (
            <div className="grid gap-4 border-t border-[#F0D6DA] bg-white px-5 py-5 sm:px-6">
              <form className="grid gap-3" onSubmit={(event) => void sendMessage(event)}>
                <textarea
                  name="body"
                  rows={4}
                  onFocus={() =>
                    socketRef.current?.emit('typing', { conversationId: selected.id, typing: true })
                  }
                  onBlur={() =>
                    socketRef.current?.emit('typing', { conversationId: selected.id, typing: false })
                  }
                  placeholder="Write a thoughtful, respectful message"
                  className="rounded-[24px] border border-[#E8D5D8] bg-[#FFF9F5] px-4 py-3 outline-none transition focus:border-[#7A1E3A] focus:ring-4 focus:ring-[#FDECEF]"
                />

                {pendingAttachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {pendingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#F0D6DA] bg-[#FFF8F1] px-3 py-2 text-xs font-semibold text-[#7A1E3A]"
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

                <div className="flex flex-wrap items-center gap-3">
                  <PremiumButton type="submit">
                    <Send className="size-4" />
                    Send message
                  </PremiumButton>
                  <span className="text-xs text-[#6B7280]">
                    Your conversations are end-to-end secure inside the Vivah member experience.
                  </span>
                </div>
              </form>

              <form
                className="grid gap-3 rounded-[26px] border border-[#F0D6DA] bg-[linear-gradient(180deg,#FFF8F1_0%,#FFFFFF_100%)] p-4"
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
                  className="inline-flex min-h-11 w-fit items-center gap-2 rounded-2xl border border-[#F0D6DA] bg-white px-4 text-sm font-semibold text-[#7A1E3A] disabled:opacity-60"
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
            <p className="border-t border-[#F0D6DA] bg-[#FFF9F5] px-5 py-3 text-sm text-[#7A1E3A] sm:px-6">
              {message}
            </p>
          ) : null}
        </PremiumCard>
      </motion.section>

      <motion.aside
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
        className="grid gap-4"
      >
        <PremiumCard className="rounded-[30px] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
            About {selected?.otherProfile?.firstName ?? 'member'}
          </p>
          {selected?.otherProfile ? (
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] bg-[#FFF9F5] px-4 py-3">
                <p className="text-sm font-semibold text-[#2F2F2F]">Profile summary</p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {selected.otherProfile.city ?? 'Location hidden'}
                </p>
              </div>
              <div className="rounded-[22px] bg-[#FFF9F5] px-4 py-3 text-sm text-[#2F2F2F]">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-[#A10E4D]" />
                  {selected.otherProfile.city ?? 'Location hidden'}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Briefcase className="size-4 text-[#A10E4D]" />
                  {selected.otherProfile.occupation ?? 'Occupation hidden'}
                </div>
              </div>
              <div className="rounded-[22px] bg-[#FFF9F5] px-4 py-3 text-sm leading-6 text-[#6B7280]">
                This member is part of the accepted-interest messaging flow, so the conversation is
                already permissioned and member-only.
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[#6B7280]">
              Select a conversation to see more context about the member you are chatting with.
            </p>
          )}
        </PremiumCard>

        <PremiumCard className="rounded-[30px] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
            Chat settings
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm text-[#2F2F2F]">
              <span className="flex items-center gap-2">
                <BellOff className="size-4 text-[#A10E4D]" />
                Mute notifications
              </span>
              <span className="text-xs font-semibold text-[#6B7280]">Off</span>
            </div>
            <div className="flex items-center justify-between rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm text-[#2F2F2F]">
              <span className="flex items-center gap-2">
                <MoreHorizontal className="size-4 text-[#A10E4D]" />
                Chat privacy
              </span>
              <span className="text-xs font-semibold text-[#6B7280]">Member-only</span>
            </div>
            <div className="flex items-center justify-between rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm text-[#2F2F2F]">
              <span className="flex items-center gap-2">
                <Star className="size-4 text-[#A10E4D]" />
                Priority safety review
              </span>
              <span className="text-xs font-semibold text-[#6B7280]">Available</span>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="rounded-[30px] border border-[#D4A04C]/18 bg-[linear-gradient(180deg,#FFF8EC_0%,#FFFFFF_100%)] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
            Stay safe
          </p>
          <h3 className="mt-3 font-playfair text-2xl font-semibold text-[#2F2F2F]">
            Respect first, details later
          </h3>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-[#6B7280]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#A10E4D]" />
              Never share financial information or identity documents in chat.
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[#A10E4D]" />
              Use profile actions if something feels unsafe or disrespectful.
            </div>
            <div className="flex items-start gap-2">
              <MessageCircleHeart className="mt-0.5 size-4 shrink-0 text-[#A10E4D]" />
              Warm, thoughtful messages usually create stronger replies than rushed introductions.
            </div>
          </div>
        </PremiumCard>
      </motion.aside>
    </div>
  );
}
