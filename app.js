const STORAGE_KEY = 'people-atlas-v1';
const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
const STORE_TYPES = ['快餐','半','全','按摩','外卖'];

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
  search: '', filters: {place:'全部',country:'全部',storeType:'全部',personType:'全部'}, sort: 'recent', map: null, mapLayer: null, selectedId: null, pendingPhoto: ''
};

function loadPeople() {
  try {
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    const demoTypes={p1:'快餐',p2:'半',p3:'全',p4:'按摩',p5:'外卖',p6:'全',p7:'半',p8:'快餐'};
    return (saved||seedPeople).map(p=>normalizePerson(p,demoTypes));
  }
  catch { return seedPeople.map(p=>normalizePerson(p,{})); }
}
function normalizePerson(p,demoTypes) {
  const candidate=p.storeType||demoTypes[p.id]||p.type||'';
  const encounters=Array.isArray(p.encounters)?p.encounters:(p.article?.trim()?[{id:`legacy-${p.id}`,title:'第一次见面',date:p.date,content:p.article}]:[]);
  return {...p,tags:[],storeType:STORE_TYPES.includes(candidate)?candidate:'',personType:p.personType||'',encounters};
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
      if(!state.map||!document.querySelector('#map')) return;
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
    } catch { const loading=document.querySelector('.map-loading');if(loading)loading.textContent='国家边界加载失败，底图仍可使用';return; }
  }
  document.querySelector('.map-loading')?.remove();
}

function filteredPeople() {
  let list=activePeople().filter(p=>{
    const hay=[p.name,p.place,p.country,p.storeType,p.personType,p.bio].join(' ').toLowerCase();
    return hay.includes(state.search.toLowerCase()) && Object.entries(state.filters).every(([key,value])=>value==='全部'||p[key]===value);
  });
  if(state.sort==='name') list.sort((a,b)=>a.name.localeCompare(b.name,'zh'));
  if(state.sort==='place') list.sort((a,b)=>a.country.localeCompare(b.country,'zh'));
  if(state.sort==='recent') list.sort((a,b)=>b.date.localeCompare(a.date));
  return list;
}

function facetGroup(label,key,values,people) {
  const current=state.filters[key];
  return `<details class="facet-group" open><summary>${label}<em>${current==='全部'?'全部':esc(current)}</em></summary><div class="facet-options">
    <button class="tag-filter ${current==='全部'?'active':''}" data-filter-key="${key}" data-filter-value="全部"><span style="--tag-color:#888"></span>全部<em>${people.length}</em></button>
    ${values.map((value,i)=>`<button class="tag-filter ${current===value?'active':''}" data-filter-key="${key}" data-filter-value="${esc(value)}"><span style="--tag-color:${['#b36b56','#5c7c68','#8b7651','#6c708c'][i%4]}"></span>${esc(value)}<em>${people.filter(p=>p[key]===value).length}</em></button>`).join('')}
  </div></details>`;
}

function renderDirectory(main) {
  const people=activePeople(), list=filteredPeople();
  const places=unique('place',people), countries=unique('country',people), personTypes=unique('personType',people);
  main.innerHTML=`<section class="dashboard page"><div class="page-head" style="padding:0 0 24px"><div><p class="eyebrow">${state.country?'COUNTRY DIRECTORY':'PEOPLE DIRECTORY'}</p><h1>${state.country?esc(state.country)+' · 人物':'相遇档案'}</h1><p>按关系、兴趣与地点重新认识你的社交世界</p></div>${state.country?'<button class="ghost-button" id="clearCountry">查看全部国家</button>':''}</div>
    <div class="overview-grid single-overview">
      <div class="metric-card total-card"><span>记录总数</span><strong>${people.length}</strong></div>
    </div>
    <section class="filter-panel filter-panel-top"><div class="filter-panel-head"><h3>筛选档案</h3><span>可组合选择多个分类</span></div>
      <div class="filter-top-row"><input class="search-input" id="searchPeople" value="${esc(state.search)}" placeholder="搜索姓名、地点或类型" />
        <label class="sort-control"><span>排序方式</span><select id="sortFilter"><option value="recent" ${state.sort==='recent'?'selected':''}>最近相遇</option><option value="name" ${state.sort==='name'?'selected':''}>姓名</option><option value="place" ${state.sort==='place'?'selected':''}>地理位置</option></select></label>
      </div>
      <div class="facet-grid">${facetGroup('具体地点','place',places,people)}
        ${facetGroup('国家','country',countries,people)}
        ${facetGroup('店类型','storeType',STORE_TYPES,people)}
        ${facetGroup('人物类型','personType',personTypes,people)}</div>
    </section>
    <div class="results-head"><h2>人物预览</h2><span>找到 ${list.length} 人</span></div><div class="people-grid">${list.length?list.map(personCard).join(''):'<div class="empty-state">没有找到匹配的人物<br><small>试试调整筛选条件</small></div>'}</div>
  </section>`;
  document.querySelector('#clearCountry')?.addEventListener('click',()=>{state.country=null;render();});
  document.querySelector('#searchPeople').addEventListener('input',e=>{state.search=e.target.value;renderDirectory(document.querySelector('#mainContent'));});
  document.querySelector('#sortFilter').addEventListener('change',e=>{state.sort=e.target.value;render();});
  document.querySelectorAll('[data-filter-key]').forEach(b=>b.onclick=()=>{state.filters[b.dataset.filterKey]=b.dataset.filterValue;render();});
  document.querySelectorAll('.person-card').forEach(c=>c.onclick=()=>setRoute('detail',{id:c.dataset.id}));
}

