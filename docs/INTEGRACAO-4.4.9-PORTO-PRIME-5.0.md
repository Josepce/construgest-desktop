# Integração das melhorias 4.4.9 no Porto Prime 5.0

Origem: `josepfor/porto-prime-gestao-comercial`, commit `78c5e0cbe86532c16216e3115e67b8827e7ebc7d` (21/10/2026).

Destino: branch `release/5.0-commercial-readiness` de `Josepce/construgest-desktop`.

## Integrado
- Finalização de vendas idempotente para evitar cobranças/vendas duplicadas após respostas incertas e tentativas repetidas.
- Migrações aditivas no banco de dados para `idempotency_key`, `request_hash` e imagem única no cadastro de produtos.
- Reutilização do identificador pendente pelo PDV, respeitando respostas HTTP de conflito.
- Cadastro de imagem do produto e estilos limitados **somente** ao campo de imagem.
- Comportamento de formulários do cadastro e avanço por Enter vindo das alterações de `public/app.js`.
- Teste de regressão `scripts/check-sale-idempotency.cjs` ativado nos workflows de Windows.
- Geração do arquivo `SHA256SUMS.txt` para os downloads oficiais do Windows.

## Mantido intencionalmente
- Correções de segurança do login, recuperação administrativa, isolamento Electron e restrições de visualização de custos.
- Layout atual de vendas, PDV e demais módulos já aprovado. A ampla alteração de tema em `public/style.css` e `public/pdv-4112.css` da origem **não** foi trazida, pois mudaria o visual.
- A versão do pacote permanece temporariamente em `4.4.8` enquanto a revisão não é liberada; ela **não** indica que a implementação de 4.4.9 esteja ausente.
- `main` continua intacta.

## Critérios ainda pendentes
- Conferir todos os testes de regressão do GitHub Actions e corrigir eventuais falhas.
- Testar finalização concorrente e repetida de vendas em ambiente funcional.
- Testar uma atualização Windows sobre um banco real com backup e restauração.
- Confirmar integridade dos artefatos ZIP/EXE gerados.
- Revisar segurança e permissões do novo campo de imagem (limites, entrada e armazenamento) antes da liberação comercial.

Não mesclar nem anunciar pronto para venda antes dessas verificações.
