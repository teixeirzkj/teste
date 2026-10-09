# Blueprint — Sistema de delivery + painel (base: Pizzaria São Paulo)

Este documento descreve **tudo o que o sistema da Pizzaria São Paulo faz e como foi construído**, para servir de referência em outros projetos (ex.: The Burgue). O código de referência está neste repositório:

- Pasta local: `C:\Users\Riquelme\projetos\pizzaria-sao-paulo`
- GitHub: `https://github.com/teixeirzkj/teste`

> Ao reaproveitar: **copie a arquitetura e os padrões, não os textos, fotos, cores ou marca da pizzaria.**

---

## 1. Visão geral

Duas áreas integradas e um banco de dados real:

1. **Loja pública (cardápio digital)**: hero animado, cardápio, modal do produto, carrinho, checkout e finalização pelo WhatsApp (ou direto para a cozinha, no pedido na mesa).
2. **Painel administrativo** (`/admin`): dashboard, pedidos em Kanban, nova venda (balcão), vendas, relatórios, cardápio, configurações e usuários.

Tudo que muda no painel aparece na loja na hora, porque a página da loja lê o banco a cada acesso.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Recharts · lucide-react · zod · sharp · qrcode · Postgres (`postgres` em produção/Supabase, `@electric-sql/pglite` no desenvolvimento).

**Hospedagem:** Vercel (região `gru1`) + Supabase (Postgres, Transaction pooler, porta 6543).

---

## 2. Checklist de funcionalidades

Use esta lista para comparar com o outro site (já tem / falta / não se aplica).

