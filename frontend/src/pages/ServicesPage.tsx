import { PageHeader } from "../components/PageHeader";
import { ScholarshipWorkflow } from "../components/ScholarshipWorkflow";

export function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Citizen portal"
        title="Government services"
        description="Access multi-department services that coordinate consented data exchange without replacing departmental source systems."
      />
      <div className="mt-8">
        <ScholarshipWorkflow />
      </div>
    </>
  );
}
