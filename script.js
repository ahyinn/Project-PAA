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

// COMMIT 7
// Bobot edge = panjang kurva Bezier (bzLen), bukan jarak Euclidean,
// agar akurat terhadap lekukan jalan yang dirender.
function dijkstra(src, dst) {
  const INF      = 1e18;
  const dist     = new Array(nodes.length).fill(INF);
  const prev     = new Array(nodes.length).fill(-1);
  const prevEdge = new Array(nodes.length).fill(-1);
  const visited  = new Array(nodes.length).fill(false);
  dist[src] = 0;

  // Bangun adjacency list: { n: neighbor, w: bobot, ei: index edge }
  const adj = nodes.map(() => []);
  edges.forEach((e, i) => {
    adj[e.a].push({ n: e.b, w: e.len, ei: i });
    adj[e.b].push({ n: e.a, w: e.len, ei: i });
  });

  // Priority Queue — diproses dari jarak terkecil
  const pq = [{ n: src, d: 0 }];
  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);          // simulasi min-heap
    const { n, d } = pq.shift();
    if (visited[n]) continue;
    visited[n] = true;
    if (n === dst) break;                   // early exit

    for (const nb of adj[n]) {
      const nd = d + nb.w;
      if (nd < dist[nb.n]) {
        dist[nb.n]     = nd;
        prev[nb.n]     = n;
        prevEdge[nb.n] = nb.ei;
        pq.push({ n: nb.n, d: nd });
      }
    }
  }

  // Tidak ada rute
  if (dist[dst] === INF) return { nodes: [], edges: [] };

  // Rekonstruksi jalur dari dst → src, lalu balik
  const nodeSeq = [], edgeSeq = [];
  let cur = dst;
  while (cur !== src) {
    nodeSeq.unshift(cur);
    edgeSeq.unshift(prevEdge[cur]);
    cur = prev[cur];
  }
  nodeSeq.unshift(src);

  return { nodes: nodeSeq, edges: edgeSeq };
}

// COMMIT 8
// REKONSTRUKSI RUTE — computeRoute()
// Mengambil hasil dijkstra() lalu membangun array pathEdges
// berisi segmen Bezier yang siap dianimasikan.
function computeRoute() {
  if (startId === null || goalId === null) return;
 
  const result = dijkstra(startId, goalId);
  path = result.nodes;
  const eids = result.edges;
 
  if (path.length < 2) {
    document.getElementById('tRoute').textContent = 'Tak ada rute';
    pathEdges = []; totalLen = 0;
    return;
  }
 
  pathEdges = []; totalLen = 0;
  for (let i = 0; i < eids.length; i++) {
    const e        = edges[eids[i]];
    const fromNode = path[i];
    let p0, c1, c2, p3;
    // Tentukan arah Bezier sesuai arah perjalanan
    if (e.a === fromNode) {
      p0 = nodes[e.a]; c1 = e.c1; c2 = e.c2; p3 = nodes[e.b];
    } else {
      p0 = nodes[e.b]; c1 = e.c2; c2 = e.c1; p3 = nodes[e.a];
    }
    pathEdges.push({ p0, c1, c2, p3, len: e.len });
    totalLen += e.len;
  }
 
  traveled = 0;
  objX = nodes[startId].x;
  objY = nodes[startId].y;
  document.getElementById('tRoute').textContent =
    `${path.length - 1} seg · ${Math.round(totalLen)}m`;
}
 
// GENERATE 47 NODE LOKASI — posisi diacak setiap generateMap()
// Setiap lokasi di-snap ke node jalan terdekat agar masuk graf
// Dijkstra, lalu dihubungkan via edge 'local'.
function getNearestRoadNode(x, y) {
  let best = null, bestDist = Infinity;
  for (const n of nodes) {
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < bestDist) { bestDist = d; best = n; }
  }
  return best;
}
 
