/** El CTA de crear companion exige consentimiento, idle y avatar con URL. */
export function canCreateCompanion(params: {
  consentComplete: boolean;
  isCreating: boolean;
  imageLoading: boolean;
  avatarUrl: string | null | undefined;
}): boolean {
  return (
    params.consentComplete &&
    !params.isCreating &&
    !params.imageLoading &&
    Boolean(params.avatarUrl)
  );
}
