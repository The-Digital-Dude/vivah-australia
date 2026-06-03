import ProfileManagementShell from '../profile-management-shell';
import MediaManager from './media-manager';

export default function MemberMediaPage() {
  return (
    <ProfileManagementShell
      title="Photo manager"
      subtitle="Curate the images that introduce you first, while keeping visibility and moderation status easy to understand."
      active="media"
    >
      <MediaManager />
    </ProfileManagementShell>
  );
}
