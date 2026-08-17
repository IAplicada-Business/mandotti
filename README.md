# Mandotti

Create a new project with Supabase enabled.

PROMPT BASE — Lovable · Sistema Grupo Mandotti (Fundação da Plataforma)

Como usar: cole este prompt inteiro como primeira mensagem em um projeto novo no Lovable. Ele constrói apenas a fundação (Módulo 01 do Blueprint: Plataforma Base & Níveis de Acesso) — pré-requisito de todos os outros módulos. Cada módulo seguinte (Financeiro, Notas, Produção, Documentos, Maquinário, Assinaturas) entra depois, em um prompt dedicado próprio, construído em cima deste mesmo esqueleto. Não peça tudo de uma vez — a Lovable rende melhor em fundação sólida

incrementos do que em um prompt gigante monolítico.

1. Contexto do produto

Construa a fundação de um sistema web mobile-first, white label, de gestão agrícola para o Grupo Mandotti — grupo do agronegócio sediado em Pedro Afonso (TO), 25 anos de atividade, soja/milho/sorgo/milheto, ~6.000 ha em 9 fazendas produtivas + 2 arrendadas a terceiros.

A operação roda em 4 emissores fiscais: 2 CPFs (Eder Mandotti e Nagyla Pollyanna, produtores rurais) + 2 empresas (Mandotti Serviços Agrícolas — também transportadora, em processo de conversão para S.A. — e Tractor). Eder cuida do operacional/safra; Nagyla, do financeiro/documentação. O sistema precisa sobreviver à migração dos CPFs para o CNPJ da S.A. sem retrabalho — isso é uma restrição de arquitetura, não um detalhe.

O cliente usa o sistema majoritariamente pelo celular, em viagem. Hoje a gestão inteira roda em uma planilha Excel + busca manual em e-mail; o objetivo do produto é eliminar digitação repetitiva via automações de IA (que virão em módulos futuros) — mas a fundação de hoje precisa ser limpa, com papéis de acesso bem definidos e pronta para receber essas automações sem refatoração.

2. Escopo desta etapa (o que construir AGORA)

Construa somente:

Esqueleto do app (shell, navegação, tema, autenticação, perfis de acesso).

Módulo Fazendas & Áreas — CRUD completo e funcional.

Módulo Emissores & Certificados — CRUD completo e funcional (sem integração real de certificado ainda — só o cadastro e status).

Módulo Usuários & Acessos — CRUD completo e funcional, com convite e perfis.

Painel Central (dashboard) — layout completo, mas em estado vazio real (sem dados inventados), pronto para os módulos financeiros/fiscais preencherem depois.

Todas as rotas dos módulos futuros já existindo no menu, como placeholder "Em breve" — a arquitetura de navegação nasce completa mesmo que o conteúdo venha depois (veja seção 6).

Não implemente agora (isso vem em prompts modulares futuros, um de cada vez): Importação de XML/SEFAZ, painel financeiro e balanço 50/50, leitura de SCR/Bacen, conciliação bancária, emissão de nota fiscal, leitura de romaneios, contratos com tradings, câmbio/clima, biblioteca de documentos, maquinário/depreciação, assinatura digital, qualquer automação n8n, qualquer envio de WhatsApp/e-mail automático. Essas telas devem existir na navegação desde já, mas com conteúdo "Em breve" — não construa a lógica de negócio delas ainda.

3. Stack técnica

Stack padrão Lovable: React + Vite + TypeScript + Tailwind + shadcn/ui.

Banco, autenticação e storage via Supabase (integração nativa da Lovable).

Nenhuma integração externa nesta etapa (SEFAZ, Bacen, APIs de câmbio/clima, n8n, WhatsApp) — ficam para os prompts de automação de cada módulo.

4. Padrões de dados — obrigatórios, não negociáveis

Aplique estes padrões em toda tabela criada agora e sirva de contrato para todas as tabelas futuras dos outros módulos:

snake_case em tabelas e colunas.

id uuid PRIMARY KEY DEFAULT gen_random_uuid().

created_at e updated_at (trigger automático) em toda tabela.

Soft delete via deleted_at — nunca DELETE físico.

RLS (Row Level Security) ativo em toda tabela com dado sensível, por perfil de usuário.

Nenhuma tabela usa CPF/CNPJ como chave. Tudo referencia emissores.id. Isso é o que permite a migração futura dos CPFs para o CNPJ da S.A. ser uma troca de registro, não uma refatoração.

