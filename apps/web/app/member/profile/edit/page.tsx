import ProfileManagementShell from '../../profile-management-shell';
import ProfileForm from '../../profile-form';

export const metadata = {
  title: 'Edit Profile | Vivah Australia',
};

export default function EditProfilePage() {
  return (
    <ProfileManagementShell
      title="Edit profile"
      subtitle="Update your biodata, photos, and partner preferences."
      active="edit"
    >
      <ProfileForm mode="edit" />
    </ProfileManagementShell>
  );
}
