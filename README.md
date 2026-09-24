# Site Samuel Castro — Acessoria Esportiva

Este pacote tem 6 arquivos, todos feitos para viver juntos na raiz de um
mesmo repositório do GitHub:

| Arquivo | Para que serve |
|---|---|
| `index.html` | Site público (Início, Planos, Sobre, Resultados, Horários, Contato) |
| `admin.html` | Painel para você marcar horários como Livre/Ocupado (não aparece no menu do site) |
| `horarios-data.js` | Grade de horários + toda a lógica de sincronizar com o GitHub |
| `horarios-status.json` | Onde ficam guardados os status (Livre/Ocupado) de cada horário |
| `manifest.json` | Deixa o site instalável como app no celular |
| `og-image.jpg` | Imagem que aparece quando o link é compartilhado no WhatsApp/Instagram |

## Como as páginas "conversam" entre si

- `index.html` e `admin.html` **só** compartilham dados através do arquivo
  `horarios-status.json`, guardado dentro do repositório do GitHub.
- Quando você marca um horário como Ocupado no `admin.html`, ele grava essa
  mudança nesse arquivo usando a API do GitHub (por isso pede um token).
- Quando qualquer visitante abre a página "Horários" do site, o
  `index.html` lê esse mesmo arquivo direto do GitHub (sem precisar de
  token, pois o arquivo é público). A leitura se repete sozinha a cada
  ~45s, e também tem um botão "Atualizar".
- Assim, uma alteração feita por você aparece para **qualquer pessoa, em
  qualquer aparelho** — e não só no seu próprio navegador, que era a
  limitação da versão anterior (que usava `localStorage`).

## Passo a passo para publicar

### 1. Crie o repositório
No GitHub, crie um repositório novo, **público** (necessário para a leitura
funcionar sem login), com o nome que preferir — por exemplo `site-samuel`.

### 2. Suba os 6 arquivos
Envie os 6 arquivos deste pacote para a raiz do repositório (não dentro de
nenhuma subpasta).

### 3. Configure o repositório em `horarios-data.js`
Abra `horarios-data.js` e troque:
```js
const GITHUB_OWNER  = 'SEU-USUARIO';       // seu usuário do GitHub
const GITHUB_REPO   = 'SEU-REPOSITORIO';   // nome do repositório
```
pelos valores reais. Exemplo, se o repositório é `github.com/samuelcastro/site-samuel`:
```js
const GITHUB_OWNER  = 'samuelcastro';
const GITHUB_REPO   = 'site-samuel';
```

### 4. Ajuste os links de compartilhamento em `index.html`
No `<head>` do `index.html`, troque as duas ocorrências de
`SEU-USUARIO.github.io/SEU-REPOSITORIO` pela URL real (linhas `og:url` e
`og:image`).

### 5. Ative o GitHub Pages
No repositório: **Settings → Pages → Source: "Deploy from a branch" → Branch:
"main" / pasta "/ (root)" → Save**. Em ~1 minuto o site fica no ar em
`https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

### 6. Crie o seu token de acesso
Em <https://github.com/settings/personal-access-tokens/new>:
- **Repository access:** só o repositório deste site (não "todos os
  repositórios").
- **Permissions → Contents:** "Read and write".
- Defina uma validade (por exemplo 90 dias) e gere o token.
- Copie o token na hora — o GitHub só mostra ele uma vez.

### 7. Acesse o painel
Abra `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/admin.html`, cole o
token, marque "Lembrar neste aparelho" se for usar sempre do mesmo celular,
e clique em Entrar. Toque em qualquer horário para alternar entre Livre e
Ocupado — é salvo na hora.

## Sobre a segurança do admin.html

O `admin.html` não tem um "login" de verdade no sentido de servidor — é uma
página estática, como qualquer outra do site. Quem realmente autoriza a
gravação é o token do GitHub, não uma senha. Por isso:

- Use um token **fine-grained**, restrito a **um único repositório** e só
  com permissão de **Contents** — assim, mesmo que vaze, ele não dá acesso
  a mais nada da sua conta.
- Não compartilhe o link do `admin.html` nem o token publicamente. O link
  não aparece em nenhum menu do site, mas qualquer pessoa que souber o
  endereço pode abri-lo (só não vai conseguir salvar nada sem o token).
- Se desconfiar que o token vazou, revogue-o em
  <https://github.com/settings/personal-access-tokens> e crie outro.

## Se preferir não usar o GitHub como banco de dados

Isso é opcional — é só a página "Horários". Se quiser, dá para remover o
link "Horários" do menu e a seção correspondente do `index.html` e seguir
usando o restante do site normalmente, sem nenhuma configuração de GitHub.
