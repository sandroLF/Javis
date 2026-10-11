// ===== JAVIS — adaptador do app de Ordens de Serviço =====
(function () {
  const STS = ['Aguardando', 'Em Produção', 'Concluído', 'Entregue', 'Cancelado'];
  const semAc = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const hojeISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const aberta = o => o.status === 'Aguardando' || o.status === 'Em Produção';
  const atrasada = o => aberta(o) && o.prazo && o.prazo < hojeISO();

  function resumoOS(o) {
    const av = computeAvaliacao(o);
    return {
      numero: o.numero, loja: o.cliente, clienteFinal: o.clienteFinal || undefined, status: o.status,
      prazo: o.prazo || undefined, atrasada: atrasada(o) || undefined, avaliacao: av ? av.label : undefined,
      tecnologia: o.tecnologia, responsavel: o.responsavel || undefined, ambiente: o.ambiente || undefined,
      mdf: coresDaOS(o).join(' / ') || undefined, etiqueta: o.etiqueta || undefined,
    };
  }
  function acharOS(ref) {
    const r = semAc(ref).replace(/^o\.?\s*s\.?\s*/, '').replace(/\s+/g, '');
    if (!r) throw new Error('Informe o número da OS.');
    let achadas = ordens.filter(o => semAc(o.numero).replace(/\s+/g, '') === r || semAc(o.numero) === 'os-' + r);
    if (!achadas.length) {
      const dig = r.replace(/\D/g, '');
      if (dig) achadas = ordens.filter(o => String(o.numero || '').replace(/\D/g, '').endsWith(dig));
    }
    if (!achadas.length) {
      achadas = ordens.filter(o => [o.cliente, o.clienteFinal].some(c => semAc(c).includes(semAc(ref))));
      if (achadas.length > 1) throw new Error('Mais de uma OS para "' + ref + '": ' + achadas.slice(0, 8).map(o => o.numero + ' (' + o.cliente + (o.clienteFinal ? ' / ' + o.clienteFinal : '') + ', ' + o.status + ')').join('; ') + '. Pergunte qual.');
    }
    if (!achadas.length) throw new Error('Nenhuma OS encontrada para "' + ref + '".');
    if (achadas.length > 1) throw new Error('Várias OS combinam: ' + achadas.slice(0, 8).map(o => o.numero + ' (' + o.cliente + ')').join('; ') + '. Pergunte qual.');
    return achadas[0];
  }
  function statusValido(s) {
    const a = semAc(s);
    const m = STS.find(x => semAc(x) === a) || STS.find(x => semAc(x).startsWith(a.slice(0, 5)));
    if (!m) throw new Error('Status inválido. Use: ' + STS.join(', '));
    return m;
  }

  window.JAVIS_APP = {
    nome: 'Ordens de Serviço',
    contexto() {
      if (!ordens.length) return 'Nenhuma OS carregada ainda.';
      const cont = STS.map(s => s + ': ' + ordens.filter(o => o.status === s).length).join(', ');
      const atr = ordens.filter(atrasada);
      const em7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
      const prox = ordens.filter(o => aberta(o) && o.prazo && o.prazo >= hojeISO() && o.prazo <= em7);
      const linha = o => `${o.numero} ${o.cliente}${o.clienteFinal ? ' / ' + o.clienteFinal : ''} (${o.status}, prazo ${o.prazo})`;
      return [
        `Total de OS: ${ordens.length}. Por status: ${cont}.`,
        `Atrasadas (prazo vencido e ainda abertas): ${atr.length ? atr.slice(0, 10).map(linha).join('; ') : 'nenhuma'}.`,
        `Prazo nos próximos 7 dias: ${prox.length ? prox.slice(0, 10).map(linha).join('; ') : 'nenhuma'}.`,
        `Equipe: Fabrício (CNC Nesting), Guilherme (Coladeira CNC), Thomaz (CNC Furo Topo). Perfil de quem usa: ${ehAdmin ? 'administrativo' : 'equipe'}.`,
      ].join('\n');
    },
    ferramentas: [
      {
        name: 'listar_os',
        description: 'Lista ordens de serviço, filtrando opcionalmente por status, por texto (loja, cliente, cor do MDF, responsável, tecnologia) ou só as atrasadas. Retorna até 25 OS resumidas, mais recentes primeiro.',
        inputSchema: { type: 'object', properties: {
          status: { type: 'string', enum: STS }, busca: { type: 'string' }, so_atrasadas: { type: 'boolean' }, limite: { type: 'number' } } },
        execute({ status, busca, so_atrasadas, limite }) {
          let l = ordens;
          if (status) l = l.filter(o => o.status === statusValido(status));
          if (so_atrasadas) l = l.filter(atrasada);
          if (busca) { const b = semAc(busca); l = l.filter(o => semAc([o.numero, o.cliente, o.clienteFinal, o.responsavel, o.tecnologia, o.ambiente, o.descricao, ...coresDaOS(o)].join(' ')).includes(b)); }
          return { total: l.length, ordens: l.slice(0, Math.min(Number(limite) || 25, 25)).map(resumoOS) };
        },
      },
      {
        name: 'detalhe_os',
        description: 'Mostra todos os detalhes de uma OS: chapas (cor, espessura, usadas, recebidas), fitas de borda, sobras, histórico de status, contato, descrição e observações. Aceita o número completo, os últimos dígitos ou o nome do cliente.',
        inputSchema: { type: 'object', properties: { numero: { type: 'string' } }, required: ['numero'] },
        execute({ numero }) {
          const o = acharOS(numero);
          return { ...resumoOS(o), contato: o.contato, descricao: o.descricao, material: o.material, observacoes: o.observacoes,
            chapas: materiaisDaOS(o), fitas: fitasDaOS(o), fitaTotalMetros: totalFitas(fitasDaOS(o)), sobras: o.sobras, destinoSobras: o.destinoSobras,
            terceirizado: o.terceirizado ? o.fornecedor : undefined, dataSolicitacao: o.dataSolicitacao,
            historico: historicoDaOS(o).map(h => h.status + ' em ' + new Date(h.em).toLocaleString('pt-BR')) };
        },
      },
      {
        name: 'mudar_status_os',
        description: 'Muda o status de uma OS (Aguardando, Em Produção, Concluído, Entregue, Cancelado). Registra o histórico e dá baixa automática no estoque de chapas e fitas, como o app faz. Pede confirmação na tela.',
        inputSchema: { type: 'object', properties: { numero: { type: 'string' }, status: { type: 'string', enum: STS } }, required: ['numero', 'status'] },
        escreve: true,
        confirmar({ numero, status }) {
          try { const o = acharOS(numero); return `Mudar a ${o.numero} (${o.cliente}) de "${o.status}" para "${statusValido(status)}"`; }
          catch (e) { return `Mudar a OS ${numero} para "${status}"`; }
        },
        async execute({ numero, status }) {
          if (!db) throw new Error('Sem conexão com os dados.');
          const o = acharOS(numero), novo = statusValido(status);
          if (o.status === novo) return `A ${o.numero} já está em ${novo}.`;
          const agora = Date.now();
          const data = { status: novo, statusAtualizadoEm: agora, atualizadoEm: agora, historico: [...historicoDaOS(o), { status: novo, em: agora }] };
          if (novo === 'Concluído' && !o.concluidoEm) data.concluidoEm = agora;
          if (novo === 'Entregue' && !o.entregueEm) data.entregueEm = agora;
          try { await db.collection('ordens').doc(o.id).update(data); }
          catch (e) { throw new Error(e && e.code === 'invalid_argument' ? 'Sem permissão para editar.' : 'Não consegui salvar agora.'); }
          const completa = { ...o, ...data };
          let estoque = 'estoque atualizado';
          try { await syncMovimentosOS(o.id, completa); } catch (e) { estoque = 'ATENÇÃO: a baixa no estoque falhou, abra a OS e salve de novo'; }
          try { window.javisMinimizar(); oferecerAviso(completa); } catch (e) {}
          return `OK: ${o.numero} agora está em ${novo}; ${estoque}. Se a loja tiver WhatsApp no contato, a tela já mostra o botão para avisá-la.`;
        },
      },
      {
        name: 'abrir_os',
        description: 'Abre a ficha de uma OS na tela para o usuário ver ou editar (fecha o painel do Javis).',
        inputSchema: { type: 'object', properties: { numero: { type: 'string' } }, required: ['numero'] },
        execute({ numero }) { const o = acharOS(numero); window.javisMinimizar(); openEdit(o.id); return 'Ficha da ' + o.numero + ' aberta na tela.'; },
      },
      {
        name: 'preparar_nova_os',
        description: 'Abre o formulário de NOVA OS já preenchido com o que o usuário ditou, para ele conferir e tocar em Salvar (nada é salvo sem ele). Datas no formato AAAA-MM-DD.',
        inputSchema: { type: 'object', properties: {
          loja: { type: 'string' }, cliente_final: { type: 'string' }, contato: { type: 'string' },
          tecnologia: { type: 'string', enum: ['CNC Nesting', 'Coladeira CNC', 'CNC Furo Topo', 'Fita de Borda', 'Impressão 3D', 'Corte a Laser CO2', 'Solda a Laser', 'Galvanoplastia', 'Outro'] },
          prazo: { type: 'string' }, descricao: { type: 'string' }, ambiente: { type: 'string' }, material: { type: 'string' },
          cor_mdf: { type: 'string' }, espessura_mm: { type: 'string' }, chapas_usadas: { type: 'number' }, chapas_recebidas: { type: 'number' },
          responsavel: { type: 'string' }, observacoes: { type: 'string' } } },
        execute(d) {
          window.javisMinimizar(); openNew();
          const set = (id, v) => { if (v != null && v !== '') document.getElementById(id).value = v; };
          set('fCliente', d.loja); set('fClienteFinal', d.cliente_final); set('fContato', d.contato); set('fTecnologia', d.tecnologia);
          set('fPrazo', d.prazo); set('fDescricao', d.descricao); set('fAmbiente', d.ambiente); set('fMaterial', d.material);
          set('fResponsavel', d.responsavel); set('fObs', d.observacoes);
          if (d.cor_mdf || d.chapas_usadas != null) {
            materiais = [{ aplicacao: 'Caixaria', cor: d.cor_mdf || '', espessura: String(d.espessura_mm || '').replace(/\D/g, ''), qtd: d.chapas_usadas ?? null, recebidas: d.chapas_recebidas ?? null }];
            renderMateriais();
          }
          atualizarBotaoAviso();
          return 'Formulário de nova OS aberto e preenchido. O usuário precisa conferir e tocar em Salvar.';
        },
      },
      {
        name: 'estoque_chapas',
        description: 'Saldo do estoque de chapas de MDF por cor e espessura: saldo, reservado em OS aguardando e disponível. Filtro opcional por cor.',
        inputSchema: { type: 'object', properties: { cor: { type: 'string' } } },
        execute({ cor }) {
          let l = calcularEstoque();
          if (cor) l = l.filter(i => semAc(i.cor).includes(semAc(cor)));
          return { itens: l.slice(0, 40).map(i => ({ cor: i.cor, espessura: i.esp ? i.esp + ' mm' : 's/ esp.', saldo: i.saldo, reservado: i.reservado, disponivel: i.disponivel })) };
        },
      },
      {
        name: 'estoque_fitas',
        description: 'Saldo do estoque de fitas de borda em metros, por largura, espessura e cor. Filtro opcional por cor ou largura.',
        inputSchema: { type: 'object', properties: { busca: { type: 'string' } } },
        execute({ busca }) {
          let l = calcularEstoqueFitas();
          if (busca) l = l.filter(i => semAc(i.cor).includes(semAc(busca)) || String(i.largura).includes(String(busca).replace(/\D/g, '') || '§'));
          return { itens: l.slice(0, 40).map(i => ({ largura: largFitaRot(i.largura), espessura: i.esp + ' mm', cor: i.cor, saldo_m: i.saldo, reservado_m: i.reservado, disponivel_m: i.disponivel })) };
        },
      },
    ],
  };
})();
