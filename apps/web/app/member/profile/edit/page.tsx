import MemberShell from '../../member-shell';
import ProfileForm from '../../profile-form';

export const metadata = {
  title: 'Edit Profile | Vivah Australia',
};

export default function EditProfilePage() {
  return (
    <MemberShell
      title="Edit profile"
      subtitle="Update your profile details and privacy-sensitive fields."
    >
      <ProfileForm mode="edit" />
    </MemberShell>
  );
}
