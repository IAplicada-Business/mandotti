import { Check, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AcoesCadastro({
  onEdit,
  onDelete,
  onPago,
}: {
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  onPago?: (() => void) | undefined;
}) {
  return (
    <div className="flex justify-end gap-0.5">
      {onPago ? (
        <Button type="button" variant="ghost" size="sm" onClick={onPago}>
          <Check className="mr-1 size-3.5" />
          Pago
        </Button>
      ) : null}
      {onEdit ? (
        <Button type="button" variant="ghost" size="icon" aria-label="Editar" onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
      ) : null}
      {onDelete ? (
        <Button type="button" variant="ghost" size="icon" aria-label="Excluir" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      ) : null}
    </div>
  );
}