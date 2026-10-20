import CreateHowPage from '~/pages/CreateHow/CreateHowPage';

import CreateMobilePage from './CreateMobilePage';
import { useIsMobileLayout } from './useIsMobileLayout';

export default function CreateHowEntry() {
  const mobile = useIsMobileLayout();
  if (mobile) return <CreateMobilePage entryStep={2} />;
  return <CreateHowPage />;
}
