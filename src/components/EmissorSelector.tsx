import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { resumoEmissores, useEmissor } from "@/lib/emissor-context";

export function EmissorSelector() {
  const { emissores, emissorIds, setEmissorIds, loading } = useEmissor();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-9 min-w-0 flex-1 animate-pulse rounded-md bg-muted sm:w-[18rem] sm:flex-none" />
    );
  }

  if (!emissores.length) {
    return (
      <Link
        to="/configuracoes"
        search={{ aba: "emissores" }}
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        Nenhum emissor cadastrado — cadastrar
      </Link>
    );
  }

  const selecionados = emissores.filter((e) => emissorIds.includes(e.id));
  const label = resumoEmissores(selecionados, emissores.length);
  const todosMarcados = emissorIds.length === emissores.length;

  const toggleTodos = () => setEmissorIds(todosMarcados ? [] : emissores.map((e) => e.id));
  const toggleUm = (id: string) =>
    setEmissorIds(
      emissorIds.includes(id) ? emissorIds.filter((x) => x !== id) : [...emissorIds, id],
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Emissores em exibição"
          className="min-w-0 flex-1 justify-between gap-2 rounded-full border-border bg-card sm:w-[18rem] sm:flex-none"
        >
          <span className="truncate text-left">
            <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Emissores
            </span>
            {label}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 rounded-2xl p-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-accent">
          <Checkbox checked={todosMarcados} onCheckedChange={toggleTodos} />
          <span className="font-medium">Selecionar todos</span>
        </label>
        <div className="my-1 h-px bg-border" />
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {emissores.map((e) => (
            <label
              key={e.id}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox
                checked={emissorIds.includes(e.id)}
                onCheckedChange={() => toggleUm(e.id)}
              />
              <span className="truncate">{e.nome_fantasia || e.razao_social}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
