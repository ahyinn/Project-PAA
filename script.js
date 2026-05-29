// COMMIT 1
(function(){
'use strict';

// SETUP CANVAS
const cv  = document.getElementById('c');
const ctx = cv.getContext('2d');
const W = 3600, H = 2800;
let zoom = 1, vx = 0, vy = 0;
const ZMIN = 0.10, ZMAX = 5;

// STATE
let nodes = [], edges = [], buildings = [], parks = [], waterBodies = [];
let startId = null, goalId = null;
let path = [], pathEdges = [], totalLen = 0, traveled = 0;
let objX = 0, objY = 0, objAngle = 0;
let running = false, rafId = null, lastTime = null;
const SPEED = 60;

let vehicleType = 'car';
let followMode = true;
const FOLLOW_ZOOM_TARGET = 2.0;
const LERP_ZOOM = 0.06, LERP_PAN = 0.10;

// COMMIT 2
// DATA 47 LOKASI NYATA TANJUNGPINANG (BARU)
const LOCATION_DATA = [
  { nama:'UMRAH – Kampus Dompak',         kategori:'Kampus',       icon:'🎓' },
  { nama:'UMRAH – Kampus Senggarang',     kategori:'Kampus',       icon:'🎓' },
  { nama:'RSUD Raja Ahmad Thabib',        kategori:'Rumah Sakit',  icon:'🏥' },
  { nama:'RSAL Dr. Midiyato Suratani',    kategori:'Rumah Sakit',  icon:'🏥' },
  { nama:'Puskesmas Batu 10',             kategori:'Puskesmas',    icon:'🏥' },
  { nama:'TCC Mall',                      kategori:'Mall',         icon:'🏬' },
  { nama:'Ramayana Mall',                 kategori:'Mall',         icon:'🏬' },
  { nama:'Pinang Lestari Swalayan',       kategori:'Swalayan',     icon:'🏪' },
  { nama:'MR. DIY Batu 10',              kategori:'Toko',         icon:'🛒' },
  { nama:'Pasar Tradisional Bintan Center', kategori:'Pasar',      icon:'🏬' },
  { nama:'SMA Negeri 1',                  kategori:'Sekolah',      icon:'🏫' },
  { nama:'SMA Negeri 2',                  kategori:'Sekolah',      icon:'🏫' },
  { nama:'SMK Negeri 1',                  kategori:'Sekolah',      icon:'🏫' },
  { nama:'SMK Negeri 4',                  kategori:'Sekolah',      icon:'🏫' },
  { nama:'Masjid Agung Al-Hikmah',        kategori:'Masjid',       icon:'🕌' },
  { nama:'Masjid Al-Hussein',             kategori:'Masjid',       icon:'🕌' },
  { nama:'Masjid Besar Al-Uswah',         kategori:'Masjid',       icon:'🕌' },
  { nama:'Gereja HKBP Bintan Centre',     kategori:'Gereja',       icon:'⛪' },
  { nama:'Klenteng Tian Hou Sheng',       kategori:'Klenteng',     icon:'🏮' },
  { nama:'Bandara Raja Haji Fisabilillah', kategori:'Bandara',     icon:'✈️' },
  { nama:'Pelabuhan Sri Bintan Pura',     kategori:'Pelabuhan',    icon:'🚢' },
  { nama:'CK Tanjungpinang Hotel',        kategori:'Hotel',        icon:'🏨' },
  { nama:'Aston Tanjung Pinang',          kategori:'Hotel',        icon:'🏨' },
  { nama:'Trans Studio Garden',           kategori:'Rekreasi',     icon:'🌳' },
  { nama:'Gedung Gonggong',               kategori:'Landmark',     icon:'🏛️' },
  { nama:'Taman Tepi Laut',               kategori:'Taman',        icon:'🌳' },
  { nama:'Taman Pamedan',                 kategori:'Taman',        icon:'🌳' },
  { nama:'Tugu Pensil',                   kategori:'Landmark',     icon:'🗼' },
  { nama:'Taman Batu 10',                 kategori:'Taman',        icon:'🌳' },
  { nama:'Stadion Sulaiman Abdullah',     kategori:'Olahraga',     icon:'⚽' },
  { nama:'Lapangan Futsal',               kategori:'Olahraga',     icon:'⚽' },
  { nama:'Lapangan Hang Lekir',           kategori:'Olahraga',     icon:'🏅' },
  { nama:'Pengadilan Negeri',             kategori:'Pemerintah',   icon:'🏢' },
  { nama:'Pengadilan Agama',              kategori:'Pemerintah',   icon:'🏢' },
  { nama:'Kemenag KM 3,5',               kategori:'Pemerintah',   icon:'🏢' },
  { nama:'Kejaksaan Tinggi',              kategori:'Pemerintah',   icon:'🏢' },
  { nama:'Kantor Gubernur',               kategori:'Pemerintah',   icon:'🏢' },
  { nama:'Dinas Pendidikan',              kategori:'Pemerintah',   icon:'🏢' },
  { nama:'BNN Kota',                      kategori:'Pemerintah',   icon:'🏢' },
  { nama:'Polsek Tanjungpinang Timur',    kategori:'Pemerintah',   icon:'🚓' },
  { nama:'Damkar',                        kategori:'Pemerintah',   icon:'🚒' },
  { nama:'BCA KCP Bintan Center',         kategori:'Bank',         icon:'🏦' },
  { nama:'BRI KCP Bintan Center',         kategori:'Bank',         icon:'🏦' },
  { nama:'Akau Potong Lembu',             kategori:'Kuliner',      icon:'🍜' },
  { nama:'Mie Gacoan',                    kategori:'Kuliner',      icon:'🍜' },
  { nama:'Mr Blitz Batu 10',              kategori:'Kuliner',      icon:'🍔' },
  { nama:'TPU BT 7',                      kategori:'Pemakaman',    icon:'⚰️' },
];

// Array node lokasi aktif (posisi di-generate ulang setiap generateMap)
let locationNodes = [];
// Node yang sedang dipilih/popup
let activePopupLocId = null;

// COMMIT 2
// GENERATE PETA
function randInt(a,b){ return Math.floor(Math.random()*(b-a))+a; }
function rand(a,b)   { return Math.random()*(b-a)+a; }

const BLDG_PAL = [
  {fill:'#f5e6c8', stroke:'#c8a060', roof:'#d4956a'},
  {fill:'#e8d5b0', stroke:'#b89050', roof:'#c07840'},
  {fill:'#dce8d8', stroke:'#80a870', roof:'#6a9060'},
  {fill:'#d8e4ec', stroke:'#7898b8', roof:'#6080a0'},
  {fill:'#ecdccc', stroke:'#b88060', roof:'#a06040'},
  {fill:'#e4e0d4', stroke:'#908070', roof:'#807060'},
];

function generateMap(){
  nodes=[]; edges=[]; buildings=[]; parks=[]; waterBodies=[];
  startId=null; goalId=null;
  path=[]; pathEdges=[]; totalLen=0; traveled=0;
  activePopupLocId = null;
  document.getElementById('location-popup').style.display = 'none';

  const COLS=10, ROWS=8, CW=W/COLS, CH=H/ROWS, MARGIN=100;

  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const x = Math.min(Math.max(c*CW+CW/2+rand(-CW*.28,CW*.28), MARGIN), W-MARGIN);
    const y = Math.min(Math.max(r*CH+CH/2+rand(-CH*.28,CH*.28), MARGIN), H-MARGIN);
    nodes.push({id:nodes.length, x, y});
  }

  const edgeSet = new Set();
  function addEdge(a,b){
    if(a===b) return;
    const k = Math.min(a,b)+','+Math.max(a,b);
    if(edgeSet.has(k)) return;
    edgeSet.add(k);
    const na=nodes[a], nb=nodes[b];
    const dx=nb.x-na.x, dy=nb.y-na.y, len=Math.hypot(dx,dy);
    const px=-dy/len, py=dx/len;
    const curve = rand(-len*.22, len*.22);
    const c1 = {x:na.x+dx*.28+px*curve, y:na.y+dy*.28+py*curve};
    const c2 = {x:na.x+dx*.72+px*curve, y:na.y+dy*.72+py*curve};
    edges.push({id:edges.length, a, b, c1, c2, len:bzLen(na,c1,c2,nb), roadLen:len});
  }

  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const i=r*COLS+c;
    if(c<COLS-1) addEdge(i,i+1);
    if(r<ROWS-1) addEdge(i,i+COLS);
    if(c<COLS-1&&r<ROWS-1&&Math.random()<.40) addEdge(i,i+COLS+1);
    if(c>0&&r<ROWS-1&&Math.random()<.35)       addEdge(i,i+COLS-1);
  }
  for(let t=0;t<80&&edges.length<280;t++){
    const a=randInt(0,nodes.length), b=randInt(0,nodes.length);
    if(a!==b){
      const ra=Math.floor(a/COLS),ca=a%COLS,rb=Math.floor(b/COLS),cb=b%COLS;
      if(Math.hypot(ra-rb,ca-cb)<=2.5) addEdge(a,b);
    }
  }
  ensureConnected(edgeSet);

  const lens = edges.map(e=>e.roadLen).sort((a,b)=>a-b);
  const p66=lens[Math.floor(lens.length*.66)], p33=lens[Math.floor(lens.length*.33)];
  edges.forEach(e=>{
    e.type = e.roadLen>p66?'arterial':e.roadLen>p33?'collector':'local';
  });

  generateBuildings();
  generateParks();
  generateWater();

  // Generate posisi 47 node lokasi ──
  generateLocationNodes();

  randomStartGoal();
  stopAnim(false);
  updateUI();
  fitZoom(); centerView();
  computeRoute();
  render();
}

