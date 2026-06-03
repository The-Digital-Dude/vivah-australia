import MemberShell from '../member-shell';
import { OnboardingFormSkeleton } from '@/app/components';

export default function MemberOnboardingLoading() {
  return (
    <MemberShell
      title="Profile onboarding"
      subtitle="Complete the core profile sections, save partial progress, then submit for approval."
    >
      <OnboardingFormSkeleton />
    </MemberShell>
  );
}
