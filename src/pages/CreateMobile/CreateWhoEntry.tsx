import CreateWhoPage from '~/pages/CreateWho/CreateWhoPage';

import CreateMobilePage from './CreateMobilePage';
import { useIsMobileLayout } from './useIsMobileLayout';

export default function CreateWhoEntry() {
  const mobile = useIsMobileLayout();
  if (mobile) return <CreateMobilePage entryStep={0} />;
  return <CreateWhoPage />;
}
