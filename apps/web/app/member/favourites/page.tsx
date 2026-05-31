import MemberShell from '../member-shell';
import FavouritesManager from './favourites-manager';

export const metadata = {
  title: 'Favourites | Vivah Australia',
};

export default function FavouritesPage() {
  return (
    <MemberShell
      title="Favourites"
      subtitle="Keep track of promising profiles and take safety actions when needed."
    >
      <FavouritesManager />
    </MemberShell>
  );
}
