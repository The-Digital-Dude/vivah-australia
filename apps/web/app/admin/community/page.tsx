'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { communityRoomInputSchema } from '@vivah/shared';
import AdminShell from '../admin-shell';
import { formString, optionalString, useMemberRequest, validationMessage } from '@/lib/member-api';

interface Room {
  id: string;
  slug: string;
  name: string;
  description?: string;
  isDefault: boolean;
  postCount: number;
}

export default function AdminCommunityPage() {
  const memberRequest = useMemberRequest();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const result = await memberRequest('/api/community/rooms');
    if (result.ok) setRooms((result.data as { rooms?: Room[] }).rooms ?? []);
    else setMessage(result.message);
  }

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = communityRoomInputSchema.safeParse({
      slug: formString(form.get('slug')),
      name: formString(form.get('name')),
      description: optionalString(form.get('description')),
      isDefault: form.get('isDefault') === 'on',
    });
    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }
    const result = await memberRequest('/api/admin/community/rooms', {
      method: 'POST',
      body: parsed.data,
    });
    setMessage(result.ok ? 'Room created.' : result.message);
    if (result.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  async function renameRoom(room: Room) {
    const name = window.prompt('Room name', room.name);
    if (!name) return;
    const result = await memberRequest(`/api/admin/community/rooms/${room.id}`, {
      method: 'PATCH',
      body: { name },
    });
    setMessage(result.ok ? 'Room updated.' : result.message);
    if (result.ok) await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminShell
      title="Community"
      subtitle="Manage member discussion rooms and keep community spaces aligned with moderation policy."
    >
      <form
        onSubmit={(event) => void createRoom(event)}
        className="mb-5 grid gap-3 rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4 md:grid-cols-[160px_1fr_1fr_auto]"
      >
        <input name="slug" placeholder="slug" className="h-11 rounded-md border px-3 text-sm" />
        <input
          name="name"
          placeholder="Room name"
          className="h-11 rounded-md border px-3 text-sm"
        />
        <input
          name="description"
          placeholder="Description"
          className="h-11 rounded-md border px-3 text-sm"
        />
        <button className="h-11 rounded-md bg-[#7A1E3A] px-4 text-sm font-semibold text-white">
          Create
        </button>
      </form>
      {message ? <p className="mb-4 text-sm text-[#7A1E3A]">{message}</p> : null}
      <div className="grid gap-3">
        {rooms.map((room) => (
          <article
            key={room.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
          >
            <div>
              <h2 className="font-semibold">{room.name}</h2>
              <p className="text-sm text-[#5E6470]">
                {room.slug} · {room.postCount} posts {room.isDefault ? '· Default' : ''}
              </p>
            </div>
            <button
              className="rounded-md border px-3 py-2 text-sm"
              onClick={() => void renameRoom(room)}
            >
              Rename
            </button>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
