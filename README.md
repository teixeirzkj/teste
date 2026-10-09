# Pizzaria São Paulo — loja online + painel

Cardápio online com hero animado, carrinho, checkout e pedido finalizado no WhatsApp, e um painel administrativo completo (pedidos em Kanban, nova venda, vendas, relatórios, cardápio e configurações), tudo ligado a um banco de dados Postgres.

**Tecnologias:** Next.js 16 · React 19 · Tailwind CSS 4 · Framer Motion · Recharts · Postgres (Supabase em produção, PGlite no desenvolvimento) · sharp · zod.

## Rodar local

Requisito: **Node.js 22 ou mais novo**.

```bash
npm install
npm run dev          # http://localhost:3000
```

Sem `DATABASE_URL`, o site usa um Postgres embutido salvo em `./data` (não precisa instalar nada). No primeiro acesso ele cria as tabelas, o cardápio inicial e cerca de 45 dias de pedidos de demonstração.

- Loja: `http://localhost:3000`
- Painel: `http://localhost:3000/admin` — `admin@pizzariasaopaulo.com.br` / `saopaulo2026`

## Publicar na Vercel + Supabase

### 1. Supabase (banco)
1. Crie um projeto em [supabase.com](https://supabase.com). Região **South America (São Paulo)** e anote a senha do banco.
2. Abra **Connect** (topo da página) → **Connection string** → **Transaction pooler** e copie a URL (porta **6543**). Troque `[YOUR-PASSWORD]` pela senha. Se a senha tiver `@ # / ?` ou espaço, codifique esses caracteres (`@` = `%40`, `#` = `%23`).

Não precisa criar tabelas: o site cria tudo sozinho no primeiro acesso, com RLS ativado para que a API pública do Supabase não exponha nada.

### 2. GitHub
Suba esta pasta para um repositório (privado de preferência). A pasta `data/` e os arquivos `.env*` já estão no `.gitignore`.

### 3. Vercel
1. Em [vercel.com/new](https://vercel.com/new), importe o repositório. O framework (Next.js) é detectado sozinho.
2. Em **Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | URL do Transaction pooler do Supabase |
| `SESSION_SECRET` | 64+ caracteres aleatórios: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` | e-mail do primeiro acesso ao painel |
| `ADMIN_PASSWORD` | senha forte do primeiro acesso |
| `SITE_URL` | endereço final do site (ex.: `https://pizzariasaopaulo.com.br`) |
| `SEED_DEMO_ORDERS` | `false` para começar sem pedidos de demonstração |

3. **Deploy.** Abra o site uma vez: esse primeiro acesso cria o banco (pode levar alguns segundos).
4. Opcional: **Settings → Domains** para ligar um domínio próprio. Depois, atualize `SITE_URL`.

`ADMIN_EMAIL`, `ADMIN_PASSWORD` e `SEED_DEMO_ORDERS` só valem na **primeira** inicialização do banco. Depois disso, gerencie usuários e senhas pelo painel.

As funções rodam na região de São Paulo (`vercel.json` → `gru1`), perto do banco.

## Estrutura

| Pasta | O que tem |
|---|---|
| `src/app/page.tsx` | Loja pública (lê o banco a cada acesso: mudanças no painel aparecem na hora) |
| `src/components/store/` | Hero com animação por scroll, cardápio, modal do produto, carrinho/checkout |
| `src/app/admin/` | Login e páginas do painel |
| `src/components/admin/` | Dashboard, Kanban de pedidos, nova venda, vendas, relatórios, cardápio, configurações |
| `src/app/api/` | API (`/api/orders` é pública; `/api/admin/*` exige login) |
| `src/lib/server/` | Banco, autenticação, pedidos, relatórios, upload |

As imagens enviadas pelo painel ficam no próprio banco (tabela `uploads`) e são servidas em `/uploads/…` com cache permanente na CDN da Vercel.

## Como funciona o pedido

1. O cliente monta o carrinho e preenche entrega/pagamento.
2. `POST /api/orders` **recalcula todos os preços no servidor** a partir do banco (o valor enviado pelo navegador é ignorado), grava o pedido como *Pendente* e devolve a mensagem pronta.
3. O WhatsApp da pizzaria (configurável) abre com a mensagem preenchida.
4. O pedido aparece em **Pedidos** com alerta sonoro: Pendente → Em preparo → Saiu para entrega → Finalizado. Só pedidos finalizados entram no faturamento.

### Pedido na mesa
- Ligue em **Configurações → Mesas** e informe quantas mesas existem.
- **Imprimir QR Codes das mesas** gera uma plaquinha por mesa. O QR abre `/?mesa=N`, e o checkout já vem com "Mesa N" selecionada.
- Na mesa o telefone é opcional, não há taxa de entrega e o WhatsApp não é aberto: o pedido vai direto para **Pedidos** (selo "MESA N") e para a maquininha.
- No balcão, a **Nova venda** também tem a opção "Mesa".

### Impressão na maquininha (webhook)
Em **Configurações → Impressão na maquininha**, informe o endereço `https://` que recebe os pedidos (o webhook do app da maquininha ou uma automação, ex. n8n) e, se houver, o token.

- **Quando envia:** a cada pedido do site e a cada nova venda (dá para ligar e desligar cada um), e no botão **Imprimir** de cada pedido.
- **Corpo:** `POST` JSON com `evento` (`pedido_novo`, `nova_venda`, `reimpressao` ou `teste`), `pedido` (dados estruturados) e `texto` (pronto para impressora térmica, igual à mensagem do WhatsApp, sem emojis).
- **Com token:** vai junto `Authorization: Bearer <token>` e `X-Pizzaria-Assinatura: sha256=<HMAC do corpo>`.
- **Segurança:** o endereço e o token nunca vão para o navegador do cliente. No painel, o token aparece mascarado.

## Segurança aplicada

- Senhas com scrypt; sessão em cookie `HttpOnly` + `SameSite=Lax` + `Secure`, assinado com HMAC.
- Limite de tentativas de login (5 a cada 15 min) e de pedidos por IP, com contadores no banco (funciona com várias instâncias da Vercel).
- Autorização checada em todas as rotas do painel; perfis **Administrador** e **Atendente** (atendente acessa só pedidos, nova venda e vendas).
- Todas as queries são parametrizadas; toda entrada é validada com zod.
- RLS ativado em todas as tabelas do Supabase (sem políticas = nada acessível pela chave pública).
- Upload: tipo verificado pelos bytes do arquivo, limite de 4 MB (o painel reduz fotos grandes antes de enviar), imagem reprocessada (remove metadados) e salva com nome UUID.
- Cabeçalhos: CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, HSTS; source maps desligados.
- Exportação CSV protegida contra injeção de fórmulas.

## Imagens

As fotos padrão dos produtos ficam em `public/img/produtos/` (uma por item do cardápio).

- **Trocar ou remover a foto de um produto:** Cardápio → Editar → Trocar imagem ou ✕. Produtos novos recebem foto do mesmo jeito.
- **Pizza da abertura e foto do "Sobre nós":** Configurações → Imagens do site. A pizza é recortada em círculo automaticamente.
- **Migração:** ao subir fotos padrão novas, ela troca só as fotos que ainda são as padrão. Uma imagem enviada pelo painel nunca é substituída.
