Entre Tempos — sessão persistente dos pesquisadores

Substitua no projeto:
- js/admin-login.js
- js/admin-painel.js
- admin/painel.html

Mudanças:
- o login usa browserLocalPersistence e redireciona automaticamente para o painel quando o pesquisador já está autenticado;
- somente o UID autorizado é aceito;
- o painel não executa mais signOut();
- o botão "Sair" virou "← Voltar" e retorna para ../faca-parte.html sem encerrar a sessão;
- abrir painel.html sem a conta autorizada retorna para Faça Parte.

Observação:
A sessão pode ser perdida se os dados/cookies do site forem apagados, se usar outro navegador/perfil/dispositivo ou se a sessão for revogada no Firebase.
