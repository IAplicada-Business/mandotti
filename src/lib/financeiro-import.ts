/** Heurística simples de categorização a partir de texto de XML/NFe. */
export function sugerirCategoria(texto: string): string {
  const t = texto.toLowerCase();
  if (/diesel|combust|trr|gasolina|etanol/.test(t)) return "combustivel";
  if (/herbic|insetic|fungic|adubo|fertiliz|agrotox|defens/.test(t)) return "quimicos";
  if (/pe[cç]a|filtro|correia|rolamento|pneu/.test(t)) return "pecas";
  if (/manuten|oficina|maqcampo|agrimac|reparo/.test(t)) return "manutencao";
  if (/folha|sal[aá]rio|funrural|inss/.test(t)) return "folha";
  if (/soja|milho|sorgo|milheto|venda|fatur/.test(t)) return "faturamento";
  return "diversos";
}

export type ParsedXml = {
  chave: string | null;
  emitente: string | null;
  valorTotal: number | null;
  data: string | null;
  textoBusca: string;
};

export function parseNfeXml(xmlText: string): ParsedXml {
  const get = (tag: string) => {
    const m = xmlText.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"));
    return m?.[1]?.trim() ?? null;
  };

  const chave =
    get("chNFe") ||
    xmlText.match(/Id="NFe(\d{44})"/)?.[1] ||
    xmlText.match(/\b(\d{44})\b/)?.[1] ||
    null;

  const emitente = get("xNome");
  const valorRaw = get("vNF") || get("vProd");
  const valorTotal = valorRaw ? Number(valorRaw.replace(",", ".")) : null;
  const data = get("dhEmi")?.slice(0, 10) || get("dEmi");

  return {
    chave,
    emitente,
    valorTotal: Number.isFinite(valorTotal) ? valorTotal : null,
    data,
    textoBusca: [emitente, xmlText.slice(0, 4000)].filter(Boolean).join(" "),
  };
}

/** Parse CSV simples de extrato: data;descricao;valor (valor negativo = débito). */
export function parseExtratoCsv(text: string): Array<{
  data: string;
  descricao: string;
  valor: number;
  tipo: "credito" | "debito";
}> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: Array<{ data: string; descricao: string; valor: number; tipo: "credito" | "debito" }> =
    [];

  for (const line of lines) {
    if (/^data[;,\t]/i.test(line)) continue;
    const parts = line.split(/[;\t,]/);
    if (parts.length < 3) continue;
    const [dataRaw, desc, valorRaw] = parts;
    const valorNum = Number(
      String(valorRaw)
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, ""),
    );
    if (!Number.isFinite(valorNum) || valorNum === 0) continue;
    const data = dataRaw.includes("/")
      ? dataRaw.split("/").reverse().join("-")
      : dataRaw.slice(0, 10);
    out.push({
      data,
      descricao: desc.trim(),
      valor: Math.abs(valorNum),
      tipo: valorNum < 0 ? "debito" : "credito",
    });
  }
  return out;
}