function personCard(p){const store=p.storeType||'未设置';return `<article class="person-card" data-id="${p.id}" tabindex="0"><div class="person-photo"><img src="${p.photo}" alt="${esc(p.name)}"><span class="person-type">${esc(store)}</span></div><div class="person-info"><h3>${esc(p.name)}</h3><p class="person-bio">${esc(p.bio||'暂无简介')}</p><div class="tags"><span class="tag location-tag">⌖ ${esc(p.place)}</span><span class="tag country-tag">◎ ${esc(p.country)}</span><span class="tag store-tag">${esc(store)}</span>${p.personType?`<span class="tag person-tag">${esc(p.personType)}</span>`:''}</div></div></article>`;}

function encounterDefaultTitle(number){return number<=3?['','第一次见面','第二次见面','第三次见面'][number]:`第${number}次见面`;}
function encounterCard(entry,index){return `<article class="encounter-entry"><div class="encounter-index">${String(index+1).padStart(2,'0')}</div><div class="encounter-body"><div class="encounter-head"><h3>${esc(entry.title||encounterDefaultTitle(index+1))}</h3><time>${esc(entry.date||'未填写日期')}</time></div><p>${esc(entry.content).replace(/\n/g,'<br>')}</p></div></article>`;}

function renderDetail(main) {
  const p=state.people.find(x=>x.id===state.selectedId);
  if(!p){setRoute('people');return;}
  const encounters=p.encounters||[],nextNumber=encounters.length+1;
  main.innerHTML=`<section class="detail-page page"><button class="back-button" id="backPeople">← 返回人物档案</button>
    <div class="detail-layout"><article class="profile-main"><div class="profile-hero"><img src="${p.photo}" alt="${esc(p.name)}"><div><p class="eyebrow">${esc(p.storeType)} · ${esc(p.country)}</p><h1>${esc(p.name)}</h1><div class="tags"><span class="tag location-tag">⌖ ${esc(p.place)}</span><span class="tag country-tag">◎ ${esc(p.country)}</span><span class="tag store-tag">${esc(p.storeType)}</span>${p.personType?`<span class="tag person-tag">${esc(p.personType)}</span>`:''}</div><p class="bio">${esc(p.bio||'暂无简介')}</p></div></div>
      <div class="article-editor"><div class="section-title"><h2>相遇手记</h2><small>共 ${encounters.length} 次见面</small></div>
        <div class="encounter-timeline">${encounters.length?encounters.map(encounterCard).join(''):'<div class="encounter-empty">还没有见面记录，从第一次开始写吧。</div>'}</div>
        <form class="encounter-form" id="encounterForm"><div class="section-title"><h3>添加${encounterDefaultTitle(nextNumber)}</h3><small>NEW ENCOUNTER</small></div><div class="two-columns"><label>记录标题<input name="title" required value="${encounterDefaultTitle(nextNumber)}" /></label><label>见面日期<input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}" /></label></div><label>本次手记<textarea name="content" required placeholder="写下这次见面的体验、观察与评价…"></textarea></label><div class="article-actions"><button class="primary-button" type="submit">保存本次见面</button></div></form>
      </div></article>
      <aside class="profile-side"><p class="eyebrow">LANGUAGE</p><h3>语言水平</h3>${ratingHTML('中文水平','chinese',p.chinese)}${ratingHTML('英文水平','english',p.english)}
      <div class="meta-list"><div class="meta-item"><small>相遇日期</small>${esc(p.date)}</div><div class="meta-item"><small>精确坐标</small>${Number(p.lat).toFixed(5)}, ${Number(p.lng).toFixed(5)}</div><div class="meta-item"><small>店类型</small>${esc(p.storeType)}</div><div class="meta-item"><small>人物类型</small>${esc(p.personType||'未设置')}</div></div></aside></div></section>`;
  document.querySelector('#backPeople').onclick=()=>setRoute('people');
  document.querySelector('#encounterForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);p.encounters.push({id:'e'+Date.now(),title:f.get('title').trim(),date:f.get('date'),content:f.get('content').trim()});savePeople();renderDetail(main);toast(`${encounterDefaultTitle(p.encounters.length)}已保存`);};
  document.querySelectorAll('.star').forEach(s=>s.onclick=()=>{p[s.dataset.key]=Number(s.dataset.value);savePeople();renderDetail(main);toast('语言评分已更新');});
}
function ratingHTML(label,key,value){return `<div class="rating"><div class="rating-head"><span>${label}</span><strong>${value}.0 / 5</strong></div><div class="stars" aria-label="${label}">${[1,2,3,4,5].map(n=>`<button class="star ${n<=value?'active':''}" data-key="${key}" data-value="${n}" aria-label="${n} 星">★</button>`).join('')}</div></div>`;}

function destroyMap(){ if(state.map){state.map.remove();state.map=null;state.mapLayer=null;} }
function fillDatalist(id,values){document.querySelector(id).innerHTML=[...new Set(values.filter(Boolean))].map(v=>`<option value="${esc(v)}"></option>`).join('');}
function openModal(){state.pendingPhoto='';document.querySelector('#personForm').reset();document.querySelector('#photoPreview').style.backgroundImage='';document.querySelector('#photoPreview').textContent='＋';document.querySelector('#placePreview').classList.add('hidden');fillDatalist('#countryOptions',unique('country',state.people));fillDatalist('#locationOptions',unique('place',state.people));fillDatalist('#personTypeOptions',unique('personType',state.people));document.querySelector('#personModal').classList.remove('hidden');}
function closeModal(){document.querySelector('#personModal').classList.add('hidden');}

document.querySelector('#homeButton').onclick=()=>setRoute('overview',{country:null});
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>setRoute(b.dataset.route,{country:b.dataset.route==='overview'?null:state.country}));
document.querySelectorAll('.view-button').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;if(state.route==='detail')state.route=state.view==='map'?'overview':'people';render();});
document.querySelector('#addPersonButton').onclick=openModal;
document.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=closeModal);
document.querySelector('#personModal').onclick=e=>{if(e.target.id==='personModal')closeModal();};
document.querySelector('#themeButton').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('people-atlas-theme',document.body.classList.contains('dark')?'dark':'light');};
if(localStorage.getItem('people-atlas-theme')==='dark') document.body.classList.add('dark');
const backToTop=document.querySelector('#backToTop');
window.addEventListener('scroll',()=>backToTop.classList.toggle('hidden',window.scrollY<420),{passive:true});
backToTop.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});

