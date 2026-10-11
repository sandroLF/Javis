// ===== JAVIS — assistente de voz da iFC3D Forja (núcleo reutilizável) =====
// Cada app define window.JAVIS_APP = { nome, contexto(), ferramentas: [...] } antes deste script.
// Ferramenta: { name, description, inputSchema?, escreve?: bool, confirmar?(input) -> texto, execute(input) }
(function () {
  const APP = window.JAVIS_APP;
  if (!APP) return;

  const css = `
  #jv-fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;z-index:400;
    background:radial-gradient(circle at 50% 50%,#fff6dc 0 14%,#e9c46a 22%,#c9a24b 40%,#1a1a1a 62%);box-shadow:0 0 0 2px #c9a24b,0 0 18px rgba(201,162,75,.55),0 6px 16px rgba(0,0,0,.45);
    display:flex;align-items:center;justify-content:center;font:700 13px 'Barlow Condensed',sans-serif;color:#1a1408;letter-spacing:.5px}
  #jv-fab.ouvindo{animation:jvpulse 1.1s ease-in-out infinite}
  #jv-fab.falando{animation:jvpulse .6s ease-in-out infinite}
  @keyframes jvpulse{0%,100%{box-shadow:0 0 0 2px #c9a24b,0 0 14px rgba(201,162,75,.5)}50%{box-shadow:0 0 0 4px #e9c46a,0 0 32px rgba(233,196,106,.9)}}
  #jv-painel{position:fixed;left:0;right:0;bottom:0;z-index:401;display:none;justify-content:center}
  #jv-painel.aberto{display:flex}
  #jv-caixa{width:100%;max-width:560px;height:min(78vh,640px);background:#141414;color:#ece7dc;border-top:2px solid #c9a24b;border-radius:18px 18px 0 0;
    display:flex;flex-direction:column;box-shadow:0 -10px 40px rgba(0,0,0,.6);font-family:'Barlow Condensed',sans-serif;padding-bottom:env(safe-area-inset-bottom,0px)}
  #jv-topo{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #2c2c2c}
  #jv-topo .jv-nucleo{width:30px;height:30px;border-radius:50%;flex-shrink:0;background:radial-gradient(circle,#fff6dc 0 18%,#e9c46a 30%,#c9a24b 48%,#141414 70%);box-shadow:0 0 10px rgba(201,162,75,.6)}
  #jv-topo b{font-family:'Bebas Neue',sans-serif;font-size:24px;color:#c9a24b;letter-spacing:1px;font-weight:400}
  #jv-topo span{font-size:13px;color:#9a938a;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .jv-ico{background:transparent;border:1px solid #2c2c2c;color:#ece7dc;border-radius:8px;min-width:38px;height:36px;font-size:15px;cursor:pointer;font-family:inherit}
  .jv-ico.on{border-color:#c9a24b;color:#c9a24b}
  #jv-msgs{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
  .jv-m{max-width:86%;padding:9px 12px;border-radius:12px;font-size:17px;line-height:1.3;white-space:pre-wrap;word-wrap:break-word}
  .jv-m.eu{align-self:flex-end;background:#c9a24b;color:#1a1408;border-bottom-right-radius:4px}
  .jv-m.jv{align-self:flex-start;background:#1f1f1f;border:1px solid #2c2c2c;border-bottom-left-radius:4px}
  .jv-m.sis{align-self:center;background:none;color:#9a938a;font-size:14px;text-align:center;padding:2px 8px}
  .jv-conf{align-self:stretch;background:#1f1a10;border:1px solid #c9a24b;border-radius:12px;padding:10px 12px;font-size:16px}
  .jv-conf div{margin-bottom:10px}
  .jv-conf button{padding:9px 14px;border-radius:8px;font:700 16px 'Barlow Condensed',sans-serif;cursor:pointer;margin-right:8px}
  .jv-sim{background:#c9a24b;color:#1a1408;border:none}.jv-nao{background:transparent;color:#9a938a;border:1px solid #2c2c2c}
  #jv-base{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #2c2c2c;align-items:flex-end}
  #jv-txt{flex:1;resize:none;min-height:44px;max-height:110px;background:#1f1f1f;border:1px solid #2c2c2c;color:#ece7dc;border-radius:10px;padding:10px;font:17px 'Barlow Condensed',sans-serif}
  #jv-mic{width:52px;height:46px;border-radius:10px;border:none;background:#c9a24b;color:#1a1408;font-size:22px;cursor:pointer;flex-shrink:0}
  #jv-mic.ouvindo{background:#b3423c;color:#fff}
  #jv-env{width:52px;height:46px;border-radius:10px;border:1px solid #c9a24b;background:transparent;color:#c9a24b;font:700 15px 'Barlow Condensed',sans-serif;cursor:pointer;flex-shrink:0}
  #jv-cfg{display:none;padding:10px 14px;border-bottom:1px solid #2c2c2c;font-size:15px;color:#9a938a}
  #jv-cfg.aberto{display:block}
  #jv-cfg select{width:100%;margin-top:4px;background:#1f1f1f;color:#ece7dc;border:1px solid #2c2c2c;border-radius:8px;padding:8px;font:16px 'Barlow Condensed',sans-serif}
  #jv-cfg label{display:flex;align-items:center;gap:8px;margin-top:10px;color:#ece7dc;font-size:15px}
  #jv-cfg input[type=range]{flex:1;width:auto;padding:0;background:none;border:none}
  #jv-cfg input[type=checkbox]{width:20px;height:20px;flex:0 0 auto;padding:0}
  @media (prefers-reduced-motion:reduce){#jv-fab.ouvindo,#jv-fab.falando{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const wrap = document.createElement('div');
  wrap.innerHTML = `
  <button id="jv-fab" aria-label="Abrir o Javis">JAVIS</button>
  <div id="jv-painel" role="dialog" aria-label="Javis">
    <div id="jv-caixa">
      <div id="jv-topo"><div class="jv-nucleo"></div><b>JAVIS</b><span id="jv-sub"></span>
        <button class="jv-ico on" id="jv-som" title="Voz ligada">🔊</button>
        <button class="jv-ico" id="jv-ajuste" title="Ajustes da voz">⚙</button>
        <button class="jv-ico" id="jv-fechar" title="Fechar">✕</button></div>
      <div id="jv-cfg">
        Voz do Javis
        <select id="jv-voz"></select>
        <div id="jv-dica" hidden style="margin-top:8px;color:#e9c46a;font-size:14px;line-height:1.35">Este celular não tem voz masculina em português instalada, então o Javis engrossa a voz feminina.<br>
          <b>iPhone:</b> Ajustes › Acessibilidade › Conteúdo Falado › Vozes › Português (Brasil) › baixe <b>Felipe</b>.<br>
          <b>Android:</b> Configurações › Acessibilidade › Saída de conversão de texto em voz › Mecanismo do Google › Português (Brasil) › escolha uma voz masculina e baixe.<br>
          Depois feche e abra o app de novo e escolha a voz aqui.</div>
        <label>Velocidade <input type="range" id="jv-vel" min="0.7" max="1.4" step="0.05"></label>
        <label>Tom <input type="range" id="jv-tom" min="0.5" max="1.3" step="0.05"></label>
        <label><input type="checkbox" id="jv-continuo"> Conversa contínua (volta a ouvir depois de responder)</label>
        <button class="jv-ico" id="jv-testar" style="margin-top:10px;padding:0 12px">Testar voz</button>
        <button class="jv-ico" id="jv-limpar" style="margin-top:10px;padding:0 12px">Limpar conversa</button>
      </div>
      <div id="jv-msgs" aria-live="polite"></div>
      <div id="jv-base">
        <textarea id="jv-txt" rows="1" placeholder="Fale ou digite para o Javis..."></textarea>
        <button id="jv-env" aria-label="Enviar">Enviar</button>
        <button id="jv-mic" aria-label="Falar">🎙</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(wrap);

  const $ = id => document.getElementById(id);
  const fab = $('jv-fab'), painel = $('jv-painel'), msgs = $('jv-msgs'), txt = $('jv-txt'), mic = $('jv-mic');
  $('jv-sub').textContent = APP.nome;

  // ---------- preferências (só neste aparelho) ----------
  const PREF_KEY = 'javis-prefs';
  let prefs = { voz: '', vel: 1.0, tom: null, som: true, continuo: false };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) {}
  if (!prefs.tomManual) prefs.tom = null;
  const MASC = /antonio|daniel|felipe|ricardo|fabio|humberto|joaquim|duarte|cristiano|male|mascul|homem|#male/i;
  const ehMasc = v => !!v && MASC.test(v.name + ' ' + (v.voiceURI || ''));
  const salvarPrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {} };

  // ---------- mensagens na tela ----------
  function bolha(tipo, texto) {
    const d = document.createElement('div'); d.className = 'jv-m ' + tipo; d.textContent = texto;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  function confirmarNaTela(texto) {
    return new Promise(res => {
      const c = document.createElement('div'); c.className = 'jv-conf';
      const p = document.createElement('div'); p.textContent = texto;
      const sim = document.createElement('button'); sim.className = 'jv-sim'; sim.textContent = 'Confirmar';
      const nao = document.createElement('button'); nao.className = 'jv-nao'; nao.textContent = 'Cancelar';
      c.append(p, sim, nao); msgs.appendChild(c); msgs.scrollTop = msgs.scrollHeight;
      falar(texto + '. Confirma?');
      const fim = v => { c.remove(); bolha('sis', v ? 'Confirmado.' : 'Cancelado.'); res(v); };
      sim.onclick = () => fim(true); nao.onclick = () => fim(false);
    });
  }

  // ---------- voz (fala) ----------
  const tts = window.speechSynthesis;
  let vozes = [];
  function carregarVozes() {
    if (!tts) return;
    vozes = tts.getVoices().filter(v => /^pt/i.test(v.lang));
    const sel = $('jv-voz');
    sel.innerHTML = vozes.length ? vozes.map((v, i) => `<option value="${i}">${v.name} (${v.lang})</option>`).join('') : '<option>Nenhuma voz em português neste aparelho</option>';
    let i = vozes.findIndex(v => v.name === prefs.voz);
    if (i < 0) i = vozes.findIndex(v => /pt-BR/i.test(v.lang) && ehMasc(v));
    if (i < 0) i = vozes.findIndex(v => ehMasc(v));
    if (i < 0) i = vozes.findIndex(v => /pt-BR/i.test(v.lang));
    if (i < 0) i = 0;
    sel.value = String(i);
    atualizarDicaVoz();
  }
  const vozAtual = () => vozes[Number($('jv-voz').value)];
  // Sem voz masculina instalada, engrossa a voz para soar mais grave.
  const tomEfetivo = () => prefs.tomManual && prefs.tom != null ? prefs.tom : (ehMasc(vozAtual()) ? 0.9 : 0.55);
  function atualizarDicaVoz() {
    const d = $('jv-dica'); if (!d) return;
    const temMasc = vozes.some(ehMasc);
    d.hidden = temMasc;
    $('jv-tom').value = tomEfetivo();
  }
  if (tts) { carregarVozes(); tts.onvoiceschanged = carregarVozes; }
  function limparParaFala(t) {
    return String(t).replace(/[*_#`>|]/g, '').replace(/\bOS-(\d{6})-(\d{3})\b/g, 'O S final $2').replace(/\s+/g, ' ').trim();
  }
  let falandoAgora = false;
  function falar(texto, depois) {
    if (!tts || !prefs.som || !texto) { if (depois) depois(); return; }
    tts.cancel();
    const u = new SpeechSynthesisUtterance(limparParaFala(texto));
    const v = vozAtual();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'pt-BR';
    u.rate = prefs.vel; u.pitch = tomEfetivo();
    u.onstart = () => { falandoAgora = true; fab.classList.add('falando'); };
    u.onend = u.onerror = () => { falandoAgora = false; fab.classList.remove('falando'); if (depois) depois(); };
    tts.speak(u);
  }
  function calar() { if (tts) tts.cancel(); falandoAgora = false; fab.classList.remove('falando'); }

  // ---------- voz (ouvir) ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, ouvindo = false, micBloqueado = !SR;
  function avisoMic() {
    bolha('sis', 'O microfone do Javis não está liberado nesta tela. Toque na caixa de texto e use o microfone do teclado do celular para ditar.');
    mic.style.opacity = .4;
  }
  function ouvir() {
    if (micBloqueado) { avisoMic(); txt.focus(); return; }
    if (ouvindo) { rec && rec.stop(); return; }
    calar();
    rec = new SR(); rec.lang = 'pt-BR'; rec.interimResults = true; rec.continuous = false;
    let final = '';
    rec.onstart = () => { ouvindo = true; mic.classList.add('ouvindo'); fab.classList.add('ouvindo'); txt.placeholder = 'Ouvindo, senhor...'; };
    rec.onresult = e => {
      let parcial = ''; final = '';
      for (const r of e.results) { if (r.isFinal) final += r[0].transcript; else parcial += r[0].transcript; }
      txt.value = (final + parcial).trim();
    };
    rec.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') { micBloqueado = true; avisoMic(); }
    };
    rec.onend = () => {
      ouvindo = false; mic.classList.remove('ouvindo'); fab.classList.remove('ouvindo'); txt.placeholder = 'Fale ou digite para o Javis...';
      const t = txt.value.trim();
      if (t && final) enviar();
    };
    try { rec.start(); } catch (e) { micBloqueado = true; avisoMic(); }
  }

  // ---------- cérebro ----------
  let sample = null, ocupado = false, ctl = null;
  if (window.claude) claude.use('sample').then(s => { sample = s; }).catch(() => {});
  let turnos = [];
  function hoje() {
    const d = new Date();
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) + ', ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function regras() {
    let ctx = '';
    try { ctx = APP.contexto ? APP.contexto() : ''; } catch (e) { ctx = '(contexto indisponível)'; }
    return [
      'Você é o JAVIS, assistente de voz da iFC3D Forja (iFC Irmãos Ferreira & Carvalho Mobiliário Arquitetado Ltda.), centro de fabricação digital e corte em Sorocaba-SP: mobiliário arquitetado, CNC Nesting, coladeira de borda, furação CNC, impressão 3D, laser CO2, solda a laser e galvanoplastia. Slogan: "Do projeto à realidade".',
      'Personalidade: um mordomo digital elegante, calmo, educado e eficiente, com um toque de humor seco e discreto. Trate o usuário por "senhor" (ou pelo nome, se ele disser). Nunca diga que é o Jarvis da Marvel; você é o Javis da iFC3D.',
      'Suas respostas são FALADAS em voz alta pelo celular: responda em português do Brasil, curto (1 a 3 frases na maioria das vezes), sem markdown, sem listas com marcadores, sem emojis. Números de OS: diga só os 3 últimos dígitos quando houver muitos. Valores em reais por extenso natural ("mil e duzentos reais").',
      `Você está dentro do app "${APP.nome}". Use as ferramentas para consultar e alterar dados deste app; nunca invente dados que não vieram das ferramentas ou do contexto. Se pedirem algo de outro app (orçamentos, pedidos de compra, controle de qualidade, ordens de serviço), explique com elegância que para isso o senhor deve abrir o Javis dentro daquele app.`,
      'Para alterar dados, chame a ferramenta: a própria tela pede a confirmação do usuário, então não peça confirmação antes. Se o usuário cancelar, aceite sem insistir. Quando abrir um formulário pré-preenchido, diga que ele confira e toque em Salvar.',
      'Também converse e tire dúvidas gerais (marcenaria, MDF, fitas de borda, produção, gestão, contas rápidas) com conhecimento geral, deixando claro quando é estimativa.',
      `Agora: ${hoje()}.`,
      'Situação atual do app:\n' + ctx,
    ].join('\n\n');
  }
  function ferramentas() {
    return (APP.ferramentas || []).map(f => ({
      name: f.name, description: f.description, inputSchema: f.inputSchema || { type: 'object', properties: {} },
      async execute(input, context) {
        if (f.escreve) {
          const texto = f.confirmar ? f.confirmar(input) : 'O Javis quer alterar dados';
          const ok = await confirmarNaTela(texto);
          if (context.signal.aborted) throw new Error('interrompido');
          if (!ok) return 'O usuário CANCELOU. Nada foi alterado.';
        }
        return await f.execute(input || {});
      },
    }));
  }
  async function enviar() {
    const t = txt.value.trim();
    if (!t || ocupado) return;
    txt.value = ''; calar();
    bolha('eu', t);
    if (!sample) { bolha('sis', 'O Javis ainda está conectando. Tente de novo em alguns segundos.'); return; }
    turnos.push({ role: 'user', content: t });
    if (turnos.length > 16) turnos = turnos.slice(-16);
    while (turnos.length && turnos[0].role !== 'user') turnos.shift();
    ocupado = true; ctl = new AbortController();
    const b = bolha('jv', 'Um instante, senhor...');
    try {
      const r = await sample([{ role: 'user', content: regras() }, ...turnos], {
        tools: ferramentas(), modelTier: 'quick', signal: ctl.signal,
        onText: ({ text }) => { b.textContent = text; msgs.scrollTop = msgs.scrollHeight; },
      });
      const resposta = r.text.trim();
      b.textContent = resposta;
      turnos.push({ role: 'assistant', content: resposta });
      falar(resposta.split(/\n\s*\n/).pop(), () => { if (prefs.continuo && painel.classList.contains('aberto') && !micBloqueado) ouvir(); });
    } catch (e) {
      const msg = {
        cancelled: 'Interrompido.',
        not_granted: 'O Javis precisa da sua permissão para usar o Claude neste app. Feche e abra de novo para permitir.',
        rate_limited: 'Muitos pedidos seguidos. Aguarde um pouco e tente de novo.',
        tools_unavailable: 'Esta tela não permite que o Javis mexa nos dados. Atualize o app do Claude.',
        session_expired: 'A sessão expirou. Entre de novo no Claude.',
      }[e && e.code] || 'Tive um problema para responder agora. Tente de novo, senhor.';
      b.textContent = (e && e.text ? e.text + '\n\n' : '') + msg;
      if (e && e.code !== 'cancelled') falar(msg);
      turnos.pop();
    } finally { ocupado = false; ctl = null; }
  }

  // ---------- abrir / fechar ----------
  let saudou = false;
  function abrir() {
    painel.classList.add('aberto');
    if (tts && !saudou) { tts.speak(new SpeechSynthesisUtterance('')); } // libera a fala no iPhone
    if (!saudou) {
      saudou = true;
      const h = new Date().getHours();
      const s = (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + ', senhor. Javis à disposição. Em que posso ajudar?';
      bolha('jv', s); falar(s);
    }
  }
  function fechar() { painel.classList.remove('aberto'); calar(); if (ctl) ctl.abort(); if (ouvindo && rec) rec.stop(); }
  window.javisMinimizar = () => { painel.classList.remove('aberto'); };

  fab.onclick = () => painel.classList.contains('aberto') ? fechar() : abrir();
  $('jv-fechar').onclick = fechar;
  mic.onclick = ouvir;
  $('jv-env').onclick = enviar;
  txt.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } });
  $('jv-som').onclick = () => { prefs.som = !prefs.som; salvarPrefs(); $('jv-som').classList.toggle('on', prefs.som); $('jv-som').textContent = prefs.som ? '🔊' : '🔇'; if (!prefs.som) calar(); };
  $('jv-som').classList.toggle('on', prefs.som); $('jv-som').textContent = prefs.som ? '🔊' : '🔇';
  $('jv-ajuste').onclick = () => $('jv-cfg').classList.toggle('aberto');
  $('jv-vel').value = prefs.vel; $('jv-tom').value = tomEfetivo(); $('jv-continuo').checked = !!prefs.continuo;
  $('jv-vel').oninput = e => { prefs.vel = Number(e.target.value); salvarPrefs(); };
  $('jv-tom').oninput = e => { prefs.tom = Number(e.target.value); prefs.tomManual = true; salvarPrefs(); };
  $('jv-continuo').onchange = e => { prefs.continuo = e.target.checked; salvarPrefs(); };
  $('jv-voz').onchange = e => { const v = vozes[Number(e.target.value)]; prefs.voz = v ? v.name : ''; prefs.tomManual = false; prefs.tom = null; salvarPrefs(); $('jv-tom').value = tomEfetivo(); };
  $('jv-testar').onclick = () => falar('Às suas ordens, senhor. A Forja está em plena operação.');
  $('jv-limpar').onclick = () => { turnos = []; msgs.innerHTML = ''; bolha('sis', 'Conversa limpa.'); };
})();