function generateLocationNodes() {
  locationNodes = [];
  const MARGIN        = 160;
  const MIN_DIST      = 140;   // jarak minimum antar marker lokasi
  const usedPositions = [];
 
  for (let i = 0; i < LOCATION_DATA.length; i++) {
    const data = LOCATION_DATA[i];
    let x, y, tries = 0;
 
    // Cari posisi acak yang tidak terlalu dekat dengan marker lain
    do {
      x = rand(MARGIN, W - MARGIN);
      y = rand(MARGIN, H - MARGIN);
      tries++;
    } while (
      tries < 80 &&
      usedPositions.some(p => Math.hypot(p.x - x, p.y - y) < MIN_DIST)
    );
 
    // Snap ke node jalan terdekat + offset kecil agar tidak menimpa simbol persimpangan
    const nearest      = getNearestRoadNode(x, y);
    const offsetAngle  = rand(0, Math.PI * 2);
    const offsetDist   = rand(30, 90);
    const fx = Math.max(MARGIN, Math.min(W - MARGIN, nearest.x + Math.cos(offsetAngle) * offsetDist));
    const fy = Math.max(MARGIN, Math.min(H - MARGIN, nearest.y + Math.sin(offsetAngle) * offsetDist));
 
    usedPositions.push({ x: fx, y: fy });
 
    // Tambahkan sebagai node graf baru
    const newNodeId = nodes.length;
    nodes.push({ id: newNodeId, x: fx, y: fy, isLocationNode: true });
 
    // Hubungkan ke node jalan terdekat
    const na = nodes[newNodeId], nb = nearest;
    const dx = nb.x - na.x, dy = nb.y - na.y, len = Math.hypot(dx, dy);
    if (len > 1) {
      const c1 = { x: na.x + dx * .33, y: na.y + dy * .33 };
      const c2 = { x: na.x + dx * .67, y: na.y + dy * .67 };
      edges.push({
        id: edges.length, a: newNodeId, b: nearest.id,
        c1, c2, len: bzLen(na, c1, c2, nb), roadLen: len, type: 'local'
      });
    }
 
    locationNodes.push({
      locId   : i,
      nodeId  : newNodeId,
      nama    : data.nama,
      kategori: data.kategori,
      icon    : data.icon,
      x       : fx,
      y       : fy,
    });
  }
}
 
// RANDOM START & GOAL
// Start: node jalan biasa (bukan locationNode)
// Goal : wajib salah satu dari 47 locationNode
function randomStartGoal() {
  if (startId !== null && nodes[startId]) nodes[startId].isStart = false;
  if (goalId  !== null && nodes[goalId])  nodes[goalId].isGoal   = false;
 
  // Cari node jalan terdekat dari posisi acak sebagai START
  const MARGIN = 100;
  const rx = rand(MARGIN, W - MARGIN);
  const ry = rand(MARGIN, H - MARGIN);
  let bestStart = null, bestDist = Infinity;
  for (const n of nodes) {
    if (n.isLocationNode) continue;
    const d = Math.hypot(n.x - rx, n.y - ry);
    if (d < bestDist) { bestDist = d; bestStart = n; }
  }
  startId = bestStart ? bestStart.id : randInt(0, nodes.length);
 
  // GOAL: acak dari 47 lokasi
  let goalLoc;
  do {
    goalLoc = locationNodes[randInt(0, locationNodes.length)];
  } while (goalLoc.nodeId === startId);
  goalId = goalLoc.nodeId;
 
  nodes[startId].isStart = true;
  nodes[goalId].isGoal   = true;
  path = []; pathEdges = []; totalLen = 0; traveled = 0;
  if (nodes[startId]) { objX = nodes[startId].x; objY = nodes[startId].y; }
  document.getElementById('tRoute').textContent = '—';
}

  //COMMIT 9
  // LOOP ANIMASI UTAMA — animate()
function animate(ts) {
  if (!running) return;
  if (!lastTime) lastTime = ts;

  const dt = Math.min(0.033, (ts - lastTime) / 1000);
  lastTime = ts;

  traveled += SPEED * dt;

  if (traveled >= totalLen) {
    traveled = totalLen;
    posFromTravel(traveled);
    updateFollowCam();
    render();
    stopAnim(true);   // animasi selesai → tiba di tujuan
    return;
  }

  posFromTravel(traveled);
  updateFollowCam();
  render();
  rafId = requestAnimationFrame(animate);
}

// KONTROL ANIMASI
function startAnim() {
  if (pathEdges.length === 0) computeRoute();
  if (pathEdges.length === 0) { showToast('Tidak ada rute valid', 1800); return; }
  if (running) return;
  running  = true;
  lastTime = null;
  setDot('moving');
  setStatus('Navigasi aktif');
  document.getElementById('btnPlay').innerHTML = '⏸ Pause';
  updateFollowBtn();
  rafId = requestAnimationFrame(animate);
}

