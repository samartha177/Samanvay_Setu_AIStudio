import { PageHeader } from "../components/PageHeader";
import { PlaceholderPanel } from "../components/PlaceholderPanel";

export function MonitoringPage() {
  return <><PageHeader eyebrow="Officer console" title="Monitoring & recovery" description="Observe gateway calls, workflow steps, retries, and controlled department failures." /><PlaceholderPanel phase="Phase 6" heading="Live workflow monitoring" description="The demonstration will show department response timing, correlation IDs, error classification, bounded retries, and officer-led recovery." /></>;
}
