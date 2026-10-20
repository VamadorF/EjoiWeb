import { AppIcon } from '~/components/AppIcon';

type EditSummaryRowProps = {
  label: string;
  value: string;
  testId: string;
  onOpen: (trigger: HTMLButtonElement) => void;
};

export function EditSummaryRow({ label, value, testId, onOpen }: EditSummaryRowProps) {
  return (
    <button
      type="button"
      className="edit-summary-row"
      data-testid={testId}
      onClick={(e) => onOpen(e.currentTarget)}
    >
      <span className="edit-summary-row__label">{label}</span>
      <span className="edit-summary-row__value">{value}</span>
      <AppIcon name="chevron-forward-outline" className="edit-summary-row__chevron" />
    </button>
  );
}
