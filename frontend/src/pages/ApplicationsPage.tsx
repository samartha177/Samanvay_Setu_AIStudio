import { PageHeader } from "../components/PageHeader";
import { PlaceholderPanel } from "../components/PlaceholderPanel";

export function ApplicationsPage() {
  return <><PageHeader eyebrow="Citizen portal" title="My applications" description="Track transparent, consented service delivery across departments." /><PlaceholderPanel phase="Phase 4" heading="No persisted applications yet" description="Application records, workflow status, and audit-safe history will be shown after the workflow and database foundations are implemented." /></>;
}
