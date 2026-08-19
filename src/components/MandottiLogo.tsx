import { cn } from "@/lib/utils";

/**
 * Marca oficial do Grupo Mandotti. Renderiza o mesmo arquivo usado como
 * favicon/ícone do app (PNG com fundo transparente), então logo e favicon nunca
 * saem de sincronia. Cores da arte: folha #037638, curvas #16472C, semente #CA8921.
 */
export function MandottiLogo({
  className,
  hires = false,
  alt = "Grupo Mandotti",
}: {
  className?: string;
  /** Usa o arquivo de 512px — para exibições grandes, como o hero do login. */
  hires?: boolean;
  alt?: string;
}) {
  return (
    <img
      src={hires ? "/favicon-512.png?v=3" : "/favicon-192.png?v=3"}
      alt={alt}
      draggable={false}
      className={cn("select-none object-contain", className)}
    />
  );
}
