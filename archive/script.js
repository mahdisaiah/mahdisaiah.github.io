/* =========================================================
   Mahdi Saiah — Portfolio interactions
   ========================================================= */

/* ----- i18n ----- */
const translations = {
  fr: {
    'nav.game':'Empreintes','nav.craft':'3D Craft','nav.skills':'Compétences',
    'nav.career':'Parcours','nav.about':'À propos','nav.contact':'Contact',

    'hero.tagline':'Développeur créatif — Mobile · Web · Jeux vidéo · 3D',
    'hero.cta1':'Voir Connect','hero.cta2':'Explorer Empreintes','hero.scroll':'Défiler',

    'connect.label':'Produit mobile','connect.meta':'iOS — Mai 2026',
    'connect.title':'Une plateforme sociale pensée pour la vraie conversation.',
    'connect.lead':"Connect est une plateforme sociale moderne où les utilisateurs partagent des posts, des instants et des débats autour de contenus réels du web. Elle privilégie l'interaction plutôt que la consommation — pour réagir, discuter, et challenger les idées au lieu de simplement scroller.",
    'connect.lead2':"Pensée avec un design épuré et immersif, Connect transforme le réseau social en un espace d'expression, de conversation et d'engagement réel.",
    'connect.m1.label':'Plateforme','connect.m1.val':'iOS à la sortie · Android bientôt',
    'connect.m2.label':'Sortie','connect.m2.val':'31 Mai · 2026',
    'connect.m3.label':'Compte à rebours',
    'connect.cap1':'Home','connect.cap2':'Débat','connect.cap3':'Profil',
    'connect.phone1.text':'Un fil temps réel où posts, instants et réactions vivent ensemble.',
    'connect.phone2.text':'Arènes Pour/Contre — les idées se confrontent, pas juste likées.',
    'connect.phone3.text':"Une identité pensée pour l'expression — pas juste des métriques.",

    'game.label':'Projet jeu vidéo',
    'game.title':"Empreintes — une expérience open-world sur l'impact humain.",
    'game.lead':"Un projet universitaire et indépendant construit autour de l'exploration, des véhicules et de la conscience environnementale. Le joueur traverse un monde marqué par les traces humaines — routes, machines, extraction, ruines et nature qui résiste.",
    'game.v1':'Exploration open-world','game.v2':'Véhicules & déplacement',
    'game.v3':"Design d'environnement",'game.v4':'Narration visuelle',

    'craft.label':'Étude 3D',
    'craft.title':'3D Craft — modélisation, textures & expérimentations visuelles.',
    'craft.lead':"Une sélection de rendus et d'explorations 3D — architecture, objets, matériaux, lumière et composition réalisés sous Blender.",
    'craft.piece':'Rendu',

    'skills.label':'Stack',
    'skills.title':'Des compétences entre produit, code et systèmes visuels.',
    'skills.lead':"Quatre disciplines, un même workflow — du premier croquis au produit livré.",
    'skills.mobile.t':'Mobile & Web',
    'skills.mobile.p':"Du prototype à l'app livrée — backends temps réel et interfaces soignées.",
    'skills.code.t':'Langages','skills.code.p':'Typés, scripting ou systèmes — choisis pour la tâche.',
    'skills.games.t':'Jeux & VR','skills.games.p':'Unity en priorité, autour des systèmes de gameplay et du level design atmosphérique.',
    'skills.3d.t':'3D & Visuel','skills.3d.p':'Blender du concept au rendu final — matériaux, lumière et composition.',

    'career.label':'Parcours',
    'career.title':'Parcours & formation.',
    'career.lead':'Entre cinéma, arts visuels et code — un chemin pensé pour croiser les disciplines.',
    'career.education':'Formation','career.experience':'Expérience',

    'about.label':'Profil',
    'about.title':"Je construis des expériences numériques soignées entre code, design et 3D.",
    'about.lead':"Né en Tunisie et basé à Paris, je travaille comme développeur créatif : apps mobiles, sites interactifs, jeux, mondes VR et visuels 3D. Mon travail se situe entre exécution technique et direction visuelle.",
    'about.based':'Basé à','about.origin':'Origine','about.languages':'Langues',
    'about.statuslabel':'Statut','about.status':'Ouvert aux opportunités',

    'contact.label':'Contact','contact.title':"Construisons quelque chose avec du goût.",
    'contact.lead':"Ouvert aux stages, missions freelance et collaborations en creative tech.",
    'contact.email':'Email','contact.cv':'Télécharger CV','contact.available':'Disponible pour missions'
  },
  en: {}
};

