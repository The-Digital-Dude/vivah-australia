'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { io, type Socket } from 'socket.io-client';
import { FileText, ImageIcon, Send, Trash2 } from 'lucide-react';
import { messageCreateSchema } from '@vivah/shared';
import { useAuth } from '@/app/auth-context';
import {
  optionalNumber,
  optionalString,
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

export default function MessagesClient() {
  const { token } = useAuth();
  const memberRequest = useMemberRequest();
  const socketRef = useRef<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [typing, setTyping] = useState<string | null>(null);

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
    const attachmentUrl = optionalString(form.get('attachmentUrl'));
    const attachmentType = optionalString(form.get('attachmentType')) ?? 'IMAGE';
    const fileName = optionalString(form.get('fileName'));
    const mimeType = optionalString(form.get('mimeType'));
    const fileSizeBytes = optionalNumber(form.get('fileSizeBytes'));
    const payload = {
      body: optionalString(form.get('body')),
      attachments:
        attachmentUrl && fileName && mimeType && fileSizeBytes
          ? [{ attachmentType, assetUrl: attachmentUrl, fileName, mimeType, fileSizeBytes }]
          : [],
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
      await loadMessages(selected.id);
      socketRef.current?.emit('message:read', { conversationId: selected.id });
    }
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
          <form
            className="grid gap-3 border-t border-[#F0D6DA] p-4"
            onSubmit={(event) => void sendMessage(event)}
          >
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
            <details className="rounded-md border border-[#F0D6DA] bg-[#FFF8F1] p-3">
              <summary className="cursor-pointer text-sm font-semibold text-[#7A1E3A]">
                Add attachment by URL
              </summary>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="URL" name="attachmentUrl" />
                <Field label="File name" name="fileName" />
                <Field
                  label="MIME type"
                  name="mimeType"
                  placeholder="image/jpeg or application/pdf"
                />
                <Field label="File size bytes" name="fileSizeBytes" type="number" />
                <label className="grid gap-1.5 text-sm font-medium text-[#232323]">
                  Type
                  <select
                    name="attachmentType"
                    className="h-10 rounded-md border border-[#E8D5D8] px-3"
                  >
                    <option value="IMAGE">Image</option>
                    <option value="DOCUMENT">Document</option>
                  </select>
                </label>
              </div>
            </details>
            <button className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-[#7A1E3A] px-5 text-sm font-semibold text-white">
              <Send className="size-4" />
              Send message
            </button>
          </form>
        ) : null}

        {message ? (
          <p className="border-t border-[#F0D6DA] p-3 text-sm text-[#7A1E3A]">{message}</p>
        ) : null}
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
}: Readonly<{ label: string; name: string; type?: string; placeholder?: string }>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[#232323]">
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="h-10 rounded-md border border-[#E8D5D8] bg-white px-3 outline-none focus:border-[#7A1E3A] focus:ring-2 focus:ring-[#FDECEF]"
      />
    </label>
  );
}
