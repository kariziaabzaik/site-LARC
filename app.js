// Carrega projetos, eventos, documentos e equipe do Supabase e monta o HTML.
// Se o config.js não estiver preenchido, ou a tabela estiver vazia, o site
// continua mostrando o conteúdo de exemplo que está escrito no index.html.
(function () {
  const cfg = window.LARC_CONFIG;
  if (!cfg || !window.supabase || cfg.url.includes('SEU-PROJETO')) return;
  const sb = supabase.createClient(cfg.url, cfg.anonKey);

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = u => (/^https?:\/\//.test(u || '') ? esc(u) : '');
  const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  // Cada seção: tabela, id do contêiner, consulta e função que gera o HTML de um item
  const SECOES = [
    { id: 'lista-equipe', q: () => sb.from('team').select('*').order('position'),
      html: p => `<div><img class="rounded-lg w-full aspect-square object-cover" src="${url(p.photo_url) || 'https://placehold.co/300x300/36677f/ffffff?text=Foto'}" alt="Foto de ${esc(p.name)}">
        <p class="mt-2 font-semibold text-white">${esc(p.name)}</p><p class="text-sm text-steel">${esc(p.role)}</p></div>` },

    { id: 'lista-projetos', q: () => sb.from('projects').select('*').order('created_at', { ascending: false }),
      html: p => `<article data-cat="${esc(p.category)}" class="proj bg-navy rounded-xl overflow-hidden border border-steel/20">
        <img src="${url(p.image_url) || 'https://placehold.co/600x360/36677f/ffffff?text=Projeto'}" alt="${esc(p.title)}" class="w-full h-44 object-cover">
        <div class="p-5"><h3 class="font-display font-bold text-white">${esc(p.title)}</h3><p class="mt-2 text-sm text-steel">${esc(p.description)}</p></div></article>` },

    { id: 'lista-documentos', q: () => sb.from('documents').select('*').order('created_at', { ascending: false }),
      html: d => `<li><a href="${url(d.file_url)}" target="_blank" rel="noopener" class="flex justify-between items-center px-5 py-4 hover:bg-navy"><span>${esc(d.title)}</span><span class="text-sm text-accent">PDF</span></a></li>` },

    { id: 'lista-eventos',
      // só eventos de hoje em diante, em ordem cronológica
      q: () => sb.from('events').select('*').gte('event_date', new Date().toISOString().slice(0, 10)).order('event_date'),
      html: e => { const [, m, d] = e.event_date.split('-');
        return `<li class="flex gap-5 bg-ink/60 border ${e.is_deadline ? 'border-white/50' : 'border-steel/20'} rounded-xl p-4">
          <div class="w-16 text-center shrink-0"><p class="font-display text-2xl font-bold ${e.is_deadline ? 'text-white' : 'text-accent'}">${d}</p><p class="text-xs text-steel">${MESES[+m - 1]}</p></div>
          <div><p class="font-semibold text-white">${esc(e.title)}</p><p class="text-sm text-steel">${esc(e.location)}</p></div></li>`; } }
  ];

  SECOES.forEach(async s => {
    const el = document.getElementById(s.id);
    if (!el) return;
    const { data, error } = await s.q();
    if (error || !data || !data.length) return;   // mantém o conteúdo de exemplo
    el.innerHTML = data.map(s.html).join('');
  });
})();
