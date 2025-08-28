// Helpers
const $ = (q, c=document) => c.querySelector(q);
const $$ = (q, c=document) => Array.from(c.querySelectorAll(q));

// Year
$('#year').textContent = new Date().getFullYear();

// Mobile nav
(() => {
  const burger = $('.hamburger'); const links = $('.nav-links');
  if(!burger || !links) return;
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    const [a,b,c] = burger.children;
    a.style.transform = open ? 'translateY(7px) rotate(45deg)' : '';
    b.style.opacity = open ? '0' : '';
    c.style.transform = open ? 'translateY(-7px) rotate(-45deg)' : '';
  });
  links.addEventListener('click', e => { if (e.target.matches('a')) links.classList.remove('open'); });
})();

// Countdown for Connect (Jan 1, 2026)
(() => {
  const el = $('#connect-countdown');
  if(!el) return;
  const target = new Date('2026-01-01T00:00:00');
  function tick(){
    const now = new Date();
    const ms = target - now;
    if (ms <= 0){ el.textContent = 'Launching — iOS & Android (free)'; return; }
    const d = Math.floor(ms/86400000);
    const h = Math.floor((ms%86400000)/3600000);
    const m = Math.floor((ms%3600000)/60000);
    const s = Math.floor((ms%60000)/1000);
    el.textContent = `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  }
  tick(); setInterval(tick, 1000);
})();

// Connect: PNG screenshot rail
(() => {
  const track = $('#connect-track'); if(!track) return;
  const l = $('.device-arrow.left'); const r = $('.device-arrow.right');
  function step(dir){
    const card = track.querySelector('img.device-png');
    if(!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '16');
    const delta = card.getBoundingClientRect().width + gap;
    track.scrollBy({ left: dir * delta, behavior:'smooth' });
  }
  l.addEventListener('click', ()=>step(-1));
  r.addEventListener('click', ()=>step(1));
})();

// Anthropocene: Videos only
(() => {
  const main = $('#anthro-main');
  const playMain = $('#play-main');
  const openGallery = $('#open-gallery');
  const thumbs = $$('.video-thumbs .thumb');

  const sources = [
    'videos/my-work-video.mp4',
    'videos/my-worktwo-video.mp4',
    'videos/my-workthree-video.mp4',
    'videos/my-workfour-video.mp4'
  ];
  const fallbackForFourth = 'videos/my-workfoor-video.mp4';

  let current = 0;

  function setMain(index){
    current = index;
    main.pause();
    main.removeAttribute('src');
    while (main.firstChild) main.removeChild(main.firstChild);
    const s1 = document.createElement('source');
    s1.src = sources[index];
    s1.type = 'video/mp4';
    main.appendChild(s1);
    if (index === 3){
      const s2 = document.createElement('source');
      s2.src = fallbackForFourth;
      s2.type = 'video/mp4';
      main.appendChild(s2);
    }
    main.load();
  }

  setMain(0);
  thumbs.forEach(v => {
    v.addEventListener('mouseenter', () => v.play().catch(()=>{}));
    v.addEventListener('mouseleave', () => v.pause());
    v.addEventListener('click', () => { setMain(Number(v.dataset.index)); openLightbox(Number(v.dataset.index)); });
  });

  const lb = $('#lightbox');
  const lbVideo = $('#lightbox-video');
  const close = $('.lightbox-close');
  const prev = $('.lightbox-prev');
  const next = $('.lightbox-next');

  function loadIntoLightbox(index){
    lbVideo.pause();
    lbVideo.removeAttribute('src');
    while (lbVideo.firstChild) lbVideo.removeChild(lbVideo.firstChild);
    const s1 = document.createElement('source');
    s1.src = sources[index];
    s1.type = 'video/mp4';
    lbVideo.appendChild(s1);
    if (index === 3){
      const s2 = document.createElement('source');
      s2.src = fallbackForFourth;
      s2.type = 'video/mp4';
      lbVideo.appendChild(s2);
    }
    lbVideo.load();
  }

  function openLightbox(index){
    current = index;
    loadIntoLightbox(current);
    lb.classList.add('active'); lb.setAttribute('aria-hidden','false');
    lbVideo.play().catch(()=>{});
  }
  function closeLightbox(){
    lb.classList.remove('active'); lb.setAttribute('aria-hidden','true');
    lbVideo.pause(); lbVideo.removeAttribute('src');
    while (lbVideo.firstChild) lbVideo.removeChild(lbVideo.firstChild);
  }
  function go(delta){
    current = (current + delta + sources.length) % sources.length;
    loadIntoLightbox(current);
    lbVideo.play().catch(()=>{});
  }

  if (playMain) playMain.addEventListener('click', ()=> openLightbox(current));
  if (openGallery) openGallery.addEventListener('click', ()=> openLightbox(0));
  if (close) close.addEventListener('click', closeLightbox);
  if (prev) prev.addEventListener('click', ()=>go(-1));
  if (next) next.addEventListener('click', ()=>go(1));

  lb.addEventListener('click', (e)=>{ if(e.target === lb) closeLightbox(); });
})();

/* WebGL backgrounds (original + mirrored) */
(() => {
  function initWebGL(canvas, { mirrored=false } = {}){
    if(!canvas) return null;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);

    const geo = new THREE.PlaneBufferGeometry(2,2);
    const uniforms = {
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_mouse: { value: new THREE.Vector2(0.5,0.5) }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `void main(){ gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        precision highp float; uniform vec2 u_res; uniform vec2 u_mouse; uniform float u_time;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p);
          float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
          vec2 u=f*f*(3.-2.*f);
          return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
        }
        void main(){
          vec2 uv = gl_FragCoord.xy/u_res.xy;
          vec2 p = (uv - 0.5)*vec2(u_res.x/u_res.y,1.0);
          float t = u_time*0.03;
          vec2 m = (u_mouse-0.5)*vec2(u_res.x/u_res.y,1.0);
          float md = length(p-m);
          float swirl = 0.05/(md+0.06);

          float n=0., amp=.7; vec2 q=p*.55;
          for(int i=0;i<5;i++){ n+=noise(q+t)*amp; q=q*1.7+vec2(13.1,7.7); amp*=.55; }

          float v = smoothstep(0.,1., n*0.85 + swirl);
          vec3 col = mix(vec3(0.06), vec3(0.88), v);
          col *= smoothstep(1.2, .2, length(p)*1.1);
          gl_FragColor = vec4(col*(0.55+v*0.25), 1.0);
        }`
    });
    scene.add(new THREE.Mesh(geo, mat));

    function onMouse(e){
      let mx = e.clientX / window.innerWidth;
      let my = 1 - (e.clientY / window.innerHeight);
      if (mirrored) mx = 1 - mx;
      uniforms.u_mouse.value.set(mx, my);
    }
    function onResize(){
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.u_res.value.set(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', onResize);

    const direction = mirrored ? -1 : 1;
    (function animate(){
      uniforms.u_time.value += 1.0 * direction;
      requestAnimationFrame(animate);
      renderer.render(scene,camera);
    })();
  }

  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    initWebGL(document.getElementById('webgl-bg'), { mirrored:false });
    initWebGL(document.getElementById('webgl-bg-2'), { mirrored:true });
  }
})();

// Reveal animations
(() => {
  const els = $$('.section-title, .section-subtitle, .card, .device-png, .cinema, .video-thumbs .thumb, .slideshow, .about__image img, .contact-form, .skills-grid, .timeline, .exp');
  els.forEach(el => { el.style.opacity = 0; el.style.transform = 'translateY(18px)'; });
  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        gsap.to(entry.target, {opacity:1, y:0, duration:0.7, ease:'power3.out'});
        io.unobserve(entry.target);
      }
    });
  }, {threshold:.15});
  els.forEach(el=>io.observe(el));
})();
