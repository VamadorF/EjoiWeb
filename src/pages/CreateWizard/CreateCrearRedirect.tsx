import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { getOnboardingDraftRecord } from '~/features/creation/onboardingDraft.api';
import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';

import { resolvePostLoginWizardPath, wizardPathForStep } from '~/features/creation/wizardSteps';

export default function CreateCrearRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    void getOnboardingDraftRecord()
      .then((draft) => {
        if (!active) return;
        navigate(
          draft
            ? resolvePostLoginWizardPath(draft as Parameters<typeof resolvePostLoginWizardPath>[0])
            : wizardPathForStep(ONBOARDING_STEPS.gender),
          { replace: true },
        );
      })
      .catch(() => {
        if (active) navigate(wizardPathForStep(ONBOARDING_STEPS.gender), { replace: true });
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  return null;
}
