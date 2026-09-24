/* =====================================================================
   HORÁRIOS — fonte única dos dados e da sincronização via GitHub
   Usado tanto pela página pública (index.html) quanto pela página de
   administração (admin.html).

   COMO FUNCIONA
   O status de cada horário (livre/ocupado) fica salvo dentro do próprio
   repositório do GitHub, no arquivo "horarios-status.json". O admin.html
   grava nesse arquivo usando a API do GitHub (precisa de um token). O
   index.html só lê esse arquivo (não precisa de token, o repositório é
   público). É assim que as duas páginas "conversam": através do arquivo
   guardado no GitHub, não do navegador.

   CONFIGURAÇÃO OBRIGATÓRIA (antes de publicar)
   Troque as duas linhas abaixo pelo seu usuário e o nome do repositório
   no GitHub. Exemplo: se o site é publicado em
   https://samuelcastro.github.io/site-samuel/, então:
     GITHUB_OWNER = 'samuelcastro'
     GITHUB_REPO  = 'site-samuel'
   ===================================================================== */
(function (global) {

  const GITHUB_OWNER  = 'Samuel-Castroo007';       // seu usuário do GitHub
  const GITHUB_REPO   = 'Acess-ria.Esportiva';   // nome do repositório no GitHub
  const GITHUB_BRANCH = 'main';              // branch onde o site é publicado
  const STATUS_FILE   = 'horarios-status.json';

  // Grade fixa da semana. "instrucao" é um horário de turma fixo
  // (não alternável); "slots" são os horários individuais que podem
  // ser marcados como Livre/Ocupado pelo admin.
  const SCHEDULE = [
    { key: 'segunda', day: 'Segunda-feira', instrucao: '19h-21h',
      slots: ['15h-16h', '16h-17h', '17h-18h', '18h-19h'] },
    { key: 'terca', day: 'Terça-feira', instrucao: '17h-19h',
      slots: ['15h-16h', '16h-17h', '19h-20h', '20h-21h'] },
    { key: 'quarta', day: 'Quarta-feira', instrucao: '19h-21h',
      slots: ['15h-16h', '16h-17h', '17h-18h', '18h-19h'] },
    { key: 'quinta', day: 'Quinta-feira', instrucao: '17h-21h',
      slots: ['14h-15h', '15h-16h', '16h-17h'] },
    { key: 'sexta', day: 'Sexta-feira', instrucao: '17h-19h',
      slots: ['15h-16h', '16h-17h', '19h-20h', '20h-21h'] }
  ];

  const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${STATUS_FILE}`;
  const API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${STATUS_FILE}`;

  function configured() {
    return GITHUB_OWNER !== 'SEU-USUARIO' && GITHUB_REPO !== 'SEU-REPOSITORIO';
  }

  function slotId(dayKey, slot) {
    return dayKey + '__' + slot;
  }

  // ---- base64 seguro para UTF-8 (a API do GitHub trabalha em base64) ----
  function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64decode(b64) { return decodeURIComponent(escape(atob(b64))); }

  async function ghError(res) {
    let msg = 'Erro ao falar com o GitHub (HTTP ' + res.status + ').';
    try {
      const j = await res.json();
      if (j && j.message) msg = j.message;
    } catch (e) { /* resposta sem corpo JSON */ }
    if (res.status === 401 || res.status === 403) {
      msg = 'Token inválido, expirado ou sem permissão de escrita neste repositório.';
    }
    const err = new Error(msg);
    err.status = res.status;
    return err;
  }

  // ---- Leitura pública (sem token): usada pela página do site ----
  async function fetchStatusMap() {
    if (!configured()) return {};
    const res = await fetch(RAW_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (res.status === 404) return {}; // arquivo ainda não existe: tudo livre
    if (!res.ok) throw new Error('Não foi possível carregar os horários (HTTP ' + res.status + ').');
    const text = await res.text();
    try { return text ? JSON.parse(text) : {}; }
    catch (e) { return {}; }
  }

  // ---- Leitura autenticada (com token): usada só pelo admin ----
  async function fetchStatusFile(token) {
    const res = await fetch(API_URL + '?ref=' + GITHUB_BRANCH, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }
    });
    if (res.status === 404) return { map: {}, sha: null };
    if (!res.ok) throw await ghError(res);
    const data = await res.json();
    const map = data.content ? JSON.parse(b64decode(data.content.replace(/\n/g, ''))) : {};
    return { map, sha: data.sha };
  }

  // ---- Gravação (com token): cria/atualiza o arquivo no GitHub ----
  async function saveStatusFile(token, map, sha, message) {
    const body = {
      message: message || 'Atualiza horários',
      content: b64encode(JSON.stringify(map, null, 2)),
      branch: GITHUB_BRANCH
    };
    if (sha) body.sha = sha;
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw await ghError(res);
    const data = await res.json();
    return data.content.sha;
  }

  // ---- Confirma se o token funciona e tem acesso ao repositório ----
  async function validateToken(token) {
    const res = await fetch('https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('Token inválido ou sem permissão para este repositório.');
    }
    if (!res.ok) throw new Error('Não foi possível confirmar o repositório (HTTP ' + res.status + ').');
    return true;
  }

  global.HorariosData = {
    SCHEDULE, GITHUB_OWNER, GITHUB_REPO,
    configured, slotId,
    fetchStatusMap, fetchStatusFile, saveStatusFile, validateToken
  };

})(window);
