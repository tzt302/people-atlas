const STORAGE_KEY = 'people-atlas-v1';
const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
const TYPES = ['快餐','半','全','按摩','外卖'];

const avatar = (name, bg = '#7a8f82') => {
  const initials = name.slice(0, 2);
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="${bg}"/><circle cx="400" cy="245" r="115" fill="#ebe5d8" opacity=".92"/><path d="M165 600c22-144 112-220 235-220s213 76 235 220" fill="#ebe5d8" opacity=".92"/><text x="400" y="285" text-anchor="middle" font-family="serif" font-size="86" fill="${bg}">${initials}</text></svg>`)}`;
};

const seedPeople = [
  { id:'p1', name:'林青', country:'China', countryCode:'CHN', place:'上海 · 衡山路十二号', lat:31.2056, lng:121.4462, type:'快餐', tags:['建筑','咖啡','摄影'], bio:'城市设计师，总能注意到街道里容易错过的细节。', photo:avatar('林青','#587468'), chinese:5, english:4, date:'2026-07-18', article:'初次见面是在一场旧建筑开放日。她谈到建筑不是物件，而是人与时间共同留下的容器。\n\n后来沿衡山路走了很久，聊到各自生活过的城市。她观察细致，表达克制，是那种会让谈话慢慢沉静下来的人。' },
  { id:'p2', name:'陈默', country:'China', countryCode:'CHN', place:'北京 · 798艺术区', lat:39.9842, lng:116.4956, type:'半', tags:['策展','当代艺术'], bio:'独立策展人，正在研究公共空间里的临时展览。', photo:avatar('陈默','#8a6a56'), chinese:5, english:3, date:'2026-05-09', article:'我们在一个声音装置旁开始聊天。对于展览，他更在意观众离开后还记得什么，而不是现场有多热闹。' },
  { id:'p3', name:'Mika Sato', country:'Japan', countryCode:'JPN', place:'东京 · 代官山 T-SITE', lat:35.6488, lng:139.6996, type:'全', tags:['出版','书籍设计','旅行'], bio:'Book designer from Kyoto. Collects small independent magazines.', photo:avatar('美香','#806c77'), chinese:3, english:4, date:'2026-03-22', article:'在书店的独立杂志区遇见。她推荐了三本关于地方文化的刊物，并在扉页写下京都一家小书店的地址。' },
  { id:'p4', name:'Noah Williams', country:'United Kingdom', countryCode:'GBR', place:'伦敦 · Barbican Centre', lat:51.5200, lng:-0.0938, type:'按摩', tags:['音乐','产品设计'], bio:'Product designer and weekend jazz pianist.', photo:avatar('NW','#516c78'), chinese:1, english:5, date:'2025-11-11', article:'音乐会散场后在长廊聊了半小时。Noah 对产品的判断很直接：先看它是否尊重使用者的时间。' },
  { id:'p5', name:'Zoé Martin', country:'France', countryCode:'FRA', place:'巴黎 · Centre Pompidou', lat:48.8606, lng:2.3522, type:'外卖', tags:['电影','法语','艺术'], bio:'纪录片剪辑师，关注迁徙与家庭记忆。', photo:avatar('ZM','#9a5d52'), chinese:2, english:4, date:'2025-09-03', article:'因为同时在看同一件录像作品而认识。她分享了纪录片剪辑中“留白”的意义。' },
  { id:'p6', name:'Aisha Rahman', country:'Singapore', countryCode:'SGP', place:'新加坡 · National Gallery', lat:1.2903, lng:103.8519, type:'全', tags:['教育','公共空间','英语'], bio:'Museum educator building inclusive art programmes.', photo:avatar('AR','#746a4e'), chinese:3, english:5, date:'2026-01-16', article:'Aisha 带我看了她参与设计的无障碍参观路线。她让复杂的信息变得亲切，待人也一样。' },
  { id:'p7', name:'周野', country:'China', countryCode:'CHN', place:'成都 · 东郊记忆', lat:30.6710, lng:104.1196, type:'半', tags:['音乐','骑行','创业'], bio:'声音工作者，喜欢骑车记录城市边缘。', photo:avatar('周野','#5d7654'), chinese:5, english:2, date:'2025-12-28', article:'一起在旧厂房里听了一场即兴演出。对声音和空间的关系，他有很多朴素但准确的判断。' },
  { id:'p8', name:'Elena Rossi', country:'United States of America', countryCode:'USA', place:'纽约 · The High Line', lat:40.7480, lng:-74.0048, type:'快餐', tags:['研究','城市','数据'], bio:'Urban data researcher, originally from Milan.', photo:avatar('ER','#675c7d'), chinese:2, english:5, date:'2026-06-02', article:'在高线公园边走边讨论城市数据是否会抹平人的真实感受。她严谨，但总愿意给例外留出位置。' }
];