function ensureConnected(edgeSet){
  const adj = nodes.map(()=>[]);
  edges.forEach(e=>{ adj[e.a].push(e.b); adj[e.b].push(e.a); });
  const vis=new Array(nodes.length).fill(false), comps=[];
  function bfs(start){
    const comp=[], q=[start]; vis[start]=true;
    while(q.length){ const n=q.shift(); comp.push(n); adj[n].forEach(nb=>{ if(!vis[nb]){vis[nb]=true;q.push(nb);} }); }
    return comp;
  }
  nodes.forEach((_,i)=>{ if(!vis[i]) comps.push(bfs(i)); });
  const set2=new Set(edges.map(e=>Math.min(e.a,e.b)+','+Math.max(e.a,e.b)));
  for(let i=1;i<comps.length;i++){
    const a=comps[0][randInt(0,comps[0].length)], b=comps[i][randInt(0,comps[i].length)];
    const k=Math.min(a,b)+','+Math.max(a,b);
    if(!set2.has(k)){
      const na=nodes[a],nb=nodes[b],dx=nb.x-na.x,dy=nb.y-na.y,len=Math.hypot(dx,dy);
      const c1={x:na.x+dx*.33,y:na.y+dy*.33}, c2={x:na.x+dx*.67,y:na.y+dy*.67};
      edges.push({id:edges.length,a,b,c1,c2,len,roadLen:len,type:'collector'});
      set2.add(k);
    }
  }
}

