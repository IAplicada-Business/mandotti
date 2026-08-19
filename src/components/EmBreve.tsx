import { Construction } from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { SectionCard } from "@/components/design-system";

export function EmBreve({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div>
      <PageHeader breadcrumb="Módulo reservado" title={titulo} description={descricao} />
      <SectionCard title="Em construção">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="rounded-2xl bg-surface-soft p-4 text-primary">
            <Construction className="size-7" />
          </span>
          <p className="text-base font-bold">Módulo em construção</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A estrutura de navegação e o design system já estão prontos. As funcionalidades deste
            módulo serão liberadas nas próximas entregas.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