### Loja pública
| # | Funcionalidade | Onde está |
|---|---|---|
| L1 | Header fixo: transparente no hero, sólido no cardápio; carrinho com contador; menu hambúrguer no celular | `src/components/store/Header.tsx` |
| L2 | Hero cinematográfico com animação **controlada pelo scroll**, chegando ao cardápio em ~2 rolagens (pizza fatiada que gira/separa fatias, ingredientes flutuando, nome gigante ao fundo). Rolagem com "encaixe" interrompível e respeito a `prefers-reduced-motion` | `src/components/store/Hero.tsx` |
| L3 | Cardápio: título, busca (ignora acentos), barra de categorias fixa com destaque da categoria visível | `src/components/store/Menu.tsx` |
| L4 | "Ofertas da semana" (carrossel com setas e bolinhas) e "As mais pedidas", ambas controladas pelo painel | `Menu.tsx` |
| L5 | Cards de produto: foto, selo (Promoção/Mais pedida/Novidade), descrição, "a partir de", preço riscado, botão +; layout horizontal em telas <400 px | `src/components/store/ProductCard.tsx` |
| L6 | Modal do produto: foto grande, ingredientes, **tamanhos com preço dinâmico**, **sabores (meio a meio / 1/3)**, adicionais, observações, quantidade; bottom-sheet no celular; edição a partir do carrinho | `src/components/store/ProductModal.tsx` |
| L7 | Carrinho em gaveta lateral: +/−, remover, editar, subtotal, taxa, total; salvo no navegador | `src/components/store/CartDrawer.tsx`, `cart.tsx` |
| L8 | Checkout: nome, telefone (máscara), Entrega/Retirada/**Mesa**, endereço, formas de pagamento do painel, "precisa de troco?" | `CartDrawer.tsx` |
| L9 | Finalização: servidor recalcula tudo, grava o pedido e abre o **WhatsApp com a mensagem completa**; tela de confirmação | `src/app/api/orders/route.ts`, `src/lib/whatsapp.ts` |
| L10 | **Pedido na mesa**: QR Code por mesa (`/?mesa=N`), selo "Mesa N", telefone opcional, sem WhatsApp | `cart.tsx`, `CartDrawer.tsx`, `src/app/admin/mesas` |
| L11 | Barra flutuante "Ver carrinho" no celular, toast "adicionado" | `src/components/store/Sections.tsx` |
| L12 | Seções: benefícios, sobre (foto editável), CTA final, rodapé com contato/horários | `Sections.tsx` |
| L13 | Loja aberta/fechada: aviso no hero e no cardápio; servidor recusa pedidos com a loja fechada | `Sections.tsx`, `orders.ts` |

### Painel administrativo (`/admin`)
| # | Funcionalidade | Onde está |
|---|---|---|
| A1 | Login com limite de tentativas; perfis **Administrador** e **Atendente** | `src/app/admin/login`, `src/lib/server/auth.ts` |
| A2 | Sidebar escura, botão abrir/fechar loja, contador de pendentes, **alerta sonoro de pedido novo** (consulta a cada 12 s) | `src/components/admin/AdminShell.tsx` |
| A3 | Dashboard: faturamento, lucro estimado, pedidos, itens, ticket médio (com % vs período anterior), vendas por dia, mais vendidos, filtro de período | `Dashboard.tsx`, `charts.tsx` |
| A4 | Pedidos em **Kanban** (Pendentes → Em preparo → Saiu para entrega → Finalizados): card expansível, endereço + Google Maps, WhatsApp do cliente, botão **Imprimir**, cancelar | `OrdersBoard.tsx` |
| A5 | Nova venda (balcão/telefone/WhatsApp/mesa), com tamanhos, sabores e adicionais | `NewSale.tsx` |
| A6 | Vendas: tabela com busca, filtros, ordenação, detalhes e exportação CSV | `SalesTable.tsx` |
| A7 | Relatórios: faturamento por dia/semana/mês, pedidos, horários de pico, produtos, categorias, pagamentos, origem | `Reports.tsx`, `src/lib/server/reports.ts` |
| A8 | Cardápio: CRUD de produtos e categorias, ordenar, ativar/desativar, selos, **upload de imagem**, tamanhos com nº de sabores, adicionais, custo % | `MenuManager.tsx` |
| A9 | Configurações: loja aberta/fechada, identidade (logo, nome, frase), **imagens do site**, contato, horários, entrega/valores, formas de pagamento, mensagem do WhatsApp com prévia, **mesas**, **impressão (webhook)**, usuários, troca de senha, apagar dados de demonstração | `SettingsPage.tsx` |
| A10 | Impressão na maquininha via **webhook** (automático por evento + botão + teste) | `src/lib/server/printer.ts` |

---

## 3. Arquitetura

```
src/
  app/
    page.tsx                  loja (server component; await connection() → sempre lê o banco)
    admin/login               login
    admin/(panel)/*           páginas do painel (layout verifica a sessão)
    admin/mesas               QR Codes das mesas (página de impressão)
    api/orders                pedido público
    api/admin/*               rotas do painel (todas chamam requireAdmin)
    uploads/[file]            serve imagens enviadas (guardadas no banco)
  components/store/*          loja (client components)
  components/admin/*          painel (client components) + ui.tsx (Card, Button, Modal, Toggle, Field, PeriodPicker, Stat, api(), useFetch, toast)
  lib/
    types.ts                  tipos compartilhados (dinheiro sempre em CENTAVOS inteiros)
    format.ts                 money(), parseMoney(), formatPhone(), waLink(), flavorPrice()…
    time.ts                   fuso UTC-3, períodos dos relatórios
    whatsapp.ts               monta a mensagem do pedido
    server/db.ts              adaptador Postgres (postgres.js ou PGlite) + schema + migrações
    server/seed.ts            cardápio inicial, configurações padrão, dados de demonstração, migrações de cardápio/fotos
    server/catalog.ts         produtos, categorias, configurações (publicSettings remove dados sensíveis)
    server/orders.ts          validação zod + createOrder (recalcula tudo) + status
    server/auth.ts            sessão HMAC em cookie HttpOnly, scrypt, limite de login
    server/printer.ts         webhook de impressão (texto térmico + JSON + HMAC)
    server/uploads.ts         upload (magic bytes, sharp, recorte redondo do hero)
    server/ratelimit.ts       limites guardados no banco
    server/schemas.ts         zod de produto/categoria/configurações/usuário + isSafeWebhook
```

### Banco (Postgres)
Tabelas: `admins`, `categories`, `products` (sizes/addons/ingredients em JSONB), `orders` (address JSONB, `table_number`), `order_items` (addons/ingredients/flavors JSONB), `settings` (um JSON único), `meta` (versões de migração, segredo de sessão, último envio de impressão), `rate_limits`, `uploads` (imagens em BYTEA).

- O schema é criado sozinho no primeiro acesso (`CREATE TABLE IF NOT EXISTS` + `ALTER TABLE … ADD COLUMN IF NOT EXISTS`).
- **RLS ativado em todas as tabelas**, sem políticas, para que a API pública do Supabase não exponha nada.
- Migrações versionadas pela tabela `meta` (`catalog_version`, `images_version`), protegidas com `pg_advisory_xact_lock`.

### Regras de negócio importantes
- **O preço é sempre recalculado no servidor** a partir do banco; o que o navegador manda é ignorado.
- Tamanhos: `sizes: [{ name, price, oldPrice?, flavors? }]`. Sabores = média dos preços dos sabores escolhidos no mesmo tamanho (`flavorPrice`).
- Status do pedido: `pending → preparing → delivering → done` (+ `canceled`). Só `done` entra no faturamento.
- Origem: `site`, `mesa`, `balcao`, `telefone`, `whatsapp`.

---

## 4. Design system (estrutura reutilizável)

As cores e fontes são **da Pizzaria**. Em outro site, troque os valores mantendo os mesmos papéis.

- **Tokens** em `src/app/globals.css` (`@theme`):
  - `ink-*`: fundos escuros
  - `gold-*`: cor da marca
  - `flame-*`: ações e promoções
  - `cream-*`: fundo claro do painel
  - Fontes: `--font-display` (títulos, Anton) e `--font-sans` (texto, Manrope)
- **Componentes base:**
  - Botões: `.btn`, `.btn-flame`, `.btn-gold`, `.btn-ghost`
  - Campo de formulário: `.field`
  - Utilitários: `text-gold`, `text-outline-gold`, `grain`, `no-scrollbar`
- **Loja:**
  - Fundo escuro premium, títulos grandes em caixa alta, cards arredondados (`rounded-2xl/3xl`) com borda sutil.
  - Hover com elevação, microanimações com Framer Motion (`MotionConfig reducedMotion="user"`).
- **Painel:**
  - Sidebar escura com item ativo na cor da marca (`layoutId` animado), conteúdo em fundo claro (`cream-50`), cards brancos.
  - Títulos display grandes, KPIs com variação percentual.
- **Gráficos:**
  - Série única na cor da marca com contraste ≥ 3:1 sobre branco (validado), tooltip, botão "Ver tabela".
  - Rankings em barras horizontais em HTML.
- **Acessibilidade:**
  - Foco visível, áreas de toque de 44 px, `aria-label` em botões só de ícone e link "Pular para o conteúdo".
  - Fonte de 16 px nos campos (evita zoom no iOS) e layout mobile-first.

---

## 5. Segurança (já aplicada; replique)

- Senhas com scrypt. Sessão em cookie `HttpOnly` + `SameSite=Lax` + `Secure`, assinado com HMAC (`SESSION_SECRET`).
- `requireAdmin(roles)` em **toda** rota do painel. Página do painel protegida por `guardPage`.
- Limites no banco: login (5 tentativas a cada 15 min por IP+e-mail) e pedidos (8 a cada 10 min por IP).
- Toda entrada é validada com zod. As queries são sempre parametrizadas (`$1…`). JSON vai como `$1::text::jsonb`.
- Upload:
  - Tipo verificado pelos bytes do arquivo, limite de 4 MB.
  - Imagem reprocessada com sharp (remove EXIF) e salva com nome UUID.
  - O painel reduz fotos grandes antes de enviar.
- Webhook de impressão:
  - Só `https` público, bloqueando IPs internos (evita SSRF).
  - Token mascarado no painel e removido das configurações públicas (`publicSettings`).
- Cabeçalhos:
  - CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, HSTS.
  - Source maps desligados.
- Exportação CSV protegida contra injeção de fórmulas.
- Em produção, `ADMIN_PASSWORD` é obrigatória: a senha padrão do código nunca é usada.

---

## 6. Deploy (Vercel + Supabase)

Variáveis de ambiente:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | URL do **Transaction pooler** (porta 6543) |
| `SESSION_SECRET` | 64+ caracteres aleatórios |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Primeiro acesso ao painel |
| `SITE_URL` | Endereço final do site |
| `SEED_DEMO_ORDERS` | `false` para começar sem pedidos de demonstração |

Sem `DATABASE_URL`, o desenvolvimento local usa o PGlite em `./data` (ignorado pelo git).

---

## 7. Problemas já enfrentados (não repita)

1. **SQLite não funciona na Vercel:** o disco é temporário. Use Postgres.
2. **`postgres.js` codifica JSON duas vezes** quando o parâmetro é `$1::jsonb`. Use `$1::text::jsonb`.
3. **Pooler do Supabase:** exige `prepare: false`. Use a URL do *Transaction pooler*; a conexão direta não funciona na Vercel.
4. **Limite de requisição da Vercel (~4,5 MB):** reduza as fotos no navegador antes do upload.
5. **Limites e segredo em memória não funcionam em serverless:** guarde no banco.
6. **`await` esquecido em `ok({ x: funcaoAsync() })`:** o TypeScript não acusa e a resposta vira `{}`.
7. **Next 16:** `params` e `cookies()` são assíncronos, e `middleware` agora se chama `proxy`. Para tarefas depois da resposta (ex.: imprimir), use `after()` de `next/server`.
8. **Pasta dentro do OneDrive:** o sandbox do Codex colocou uma regra de NEGAR gravação. Mantenha os projetos em `C:\Users\Riquelme\projetos\`.
9. **Hidratação no React:** não use `Date.now()`, `Math.random()` ou `useReducedMotion` no `initial` durante o render.
10. **Animação parada:** a tela de confirmação não anima quando o WhatsApp abre em outra aba, porque o navegador pausa a aba de fundo. Isso é esperado.