function pauseAnim() {
  if (!running) return;
  cancelAnimationFrame(rafId);
  running = false; lastTime = null;
  setDot('idle');
  setStatus('Dijeda');
  document.getElementById('btnPlay').innerHTML = '▶ Lanjut';
  document.getElementById('follow-badge').style.display = 'none';
}

function stopAnim(arrived) {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  running = false; lastTime = null;
  setDot(arrived ? 'done' : 'idle');
  setStatus(arrived ? 'Tiba di tujuan!' : 'Siap');
  document.getElementById('btnPlay').innerHTML = '▶ Start Track';
  document.getElementById('follow-badge').style.display = 'none';
  if (arrived) {
    showToast('✅ Tiba di tujuan!', 2200);
    if (followMode) zoomOutOverview();
  }
}

function resetAnim() {
  stopAnim(false);
  traveled = 0;
  if (startId !== null && nodes[startId]) {
    objX = nodes[startId].x;
    objY = nodes[startId].y;
  }
  computeRoute();
  render();
}

function togglePlay() {
  if (running) pauseAnim(); else startAnim();
}

  //COMMIT 10
  // POSISI & SUDUT KENDARAAN — posFromTravel()
function posFromTravel(t) {
  let acc = 0;
  for (let i = 0; i < pathEdges.length; i++) {
    const seg = pathEdges[i];
    if (acc + seg.len >= t || i === pathEdges.length - 1) {
      const s  = Math.min(t - acc, seg.len);
      const tp = seg.len > 0 ? s / seg.len : 0;
      const pt = bzPt(seg.p0, seg.c1, seg.c2, seg.p3, tp);
      const dv = bzDeriv(seg.p0, seg.c1, seg.c2, seg.p3, tp);
      objX = pt.x; objY = pt.y;
      if (Math.hypot(dv.dx, dv.dy) > 0.001) {
        objAngle = Math.atan2(dv.dy, dv.dx);   // sinkronisasi rotasi
      }
      break;
    }
    acc += seg.len;
  }
}

// RENDER OBJEK BERGERAK — drawObjek()
// Translate + Rotate canvas ke posisi kendaraan, lalu gambar
// sesuai tipe kendaraan yang dipilih.
function drawObjek(x, y, angle, type) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Bayangan di bawah semua kendaraan
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 7, type === 'person' ? 6 : 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  switch (type) {
    case 'car':    drawMobil();   break;
    case 'motor':  drawMotor();   break;
    case 'bike':   drawSepeda();  break;
    case 'person': drawOrang();   break;
  }
  ctx.restore();
}