Qualquer regra de proporção (ex.: a divisão 50/50 entre os CPFs, que existirá no módulo financeiro) deve nascer parametrizável por par de emissores — nunca fixe "50/50" como constante em código, porque essa proporção pode mudar e a S.A. vai desativar o balanço por completo.

5. Autenticação & perfis de acesso

Três perfis, com RLS refletindo cada um desde já (mesmo que as telas de dado ainda não existam):

Perfil Quem Acesso Admin Nagyla Pollyanna, Eder Mandotti Total — todas as telas, todos os emissores Funcionário Ex.: funcionária do escritório Restrito tela a tela, conforme grants definidos pelo Admin Contabilidade HRM Contabilidade Somente leitura — telas fiscais/financeiras/extratos

Crie a tabela perfis_acesso (grants por tela, por usuário) separada da tabela usuarios, para que liberar/bloquear uma tela específica para um Funcionário não exija mudar código.

Critério real de aceite: um usuário Funcionário não pode acessar uma tela não autorizada mesmo digitando a URL direto — a proteção precisa estar no backend (RLS/policy), não só escondendo o item no menu.

6. Arquitetura de navegação (IA completa desde o dia 1)

Sidebar com um toggle no topo entre dois contextos: Gestão (Admin/Funcionário) e Contabilidade (HRM) — cada um mostra um conjunto de menus diferente. Dentro de "Gestão", grupos colapsáveis:

Grupo Tela Rota Status nesta etapa Operação Painel Central /dashboard Funcional (shell + estado vazio) Operação Fazendas & Áreas /fazendas Funcional (CRUD completo) Operação Produção & Safras /producao Placeholder "Em breve" Operação Maquinário /maquinario Placeholder "Em breve" Financeiro Painel Financeiro /financeiro Placeholder "Em breve" Financeiro Importação XML /financeiro/xml Placeholder "Em breve" Financeiro Conciliação Bancária /financeiro/conciliacao Placeholder "Em breve" Financeiro Passivos · SCR /passivos Placeholder "Em breve" Fiscal Notas Fiscais /notas Placeholder "Em breve" Fiscal Clientes & Compradores /clientes Placeholder "Em breve" Fiscal Contratos · Tradings /contratos Placeholder "Em breve" Documentos Biblioteca /documentos Placeholder "Em breve" Documentos Assinatura Digital /assinaturas Placeholder "Em breve" Configurações Emissores & Certificados /emissores Funcional (CRUD completo) Configurações Usuários & Acessos /usuarios Funcional (CRUD completo) Configurações Integrações /integracoes Placeholder — lista de integrações futuras, status "não conectado"

Contexto Contabilidade (menu separado, mesma sidebar):

Tela Rota Status Extratos bancários /contabilidade/extratos Placeholder "Em breve" Relatórios mensais /contabilidade/relatorios Placeholder "Em breve" Documentos fiscais /contabilidade/documentos Placeholder "Em breve"

Cada placeholder deve ter um estado "em breve" limpo (não uma tela quebrada ou 404) — isso importa porque a cliente vai navegar pelo sistema desde a primeira entrega e a sensação de completude do menu é parte da experiência.

7. Seletor global de visão (por emissor)

No cabeçalho, sempre visível, um seletor que filtra os dados por: um CPF, um CNPJ, ou qualquer combinação livre dos 4 emissores (ex.: "Eder + Mandotti"). Nesta etapa, faça-o funcionar de verdade nas telas de Fazendas e no Painel Central (mesmo que hoje quase tudo esteja vazio) — os módulos futuros (financeiro, fiscal) vão herdar esse mesmo seletor sem precisar reconstruí-lo.

8. Design system / identidade visual

Tipografia: Inter (400/500/600/700/800) para UI geral, JetBrains Mono para números, documentos (CPF/CNPJ) e valores monetários.

Tema claro/escuro selecionável pelo usuário.

Mobile-first — o uso principal é pelo celular, em viagem. Teste a responsividade de cada tela como prioridade, não como ajuste posterior.

Paleta provisória agro (o cliente ainda vai enviar as logos positiva/negativa via Drive — a paleta abaixo é temporária e deve estar 100% em tokens/variáveis, nunca hardcoded, para ser trocada em um lugar só quando a marca chegar):