function generateBuildings(){
  buildings=[];
  const BW=115, BH=100;
  for(let bx=60;bx<W-60;bx+=BW){
    for(let by=60;by<H-60;by+=BH){
      if(Math.random()<0.55){
        const pad=10, w=rand(28,62), h=rand(22,52);
        const x=bx+rand(pad,BW-w-pad), y=by+rand(pad,BH-h-pad);
        let ok=true;
        for(const n of nodes){ if(Math.hypot(n.x-(x+w/2),n.y-(y+h/2))<55){ok=false;break;} }
        if(!ok) continue;
        const pal=BLDG_PAL[randInt(0,BLDG_PAL.length)];
        buildings.push({x,y,w,h,pal,floors:randInt(1,5),shadow:rand(3,6),roofStyle:randInt(0,3)});
      }
    }
  }
}

function generateParks(){
  parks=[];
  for(let i=0;i<18;i++){
    const x=rand(60,W-200), y=rand(60,H-200);
    const w=rand(70,180), h=rand(60,140);
    const trees=[];
    for(let j=0;j<Math.floor(w*h/1400);j++)
      trees.push({x:x+rand(12,w-12), y:y+rand(12,h-12), r:rand(5,11)});
    parks.push({x,y,w,h,trees});
  }
}

function generateWater(){
  waterBodies=[];
  for(let i=0;i<5;i++){
    waterBodies.push({
      x:rand(100,W-300), y:rand(100,H-200),
      w:rand(80,200), h:rand(50,120)
    });
  }
}

//COMMIT 3
// KONSTANTA DUNIA
const W = 3600, H = 2800;

