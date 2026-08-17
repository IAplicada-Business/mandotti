import { Construction } from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";

export function EmBreve({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div>
      <PageHeader title={titulo} description={descricao} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="size-8 text-accent" />
          <p className="font-medium">Módulo em construção</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A estrutura de navegação já está pronta. As funcionalidades deste módulo serão liberadas
            nas próximas entregas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