const state = {
  people: loadPeople(), route: 'overview', view: 'map', country: null,
  search: '', type: '全部', tag: '全部', sort: 'recent', map: null, mapLayer: null, selectedId: null, pendingPhoto: ''
};

function loadPeople() {
  try {
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!saved) return seedPeople;
    const demoTypes={p1:'快餐',p2:'半',p3:'全',p4:'按摩',p5:'外卖',p6:'全',p7:'半',p8:'快餐'};
    return saved.map(p=>demoTypes[p.id]?{...p,type:demoTypes[p.id]}:p);
  }
  catch { return seedPeople; }
}
function savePeople() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.people)); }
function esc(value='') { const d=document.createElement('div'); d.textContent=value; return d.innerHTML; }
function toast(message) { const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200); }
function countryName(p) { return p.country || '未知国家'; }
function activePeople() { return state.country ? state.people.filter(p => countryName(p) === state.country) : state.people; }
function unique(key, people=activePeople()) { return [...new Set(people.flatMap(p => Array.isArray(p[key]) ? p[key] : [p[key]]).filter(Boolean))]; }

function setRoute(route, options={}) {
  state.route=route;
  if ('country' in options) state.country=options.country;
  if ('id' in options) state.selectedId=options.id;
  render();
}

function render() {
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.route===state.route || (state.route==='detail' && b.dataset.route==='people')));
  document.querySelectorAll('.view-button').forEach(b=>b.classList.toggle('active', b.dataset.view===state.view));
  destroyMap();
  const main=document.querySelector('#mainContent');
  if (state.route==='detail') renderDetail(main);
  else if (state.view==='map') renderMapPage(main);
  else renderDirectory(main);
}

function renderMapPage(main) {
  const people=activePeople();
  const title=state.country ? state.country : '世界相遇地图';
  const subtitle=state.country ? '每一个坐标，都是一段关系开始的地方' : '你与世界发生联系的方式，一目了然';
  const places=unique('place', people).length;
  main.innerHTML=`<section class="page">
    <div class="page-head"><div><p class="eyebrow">${state.country?'COUNTRY VIEW':'WORLD VIEW'}</p><h1>${esc(title)}</h1><p>${subtitle}</p></div>
    <div class="head-meta">已记录<strong>${people.length}</strong>${state.country?'位相遇':'个人 · '+unique('country',state.people).length+'个国家'}</div></div>
    <div class="map-shell"><div id="map"></div><div class="map-loading">正在展开地图…</div>
      <div class="map-overlay map-stats"><h3>${state.country?'本地相遇':'你的足迹'}</h3>
      <div class="stat-row"><span>人物</span><strong>${people.length}</strong></div><div class="stat-row"><span>${state.country?'地点':'国家 / 地区'}</span><strong>${state.country?places:unique('country',state.people).length}</strong></div>
      ${state.country?`<button class="new-tag" id="backWorld">← 返回世界地图</button>`:''}</div>
      ${!state.country?`<div class="map-overlay legend">人数密度<div class="legend-scale"><span>0</span><i style="--c:#fff"></i><i style="--c:#b8d0c1"></i><i style="--c:#6f9b80"></i><i style="--c:#234f3c"></i><span>多</span></div></div>`:''}
    </div></section>`;
  if (state.country) document.querySelector('#backWorld').onclick=()=>setRoute('overview',{country:null});
  initMap();
}

