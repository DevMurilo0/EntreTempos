# Imagens, vídeos e otimização

## Regras gerais pra mídia nova

- Formato preferido pra imagem: **`.webp`**. É o que domina o
  repositório inteiro. Só usa `.svg` pros placeholders de retrato
  (`placeholder-retrato.svg`, usado quando um aluno ainda não mandou
  foto) e `.png` só quando precisa de transparência que o processo
  de conversão não resolveu bem.
- Vídeo: `.mp4` na maioria, mas a pasta do Bruno em Talento Musical
  usa `.webm` — os dois funcionam, `.mp4` é só o mais comum aqui.
- Toda imagem decorativa carrega com
  `loading="lazy" decoding="async"` no `<img>` (ver
  `01-visao-geral.md`).
- Imagem de cada seção mora dentro da própria pasta daquela seção
  (`topicos/desenhos/img/`, não solta em `img/` da raiz — essa pasta
  raiz é só pra capa/menu).

## Os scripts de otimização

Tem duas gerações de script Python fazendo basicamente a mesma coisa
(comprimir imagem pesada), porque foram escritos em momentos
diferentes. Ambos exigem Pillow (`pip install Pillow`).

### `optimize_media.py` (raiz do projeto — o mais recente)

Varre o projeto inteiro (ignorando `.git`, `.gemini`, `node_modules`),
e pra cada imagem:
- Redimensiona se a maior dimensão passar de **1920px**.
- Re-salva com compressão: `.webp` em qualidade 82 (método 6,
  otimizado), `.jpg`/`.jpeg` convertido pra RGB e salvo em qualidade
  82, `.png` otimizado sem perda.
- Salva num arquivo temporário (`.tmp<ext>`) antes de substituir o
  original — assim, se o processo falhar no meio, o arquivo original
  não fica corrompido.

Rodar: `python3 optimize_media.py` na raiz do projeto.

### `scripts/otimizacao_imagens/` (a versão mais antiga)

Dois scripts que trabalham em conjunto:

1. **`optimize_images.py`** — varre o projeto procurando imagem acima
   de **100KB**, comprime (preservando transparência quando existe) e
   registra as mudanças de nome/caminho em `image_changes.json`.
2. **`update_html.py`** — lê esse `image_changes.json` e varre todo
   `.html` do projeto trocando as referências antigas pelas novas, e
   de quebra já garante que todo `<img>` tenha
   `loading="lazy" decoding="async"`.

Rodar os dois em sequência, dentro da pasta
`scripts/otimizacao_imagens/`: primeiro `optimize_images.py`, depois
`update_html.py`.

**Se for otimizar imagem em massa de novo:** prefira o
`optimize_media.py` da raiz — é o mais novo e não depende de rodar
dois scripts em sequência. Os logs (`opt.log`, `update.log`,
`cleanup.log`) que aparecem depois de rodar são só histórico de
execução, pode ignorar ou apagar sem problema.

## Um patch isolado que apareceu no repo

Tem um arquivo solto, `topicos/poemas/autorais/autorais/pessoa_patch.py`,
que é um script pontual — ele abre um `pessoa.css` específico e troca
um bloco de CSS antigo (papel manchado) por um novo (papel amarelado
amassado), via substituição de texto exato. Não é um script
reutilizável nem faz parte de um pipeline — foi uma correção pontual
de estilo feita via script em vez de editar o CSS na mão. Pode
apagar com segurança se o `pessoa.css` daquela pasta já estiver com o
resultado aplicado (confira o CSS atual antes de deletar, só por
garantia).
