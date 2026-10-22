# Porto Prime 5.0 — plano de prontidão comercial

## Objetivo
Preparar o Porto Prime para os primeiros clientes pagantes, preservando o layout e os fluxos já aprovados. Nenhuma mudança deve chegar à versão estável sem validação automatizada e revisão do impacto nos dados existentes.

## Etapa 1 — estabilidade e distribuição
- [x] Criar branch isolada `release/5.0-commercial-readiness`, baseada na correção de login 4.4.8.
- [x] Corrigir o workflow de Windows para reconhecer versões e nomes de artefatos sem depender de 4.4.7.
- [x] Fazer o workflow de build executar também em branches `release/**`.
- [ ] Validar a execução do workflow no GitHub Actions.
- [ ] Confirmar que o ZIP contém portátil, instalador e atualizador.
- [ ] Confirmar que o instalador/atualizador preserva o diretório de dados do cliente.

## Etapa 2 — segurança antes de vender
- [ ] Revisar acesso local às rotas de recuperação de senha e limitar tentativas.
- [ ] Verificar isolamento do Electron, navegação externa, permissões e origem das requisições.
- [ ] Revisar autenticação, autorização por função e trilha de auditoria.
- [ ] Revisar o armazenamento e a recuperação de backups, incluindo teste real de restauração.
- [ ] Avaliar a exposição do código-fonte e mover o repositório para privado antes de distribuir comercialmente, se não houver motivo para mantê-lo público.
- [ ] Revisar emissão, expiração, revogação e vinculação das licenças.

## Etapa 3 — experiência comercial
- [ ] Testar cadastro/importação de produtos, clientes e fornecedores.
- [ ] Testar venda no PDV, cancelamento, fechamento de caixa e movimentações financeiras.
- [ ] Testar compras, estoque, inventário, orçamentos e relatórios.
- [ ] Testar atualização de uma instalação existente sem perder dados.
- [ ] Definir processo de suporte, política de backup e procedimento de recuperação.

## Etapa 4 — lançamento
- [ ] Executar os testes em uma máquina Windows limpa.
- [ ] Gerar instalador, portátil, atualizador e ZIP com a mesma versão.
- [ ] Publicar notas da versão e instruções de instalação.
- [ ] Liberar para clientes somente após os itens críticos acima passarem.

## Critério de liberação
Build verde, testes essenciais aprovados, ZIP validado, instalação/atualização testada e restauração de backup confirmada. Um build bem-sucedido, sozinho, não comprova que o sistema está pronto para comercialização.