async function initMap() {
  if (!window.L) { document.querySelector('.map-loading').textContent='地图资源加载失败，请检查网络'; return; }
  const people=activePeople();
  state.map=L.map('map',{zoomControl:false, worldCopyJump:true, minZoom: state.country?3:2}).setView(state.country ? [people[0]?.lat||20,people[0]?.lng||0] : [22,12], state.country?5:2);
  L.control.zoom({position:'bottomleft'}).addTo(state.map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(state.map);
  if (state.country) {
    const bounds=[];
    people.forEach(p=>{
      const marker=L.circleMarker([p.lat,p.lng],{radius:9,color:'#fff',weight:3,fillColor:'#234f3c',fillOpacity:1}).addTo(state.map);
      marker.bindPopup(`<div class="popup-person"><img src="${p.photo}" alt=""><div><strong>${esc(p.name)}</strong><small>${esc(p.place)}</small><button class="new-tag popup-open" data-id="${p.id}">查看档案 →</button></div></div>`);
      marker.on('popupopen',()=>setTimeout(()=>document.querySelector(`.popup-open[data-id="${p.id}"]`)?.addEventListener('click',()=>setRoute('detail',{id:p.id})),0));
      bounds.push([p.lat,p.lng]);
    });
    if(bounds.length) state.map.fitBounds(bounds,{padding:[70,70],maxZoom:14});
  } else {
    try {
      const geo=await fetch(GEOJSON_URL).then(r=>{if(!r.ok) throw Error(); return r.json();});
      const counts=Object.fromEntries(state.people.reduce((m,p)=>p.countryCode?m.set(p.countryCode,(m.get(p.countryCode)||0)+1):m,new Map()));
      const nameCounts=Object.fromEntries(state.people.reduce((m,p)=>m.set(p.country,(m.get(p.country)||0)+1),new Map()));
      const featureCount=f=>counts[f.properties['ISO3166-1-Alpha-3']]||nameCounts[f.properties.name]||0;
      const color=n=>!n?'#ffffff':n>=5?'#234f3c':n>=3?'#47725c':n>=2?'#78a087':'#b8d0c1';
      state.mapLayer=L.geoJSON(geo,{style:f=>({fillColor:color(featureCount(f)),fillOpacity:.92,color:'#aeb8b0',weight:.6}),onEachFeature:(f,l)=>{
        const code=f.properties['ISO3166-1-Alpha-3']; const n=featureCount(f); const name=f.properties.name;
        const storedCountry=state.people.find(p=>p.countryCode===code)?.country||name;
        l.bindTooltip(`${esc(name)} · ${n} 人`,{sticky:true});
        if(n) { l.on('mouseover',()=>l.setStyle({weight:1.5,color:'#234f3c'})); l.on('mouseout',()=>state.mapLayer.resetStyle(l)); l.on('click',()=>setRoute('overview',{country:storedCountry})); }
      }}).addTo(state.map);
    } catch { document.querySelector('.map-loading').textContent='国家边界加载失败，底图仍可使用'; return; }
  }
  document.querySelector('.map-loading')?.remove();
}

function filteredPeople() {
  let list=activePeople().filter(p=>{
    const hay=[p.name,p.place,p.country,p.type,...p.tags].join(' ').toLowerCase();
    return hay.includes(state.search.toLowerCase()) && (state.type==='全部'||p.type===state.type) && (state.tag==='全部'||p.tags.includes(state.tag));
  });
  if(state.sort==='name') list.sort((a,b)=>a.name.localeCompare(b.name,'zh'));
  if(state.sort==='place') list.sort((a,b)=>a.country.localeCompare(b.country,'zh'));
  if(state.sort==='recent') list.sort((a,b)=>b.date.localeCompare(a.date));
  return list;
}

function renderDirectory(main) {
  const people=activePeople(), list=filteredPeople(), tags=unique('tags',people), types=TYPES;
  const avg=(key)=>people.length?(people.reduce((s,p)=>s+(p[key]||0),0)/people.length).toFixed(1):'—';
  main.innerHTML=`<section class="dashboard page"><div class="page-head" style="padding:0 0 24px"><div><p class="eyebrow">${state.country?'COUNTRY DIRECTORY':'PEOPLE DIRECTORY'}</p><h1>${state.country?esc(state.country)+' · 人物':'相遇档案'}</h1><p>按关系、兴趣与地点重新认识你的社交世界</p></div>${state.country?'<button class="ghost-button" id="clearCountry">查看全部国家</button>':''}</div>
    <div class="overview-grid">
      <div class="metric-card"><span>记录总数</span><strong>${people.length}</strong><small>${unique('country',people).length} 个国家 / 地区</small></div>
      <div class="metric-card"><span>相遇地点</span><strong>${unique('place',people).length}</strong><small>精确至建筑坐标</small></div>
      <div class="metric-card"><span>常见标签</span><strong>${tags[0]||'—'}</strong><small>共 ${tags.length} 个自定义标签</small></div>
      <div class="metric-card"><span>平均语言水平</span><strong>${avg('english')}</strong><small>英语 · 中文 ${avg('chinese')}</small></div>
    </div>
    <div class="directory-layout"><aside class="filter-panel"><h3>筛选档案</h3>
      <input class="search-input" id="searchPeople" value="${esc(state.search)}" placeholder="搜索姓名、地点或标签" />
      <div class="filter-group"><span class="filter-label">关系类型</span><select id="typeFilter"><option>全部</option>${types.map(x=>`<option ${state.type===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="filter-group"><span class="filter-label">标签</span><button class="tag-filter ${state.tag==='全部'?'active':''}" data-tag="全部"><span style="--tag-color:#888"></span>全部<em>${people.length}</em></button>
      ${tags.map((t,i)=>`<button class="tag-filter ${state.tag===t?'active':''}" data-tag="${esc(t)}"><span style="--tag-color:${['#b36b56','#5c7c68','#8b7651','#6c708c'][i%4]}"></span>${esc(t)}<em>${people.filter(p=>p.tags.includes(t)).length}</em></button>`).join('')}
      <button class="new-tag" id="newTagButton">＋ 新建标签</button></div>
      <div class="filter-group"><span class="filter-label">排序方式</span><select id="sortFilter"><option value="recent" ${state.sort==='recent'?'selected':''}>最近相遇</option><option value="name" ${state.sort==='name'?'selected':''}>姓名</option><option value="place" ${state.sort==='place'?'selected':''}>地理位置</option></select></div>
    </aside><div><div class="results-head"><h2>${state.tag==='全部'?'所有人物':'# '+esc(state.tag)}</h2><span>找到 ${list.length} 人</span></div><div class="people-grid">${list.length?list.map(personCard).join(''):'<div class="empty-state">没有找到匹配的人物<br><small>试试调整筛选条件</small></div>'}</div></div></div>
  </section>`;
  document.querySelector('#clearCountry')?.addEventListener('click',()=>{state.country=null;render();});
  document.querySelector('#searchPeople').addEventListener('input',e=>{state.search=e.target.value;renderDirectory(document.querySelector('#mainContent'));});
  document.querySelector('#typeFilter').addEventListener('change',e=>{state.type=e.target.value;render();});
  document.querySelector('#sortFilter').addEventListener('change',e=>{state.sort=e.target.value;render();});
  document.querySelectorAll('.tag-filter').forEach(b=>b.onclick=()=>{state.tag=b.dataset.tag;render();});
  document.querySelectorAll('.person-card').forEach(c=>c.onclick=()=>setRoute('detail',{id:c.dataset.id}));
  document.querySelector('#newTagButton').onclick=()=>{const t=prompt('输入新标签名称'); if(t?.trim()) toast(`标签“${t.trim()}”已就绪，可在添加或编辑人物时使用`);};
}

function personCard(p){return `<article class="person-card" data-id="${p.id}" tabindex="0"><div class="person-photo"><img src="${p.photo}" alt="${esc(p.name)}"><span class="person-type">${esc(p.type)}</span></div><div class="person-info"><h3>${esc(p.name)}</h3><div class="tags"><span class="tag location-tag">⌖ ${esc(p.place)}</span>${p.tags.slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div></article>`;}

function renderDetail(main) {
  const p=state.people.find(x=>x.id===state.selectedId);
  if(!p){setRoute('people');return;}
  main.innerHTML=`<section class="detail-page page"><button class="back-button" id="backPeople">← 返回人物档案</button>
    <div class="detail-layout"><article class="profile-main"><div class="profile-hero"><img src="${p.photo}" alt="${esc(p.name)}"><div><p class="eyebrow">${esc(p.type)} · ${esc(p.country)}</p><h1>${esc(p.name)}</h1><div class="tags"><span class="tag location-tag">⌖ ${esc(p.place)}</span>${p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><p class="bio">${esc(p.bio)}</p></div></div>
      <div class="article-editor"><div class="section-title"><h2>相遇手记</h2><small>${esc(p.date)} 记录</small></div><textarea id="articleText" placeholder="写下这次相遇的体验、观察与评价…">${esc(p.article)}</textarea><div class="article-actions"><button class="primary-button" id="saveArticle">保存手记</button></div></div></article>
      <aside class="profile-side"><p class="eyebrow">LANGUAGE</p><h3>语言水平</h3>${ratingHTML('中文水平','chinese',p.chinese)}${ratingHTML('英文水平','english',p.english)}
      <div class="meta-list"><div class="meta-item"><small>相遇日期</small>${esc(p.date)}</div><div class="meta-item"><small>精确坐标</small>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</div><div class="meta-item"><small>人物类型</small>${esc(p.type)}</div></div></aside></div></section>`;
  document.querySelector('#backPeople').onclick=()=>setRoute('people');
  document.querySelector('#saveArticle').onclick=()=>{p.article=document.querySelector('#articleText').value;savePeople();toast('相遇手记已保存');};
  document.querySelectorAll('.star').forEach(s=>s.onclick=()=>{p[s.dataset.key]=Number(s.dataset.value);savePeople();renderDetail(main);toast('语言评分已更新');});
}
function ratingHTML(label,key,value){return `<div class="rating"><div class="rating-head"><span>${label}</span><strong>${value}.0 / 5</strong></div><div class="stars" aria-label="${label}">${[1,2,3,4,5].map(n=>`<button class="star ${n<=value?'active':''}" data-key="${key}" data-value="${n}" aria-label="${n} 星">★</button>`).join('')}</div></div>`;}

function destroyMap(){ if(state.map){state.map.remove();state.map=null;state.mapLayer=null;} }
function openModal(){state.pendingPhoto='';document.querySelector('#personForm').reset();document.querySelector('#photoPreview').style.backgroundImage='';document.querySelector('#photoPreview').textContent='＋';document.querySelector('#placePreview').classList.add('hidden');document.querySelector('#personModal').classList.remove('hidden');}
function closeModal(){document.querySelector('#personModal').classList.add('hidden');}

document.querySelector('#homeButton').onclick=()=>setRoute('overview',{country:null});
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>setRoute(b.dataset.route,{country:b.dataset.route==='overview'?null:state.country}));
document.querySelectorAll('.view-button').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;if(state.route==='detail')state.route=state.view==='map'?'overview':'people';render();});
document.querySelector('#addPersonButton').onclick=openModal;
document.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=closeModal);
document.querySelector('#personModal').onclick=e=>{if(e.target.id==='personModal')closeModal();};
document.querySelector('#themeButton').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('people-atlas-theme',document.body.classList.contains('dark')?'dark':'light');};
if(localStorage.getItem('people-atlas-theme')==='dark') document.body.classList.add('dark');

document.querySelector('#photoInput').onchange=e=>{const file=e.target.files[0];if(!file)return;if(file.size>2_000_000){toast('照片请控制在 2MB 以内');e.target.value='';return;}const reader=new FileReader();reader.onload=()=>{state.pendingPhoto=reader.result;const p=document.querySelector('#photoPreview');p.style.backgroundImage=`url(${reader.result})`;p.textContent='';};reader.readAsDataURL(file);};
document.querySelector('#placeInput').oninput=e=>{const preview=document.querySelector('#placePreview');const value=e.target.value.trim();preview.textContent=`⌖ ${value||'地点标签'}`;preview.classList.toggle('hidden',!value);};
document.querySelector('#personForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const name=f.get('name').trim();const colors=['#587468','#8a6a56','#516c78','#675c7d'];const person={id:'p'+Date.now(),name,country:f.get('country').trim(),countryCode:'',place:f.get('place').trim(),lat:Number(f.get('lat')),lng:Number(f.get('lng')),type:f.get('type').trim(),tags:f.get('tags').split(/[,，]/).map(x=>x.trim()).filter(Boolean),bio:f.get('bio').trim(),photo:state.pendingPhoto||avatar(name,colors[state.people.length%colors.length]),chinese:0,english:0,date:new Date().toISOString().slice(0,10),article:''};state.people.unshift(person);savePeople();closeModal();state.country=null;state.search='';state.type='全部';state.tag='全部';state.view='directory';state.route='people';render();toast(`${name} 已加入相遇档案`);};

render();
