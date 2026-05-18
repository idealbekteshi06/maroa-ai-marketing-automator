import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { Construction } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
}

/** Reusable stub for routes not yet wired to real endpoints. */
export default function ModuleStub({ title, subtitle }: Props) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState
        icon={Construction}
        title="Under construction"
        helper="This module's UI is scaffolded. Live data wiring lands in the next build pass."
      />
    </div>
  );
}