// ── Mobil ──
function drawMobil() {
  ctx.fillStyle = '#c84b2f';
  ctx.beginPath(); ctx.roundRect(-16, -7, 32, 14, 4); ctx.fill();
  ctx.fillStyle = '#a03020';
  ctx.beginPath(); ctx.roundRect(-9, -13, 18, 10, 3); ctx.fill();
  // Kaca depan & belakang
  ctx.fillStyle = 'rgba(180,220,255,0.85)';
  ctx.beginPath(); ctx.roundRect(0, -12, 7, 7, 1.5); ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,0.6)';
  ctx.beginPath(); ctx.roundRect(-7, -12, 6, 7, 1.5); ctx.fill();
  // Lampu
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(14, -5, 4, 3); ctx.fillRect(14, 2, 4, 3);
  ctx.fillStyle = '#fca5a5';
  ctx.fillRect(-18, -5, 4, 3); ctx.fillRect(-18, 2, 4, 3);
  // Roda
  for (const [wx, wy] of [[-10, 8], [10, 8]]) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.ellipse(wx, wy, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(wx, wy, 2, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Motor ──
function drawMotor() {
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath(); ctx.roundRect(-12, -4, 24, 8, 3); ctx.fill();
  ctx.fillStyle = '#1e40af';
  ctx.beginPath(); ctx.roundRect(-6, -7, 12, 7, 2); ctx.fill();
  // Helm pengendara
  ctx.fillStyle = '#f8d48a';
  ctx.beginPath(); ctx.arc(0, -10, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.beginPath(); ctx.arc(0, -10, 5, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fef08a'; ctx.fillRect(12, -2, 3, 4);
  for (const wx of [-10, 10]) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.ellipse(wx, 0, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(wx, 0, 1.5, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Sepeda ──
function drawSepeda() {
  ctx.strokeStyle = '#5a3e1b'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(0, -6); ctx.lineTo(8, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(10, -4); ctx.stroke();
  ctx.fillStyle = '#f8d48a';
  ctx.beginPath(); ctx.arc(0, -9, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2d6a4f';
  ctx.beginPath(); ctx.arc(0, -9, 4, Math.PI, Math.PI * 2); ctx.fill();
  for (const wx of [-8, 8]) {
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(wx, 0, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(wx, 0, 1.5, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Orang ──
function drawOrang() {
  const warna = '#5a3e1b';
  ctx.fillStyle = '#f8d48a'; lingkaranNode(0, -12, 5, warna, true);
  garisDAA(0, -7, 0, 4, warna, 2);
  const kick = Math.sin(traveled * 0.08) * 8;
  garisDAA(0, 4, kick,  12, warna, 2);
  garisDAA(0, 4, -kick, 12, warna, 2);
  garisDAA(0, -4, 8,  2, warna, 2);
  garisDAA(0, -4, -8, 2, warna, 2);
  ctx.fillStyle = '#2563eb'; ctx.fillRect(-4, -7, 8, 10);
}

//COMMIT 11
// FOLLOW KAMERA — updateFollowCam()
function updateFollowCam() {
  if (!followMode || !running) return;

  // Interpolasi zoom menuju target follow
  zoom = lerp(zoom, FOLLOW_ZOOM_TARGET, LERP_ZOOM);
  zoom = Math.min(Math.max(zoom, ZMIN), ZMAX);

  // Interpolasi pan agar objek selalu di tengah layar
  vx = lerp(vx, objX - cv.width  / (2 * zoom), LERP_PAN);
  vy = lerp(vy, objY - cv.height / (2 * zoom), LERP_PAN);

  clamp();
}

// NONAKTIFKAN FOLLOW — saat user drag/scroll manual
function disableFollow() {
  if (!followMode) return;
  followMode = false;
  updateFollowBtn();
}

// UPDATE TOMBOL FOLLOW — sinkronisasi visual status follow
function updateFollowBtn() {
  const btn   = document.getElementById('btnFollow');
  const badge = document.getElementById('follow-badge');
  btn.className = followMode ? 'btn follow-on' : 'btn follow-off';
  badge.style.display = (followMode && running) ? 'block' : 'none';
}

// ZOOM OUT OVERVIEW — animasi kembali ke tampilan penuh peta
function zoomOutOverview() {
  const tz  = Math.min(cv.width / W, cv.height / H) * 0.92;
  const tvx = W / 2 - cv.width  / (2 * tz);
  const tvy = H / 2 - cv.height / (2 * tz);
  let n = 0;
  function step() {
    zoom = lerp(zoom, tz,  .06);
    vx   = lerp(vx,   tvx, .06);
    vy   = lerp(vy,   tvy, .06);
    clamp(); render();
    if (++n < 80) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

  //COMMIT 12
  // RENDER UTAMA — render()
function render() {
  const cw = cv.width, ch = cv.height;
  ctx.clearRect(0, 0, cw, ch);

  // Background luar peta
  ctx.fillStyle = '#e8dfc8';
  ctx.fillRect(0, 0, cw, ch);

  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(-vx, -vy);

  // Background peta
  ctx.fillStyle = '#ede4ce';
  ctx.fillRect(0, 0, W, H);

  // Grid samar
  ctx.globalAlpha = 0.06;
  for (let i = 0; i <= W; i += 120) garisDAA(i, 0, i, H, '#806030', 1);
  for (let i = 0; i <= H; i += 120) garisDAA(0, i, W, i, '#806030', 1);
  ctx.globalAlpha = 1;

  drawWater();
  drawParks();
  drawBuildings();
  drawRoads();
  drawRouteHighlight();
  drawNodes();

  // Bendera START/GOAL untuk node jalan biasa
  for (const n of nodes) {
    if (n.isStart) drawBendera(n.x, n.y, '#dc2626', 'START',  '🚩');
    else if (n.isGoal) drawBendera(n.x, n.y, '#16a34a', 'FINISH', '🏁');
  }

  // Aura kendaraan saat follow aktif
  if (followMode && running) {
    ctx.beginPath(); ctx.arc(objX, objY, 34, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(45,106,79,0.10)'; ctx.fill();
    ctx.beginPath(); ctx.arc(objX, objY, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(45,106,79,0.15)'; ctx.fill();
  }
  drawObjek(objX, objY, objAngle, vehicleType);

  // Marker 47 lokasi (layer paling atas)
  drawLocationMarkers();

  ctx.restore();
  document.getElementById('tZoom').textContent = Math.round(zoom * 100) + '%';
}

// ── Badan Air ──
function drawWater() {
  for (const w of waterBodies) {
    ctx.fillStyle = '#a8c8e0';
    ctx.beginPath();
    ctx.ellipse(w.x + w.w / 2, w.y + w.h / 2, w.w / 2, w.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7aaac0'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(w.x + w.w / 2, w.y + w.h / 2, w.w / 3, w.h / 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ── Taman ──
function drawParks() {
  for (const p of parks) {
    ctx.fillStyle = '#b8d8a8';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = '#88b870'; ctx.lineWidth = 1;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    for (const tr of p.trees) {
      lingkaranNode(tr.x, tr.y, tr.r, '#4a8840', true);
      lingkaranNode(tr.x - 2, tr.y - 2, tr.r * .55, '#6aaa60', true);
    }
  }
}

// ── Bangunan ──
function drawBuildings() {
  for (const b of buildings) {
    const { x, y, w, h, pal, floors, shadow, roofStyle } = b;
    // Bayangan
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(x + shadow, y + shadow, w, h);
    // Badan
    ctx.fillStyle = pal.fill; ctx.strokeStyle = pal.stroke; ctx.lineWidth = 0.8;
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    // Lantai
    if (floors > 1) {
      ctx.globalAlpha = 0.3; ctx.lineWidth = 0.5;
      const fh = h / floors;
      for (let f = 1; f < floors; f++) garisDAA(x + 2, y + fh * f, x + w - 2, y + fh * f, pal.stroke, 0.5);
      ctx.globalAlpha = 1;
    }
    // Jendela
    const ww = Math.max(4, w / 5), wh = Math.max(3, h / 5);
    const cols = Math.max(1, Math.floor(w / (ww + 5)));
    const rows = Math.max(1, Math.floor(h / (wh + 6)));
    const gx = (w - cols * ww) / (cols + 1);
    const gy = (h - rows * wh) / (rows + 1);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      ctx.fillStyle = 'rgba(200,220,255,0.7)';
      ctx.fillRect(x + gx + (ww + gx) * c, y + gy + (wh + gy) * r, ww, wh);
    }
    // Atap
    if (floors >= 2) {
      const iso = Math.min(floors, 4) * 3;
      if (iso > 4 && roofStyle === 1) {
        ctx.fillStyle = pal.roof; ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + w / 2, y - iso * 2); ctx.lineTo(x + w, y);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = pal.stroke; ctx.lineWidth = 0.7; ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
}

// ── Jalan ──
function drawRoads() {
  for (const e of edges) {
    const na = nodes[e.a], nb = nodes[e.b];
    const rw          = e.type === 'arterial' ? 20 : e.type === 'collector' ? 14 : 9;
    const warnaPinggir = e.type === 'arterial' ? '#b8a880' : e.type === 'collector' ? '#c0b088' : '#c8b890';
    const warnaAspal   = e.type === 'arterial' ? '#d8cca8' : e.type === 'collector' ? '#e0d4b0' : '#e8dcbc';

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // Pinggir jalan
    ctx.beginPath(); ctx.moveTo(na.x, na.y);
    ctx.bezierCurveTo(e.c1.x, e.c1.y, e.c2.x, e.c2.y, nb.x, nb.y);
    ctx.strokeStyle = warnaPinggir; ctx.lineWidth = rw + 6; ctx.stroke();

    // Aspal
    ctx.beginPath(); ctx.moveTo(na.x, na.y);
    ctx.bezierCurveTo(e.c1.x, e.c1.y, e.c2.x, e.c2.y, nb.x, nb.y);
    ctx.strokeStyle = warnaAspal; ctx.lineWidth = rw; ctx.stroke();

    // Marka tengah
    if (e.type !== 'local') {
      ctx.beginPath(); ctx.moveTo(na.x, na.y);
      ctx.bezierCurveTo(e.c1.x, e.c1.y, e.c2.x, e.c2.y, nb.x, nb.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2;
      ctx.setLineDash(e.type === 'arterial' ? [14, 10] : [10, 13]); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// ── Highlight Rute Dijkstra ──
function drawRouteHighlight() {
  if (pathEdges.length === 0) return;
  for (const seg of pathEdges) {
    ctx.beginPath(); ctx.moveTo(seg.p0.x, seg.p0.y);
    ctx.bezierCurveTo(seg.c1.x, seg.c1.y, seg.c2.x, seg.c2.y, seg.p3.x, seg.p3.y);
    ctx.strokeStyle = 'rgba(45,106,79,0.18)'; ctx.lineWidth = 26; ctx.stroke();
  }
  for (const seg of pathEdges) {
    ctx.beginPath(); ctx.moveTo(seg.p0.x, seg.p0.y);
    ctx.bezierCurveTo(seg.c1.x, seg.c1.y, seg.c2.x, seg.c2.y, seg.p3.x, seg.p3.y);
    ctx.strokeStyle = '#2d6a4f'; ctx.lineWidth = 4; ctx.setLineDash([]); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(45,106,79,0.5)';
  for (let d = 180; d < totalLen; d += 260) {
    let acc = 0;
    for (const seg of pathEdges) {
      if (acc + seg.len >= d) {
        const tp = (d - acc) / seg.len;
        const pt = bzPt(seg.p0, seg.c1, seg.c2, seg.p3, tp);
        lingkaranNode(pt.x, pt.y, 4, 'rgba(45,106,79,0.5)', true);
        break;
      }
      acc += seg.len;
    }
  }
}

// ── Node Persimpangan ──
function drawNodes() {
  for (const n of nodes) {
    if (n.isLocationNode || n.isStart || n.isGoal) continue;
    const onPath = path.includes(n.id);
    lingkaranNode(n.x, n.y, onPath ? 5 : 3, onPath ? '#2d6a4f' : '#a09070', true);
    lingkaranNode(n.x, n.y, onPath ? 3 : 1.5, '#ffffff', true);
  }
}

// ── Bendera START / FINISH ──
function drawBendera(x, y, warna, label, ikon) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = warna + '33'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = warna; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 36);
  ctx.strokeStyle = '#5a3e1b'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 36); ctx.lineTo(x + 18, y - 28); ctx.lineTo(x, y - 20);
  ctx.closePath(); ctx.fillStyle = warna; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.font = 'bold 10px Segoe UI,sans-serif'; ctx.textAlign = 'center';
  const tw = ctx.measureText(label).width + 10;
  ctx.fillStyle = 'rgba(255,252,245,0.92)';
  ctx.strokeStyle = warna; ctx.lineWidth = 1;
  ctx.fillRect(x - tw / 2, y - 52, tw, 14);
  ctx.strokeRect(x - tw / 2, y - 52, tw, 14);
  ctx.fillStyle = warna;
  ctx.fillText(label, x, y - 41);
  ctx.restore();
}

// ── Marker 47 Lokasi ──
function drawLocationMarkers() {
  const BASE_R   = 14;
  const ICON_SZ  = 16;
  const LABEL_SZ = 10;

  for (const loc of locationNodes) {
    const { x, y, icon, nama, nodeId } = loc;
    const isActive = (activePopupLocId === loc.locId);
    const onPath   = path.includes(nodeId);
    const r        = isActive ? BASE_R * 1.25 : BASE_R;

    // Aura
    ctx.beginPath(); ctx.arc(x, y, r + 8, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? 'rgba(37,99,235,0.18)' : onPath ? 'rgba(45,106,79,0.15)' : 'rgba(90,62,27,0.10)';
    ctx.fill();

    // Lingkaran marker
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#2563eb' : onPath ? '#2d6a4f' : '#fff8ed';
    ctx.fill();
    ctx.strokeStyle = isActive ? '#1d4ed8' : onPath ? '#1b4332' : '#c8a060';
    ctx.lineWidth = isActive ? 2.5 : 1.8; ctx.stroke();

    // Pin bawah
    ctx.beginPath();
    ctx.moveTo(x - 5, y + r - 1); ctx.lineTo(x + 5, y + r - 1); ctx.lineTo(x, y + r + 8);
    ctx.closePath();
    ctx.fillStyle = isActive ? '#2563eb' : onPath ? '#2d6a4f' : '#c8a060';
    ctx.fill();

    // Emoji
    ctx.font = `${ICON_SZ}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y - 1);
    ctx.textBaseline = 'alphabetic';

    // Label (hanya saat zoom cukup besar)
    if (zoom >= 0.55) {
      const shortNama = nama.length > 18 ? nama.substring(0, 16) + '…' : nama;
      ctx.font = `bold ${LABEL_SZ}px Segoe UI,sans-serif`;
      const tw = ctx.measureText(shortNama).width + 10;
      const lx = x, ly = y - r - 14;
      ctx.fillStyle = 'rgba(255,252,245,0.93)';
      ctx.strokeStyle = isActive ? '#2563eb' : '#c8a060';
      ctx.lineWidth = 1;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(lx - tw / 2, ly - 9, tw, 13, 3); }
      else                { ctx.beginPath(); ctx.rect(lx - tw / 2, ly - 9, tw, 13); }
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = isActive ? '#1d4ed8' : '#3d2800';
      ctx.textAlign = 'center';
      ctx.fillText(shortNama, lx, ly + 1);
    }
  }

  // Bendera locationNode yang jadi start/goal
  for (const loc of locationNodes) {
    const nd = nodes[loc.nodeId];
    if (nd && nd.isStart) drawBendera(loc.x, loc.y, '#dc2626', 'START',  '🚩');
    if (nd && nd.isGoal)  drawBendera(loc.x, loc.y, '#16a34a', 'FINISH', '🏁');
  }
}

// POPUP INFO LOKASI
function showLocationPopup(loc, screenX, screenY) {
  activePopupLocId = loc.locId;
  const popup = document.getElementById('location-popup');
  document.getElementById('lpIcon').textContent = loc.icon;
  document.getElementById('lpNama').textContent = loc.nama;
  document.getElementById('lpKat').textContent  = loc.kategori;
  document.getElementById('lpId').textContent   = '';
  popup.style.display = 'block';
  const pw = 200, ph = 110;
  let px = screenX + 16, py = screenY - 20;
  if (px + pw > window.innerWidth  - 10) px = screenX - pw - 10;
  if (py + ph > window.innerHeight - 10) py = screenY - ph - 10;
  if (py < 10) py = 10;
  popup.style.left = px + 'px';
  popup.style.top  = py + 'px';
  render();
}

function hideLocationPopup() {
  activePopupLocId = null;
  document.getElementById('location-popup').style.display = 'none';
  render();
}

document.getElementById('lpClose').onclick = hideLocationPopup;

// DETEKSI KLIK MARKER LOKASI
function handleLocationClick(screenX, screenY) {
  const wx = screenX / zoom + vx;
  const wy = screenY / zoom + vy;
  const HIT_R = Math.max(18, 28 / zoom);
  for (const loc of locationNodes) {
    if (Math.hypot(loc.x - wx, loc.y - wy) <= HIT_R) {
      showLocationPopup(loc, screenX, screenY);
      return true;
    }
  }
  return false;
}

// FEEDBACK UI
function setDot(s) {
  const d = document.getElementById('dot');
  d.className = 'dot' + (s === 'moving' ? ' moving' : s === 'done' ? ' done' : '');
}
function setStatus(t) { document.getElementById('statusTxt').textContent = t; }
function showToast(msg, dur) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._t); t._t = setTimeout(() => t.style.display = 'none', dur);
}
function updateUI() {
  document.getElementById('tNodes').textContent = LOCATION_DATA.length;
  document.getElementById('tRoads').textContent = edges.length;
}

// EVENT BINDING TOMBOL UI
document.getElementById('btnMap').onclick    = generateMap;
document.getElementById('btnPos').onclick    = () => { stopAnim(false); randomStartGoal(); computeRoute(); render(); };
document.getElementById('btnPlay').onclick   = togglePlay;
document.getElementById('btnReset').onclick  = resetAnim;
document.getElementById('btnZIn').onclick    = () => { if (followMode && running) disableFollow(); zoomAtCenter(1.25); };
document.getElementById('btnZOut').onclick   = () => { if (followMode && running) disableFollow(); zoomAtCenter(0.8); };
document.getElementById('btnFollow').onclick = () => {
  followMode = !followMode;
  updateFollowBtn();
  showToast(followMode ? 'Follow aktif' : 'Follow nonaktif', 1200);
};

document.querySelectorAll('.vbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    vehicleType = btn.dataset.v;
    document.querySelectorAll('.vbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showToast('Kendaraan: ' + btn.textContent.trim(), 1200);
    render();
  });
});

// INIT
resize();
generateMap();
updateFollowBtn();
})();