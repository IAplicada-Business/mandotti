export type FazendaRegime = "propria" | "arrendada" | "arrendada_a_terceiro";

export const REGIME_LABEL: Record<FazendaRegime, string> = {
  propria: "Própria",
  arrendada: "Arrendada",
  arrendada_a_terceiro: "Arrendada a 3º",
};

export const REGIME_VARIANT: Record<FazendaRegime, "default" | "secondary" | "outline"> = {
  propria: "default",
  arrendada: "secondary",
  arrendada_a_terceiro: "outline",
};
