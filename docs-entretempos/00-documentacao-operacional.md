# Entre Tempos — documentação operacional

Este documento é a porta de entrada para quem precisa manter a revista eletrônica **Entre Tempos** sem depender de uma única pessoa.

## Referências oficiais

- Site: https://entretempos.blog.br/
- Repositório: https://github.com/DevMurilo0/EntreTempos
- Hospedagem: Vercel
- Projeto Firebase: `entretempos-27471`
- Cloudinary cloud name: `uaisf2vc`
- Upload preset usado pelo site: `entre_tempos_upload`
- Google tag usada nas páginas: `G-GJFVC2LH9T`

## Como a documentação está dividida

- **08-manual-pesquisadores.md** — uso diário da revista: login, inscrições, pessoas, poemas, desenhos, músicas, curiosidades, Tops e podcast.
- **09-manual-programadores.md** — arquitetura, hospedagem, deploy, Firebase, Firestore, Authentication, Cloudinary, dados, manutenção e riscos.
- **10-plataformas-integracoes-e-acessos.md** — para que serve cada plataforma, quais identificadores são públicos, como conceder acesso e o que nunca deve ser salvo no GitHub.

As documentações antigas de `01` a `07` continuam úteis para entender a estrutura histórica e visual do projeto, mas algumas descrições ficaram desatualizadas porque o Entre Tempos deixou de ser apenas um site estático. Para operação atual, estes documentos novos devem ter prioridade.

## Regra de segurança

O repositório é público. Portanto:

- não colocar senhas no código ou na documentação;
- não colocar códigos de recuperação, cookies de sessão ou tokens privados;
- não colocar API secret do Cloudinary;
- não colocar credenciais administrativas do Firebase;
- não colocar senha do e-mail usado nas plataformas;
- não colocar chave privada de qualquer serviço.

A configuração web do Firebase presente no front-end é pública por natureza. O que protege os dados são as regras do Firestore/Authentication e a autorização do sistema.

## Fluxo geral

1. O código fica no GitHub.
2. Push na branch principal atualiza o projeto hospedado na Vercel.
3. O domínio `entretempos.blog.br` aponta para a hospedagem.
4. O front-end carrega dados dinâmicos do Firebase/Firestore.
5. A autenticação Firebase identifica pesquisadores e visitantes anônimos.
6. Imagens e vídeos enviados pela área editorial vão para o Cloudinary.
7. Os Tops usam Firestore e upvotes para classificação dinâmica.
8. O Google tag mede acessos; Search Console acompanha indexação.