// Sinkronisasi ukuran canvas dengan viewport
function resize() {
  cv.width  = window.innerWidth;
  cv.height = window.innerHeight;
  clamp();
  render();
}
window.addEventListener('resize', resize);

// Sesuaikan zoom agar seluruh peta tampil
function fitZoom() {
  zoom = Math.min(cv.width / W, cv.height / H) * 0.92;
}

// Pusatkan pandangan ke tengah peta
function centerView() {
  vx = W / 2 - cv.width  / (2 * zoom);
  vy = H / 2 - cv.height / (2 * zoom);
  clamp();
}

// Batasi pan agar tidak keluar batas peta
function clamp() {
  const mw = W * zoom, mh = H * zoom;
  vx = mw <= cv.width
    ? (W - cv.width  / zoom) / 2
    : Math.min(Math.max(vx, 0), W - cv.width  / zoom);
  vy = mh <= cv.height
    ? (H - cv.height / zoom) / 2
    : Math.min(Math.max(vy, 0), H - cv.height / zoom);
}

//COMMIT 4
  //Navigasi Kamera Interaktif
  //zoom terhadap titik tertentu di layar.
  function zoomAtPoint(sx, sy, factor) {
    const oldZ = zoom;
    const newZ = Math.min(Math.max(oldZ * factor, ZMIN), ZMAX);
    if (newZ === oldZ) return;
    const wx = vx + sx / oldZ;
    const wy = vy + sy / oldZ;
    zoom = newZ;
    vx = wx - sx / zoom;
    vy = wy - sy / zoom;
    clamp();
    render();
  }

  //zoomAtCenter(factor) — zoom dari titik tengah layar.
  //Digunakan oleh tombol zoom + / zoom −.
  function zoomAtCenter(factor) {
    zoomAtPoint(cv.width / 2, cv.height / 2, factor);
  }

  // Event Mouse: Pan (drag) & Zoom (scroll wheel) 
  let drag = false, dsx = 0, dsy = 0, dvx = 0, dvy = 0;

  cv.addEventListener('mousedown', e => {
    drag = true;
    dsx = e.clientX; dsy = e.clientY;
    dvx = vx;        dvy = vy;
  });

  window.addEventListener('mousemove', e => {
    if (!drag) return;
    if (followMode && running) disableFollow();
    vx = dvx - (e.clientX - dsx) / zoom;
    vy = dvy - (e.clientY - dsy) / zoom;
    clamp();
    render();
  });

  window.addEventListener('mouseup', () => drag = false);

  // Scroll mouse = zoom ke arah kursor
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    if (followMode && running) disableFollow();
    const r = cv.getBoundingClientRect();
    zoomAtPoint(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 0.87);
  }, { passive: false });

  // Event Touch: Drag (1 jari) & Pinch Zoom (2 jari)
  let lastDist2 = 0;

  cv.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      drag = true;
      dsx = e.touches[0].clientX; dsy = e.touches[0].clientY;
      dvx = vx; dvy = vy;
    }
    if (e.touches.length === 2) {
      drag = false;
      lastDist2 = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
    }
  }, { passive: false });

  cv.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && drag) {
      if (followMode && running) disableFollow();
      vx = dvx - (e.touches[0].clientX - dsx) / zoom;
      vy = dvy - (e.touches[0].clientY - dsy) / zoom;
      clamp(); render();
    }
    if (e.touches.length === 2) {
      const nd = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      if (lastDist2 > 0 && nd > 0) {
        if (followMode && running) disableFollow();
        const r  = cv.getBoundingClientRect();
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
        zoomAtPoint(mx, my, nd / lastDist2);
      }
      lastDist2 = nd;
    }
  }, { passive: false });

  cv.addEventListener('touchend', e => {
    if (e.touches.length === 0) drag = false;
    if (e.touches.length < 2)  lastDist2 = 0;
  });

