import Link from 'next/link';
import { Camera, Eye, Lock, ShieldCheck } from 'lucide-react';
import { PremiumCard } from '@/app/components';
import ProfileManagementShell from '../../profile-management-shell';
import ProfileForm from '../../profile-form';

export const metadata = {
  title: 'Edit Profile | Vivah Australia',
};

export default function EditProfilePage() {
  return (
    <ProfileManagementShell
      title="Edit profile"
      subtitle="Refine your biodata, story, and preferences without disturbing your existing profile workflow."
      active="edit"
      utility={
        <>
          <PremiumCard className="rounded-[30px] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
              Editing focus
            </p>
            <h3 className="mt-3 font-playfair text-2xl font-semibold text-[#2F2F2F]">
              Keep your story current
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#6B7280]">
              Fresh details, thoughtful partner preferences, and complete lifestyle context help
              serious matches understand you faster.
            </p>
          </PremiumCard>

          <PremiumCard className="rounded-[30px] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
              Quick links
            </p>
            <div className="mt-4 space-y-3">
              <Link
                href="/member/media"
                className="flex items-center gap-3 rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F] transition hover:bg-white"
              >
                <Camera className="size-4 text-[#A10E4D]" />
                Manage photos
              </Link>
              <Link
                href="/member/settings"
                className="flex items-center gap-3 rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F] transition hover:bg-white"
              >
                <Lock className="size-4 text-[#A10E4D]" />
                Privacy controls
              </Link>
              <Link
                href="/member/verification"
                className="flex items-center gap-3 rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F] transition hover:bg-white"
              >
                <ShieldCheck className="size-4 text-[#A10E4D]" />
                Verification centre
              </Link>
              <Link
                href="/member/profile"
                className="flex items-center gap-3 rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F] transition hover:bg-white"
              >
                <Eye className="size-4 text-[#A10E4D]" />
                Preview public profile
              </Link>
            </div>
          </PremiumCard>
        </>
      }
    >
      <ProfileForm mode="edit" />
    </ProfileManagementShell>
  );
}