:root {
  /* Primária — verde agro (provisório) */
  --primary-900: #16301A;
  --primary-800: #235229;
  --primary-700: #2E6636;
  --primary-600: #3F7D49; /* cor base */
  --primary-500: #5C9463;
  --primary-400: #86B28C;
  --primary-300: #B3D0B7;
  --primary-200: #D2E4D4;
  --primary-100: #E1EEE2;
  --primary-050: #F1F7F1;

  /* Acentos — referência a culturas/terra, usar em gráficos e categorias */
  --accent-terracota: #B5541C; /* sorgo */
  --accent-dourado:   #C99012; /* milho */
  --accent-verde-claro: #7FA832; /* soja */
  --accent-marrom-terra: #6E5537; /* milheto */

  /* Cor por emissor — usar em badges em todo o sistema */
  --emissor-eder:     #2E6636;
  --emissor-nagyla:   #B5541C;
  --emissor-mandotti: #6E5537;
  --emissor-tractor:  #C99012;

  /* Semânticas */
  --success: #10B981;
  --warning: #F58A1F;
  --danger:  #E11D48;
  --info:    #7B4FB5;

  /* Neutros */
  --ink: #2C2C2C;
  --ink-2: #4B4B4B;
  --paper: #FFFFFF;
  --bg: #FAFBFC;
  --muted: #6B7280;
  --line: #E5E7EB;
  --line-strong: #D1D5DB;
}


Inclua um banner discreto e persistente (ex.: no Painel Central e em Configurações) avisando: "Paleta provisória — será substituída pelas cores da marca do Grupo Mandotti assim que as logos chegarem." Isso evita que alguém confunda a paleta de agora com a identidade final.

4 estados obrigatórios em toda lista e todo formulário, sem exceção, desde já: loading (skeleton/spinner), empty (mensagem clara quando não há registros), error (feedback visual quando algo falha) e success (confirmação ao salvar).

9. Schema inicial do banco (Supabase) — construir agora

emissores
  id                uuid PK
  tipo              text        -- 'cpf' | 'cnpj'
  nome              text        -- Eder Mandotti · Nagyla Pollyanna · Mandotti Serviços · Tractor
  documento         text UNIQUE -- CPF/CNPJ
  certificado_id    uuid FK -> certificados.id (nullable)
  status_migracao_sa text nullable -- 'ativo' | 'em_migracao' | 'migrado'
  created_at, updated_at, deleted_at

fazendas
  id                  uuid PK
  nome                text
  municipio           text
  regime              text        -- 'propria' | 'arrendada' | 'arrendada_a_terceiro'
  area_produtiva_ha   numeric
  area_abertura_ha    numeric nullable
  custo_arrendamento  numeric nullable  -- a receber da cliente, ainda não informado
  venc_arrendamento   date nullable
  latlong             point nullable    -- para clima, usado em módulo futuro
  created_at, updated_at, deleted_at

certificados
  id            uuid PK
  emissor_id    uuid FK -> emissores.id
  tipo          text        -- 'A1'
  validade      date nullable
  status        text        -- 'pendente' | 'vinculado' | 'vencido' (metadado só — sem
                                armazenamento real do arquivo/criptografia nesta etapa;
                                isso é do módulo de Assinatura Digital)
  created_at, updated_at, deleted_at

usuarios
  id            uuid PK (ligado a auth.users do Supabase)
  nome          text
  perfil        text        -- 'admin' | 'funcionario' | 'contabilidade'
  status        text        -- 'ativo' | 'convite_enviado'
  ultimo_login  timestamptz nullable
  created_at, updated_at, deleted_at

perfis_acesso
  id            uuid PK
  usuario_id    uuid FK -> usuarios.id
  tela          text        -- identificador da rota, ex. '/fazendas'
  pode_ver      boolean DEFAULT false
  pode_editar   boolean DEFAULT false
  created_at, updated_at


RLS: Admin lê/escreve tudo; Funcionário segue perfis_acesso; Contabilidade só lê (sem tabelas fiscais ainda existirem — mas a policy já deve prever esse perfil).

10. Dados de referência para a carga inicial

Use como dado de referência para popular as telas de Fazendas/Emissores/Usuários — mas trate como dado a validar, não como verdade definitiva (há inconsistências conhecidas na planilha original do cliente que ainda serão confirmadas no kickoff):

Emissores:

Nome Tipo Status certificado Eder Mandotti CPF Pendente (cliente ainda vai enviar) Nagyla Pollyanna CPF Pendente Mandotti Serviços Agrícolas CNPJ Pendente Tractor CNPJ Pendente

Fazendas:

