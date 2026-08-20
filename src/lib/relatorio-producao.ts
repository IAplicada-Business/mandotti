export const COLUNAS_RELATORIO = [
  { id: "safra", label: "Safra", banco: true },
  { id: "fazenda", label: "Fazenda", banco: true },
  { id: "cultura", label: "Cultura", banco: true },
  { id: "ciclo", label: "Ciclo", banco: true },
  { id: "area", label: "Área (ha)", banco: true },
  { id: "produtividade", label: "Produtividade (sc/ha)", banco: true },
  { id: "volume", label: "Volume estimado (sc)", banco: true },
  { id: "preco", label: "Preço/sc", banco: false },
  { id: "custo", label: "Custo/sc", banco: false },
] as const;

export type ColunaRelatorio = (typeof COLUNAS_RELATORIO)[number]["id"];

export const COLUNAS_BANCO: ColunaRelatorio[] = COLUNAS_RELATORIO.filter((c) => c.banco).map(
  (c) => c.id,
);

export type LinhaRelatorio = {
  id: string;
  safra: string;
  fazenda: string;
  fazenda_id: string | null;
  cultura: string;
  cultura_codigo: string;
  ciclo: string;
  area: number | null;
  produtividade: number | null;
  volume: number | null;
  preco: number | null;
  custo: number | null;
};

export function valorColuna(row: LinhaRelatorio, coluna: ColunaRelatorio): string | number | null {
  switch (coluna) {
    case "safra":
      return row.safra;
    case "fazenda":
      return row.fazenda;
    case "cultura":
      return row.cultura;
    case "ciclo":
      return row.ciclo === "safrinha" ? "Safrinha" : row.ciclo === "safra" ? "Safra" : row.ciclo || "—";
    case "area":
      return row.area;
    case "produtividade":
      return row.produtividade;
    case "volume":
      return row.volume;
    case "preco":
      return row.preco;
    case "custo":
      return row.custo;
  }
}

export function formatarCelula(row: LinhaRelatorio, coluna: ColunaRelatorio): string {
  const v = valorColuna(row, coluna);
  if (v == null || v === "") return "—";
  if (coluna === "area") return `${Number(v).toLocaleString("pt-BR")} ha`;
  if (coluna === "produtividade") return `${Number(v).toLocaleString("pt-BR")} sc/ha`;
  if (coluna === "volume") return Number(v).toLocaleString("pt-BR");
  if (coluna === "preco" || coluna === "custo") {
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return String(v);
}
