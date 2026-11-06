// LARC UFPE: navegação entre seções, projetos e dados do Supabase.
// Sem config.js preenchido (ou com o banco vazio), o site mostra projetos de exemplo.
(function () {
  const cfg = window.LARC_CONFIG;
  const sb = cfg && window.supabase && !cfg.url.includes('SEU-PROJETO') ? supabase.createClient(cfg.url, cfg.anonKey) : null;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = u => (/^https?:\/\//.test(u || '') ? esc(u) : '');
  const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  // Categorias da página "Atividades e Projetos" (a chave é gravada no banco)
  const CATS = { congresso: 'Congressos', planta: 'Plantas Didáticas', apresentacao: 'Apresentações Internas' };

  // Tipos de arquivo da área de downloads: [rótulo, ícone]
  const KINDS = { banner: ['Modelo de banner', 'img'], slides: ['Slides da apresentação', 'slides'], artigo: ['Artigo', 'doc'], outro: ['Documento', 'doc'] };
  const ICON = {
    doc:    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    slides: '<path d="M3 4h18M5 4v10h14V4M12 14v5M8 21l4-2 4 2"/>',
    img:    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/>'
  };
  const icon = k => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  // ---------- Dados de exemplo (usados enquanto o banco estiver vazio) ----------
  const ph = (t, w = 800, h = 600) => `https://placehold.co/${w}x${h}/36677f/ffffff?text=${encodeURIComponent(t)}`;
  const mk = (id, category, title, description) => ({
    id, category, title, description, image_url: ph(title), official_url: 'https://example.com',
    photos: [1, 2, 3, 4, 5, 6].map(n => ({ image_url: ph(`${title} ${n}`), caption: '' })),
    files: [
      { title: 'Modelo de banner', kind: 'banner', file_url: 'https://example.com' },
      { title: 'Slides da apresentação', kind: 'slides', file_url: 'https://example.com' },
      { title: 'Artigo completo (PDF)', kind: 'artigo', file_url: 'https://example.com' }
    ]
  });
  const DEMO = [
    mk('d1', 'congresso', 'Congresso Brasileiro de Automação', 'Participação da liga com a apresentação de um trabalho sobre controle de uma planta didática. Texto de exemplo: substitua pela descrição real no painel de administração.'),
    mk('d2', 'congresso', 'Semana de Engenharia UFPE', 'Estande da liga, minicursos e demonstração de robôs seguidores de linha para a comunidade acadêmica.'),
    mk('d3', 'planta', 'Pêndulo invertido', 'Planta didática para estudo de controle em espaço de estados (LQR), construída pelos membros da liga.'),
    mk('d4', 'planta', 'Controle de nível de tanques', 'Bancada de dois tanques acoplados para práticas de controle PID e identificação de sistemas.'),
    mk('d5', 'apresentacao', 'Apresentação interna: ROS na prática', 'Encontro interno em que os membros apresentaram seus estudos sobre ROS e navegação autônoma.')
  ];

  // ---------- Carregamento dos projetos ----------
  async function loadProjects() {
    if (sb) {
      const { data, error } = await sb.from('projects')
        .select('*, project_photos(image_url, caption), project_files(title, kind, file_url)')
        .order('created_at', { ascending: false });
      if (!error && data && data.length)
        return data.map(p => ({ ...p, photos: p.project_photos || [], files: p.project_files || [] }));
    }
    return DEMO;
  }
  let PROJECTS = [];
  const ready = loadProjects().then(d => { PROJECTS = d; });

  // ---------- Lista de pastinhas (cards) ----------
  function renderList(cat) {
    $('abas-projetos').innerHTML = Object.entries(CATS).map(([k, n]) =>
      `<a href="#/projetos/${k}" ${k === cat ? 'aria-current="page"' : ''} class="px-4 py-2 rounded-full text-sm border transition ${k === cat ? 'bg-white text-navy border-white font-semibold' : 'border-steel/40 hover:border-white hover:text-white'}">${n}</a>`).join('');

    const items = PROJECTS.filter(p => p.category === cat);
    $('lista-projetos').innerHTML = items.length ? items.map(p => `
      <a href="#/projeto/${encodeURIComponent(p.id)}" class="group relative block mt-3 focus-visible:outline-offset-4">
        <!-- aba da "pasta" -->
        <span class="absolute -top-3 left-5 w-24 h-4 rounded-t-lg bg-chip group-hover:bg-white group-focus-visible:bg-white transition-colors"></span>
        <span class="relative block aspect-[4/3] rounded-xl rounded-tl-none overflow-hidden border border-steel/20 group-hover:border-white transition-colors shadow-lg group-hover:shadow-accent/20">
          <img src="${url(p.image_url) || ph(p.title)}" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
          <span class="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent group-hover:from-navy transition-colors duration-300"></span>
          <span class="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-3">
            <span class="font-display font-bold text-xl text-white leading-snug">${esc(p.title)}</span>
            <span class="shrink-0 w-9 h-9 rounded-full bg-white text-navy grid place-items-center transition md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 md:group-hover:translate-y-0" aria-hidden="true">→</span>
          </span>
        </span>
      </a>`).join('')
      : '<p class="text-steel col-span-full">Ainda não há itens nesta categoria.</p>';
  }

  // ---------- Página de detalhes ----------
  function renderDetail(id) {
    const el = $('detalhe');
    const p = PROJECTS.find(x => String(x.id) === id);
    if (!p) {
      el.innerHTML = '<p class="text-steel">Não encontramos este item.</p><a href="#/projetos" class="inline-block mt-4 text-white underline">Voltar para as atividades</a>';
      return;
    }
    document.title = `${p.title} – LARC UFPE`;
    const photos = p.photos || [], files = p.files || [];
    el.innerHTML = `
      <a href="#/projetos/${esc(p.category)}" class="inline-flex items-center gap-2 text-sm text-steel hover:text-white">← ${esc(CATS[p.category] || 'Atividades e projetos')}</a>
      <h1 class="font-display font-bold text-3xl sm:text-4xl text-white mt-4">${esc(p.title)}</h1>
      <p class="mt-5 text-steel text-lg max-w-3xl whitespace-pre-line">${esc(p.description)}</p>
      ${url(p.official_url) ? `<a href="${url(p.official_url)}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 mt-6 bg-white text-navy font-semibold px-6 py-3 rounded-md hover:bg-steel transition">Página oficial do evento <span aria-hidden="true">↗</span></a>` : ''}

      ${photos.length ? `
      <h2 class="font-display font-bold text-2xl text-white mt-14">Galeria</h2>
      <div class="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
        ${photos.map(f => `<button type="button" data-zoom="${url(f.image_url)}" class="group overflow-hidden rounded-lg aspect-[4/3] border border-steel/20 hover:border-white transition-colors" aria-label="Ampliar foto">
          <img src="${url(f.image_url)}" alt="${esc(f.caption || p.title)}" loading="lazy" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"></button>`).join('')}
      </div>` : ''}

      ${files.length ? `
      <h2 class="font-display font-bold text-2xl text-white mt-14">Downloads e documentos</h2>
      <ul class="mt-5 divide-y divide-steel/20 border border-steel/20 rounded-xl overflow-hidden">
        ${files.map(f => { const k = KINDS[f.kind] || KINDS.outro;
          return `<li><a href="${url(f.file_url)}" target="_blank" rel="noopener" class="flex items-center gap-4 px-5 py-4 hover:bg-navy">
            <span class="text-accent">${icon(k[1])}</span>
            <span class="flex-1"><span class="block text-white">${esc(f.title)}</span><span class="block text-xs text-steel">${k[0]}</span></span>
            <span class="text-sm text-accent">Baixar</span></a></li>`; }).join('')}
      </ul>` : ''}`;
  }

  // ---------- Roteador (#/projetos, #/projetos/planta, #/projeto/ID, ...) ----------
  const VIEWS = [...document.querySelectorAll('[data-view]')];
  const BASE_TITLE = document.title;
  async function route() {
    const [name = '', arg = ''] = location.hash.replace(/^#\/?/, '').split('/');
    const view = ['projetos', 'projeto', 'selecao', 'documentos', 'eventos'].includes(name) ? name : 'home';
    VIEWS.forEach(v => { v.hidden = v.dataset.view !== view; });
    const nav = view === 'projeto' ? 'projetos' : view;
    document.querySelectorAll('[data-nav]').forEach(a => {
      const on = a.dataset.nav === nav;
      a.classList.toggle('text-white', on); a.classList.toggle('text-steel', !on);
      on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    document.title = BASE_TITLE;
    window.scrollTo(0, 0);
    if (view === 'projetos' || view === 'projeto') await ready;
    if (view === 'projetos') renderList(CATS[arg] ? arg : 'congresso');
    if (view === 'projeto') renderDetail(decodeURIComponent(arg));
  }
  addEventListener('hashchange', route);
  route();

  // ---------- Galeria ampliada ----------
  const lb = $('lightbox'), closeLb = () => { lb.classList.add('hidden'); lb.classList.remove('flex'); };
  document.addEventListener('click', e => {
    const z = e.target.closest('[data-zoom]');
    if (z) { lb.querySelector('img').src = z.dataset.zoom; lb.classList.remove('hidden'); lb.classList.add('flex'); }
    else if (lb.contains(e.target)) closeLb();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

  // ---------- Equipe, documentos e eventos (Supabase) ----------
  if (!sb) return;
  const SECOES = [
    { id: 'lista-equipe', q: () => sb.from('team').select('*').order('position'),
      html: p => `<div><img class="rounded-lg w-full aspect-square object-cover" src="${url(p.photo_url) || 'https://placehold.co/300x300/36677f/ffffff?text=Foto'}" alt="Foto de ${esc(p.name)}">
        <p class="mt-2 font-semibold text-white">${esc(p.name)}</p><p class="text-sm text-steel">${esc(p.role)}</p></div>` },
    { id: 'lista-documentos', q: () => sb.from('documents').select('*').order('created_at', { ascending: false }),
      html: d => `<li><a href="${url(d.file_url)}" target="_blank" rel="noopener" class="flex justify-between items-center px-5 py-4 hover:bg-navy"><span>${esc(d.title)}</span><span class="text-sm text-accent">PDF</span></a></li>` },
    { id: 'lista-eventos',
      q: () => sb.from('events').select('*').gte('event_date', new Date().toISOString().slice(0, 10)).order('event_date'),
      html: e => { const [, m, d] = e.event_date.split('-');
        return `<li class="flex gap-5 bg-navy border ${e.is_deadline ? 'border-white/50' : 'border-steel/20'} rounded-xl p-4">
          <div class="w-16 text-center shrink-0"><p class="font-display text-2xl font-bold ${e.is_deadline ? 'text-white' : 'text-accent'}">${d}</p><p class="text-xs text-steel">${MESES[+m - 1]}</p></div>
          <div><p class="font-semibold text-white">${esc(e.title)}</p><p class="text-sm text-steel">${esc(e.location)}</p></div></li>`; } }
  ];
  SECOES.forEach(async s => {
    const el = $(s.id);
    const { data, error } = await s.q();
    if (el && !error && data && data.length) el.innerHTML = data.map(s.html).join('');
  });
})();
