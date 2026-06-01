'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import { communityCommentCreateSchema, communityPostCreateSchema } from '@vivah/shared';
import MemberShell from '../member-shell';
import { formString, optionalString, useMemberRequest, validationMessage } from '@/lib/member-api';

interface Room {
  id: string;
  slug: string;
  name: string;
  description?: string;
  postCount: number;
}

interface Post {
  id: string;
  _id?: string;
  roomId: string;
  title?: string;
  body: string;
  commentCount: number;
  reactionCount: number;
  createdAt: string;
}

export default function MemberCommunityPage() {
  const memberRequest = useMemberRequest();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState('');

  async function loadRooms() {
    const result = await memberRequest('/api/community/rooms');
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    const nextRooms = (result.data as { rooms?: Room[] }).rooms ?? [];
    setRooms(nextRooms);
    if (!activeRoom && nextRooms[0]) {
      setActiveRoom(nextRooms[0]);
      await loadPosts(nextRooms[0].slug);
    }
  }

  async function loadPosts(roomSlug: string) {
    const result = await memberRequest(`/api/community/rooms/${roomSlug}/posts`);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setPosts((result.data as { posts?: Post[] }).posts ?? []);
  }

  async function selectRoom(room: Room) {
    setActiveRoom(room);
    await loadPosts(room.slug);
  }

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRoom) return;
    const form = new FormData(event.currentTarget);
    const parsed = communityPostCreateSchema.safeParse({
      title: optionalString(form.get('title')),
      body: formString(form.get('body')),
    });
    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }
    const result = await memberRequest(`/api/community/rooms/${activeRoom.id}/posts`, {
      method: 'POST',
      body: parsed.data,
    });
    setMessage(result.ok ? 'Post published.' : result.message);
    if (result.ok) {
      event.currentTarget.reset();
      await loadPosts(activeRoom.slug);
    }
  }

  async function addComment(postId: string) {
    const body = window.prompt('Add a comment');
    const parsed = communityCommentCreateSchema.safeParse({ body });
    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }
    const result = await memberRequest(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      body: parsed.data,
    });
    setMessage(result.ok ? 'Comment added.' : result.message);
    if (result.ok && activeRoom) await loadPosts(activeRoom.slug);
  }

  async function react(postId: string) {
    const result = await memberRequest(`/api/community/posts/${postId}/reactions`, {
      method: 'POST',
      body: { reaction: 'LIKE' },
    });
    setMessage(result.ok ? 'Reaction updated.' : result.message);
    if (result.ok && activeRoom) await loadPosts(activeRoom.slug);
  }

  async function report(postId: string) {
    const reason = window.prompt('Why are you reporting this post?');
    if (!reason) return;
    const result = await memberRequest(`/api/community/posts/${postId}/report`, {
      method: 'POST',
      body: { reason },
    });
    setMessage(result.ok ? 'Report submitted.' : result.message);
  }

  useEffect(() => {
    void loadRooms();
  }, []);

  return (
    <MemberShell
      title="Community"
      subtitle="Join respectful member discussions across introductions, wedding planning, and settlement topics."
    >
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="grid gap-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => void selectRoom(room)}
              className={`rounded-lg border p-4 text-left ${
                activeRoom?.id === room.id
                  ? 'border-[#7A1E3A] bg-[#FFF8F1]'
                  : 'border-[#F0D6DA] bg-white'
              }`}
            >
              <span className="font-semibold text-[#232323]">{room.name}</span>
              <span className="mt-1 block text-xs text-[#5E6470]">{room.postCount} posts</span>
            </button>
          ))}
        </aside>
        <section>
          {message ? (
            <p className="mb-4 rounded-md bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">{message}</p>
          ) : null}
          <form
            onSubmit={(event) => void createPost(event)}
            className="mb-5 grid gap-3 rounded-lg border border-[#F0D6DA] bg-white p-4"
          >
            <input
              name="title"
              placeholder="Post title"
              className="h-11 rounded-md border border-[#F0D6DA] px-3 text-sm"
            />
            <textarea
              name="body"
              placeholder="Share something useful with the community"
              className="min-h-28 rounded-md border border-[#F0D6DA] p-3 text-sm"
            />
            <button className="h-11 rounded-md bg-[#7A1E3A] px-4 text-sm font-semibold text-white">
              Publish post
            </button>
          </form>
          <div className="grid gap-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded-lg border border-[#F0D6DA] bg-white p-4">
                <h2 className="font-semibold text-[#232323]">{post.title ?? 'Community post'}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5E6470]">{post.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold"
                    onClick={() => void react(post.id)}
                  >
                    <ThumbsUp className="size-3.5" />
                    {post.reactionCount}
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold"
                    onClick={() => void addComment(post.id)}
                  >
                    <MessageSquare className="size-3.5" />
                    {post.commentCount}
                  </button>
                  <button
                    className="rounded-md border px-3 py-2 text-xs font-semibold"
                    onClick={() => void report(post.id)}
                  >
                    Report
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </MemberShell>
  );
}
