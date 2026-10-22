# Recuperação de senha — Porto Prime (revisão de segurança)

## Alteração
A redefinição da senha administrativa requer, além do e-mail, ID da máquina e nova senha, um **código de recuperação local** de 32 caracteres. O código é gerado criptograficamente na primeira inicialização com a atualização e permanece no mesmo diretório de dados.

## Onde encontrar o código
O arquivo chama-se `porto-prime-recovery-code.txt` e é armazenado no diretório de dados da instalação, ao lado do arquivo `porto-prime.license`. Em instalações padrão, costuma estar em `%APPDATA%\Porto Prime`, mas o programa pode selecionar um diretório legado do sistema; por isso, localizar o arquivo `porto-prime.license` ou consultar o registro `porto-prime-startup.log` para saber o caminho efetivo.

1. No próprio computador do cliente, abra o arquivo local de recuperação.
2. Digite o código na área **Esqueci minha senha / Recuperar acesso**.
3. Confirme e defina uma senha administrativa forte.
4. Não envie o código em mensagens públicas, prints ou chamados sem controle de acesso.

**Importante:** qualquer pessoa que consiga ler esse arquivo e acessar o computador pode ter os requisitos para redefinir a senha. Proteja o perfil de usuário do Windows e os arquivos de dados. O código não substitui os controles de acesso ao próprio Windows.

## Comportamento e compatibilidade
- A rota de redefinição agora valida o segredo, além do identificador da máquina, e recebe limitação de tentativas.
- O código não é retornado por nenhuma rota HTTP do sistema.
- O segredo não muda em reinicializações normais.
- As rotas de recuperação continuam limitadas a conexões vindas do próprio computador.
- A atualização não altera diretamente os dados comerciais existentes.
- Uma perda do arquivo de recuperação exige procedimento de suporte e diagnóstico; não recrie manualmente um segredo sem antes preservar os dados do cliente.

## Pendências antes de comercializar
- Fazer teste funcional completo em Windows instalado e atualizado.
- Validar os backups e restaurá-los em ambiente de teste.
- Revisar as permissões do diretório local, do servidor LAN e das contas de usuário.
- Revisar proteção do mecanismo de demonstração offline: um segredo HMAC embutido em código distribuído pode ser extraído, portanto não oferece proteção forte contra adulteração deliberada.
- Avaliar assinatura do aplicativo e política de revogação de licenças.
- Avaliar tornar privado o repositório antes da distribuição comercial.
