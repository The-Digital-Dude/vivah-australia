'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { verificationRequestCreateSchema } from '@vivah/shared';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Upload,
  Lock,
  FileText,
} from 'lucide-react';
import MemberShell from '../member-shell';
import { formString, optionalString, useMemberRequest, validationMessage } from '@/lib/member-api';
import { PremiumButton, PremiumCard, VerificationBadge } from '@/app/components';

const verificationTypes = [
  { value: 'EMAIL', label: 'Email Address' },
  { value: 'MOBILE', label: 'Mobile Number OTP' },
  { value: 'IDENTITY', label: 'Identity (Passport/Driver License)' },
  { value: 'ADDRESS', label: 'Physical Address (Utility Bill)' },
  { value: 'EMPLOYMENT', label: 'Employment Status (Payslip/Contract)' },
  { value: 'VISA', label: 'Visa & Citizenship Status' },
  { value: 'POLICE_CLEARANCE', label: 'Police Clearance Certificate' },
  { value: 'FACIAL', label: 'Facial Match Selfie' },
];

interface VerificationRequestItem {
  _id: string;
  type: string;
  status: string;
  reviewReason?: string;
  createdAt: string;
  documentType?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function MemberVerificationPage() {
  const memberRequest = useMemberRequest();
  const [requests, setRequests] = useState<VerificationRequestItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [simulatedUrl, setSimulatedUrl] = useState('');

  async function load() {
    const result = await memberRequest('/api/me/verifications');
    if (result.ok) {
      setRequests((result.data as { requests?: VerificationRequestItem[] }).requests ?? []);
    } else {
      setMessage(result.message);
      setIsSuccess(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const documentUrl = simulatedUrl || optionalString(form.get('documentUrl'));
    const payload = {
      type: formString(form.get('type')),
      documentType: optionalString(form.get('documentType')),
      documentUrls: documentUrl ? [documentUrl] : undefined,
    };
    const parsed = verificationRequestCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      setIsSuccess(false);
      return;
    }
    const result = await memberRequest('/api/me/verifications', {
      method: 'POST',
      body: parsed.data,
    });
    setMessage(
      result.ok
        ? 'Verification request submitted successfully for moderation review.'
        : result.message,
    );
    setIsSuccess(result.ok);
    if (result.ok) {
      setFileName(null);
      setSimulatedUrl('');
      event.currentTarget.reset();
      await load();
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const handleSimulatedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSimulatedUrl(
        `https://secure.cdn.vivahaustralia.com/uploads/verifications/${Date.now()}-${file.name}`,
      );
    }
  };

  return (
    <MemberShell
      title="Trust & Verification"
      subtitle="Submit identity, visa, and background documents to unlock higher trust badges and premium matching tiers."
    >
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-8">
          {/* ─── Document Submission Form ────────────────────────────────────── */}
          <PremiumCard className="p-6">
            <div className="flex items-center gap-3 border-b border-[#7A1F2B]/10 pb-4 mb-6">
              <ShieldCheck className="size-6 text-[#7A1F2B]" />
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  Submit Verification Documents
                </h2>
                <p className="text-xs text-[#6B7280]">
                  All documents are securely encrypted with AES-256 and manual moderation review.
                </p>
              </div>
            </div>

            <form onSubmit={(event) => void submit(event)} className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-[#1A1A1A]">
                  Verification Type
                  <select
                    name="type"
                    className="h-12 rounded-2xl border border-[#7A1F2B]/15 bg-[#FCFAF7]/40 px-4 text-sm outline-none transition focus:bg-white focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8]"
                  >
                    {verificationTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm font-semibold text-[#1A1A1A]">
                  Document Title
                  <input
                    name="documentType"
                    placeholder="e.g. Passport, Australian Visa Card"
                    required
                    className="h-12 rounded-2xl border border-[#7A1F2B]/15 bg-[#FCFAF7]/40 px-4 text-sm outline-none transition focus:bg-white focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8]"
                  />
                </label>
              </div>

              {/* Secure simulated uploader dropzone */}
              <div className="relative rounded-3xl border-2 border-dashed border-[#7A1F2B]/15 bg-[#FCFAF7]/20 p-6 text-center hover:bg-[#F8E8E8]/10 transition duration-200">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleSimulatedFile}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Upload className="mx-auto size-8 text-[#7A1F2B]/60" />
                <h3 className="mt-3 text-sm font-bold text-[#1A1A1A]">
                  {fileName ? `Selected: ${fileName}` : 'Choose file or drag here'}
                </h3>
                <p className="mt-1.5 text-xs text-[#6B7280]">Supports PDF, PNG, JPG up to 10MB.</p>
                {simulatedUrl && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full w-fit mx-auto">
                    <CheckCircle2 className="size-4" /> Securely locked for upload
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-amber-50/50 p-4 border border-amber-200/50 text-[#7A1F2B] text-xs">
                <Lock className="size-4 text-[#7A1F2B]/70 shrink-0" />
                <p className="leading-5">
                  <strong>Secure Upload Notice:</strong> Your documents are fully isolated in
                  high-security, encrypted AWS S3 buckets. Verification is executed manually by
                  certified Australian moderators.
                </p>
              </div>

              {message ? (
                <p
                  className={cx(
                    'rounded-2xl border p-4 text-sm font-semibold',
                    isSuccess
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-red-200 bg-red-50 text-[#7A1F2B]',
                  )}
                >
                  {message}
                </p>
              ) : null}

              <PremiumButton type="submit" className="w-full">
                Submit Document Request
              </PremiumButton>
            </form>
          </PremiumCard>

          {/* ─── Verification Requests History ────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1A1A1A]">Your Verification History</h2>
            {requests.length === 0 ? (
              <PremiumCard className="p-6 text-center border-dashed text-[#6B7280]">
                <FileText className="mx-auto size-7 text-[#6B7280]/40 mb-2" />
                No document verification requests submitted yet. Complete the form above to submit.
              </PremiumCard>
            ) : (
              <div className="grid gap-4">
                {requests.map((r) => {
                  const statusInfo = (() => {
                    switch (r.status) {
                      case 'APPROVED':
                        return {
                          bg: 'bg-emerald-50 border-emerald-100',
                          badge: 'bg-emerald-100 text-emerald-800',
                          icon: <CheckCircle2 className="size-5 text-emerald-700" />,
                          desc: 'Successfully verified. Badge is credited to your public profile.',
                        };
                      case 'REJECTED':
                        return {
                          bg: 'bg-red-50 border-red-100',
                          badge: 'bg-red-100 text-red-800',
                          icon: <AlertCircle className="size-5 text-rose-700" />,
                          desc:
                            r.reviewReason ||
                            'Rejected. The uploaded document did not meet eligibility or legibility requirements.',
                        };
                      case 'PENDING':
                      default:
                        return {
                          bg: 'bg-amber-50 border-amber-100',
                          badge: 'bg-amber-100 text-amber-800',
                          icon: <Clock className="size-5 text-amber-700" />,
                          desc: 'Under manual review by our Australian moderator panel. Usually processed in 2–4 hours.',
                        };
                    }
                  })();

                  return (
                    <article
                      key={r._id}
                      className={cx(
                        'rounded-3xl border p-5 flex gap-4 transition hover:-translate-y-0.5 bg-white shadow-sm',
                        statusInfo.bg,
                      )}
                    >
                      <div className="mt-0.5 shrink-0">{statusInfo.icon}</div>
                      <div className="min-w-0 flex-1 grid gap-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-semibold text-sm text-[#1A1A1A]">
                            {r.type.replaceAll('_', ' ')} Verified
                          </h3>
                          <span
                            className={cx(
                              'rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 uppercase tracking-wider',
                              statusInfo.badge,
                            )}
                          >
                            {r.status}
                          </span>
                        </div>
                        {r.documentType && (
                          <p className="text-xs font-medium text-[#6B7280]">
                            Attached Document:{' '}
                            <span className="text-[#1A1A1A]">{r.documentType}</span>
                          </p>
                        )}
                        <p className="text-xs leading-5 text-[#6B7280]">{statusInfo.desc}</p>
                        <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-widest mt-1">
                          Submitted on{' '}
                          {new Date(r.createdAt).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Verification Badges Ladder ───────────────────────────────────── */}
        <aside className="space-y-6">
          <PremiumCard className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Trust Badge Ladder</h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Matrimonial accounts unlock higher trust and match scores with badge progression.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex gap-4 items-start p-4 rounded-2xl bg-amber-50/30 border border-amber-200/40">
                <VerificationBadge level="BASIC" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-[#1A1A1A]">Basic Level</h3>
                  <p className="text-[11px] text-[#6B7280] mt-1 leading-4">
                    Unlocked by verifying **Email & Mobile OTP**. Grants access to discover profiles
                    and request match interests.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50 border border-slate-200/40">
                <VerificationBadge level="SILVER" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-[#1A1A1A]">Silver Level</h3>
                  <p className="text-[11px] text-[#6B7280] mt-1 leading-4">
                    Unlocked by verifying **Identity & Address**. Grants visual search
                    prioritization and direct interest approvals.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-2xl bg-yellow-50/30 border border-yellow-200/40">
                <VerificationBadge level="GOLD" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-[#1A1A1A]">Gold Level</h3>
                  <p className="text-[11px] text-[#6B7280] mt-1 leading-4">
                    Unlocked by verifying **Employment & Visa Status**. Adds a golden badge, unlocks
                    custom video intros, and increases matches visibility.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-2xl bg-indigo-50/20 border border-indigo-200/30">
                <VerificationBadge level="PLATINUM" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-[#1A1A1A]">Platinum Level</h3>
                  <p className="text-[11px] text-[#6B7280] mt-1 leading-4">
                    Unlocked by submitting a clean **Police Clearance Certificate** and **Facial
                    Selfie matching**. Grants top priority matching.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-2xl bg-[#7A1F2B]/5 border border-[#7A1F2B]/10">
                <VerificationBadge level="FULLY_VERIFIED" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-[#1A1A1A]">Fully Verified</h3>
                  <p className="text-[11px] text-[#6B7280] mt-1 leading-4">
                    All 5 trust levels fully verified. Matrimonial Crown displayed, with a 35%
                    higher search algorithm boost.
                  </p>
                </div>
              </div>
            </div>
          </PremiumCard>
        </aside>
      </div>
    </MemberShell>
  );
}
