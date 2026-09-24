/* =====================================================================
   HORÁRIOS — versão com GitHub (status salvo em horarios-status.json)
   ===================================================================== */
(function (global) {

  // ⚠️ CONFIGURE AQUI (já está preenchido corretamente)
  const GITHUB_OWNER = 'Samuel-Castroo007';   // seu usuário do GitHub
  const GITHUB_REPO  = 'Acess-ria.Esportiva';  // nome exato do repositório
  const GITHUB_BRANCH = 'main';
  const STATUS_FILE = 'horarios-status.json';

  // Grade fixa da semana
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

  function slotId(dayKey, slot) {
    return dayKey + '__' + slot;
  }

  function configured() {
    return GITHUB_OWNER && GITHUB_REPO &&
           GITHUB_OWNER !== 'SEU-USUARIO' &&
           GITHUB_REPO !== 'SEU-REPOSITORIO';
  }

  // Lê o status publicamente (sem token)
  async function fetchStatusMap() {
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${STATUS_FILE}?t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Não foi possível carregar os horários');
    return await res.json();
  }

  // Lê o arquivo + sha (usado pelo admin)
  async function fetchStatusFile(token) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${STATUS_FILE}?ref=${GITHUB_BRANCH}`;
    const res = await fetch(url, {
      headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) throw new Error('Erro ao ler arquivo de status');
    const data = await res.json();
    const content = JSON.parse(atob(data.content.replace(/\n/g, '')));
    return { map: content, sha: data.sha };
  }

  // Salva o status no GitHub
  async function saveStatusFile(token, map, sha, message) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${STATUS_FILE}`;
    const body = {
      message: message || 'Atualização de horários',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(map, null, 2)))),
      branch: GITHUB_BRANCH,
      sha: sha
    };
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: 'token ' + token,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.message || 'Erro ao salvar');
      e.status = res.status;
      throw e;
    }
    const data = await res.json();
    return data.content.sha;
  }

  // Valida o token
  async function validateToken(token) {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
      headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) throw new Error('Token inválido ou sem permissão no repositório');
  }

  global.HorariosData = {
    SCHEDULE,
    GITHUB_OWNER,
    GITHUB_REPO,
    slotId,
    configured,
    fetchStatusMap,
    fetchStatusFile,
    saveStatusFile,
    validateToken
  };

})(window);
