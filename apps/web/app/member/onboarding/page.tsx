import MemberShell from '../member-shell';
import ProfileForm from '../profile-form';

export const metadata = {
  title: 'Profile Onboarding | Vivah Australia',
};

export default function OnboardingPage() {
  return (
    <MemberShell
      title="Profile onboarding"
      subtitle="Complete the core profile sections, save partial progress, then submit for approval."
    >
      <ProfileForm mode="onboarding" />
    </MemberShell>
  );
}
