import MemberShell from '../../member-shell';
import { OnboardingFormSkeleton } from '@/app/components';

export default function EditProfileLoading() {
  return (
    <MemberShell
      title="Edit profile"
      subtitle="Update your profile details and privacy-sensitive fields."
    >
      <OnboardingFormSkeleton />
    </MemberShell>
  );
}
