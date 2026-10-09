Vamos evoluir o site da hamburgueria **The Burgue** usando como referência o sistema que fizemos para a Pizzaria São Paulo.

## Referência (leia antes de qualquer coisa)
1. Leia por inteiro o blueprint: `C:\Users\Riquelme\projetos\pizzaria-sao-paulo\docs\BLUEPRINT_SISTEMA.md`
2. O código completo da pizzaria está em `C:\Users\Riquelme\projetos\pizzaria-sao-paulo` (GitHub: https://github.com/teixeirzkj/teste). Sempre que for implementar algo, abra o arquivo correspondente da pizzaria e reaproveite a lógica e os padrões. Não copie textos, fotos, cores, logo ou nomes da pizzaria.

## Passo 1 — Analise o The Burgue (só leitura, não altere nada ainda)
Analise o projeto da pasta atual e me mostre:
- Stack, como roda, onde está hospedado e qual banco usa (se usa).
- As páginas e funcionalidades que **já existem** (loja e painel/admin).
- A **identidade visual** atual: cores (é uma marca de tons mais claros), fontes, logo, estilo dos botões e cards. Ela deve ser **mantida**.

## Passo 2 — Compare com o blueprint
Use o checklist da seção 2 do blueprint (L1–L13 e A1–A10) e me entregue uma tabela curta:
- ✅ **já tem** no The Burgue
- ➕ **falta** (o que precisa adicionar)
- ⛔ **não se aplica** a hamburgueria (ex.: meio a meio / sabores de pizza, pizza fatiada no hero)

Liste **só o que precisa adicionar** e, para cada item, uma linha explicando o que é. Para hamburgueria, sugira as adaptações, por exemplo:
- Personalização do lanche: ponto da carne, adicionais (bacon, cheddar, ovo), remover ingredientes, trocar o pão.
- Combos com escolha de batata e bebida.
- Hero animado próprio com o hambúrguer (camadas que se separam no scroll), no lugar da pizza.

## Passo 3 — Pergunte antes de implementar
Use perguntas de múltipla escolha para eu decidir:
- Quais itens da lista "falta" devem ser adicionados (pode marcar vários).
- Banco e hospedagem (se o site ainda não tiver): seguir o padrão Vercel + Supabase do blueprint?
- Pedido na mesa (QR Code) e impressão na maquininha (webhook): sim ou não agora?
- Qualquer dúvida de regra de negócio (preços, tamanhos, adicionais, taxa de entrega).

**Não implemente nada antes das minhas respostas.**

## Passo 4 — Implementar (depois das respostas)
- **Design:** deixe a loja e o painel com a mesma estrutura e qualidade de layout da pizzaria. Isso inclui hero com animação no scroll, cards, modal do produto, carrinho em gaveta, checkout, painel com sidebar, Kanban de pedidos, dashboard e relatórios. **Mantenha a identidade visual do The Burgue**: paleta clara, logo e fontes dele. Adapte os tokens de cor do blueprint (seção 4) para as cores do The Burgue, sem trazer o preto e dourado da pizzaria.
- **Conteúdo atual:** não apague nem reescreva o que já existe sem me perguntar.
- **Segurança e pegadinhas:** siga a seção 5 (segurança) e a seção 7 (problemas já enfrentados) do blueprint.
- **Responsividade:** mobile-first; teste no celular (390 px) e no computador.
- **Testes:** rode tipos, lint e build, e teste o fluxo de pedido de ponta a ponta antes de me dizer que terminou.
- **Commits:** só faça commit e push quando eu pedir.
