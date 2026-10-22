# Porto Prime 5.0.0 — candidato a lançamento

## Melhorias incluídas
- Visual minimalista azul fosco aplicado à interface e ao PDV.
- Reabertura segura das janelas de impressão, com teste de geração de PDF confirmado no computador do usuário.
- Prevenção de vendas duplicadas em caso de reenvio da finalização.
- Cadastro de produtos com imagem.
- Limitação de tentativas de login, proteção adicional de recuperação administrativa e isolamento de janelas Electron.
- Melhorias na validação dos registros da demonstração gratuita e no controle de acesso a preços de custo.
- Testes automatizados de módulos comerciais, impressão, segurança e integridade das vendas.
- Pacotes Windows portátil, instalador, atualizador e ZIP.

## Importante para atualizar instalações existentes
1. Antes de instalar, faça backup lógico pelo próprio Porto Prime e copie-o para um local seguro.
2. Feche o Porto Prime e seus processos antes de executar o atualizador.
3. Não apague o diretório de dados do usuário; a aplicação pode usar um caminho legado selecionado na inicialização.
4. Após a atualização, confirme login, cadastros, vendas, caixa, emissão de PDF e arquivos de backup.
5. Se qualquer verificação falhar, preserve os dados e procure suporte antes de reinstalar ou restaurar.

## Aprovação comercial pendente
Identificação da versão como 5.0.0 não é comprovação de prontidão. Antes de marcar este candidato como lançamento estável, confirmar:
- build e testes no commit final;
- backup e restauração real testados;
- atualização instalada sobre base anterior real;
- integridade do ZIP e dos executáveis;
- condições de licenciamento, distribuição e privacidade do repositório.

**Não publicar release oficial ou mesclar à main enquanto esses critérios não forem atendidos.**
