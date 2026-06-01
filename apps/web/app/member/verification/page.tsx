'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { verificationRequestCreateSchema } from '@vivah/shared';
import MemberShell from '../member-shell';
import { formString, optionalString, useMemberRequest, validationMessage } from '@/lib/member-api';

const verificationTypes = [
  'EMAIL',
  'MOBILE',
  'IDENTITY',
  'ADDRESS',
  'EMPLOYMENT',
  'VISA',
  'POLICE_CLEARANCE',
  'FACIAL',
];

interface VerificationRequestItem {
  _id: string;
  type: string;
  status: string;
  reviewReason?: string;
  createdAt: string;
}

export default function MemberVerificationPage() {
  const memberRequest = useMemberRequest();
  const [requests, setRequests] = useState<VerificationRequestItem[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const result = await memberRequest('/api/me/verifications');
    if (result.ok)
      setRequests((result.data as { requests?: VerificationRequestItem[] }).requests ?? []);
    else setMessage(result.message);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const documentUrl = optionalString(form.get('documentUrl'));
    const payload = {
      type: formString(form.get('type')),
      documentType: optionalString(form.get('documentType')),
      documentUrls: documentUrl ? [documentUrl] : undefined,
    };
    const parsed = verificationRequestCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }
    const result = await memberRequest('/api/me/verifications', {
      method: 'POST',
      body: parsed.data,
    });
    setMessage(result.ok ? 'Verification request submitted.' : result.message);
    if (result.ok) await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <MemberShell
      title="Verification"
      subtitle="Submit documents for manual verification review and track your badge status."
    >
      <form
        onSubmit={(event) => void submit(event)}
        className="grid gap-3 rounded-lg border border-neutral-200 p-4"
      >
        <select name="type" className="h-11 rounded-md border border-neutral-200 px-3 text-sm">
          {verificationTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          name="documentType"
          placeholder="Document type"
          className="h-11 rounded-md border border-neutral-200 px-3 text-sm"
        />
        <input
          name="documentUrl"
          placeholder="Secure document or media URL"
          className="h-11 rounded-md border border-neutral-200 px-3 text-sm"
        />
        <button className="h-11 rounded-md bg-red-700 px-4 text-sm font-semibold text-white">
          Submit request
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}
      <div className="mt-6 grid gap-3">
        {requests.map((request) => (
          <article key={request._id} className="rounded-lg border border-neutral-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{request.type}</h2>
                <p className="text-sm text-neutral-600">
                  {request.status} · {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
              {request.reviewReason ? (
                <p className="max-w-md text-sm text-neutral-600">{request.reviewReason}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </MemberShell>
  );
}