let lang = localStorage.getItem('lang') || 'en';
const langToggle = document.getElementById('langToggle');

function applyLang(){
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el)=>{
    const key = el.dataset.i18n;
    const txt = translations[lang]?.[key];
    if (txt) el.textContent = txt;
  });
  if (langToggle){
    const cur = langToggle.querySelector('.lang-current');
    const nxt = langToggle.querySelector('.lang-next');
    if (cur && nxt){
      cur.textContent = lang.toUpperCase();
      nxt.textContent = lang === 'en' ? 'FR' : 'EN';
    }
  }
  localStorage.setItem('lang', lang);
}

if (langToggle){
  langToggle.addEventListener('click', ()=>{
    lang = lang === 'en' ? 'fr' : 'en';
    applyLang();
    tickCountdown();
  });
}
applyLang();

/* ----- Footer year ----- */
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

/* ----- Countdown (Connect) ----- */
const countdown = document.getElementById('countdown');

function tickCountdown(){
  if (!countdown) return;
  const target = new Date('2026-05-31T00:00:00');
  const ms = target - new Date();
  if (ms <= 0){
    countdown.textContent = lang === 'fr' ? 'Lancement' : 'Launching';
    return;
  }
  const d = Math.floor(ms/86400000);
  const h = Math.floor((ms%86400000)/3600000);
  const m = Math.floor((ms%3600000)/60000);
  const dL = lang === 'fr' ? 'j' : 'd';
  countdown.textContent = `${d}${dL} ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;
}
tickCountdown();
setInterval(tickCountdown, 60000);

/* ----- Mobile menu ----- */
const siteHeader = document.getElementById('siteHeader');
const navMenuBtn = document.getElementById('navMenuBtn');
const mobilePanel = document.getElementById('mobilePanel');

if (navMenuBtn && siteHeader && mobilePanel){
  navMenuBtn.addEventListener('click', ()=>{
    const isOpen = siteHeader.classList.toggle('menu-open');
    navMenuBtn.setAttribute('aria-expanded', String(isOpen));
    mobilePanel.setAttribute('aria-hidden', String(!isOpen));
  });
  document.querySelectorAll('.mobile-link').forEach((link)=>{
    link.addEventListener('click', ()=>{
      siteHeader.classList.remove('menu-open');
      navMenuBtn.setAttribute('aria-expanded', 'false');
      mobilePanel.setAttribute('aria-hidden', 'true');
    });
  });
  window.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape'){
      siteHeader.classList.remove('menu-open');
      navMenuBtn.setAttribute('aria-expanded', 'false');
      mobilePanel.setAttribute('aria-hidden', 'true');
    }
  });
}

/* ----- Active nav + scrolled header ----- */
const sectionsForNav = Array.from(document.querySelectorAll('section[id]'));

function onScroll(){
  if (sectionsForNav.length){
    let currentId = sectionsForNav[0].id;
    sectionsForNav.forEach((s)=>{
      const r = s.getBoundingClientRect();
      if (r.top <= 180) currentId = s.id;
    });
    document.querySelectorAll('.nav-link').forEach((link)=>{
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }
  if (siteHeader){
    siteHeader.classList.toggle('scrolled', window.scrollY > 40);
  }
}
window.addEventListener('scroll', onScroll, { passive:true });
window.addEventListener('load', onScroll);
onScroll();

/* ----- Phone parallax (Connect) ----- */
const phoneStage = document.getElementById('phoneStage');
if (phoneStage && matchMedia('(hover:hover)').matches){
  const cols = phoneStage.querySelectorAll('.phone-col');
  phoneStage.addEventListener('pointermove', (e)=>{
    const rect = phoneStage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - .5;
    const y = (e.clientY - rect.top) / rect.height - .5;
    cols.forEach((col, i)=>{
      const depth = i === 1 ? 1 : .7;
      const baseRot = col.classList.contains('left') ? -5 : col.classList.contains('right') ? 5 : 0;
      const baseY = col.classList.contains('center') ? -24 : 28;
      col.style.transform = `translate(${x*14*depth}px, ${baseY + y*10*depth}px) rotate(${baseRot + x*3}deg)`;
    });
  });
  phoneStage.addEventListener('pointerleave', ()=>{
    cols.forEach(c=>{ c.style.transform = ''; });
  });
}

/* ----- Carousel ----- */
function buildCarousel(rootId, opts={}){
  const root = document.getElementById(rootId);
  if (!root) return;
  const slides = Array.from(root.querySelectorAll('.carousel-slide'));
  const prev = root.querySelector('.car-btn.prev');
  const next = root.querySelector('.car-btn.next');
  const thumbsRoot = root.querySelector('.carousel-thumbs, .thumb-grid');
  const thumbs = thumbsRoot ? Array.from(thumbsRoot.querySelectorAll('.thumb')) : [];

  // dots
  const dotsRoot = opts.dotsId ? document.getElementById(opts.dotsId) : null;
  if (dotsRoot){
    dotsRoot.innerHTML = '';
    slides.forEach((_, idx)=>{
      const d = document.createElement('i');
      if (idx === 0) d.classList.add('active');
      dotsRoot.appendChild(d);
    });
  }
  const dots = dotsRoot ? Array.from(dotsRoot.querySelectorAll('i')) : [];

  let i = 0;

  function render(){
    slides.forEach((s, idx)=>s.classList.toggle('active', idx === i));
    thumbs.forEach((t, idx)=>t.classList.toggle('active', idx === i));
    dots.forEach((d, idx)=>d.classList.toggle('active', idx === i));
    if (opts.isVideo){
      slides.forEach((s, idx)=>{
        const v = s.querySelector('video');
        if (!v) return;
        if (idx === i){
          v.play().catch(()=>{});
        } else {
          v.pause();
          try { v.currentTime = 0; } catch(_){}
        }
      });
    }
    if (opts.onChange) opts.onChange(i);
  }

  if (prev) prev.addEventListener('click', ()=>{ i = (i - 1 + slides.length) % slides.length; render(); });
  if (next) next.addEventListener('click', ()=>{ i = (i + 1) % slides.length; render(); });
  thumbs.forEach((t)=>{
    t.addEventListener('click', ()=>{
      const idx = Number(t.dataset.index);
      i = Number.isFinite(idx) ? idx : thumbs.indexOf(t);
      render();
    });
  });

  // swipe
  const stage = root.querySelector('.carousel-stage');
  let startX = 0, startY = 0, dragging = false;
  if (stage){
    stage.addEventListener('pointerdown', (e)=>{
      if (e.target.closest('.car-btn')) return;
      startX = e.clientX; startY = e.clientY; dragging = true;
    });
    stage.addEventListener('pointerup', (e)=>{
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)){
        if (dx < 0 && next) next.click();
        else if (dx > 0 && prev) prev.click();
      }
      dragging = false;
    });
    stage.addEventListener('pointercancel', ()=>{ dragging = false; });
  }

  render();
}

/* Build image thumbs for 3D Craft */
(function buildImageThumbs(){
  const grid = document.getElementById('imageThumbs');
  if (!grid) return;
  const slides = document.querySelectorAll('#imageTrack .carousel-slide img');
  slides.forEach((img, idx)=>{
    const b = document.createElement('button');
    b.className = 'thumb' + (idx === 0 ? ' active' : '');
    b.dataset.index = String(idx);
    b.setAttribute('aria-label', `Render ${idx+1}`);
    b.innerHTML = `<img src="${img.src}" alt="">`;
    grid.appendChild(b);
  });
})();

const videoTitleEl = document.getElementById('videoTitle');
const videoIndexEl = document.getElementById('videoIndex');
const craftIndexEl = document.getElementById('craftIndex');
const videoTitles = ['game.v1','game.v2','game.v3','game.v4'];
const videoTitlesEn = ['Open-world exploration','Vehicles & movement','Environment design','Visual storytelling'];

buildCarousel('videoCarousel', {
  isVideo:true,
  dotsId:'videoDots',
  onChange:(i)=>{
    if (videoIndexEl) videoIndexEl.textContent = String(i+1).padStart(2,'0');
    if (videoTitleEl){
      const key = videoTitles[i];
      const txt = translations[lang]?.[key] || videoTitlesEn[i];
      videoTitleEl.textContent = txt;
      videoTitleEl.setAttribute('data-i18n', key);
    }
  }
});

buildCarousel('imageCarousel', {
  dotsId:'imageDots',
  onChange:(i)=>{ if (craftIndexEl) craftIndexEl.textContent = String(i+1).padStart(2,'0'); }
});



/* ----- Video thumbnails: show first frame instead of black boxes ----- */
function prepareVideoThumbnails(){
  const thumbVideos = document.querySelectorAll('#videoThumbs video');

  thumbVideos.forEach((video)=>{
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const showFrame = () => {
      const seekTo = Math.min(0.12, Math.max(0, (video.duration || 1) - 0.05));
      try {
        video.currentTime = seekTo;
      } catch (_) {}
    };

    video.addEventListener('loadedmetadata', showFrame, { once:true });
    video.addEventListener('seeked', ()=>{
      video.pause();
      video.classList.add('thumb-ready');
    }, { once:true });

    // Safari / slow-loading fallback: nudge load and try again once the frame is available.
    video.addEventListener('loadeddata', ()=>{
      if (!video.classList.contains('thumb-ready')) showFrame();
    }, { once:true });

    video.load();
  });
}

prepareVideoThumbnails();

/* ----- Lightbox (double-click 3D image to expand) ----- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeLightbox = document.getElementById('closeLightbox');

if (lightbox && lightboxImg){
  document.querySelectorAll('#imageTrack .carousel-slide img').forEach((img)=>{
    img.addEventListener('dblclick', ()=>{
      lightboxImg.src = img.src;
      lightbox.classList.add('open');
    });
    img.style.cursor = 'zoom-in';
  });
  if (closeLightbox) closeLightbox.addEventListener('click', ()=>lightbox.classList.remove('open'));
  lightbox.addEventListener('click', (e)=>{ if (e.target === lightbox) lightbox.classList.remove('open'); });
  window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') lightbox.classList.remove('open'); });
}

/* ----- Reveal on scroll ----- */
(() => {
  const revealItems = document.querySelectorAll('.s-head, .head-grid, .connect-head, .phone-col, .carousel, .skill-row, .career-col, .portrait, .about-copy, .contact-cards');
  revealItems.forEach(el=>el.setAttribute('data-reveal',''));
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if (en.isIntersecting){
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin:'0px 0px -8% 0px', threshold:0.1 });
    revealItems.forEach(el=>io.observe(el));
  } else {
    revealItems.forEach(el=>el.classList.add('visible'));
  }
})();

/* =========================================================
   WebGL bordeaux nebula background (unchanged logic, clean colors)
   ========================================================= */

const canvas = document.getElementById('shader');
const gl = canvas?.getContext('webgl', {
  antialias:false,
  premultipliedAlpha:false,
  powerPreference:'high-performance'
});

if (canvas && gl){
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}`;

  const FRAG = `precision highp float;
uniform float u_time;uniform vec2 u_res;uniform vec2 u_mouse;uniform float u_intensity;uniform float u_scale;uniform float u_speed;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));vec2 u=f*f*(3.-2.*f);return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;}
float fbm(vec2 p){float v=0.;float a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=0.5;}return v;}
vec2 curl(vec2 p){float e=0.01;float n1=fbm(p+vec2(0.,e));float n2=fbm(p-vec2(0.,e));float n3=fbm(p+vec2(e,0.));float n4=fbm(p-vec2(e,0.));return vec2(n1-n2,-(n3-n4))/(2.0*e);}
void main(){
  vec2 fc=gl_FragCoord.xy;
  vec2 uv=(fc-0.5*u_res)/min(u_res.x,u_res.y);
  vec2 m=(u_mouse-0.5)*vec2(u_res.x/min(u_res.x,u_res.y),u_res.y/min(u_res.x,u_res.y));
  float t=u_time*0.18*u_speed;
  vec2 q=uv*u_scale*1.2;
  vec2 toMouse=(m-uv);
  vec2 flow=curl(q*0.9+t*0.5)*0.35+toMouse*0.05;
  for(int i=0;i<3;i++){q+=flow*0.25;flow=curl(q*0.9+t*0.5)*0.35+toMouse*0.05;}
  float n=fbm(q*1.2+t);
  float n2=fbm(q*2.4-t*0.7);
  float dens=smoothstep(0.16,0.95,n*0.72+n2*0.4);
  vec3 cBlack=vec3(0.012,0.008,0.010);
  vec3 cGrey=vec3(0.22,0.20,0.21);
  vec3 cBordeaux=vec3(0.44,0.07,0.13);
  vec3 cWine=vec3(0.26,0.035,0.075);
  vec3 cEmber=vec3(0.82,0.24,0.30);
  vec3 col=mix(cBlack,cGrey,smoothstep(0.25,0.85,n));
  col=mix(col,cWine,smoothstep(0.45,0.95,n));
  col=mix(col,cBordeaux,smoothstep(0.55,1.0,n2)*0.88);
  col*=dens;
  float r=length(uv-m);
  col+=cEmber*exp(-r*r*2.4)*0.55;
  col+=cBordeaux*exp(-r*r*0.6)*0.18;
  col+=vec3(0.008,0.006,0.007);
  col*=u_intensity;
  col=pow(col, vec3(0.95));
  gl_FragColor=vec4(col,1.0);
}`;

  function compile(src, type){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  const vs = compile(VERT, gl.VERTEX_SHADER);
  const fs = compile(FRAG, gl.FRAGMENT_SHADER);

  if (vs && fs){
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'a');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
      console.error(gl.getProgramInfoLog(program));
    }

    const uniforms = {};
    ['u_time','u_res','u_mouse','u_intensity','u_scale','u_speed'].forEach((name)=>{
      uniforms[name] = gl.getUniformLocation(program, name);
    });

    let mouse = [0.5, 0.5];
    let target = [0.5, 0.5];
    let hidden = false;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resizeShader(){
      const small = innerWidth < 720;
      const dpr = Math.min(devicePixelRatio || 1, small ? 1.25 : 1.75);
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    addEventListener('resize', resizeShader, { passive:true });
    resizeShader();

    addEventListener('pointermove', (e)=>{
      target[0] = e.clientX / innerWidth;
      target[1] = 1 - e.clientY / innerHeight;
    }, { passive:true });

    document.addEventListener('visibilitychange', ()=>{ hidden = document.hidden; });

    function frame(now){
      if (!hidden){
        const t = reduceMotion ? 0 : now / 1000;
        mouse[0] += (target[0] - mouse[0]) * 0.08;
        mouse[1] += (target[1] - mouse[1]) * 0.08;

        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1f(uniforms.u_time, t);
        gl.uniform2f(uniforms.u_res, canvas.width, canvas.height);
        gl.uniform2f(uniforms.u_mouse, mouse[0], mouse[1]);
        gl.uniform1f(uniforms.u_intensity, 1.0);
        gl.uniform1f(uniforms.u_scale, 1.0);
        gl.uniform1f(uniforms.u_speed, 1.0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}