// COMMIT 5
// ALGORITMA DDA — Menggambar garis lurus di canvas
// Digital Differential Analyzer (digunakan untuk jalan & grid)
function garisDAA(x1, y1, x2, y2, warna, tebal = 1) {
  ctx.strokeStyle = warna;
  ctx.lineWidth   = tebal;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
 
// KURVA BEZIER KUBIK — Titik pada parameter t
// Persamaan: B(t) = (1-t)³P0 + 3(1-t)²tC1 + 3(1-t)t²C2 + t³P3
function bzPt(p0, c1, c2, p3, t) {
  const m = 1 - t, m2 = m * m, t2 = t * t;
  return {
    x: m2 * m * p0.x + 3 * m2 * t * c1.x + 3 * m * t2 * c2.x + t2 * t * p3.x,
    y: m2 * m * p0.y + 3 * m2 * t * c1.y + 3 * m * t2 * c2.y + t2 * t * p3.y
  };
}
 
// TURUNAN BEZIER KUBIK — Untuk menghitung arah/sudut kendaraan
// B'(t) = 3(1-t)²(C1-P0) + 6(1-t)t(C2-C1) + 3t²(P3-C2)
function bzDeriv(p0, c1, c2, p3, t) {
  const m = 1 - t;
  return {
    dx: 3 * m * m * (c1.x - p0.x) + 6 * m * t * (c2.x - c1.x) + 3 * t * t * (p3.x - c2.x),
    dy: 3 * m * m * (c1.y - p0.y) + 6 * m * t * (c2.y - c1.y) + 3 * t * t * (p3.y - c2.y)
  };
}
 
// PANJANG KURVA BEZIER — Aproksimasi numerik (32 segmen)
// Digunakan sebagai bobot edge dalam Dijkstra
function bzLen(p0, c1, c2, p3) {
  let len = 0, prev = p0;
  for (let i = 1; i <= 32; i++) {
    const pt = bzPt(p0, c1, c2, p3, i / 32);
    len += Math.hypot(pt.x - prev.x, pt.y - prev.y);
    prev = pt;
  }
  return len;
}
 
// FUNGSI BANTU GEOMETRI
 
// Interpolasi linear — digunakan untuk follow kamera & animasi zoom
function lerp(a, b, t) { return a + (b - a) * t; }
 
// Rotasi titik (x, y) sebesar angle radian terhadap origin
function rotPt(x, y, angle) {
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle)
  };
}
 
// Menggambar lingkaran node (persimpangan jalan / marker)
function lingkaranNode(cx, cy, r, warna, isi = true) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  if (isi) { ctx.fillStyle = warna;   ctx.fill();   }
  else      { ctx.strokeStyle = warna; ctx.stroke(); }
}

// COMMIT 6
// KONEKTIVITAS GRAF — BFS (Breadth-First Search)
// Memastikan seluruh node pada graf terhubung (connected graph).
// Jika ditemukan komponen terpisah, disambung dengan edge baru.
function ensureConnected(edgeSet) {
  // Bangun adjacency list dari edge yang ada
  const adj = nodes.map(() => []);
  edges.forEach(e => {
    adj[e.a].push(e.b);
    adj[e.b].push(e.a);
  });

  // Temukan semua komponen terhubung via BFS
  const vis   = new Array(nodes.length).fill(false);
  const comps = [];

  function bfs(start) {
    const comp = [], q = [start];
    vis[start] = true;
    while (q.length) {
      const n = q.shift();
      comp.push(n);
      adj[n].forEach(nb => {
        if (!vis[nb]) { vis[nb] = true; q.push(nb); }
      });
    }
    return comp;
  }

  nodes.forEach((_, i) => { if (!vis[i]) comps.push(bfs(i)); });

  // Jika lebih dari 1 komponen sambungkan ke komponen utama (comps[0])
  const set2 = new Set(edges.map(e => Math.min(e.a, e.b) + ',' + Math.max(e.a, e.b)));
  for (let i = 1; i < comps.length; i++) {
    const a = comps[0][randInt(0, comps[0].length)];
    const b = comps[i][randInt(0, comps[i].length)];
    const k = Math.min(a, b) + ',' + Math.max(a, b);
    if (!set2.has(k)) {
      const na = nodes[a], nb = nodes[b];
      const dx = nb.x - na.x, dy = nb.y - na.y, len = Math.hypot(dx, dy);
      const c1 = { x: na.x + dx * .33, y: na.y + dy * .33 };
      const c2 = { x: na.x + dx * .67, y: na.y + dy * .67 };
      edges.push({
        id: edges.length, a, b, c1, c2,
        len, roadLen: len, type: 'collector'
      });
      set2.add(k);
    }
  }
}


})();