if(window.desktopUpdater){
  const updateButton=document.querySelector('#updateButton'),updateText=document.querySelector('#updateText');
  updateButton.classList.remove('hidden');
  window.desktopUpdater.getVersion().then(version=>{updateText.textContent=`v${version}`;});
  window.desktopUpdater.onStatus(status=>{
    updateButton.dataset.status=status.type;
    updateText.textContent=status.message;
    updateButton.title=status.message;
  });
  updateButton.onclick=()=>window.desktopUpdater.checkNow();
}

document.querySelector('#photoInput').onchange=e=>{const file=e.target.files[0];if(!file)return;if(file.size>2_000_000){toast('照片请控制在 2MB 以内');e.target.value='';return;}const reader=new FileReader();reader.onload=()=>{state.pendingPhoto=reader.result;const p=document.querySelector('#photoPreview');p.style.backgroundImage=`url(${reader.result})`;p.textContent='';};reader.readAsDataURL(file);};
document.querySelector('#placeInput').oninput=e=>{const preview=document.querySelector('#placePreview');const value=e.target.value.trim();preview.textContent=`⌖ ${value||'地点标签'}`;preview.classList.toggle('hidden',!value);};
document.querySelector('#personForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const name=f.get('name').trim();const colors=['#587468','#8a6a56','#516c78','#675c7d'];const person={id:'p'+Date.now(),name,country:f.get('country').trim(),countryCode:'',place:f.get('place').trim(),lat:Number(f.get('lat')),lng:Number(f.get('lng')),storeType:f.get('storeType').trim(),personType:f.get('personType').trim(),tags:[],bio:f.get('bio').trim(),photo:state.pendingPhoto||avatar(name,colors[state.people.length%colors.length]),chinese:0,english:0,date:new Date().toISOString().slice(0,10),article:'',encounters:[]};state.people.unshift(person);savePeople();closeModal();state.country=null;state.search='';state.filters={place:'全部',country:'全部',storeType:'全部',personType:'全部'};state.view='directory';state.route='people';render();toast(`${name} 已加入相遇档案`);};

render();
