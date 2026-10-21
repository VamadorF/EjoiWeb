import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { getOnboardingDraftRecord } from '~/features/creation/onboardingDraft.api';
import { resolvePostLoginWizardPath, wizardPath } from '~/features/creation/wizardSteps';

export default function CreateCrearRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    void getOnboardingDraftRecord()
      .then((draft) => {
        if (!active) return;
        navigate(draft ? resolvePostLoginWizardPath(draft) : wizardPath(0), { replace: true });
      })
      .catch(() => {
        if (active) navigate(wizardPath(0), { replace: true });
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  return null;
}