Fazenda Regime Produtiva (ha) Abertura (ha) Venc. arrendamento Cana Brava Arrendada 1.430 1.000 2044 São José do Ribamar Arrendada 1.700 — 2037 Pau Ferrado Arrendada 450 — 2032 São Judas Arrendada 450 — 2033 São Bento Arrendada 400 — 2035 Salinas Arrendada 60 — 2032 Cana Brava 2 Arrendada — 430 2036 Brejão Própria 70 — — Barracão e São José Própria 700 — — Telha Própria 500 — — Sol Nascente / Cruz de Malta Arrendada a terceiro — — (receita de arrendamento, patrimônio)

⚠️ Pontos a confirmar com a cliente antes de tratar como definitivo (não assuma, sinalize na interface como "a validar"): custo de arrendamento por área ainda não informado; Fazenda Barracão aparece em projeções de safra futura mas não constava no perfil de áreas original; Cana Brava Abertura (1.000 ha) aparece sem contrato de arrendamento correspondente.

Usuários:

Nome Perfil Status Nagyla Pollyanna Admin Ativo Eder Mandotti Admin Ativo Funcionária (escritório) Funcionário Ativo — acesso a Produção e Documentos (ver) HRM Contabilidade Contabilidade Convite enviado

Não grave CPF/CNPJ reais nem coloque certificados de verdade nesta etapa — os dados sensíveis do cliente ainda estão pendentes de envio (ver seção 12).

11. Painel Central (dashboard) — o que construir agora

Monte o layout final (cards de KPI, área de gráfico de despesas por categoria, tabela de últimos lançamentos) já preparado visualmente para os módulos financeiro/fiscal que virão depois — mas como esses dados ainda não existem, a tela deve nascer no estado vazio real (consultas ao Supabase que hoje retornam vazio, mostrando o empty state definido na seção 8). Não simule números financeiros nesta etapa — isso viraria dado fantasma fácil de confundir com produção real.

KPIs a deixar com o "encaixe" pronto (hoje vazios, populados pelo módulo financeiro depois): Faturamento da safra · Balanço 50/50 (indicador + recomendação de emissor) · Passivo total (SCR) · XMLs importados no mês.

12. O que NÃO fazer nesta etapa

Não implemente XML/SEFAZ, SCR/Bacen, câmbio/clima, romaneios, contratos, biblioteca de documentos, maquinário, assinatura digital ou qualquer automação n8n/WhatsApp — só as rotas placeholder da seção 6.

Não fixe a divisão 50/50 (ou qualquer proporção) como constante em código.

Não modele emissão de boleto em nenhum lugar — pagamentos do cliente são só Pix/transferência.

Não use CPF/CNPJ como chave primária ou estrangeira em nenhuma tabela, nem agora nem como referência para os módulos futuros.

Não grave segredos (chaves de API, certificados) no frontend ou no repositório.

13. Critérios de aceite desta etapa

As 9 fazendas produtivas + 2 arrendadas a terceiros cadastradas (dados de referência da seção 10, com os pontos de validação sinalizados na interface, não escondidos).

Usuário Funcionário não acessa uma tela não autorizada mesmo digitando a URL diretamente.

Seletor global de visão altera de forma consistente os dados exibidos em Fazendas e no Painel Central.

Sistema usável e responsivo em celular real (não só redimensionado no desktop).

Os 4 estados de interface (loading/empty/error/success) implementados em toda lista e formulário criados nesta etapa.

Tema claro/escuro funcional.

RLS ativo e validável por perfil (Admin, Funcionário, Contabilidade).

Nenhuma chave de API ou segredo exposto no frontend.

14. Próximos passos (fora do escopo deste prompt)

Depois que esta fundação estiver no ar, os módulos seguintes entram um de cada vez, cada um com seu próprio prompt dedicado, construído em cima deste esqueleto:

Financeiro & Fiscal Inteligente — XML dos 4 emissores, painel financeiro, balanço 50/50, SCR, conciliação bancária, envio à contabilidade.

Emissão de Notas & Remessas — NF de produtor, remessa, certificados vinculados.

Produção, Contratos & Câmbio — romaneios por IA, contratos com tradings, câmbio/clima, comparativo de safras.

Biblioteca de Documentos — pastas por fazenda, alertas de vencimento, links seguros.

Maquinário & Alertas — depreciação, manutenção vinculada, alerta de troca.

Assinatura Digital Multicertificado — os 4 certificados no celular, trilha de auditoria.

Se quiser, posso escrever o prompt de cada um desses módulos quando chegar a vez — cada um vai se apoiar exatamente no schema e nos padrões definidos aqui.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7980de14-a351-4a6e-9ee0-8493ac3aceb9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
