import MemberShell from '../member-shell';
import ProfileForm from '../profile-form';

export const metadata = {
  title: 'Profile Onboarding | Vivah Australia',
};

export default function OnboardingPage() {
  return (
    <MemberShell
      title="Find Your Match — Compatibility Profile"
      subtitle="Complete your compatibility profile, save partial progress, then submit for approval."
    >
      <ProfileForm mode="onboarding" />
    </MemberShell>
  );
}
