const STORAGE_KEY = 'people-atlas-v1';
const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
const STORE_TYPES = ['快餐','半','全','按摩','外卖'];
const RATING_DEFAULTS = {overall:0,appearance:0,language:0,communication:0,emotionalValue:0,environment:0,service:0,professionalism:0,hygiene:0,value:0};
const COMMON_COUNTRIES = [
  ['中国','China','CN','CHN',['中华人民共和国','PRC']],['美国','United States','US','USA',['美國','USA','United States of America']],
  ['日本','Japan','JP','JPN'],['韩国','South Korea','KR','KOR',['韓國','Korea','Republic of Korea']],['英国','United Kingdom','GB','GBR',['英國','UK','Great Britain']],
  ['法国','France','FR','FRA',['法國']],['德国','Germany','DE','DEU',['德國']],['意大利','Italy','IT','ITA'],['西班牙','Spain','ES','ESP'],
  ['荷兰','Netherlands','NL','NLD',['荷蘭']],['瑞士','Switzerland','CH','CHE'],['奥地利','Austria','AT','AUT',['奧地利']],['俄罗斯','Russia','RU','RUS',['俄羅斯','Russian Federation']],
  ['加拿大','Canada','CA','CAN'],['墨西哥','Mexico','MX','MEX'],['巴西','Brazil','BR','BRA'],['阿根廷','Argentina','AR','ARG'],
  ['澳大利亚','Australia','AU','AUS',['澳洲','澳大利亞']],['新西兰','New Zealand','NZ','NZL',['新西蘭']],['新加坡','Singapore','SG','SGP'],
  ['泰国','Thailand','TH','THA',['泰國']],['越南','Vietnam','VN','VNM'],['马来西亚','Malaysia','MY','MYS',['馬來西亞']],['印度尼西亚','Indonesia','ID','IDN',['印尼','印度尼西亞']],
  ['菲律宾','Philippines','PH','PHL',['菲律賓']],['印度','India','IN','IND'],['阿联酋','United Arab Emirates','AE','ARE',['阿聯酋','UAE']],['土耳其','Türkiye','TR','TUR',['Turkey']],
  ['葡萄牙','Portugal','PT','PRT'],['希腊','Greece','GR','GRC',['希臘']],['瑞典','Sweden','SE','SWE'],['挪威','Norway','NO','NOR'],['丹麦','Denmark','DK','DNK',['丹麥']],['芬兰','Finland','FI','FIN',['芬蘭']]
].map(([zh,en,alpha2,alpha3,aliases=[]])=>({zh,en,alpha2,alpha3,names:[zh,en,...aliases]}));
const countryCatalog=[...COMMON_COUNTRIES];
const countryText=value=>String(value||'').trim().toLocaleLowerCase().replace(/[.·,，'’\s_-]/g,'');
function countryRecord(value){const key=countryText(value);return countryCatalog.find(c=>c.alpha2.toLowerCase()===key||c.alpha3.toLowerCase()===key||countryText(`${c.zh}/${c.en}`)===key||c.names.some(name=>countryText(name)===key));}
function resolveCountryCode(value){return countryRecord(value)?.alpha3||'';}
function registerCountries(features){
  const zh=new Intl.DisplayNames(['zh-CN'],{type:'region'}),en=new Intl.DisplayNames(['en'],{type:'region'});
  features.forEach(f=>{const p=f.properties,alpha2=p['ISO3166-1-Alpha-2'],alpha3=p['ISO3166-1-Alpha-3'];if(!alpha2||!alpha3)return;let zhName,enName;try{zhName=zh.of(alpha2);enName=en.of(alpha2);}catch{return;}const existing=countryCatalog.find(c=>c.alpha3===alpha3);const names=[p.name,zhName,enName].filter(Boolean);if(existing)existing.names=[...new Set([...existing.names,...names])];else countryCatalog.push({zh:zhName,en:enName,alpha2,alpha3,names});});
}
function countryKey(p){return p.countryCode||resolveCountryCode(p.country)||countryText(p.country)||'unknown';}

const avatar = (name, bg = '#554d48') => {
  const initials = name.slice(0, 2);
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="${bg}"/><circle cx="400" cy="245" r="115" fill="#ebe5d8" opacity=".92"/><path d="M165 600c22-144 112-220 235-220s213 76 235 220" fill="#ebe5d8" opacity=".92"/><text x="400" y="285" text-anchor="middle" font-family="serif" font-size="86" fill="${bg}">${initials}</text></svg>`)}`;
};

const state = {
  people: loadPeople(), route: 'overview', view: 'map', country: null, countryCode: null, region: null,
  search: '', filters: {place:'全部',country:'全部',storeType:'全部',storeName:'全部'}, sort: 'recent', map: null, mapLayer: null, selectedId: null, pendingPhoto: '', editingPersonId: null
};

function loadPeople() {
  try {
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    return (saved||[]).map(normalizePerson);
  }
  catch { return []; }
}
function normalizePerson(p) {
  const candidate=p.storeType||p.type||'';
  const encounters=Array.isArray(p.encounters)?p.encounters:(p.article?.trim()?[{id:`legacy-${p.id}`,title:'第一次到访',date:p.date,content:p.article}]:[]);
  const legacyAverage=Math.round(((Number(p.chinese)||0)+(Number(p.english)||0))/2);
  const ratings={...RATING_DEFAULTS,overall:legacyAverage,communication:Number(p.chinese)||0,...(p.ratings||{})};
  return {...p,countryCode:p.countryCode||resolveCountryCode(p.country),tags:[],storeType:STORE_TYPES.includes(candidate)?candidate:'',storeName:p.storeName||'',ratings,encounters};
}
function savePeople() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.people)); }
function esc(value='') { const d=document.createElement('div'); d.textContent=value; return d.innerHTML.replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function toast(message) { const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200); }
function countryName(p) { return p.country || '未知国家'; }
function countryCount(people=state.people){return new Set(people.map(countryKey)).size;}
function activePeople() {
  let people=state.countryCode?state.people.filter(p=>countryKey(p)===state.countryCode):state.country?state.people.filter(p=>countryName(p)===state.country):state.people;
  if(state.region) people=people.filter(p=>state.region.personIds.includes(p.id));
  return people;
}
function unique(key, people=activePeople()) { return [...new Set(people.flatMap(p => Array.isArray(p[key]) ? p[key] : [p[key]]).filter(Boolean))]; }

function setRoute(route, options={}) {
  state.route=route;
  if ('country' in options) {state.country=options.country;if(!options.country){state.region=null;state.countryCode=null;}}
  if ('countryCode' in options) state.countryCode=options.countryCode;
  if ('region' in options) state.region=options.region;
  if ('id' in options) state.selectedId=options.id;
  render();
}

function render() {
  document.querySelectorAll('.view-button').forEach(b=>b.classList.toggle('active', b.dataset.view===state.view));
  destroyMap();
  const main=document.querySelector('#mainContent');
  if (state.route==='detail') renderDetail(main);
  else if (state.view==='map') renderMapPage(main);
  else renderDirectory(main);
}

function renderMapPage(main) {
  const people=activePeople();
  const title=state.region?`${state.region.name} · 探店地点`:state.country?`${state.country} · 一级行政区`:'世界探店地图';
  const subtitle=state.region?'查看精确到建筑的探店足迹':state.country?'按当地最大的行政区划查看探店分布':'按档案数量查看你的世界足迹';
  const places=unique('place', people).length;
  main.innerHTML=`<section class="page">
    <div class="page-head"><div><p class="eyebrow">${state.region?'REGION VIEW':state.country?'ADMINISTRATIVE VIEW':'WORLD VIEW'}</p><h1>${esc(title)}</h1><p>${subtitle}</p></div>
    <div class="head-meta">已记录<strong>${people.length}</strong>${state.country?'条档案':'条档案 · '+countryCount()+'个国家'}</div></div>
    <div class="content-tabs"><span class="${!state.country?'active':''}">世界地图</span><span class="${state.country&&!state.region?'active':''}">行政区划</span><span class="${state.region?'active':''}">精确地点</span></div>
    <div class="map-shell"><div id="map"></div><div class="map-loading">正在展开地图…</div>
      <div class="map-overlay map-stats"><h3>${state.country?'本地探店':'你的足迹'}</h3>
      <div class="stat-row"><span>档案</span><strong>${people.length}</strong></div><div class="stat-row"><span>${state.region?'地点':state.country?'一级行政区':'国家 / 地区'}</span><strong id="mapSecondaryStat">${state.region?places:state.country?'—':countryCount()}</strong></div>
      ${state.country?`<button class="new-tag" id="backMapLevel">← ${state.region?`返回 ${esc(state.country)} 行政区`:'返回世界地图'}</button>`:''}</div>
      ${!state.region?`<div class="map-overlay legend">${state.country?'行政区':'国家'}档案密度<div class="legend-scale"><span>0</span><i style="--c:#fff"></i><i style="--c:#d7c3ba"></i><i style="--c:#a77d70"></i><i style="--c:#392f2b"></i><span>多</span></div>${state.country?'<small>边界：geoBoundaries · gbOpen</small>':''}</div>`:''}
    </div></section>`;
  if(state.country)document.querySelector('#backMapLevel').onclick=()=>state.region?setRoute('overview',{region:null}):setRoute('overview',{country:null,countryCode:null,region:null});
  initMap();
}

const densityColor=n=>!n?'#ffffff':n>=5?'#392f2b':n>=3?'#765148':n>=2?'#a77d70':'#d7c3ba';

function pointInRing(point,ring){
  const [x,y]=point;let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [xi,yi]=ring[i],[xj,yj]=ring[j];
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}
function pointInGeometry(point,geometry){
  const inPolygon=polygon=>pointInRing(point,polygon[0])&&!polygon.slice(1).some(hole=>pointInRing(point,hole));
  if(geometry.type==='Polygon')return inPolygon(geometry.coordinates);
  if(geometry.type==='MultiPolygon')return geometry.coordinates.some(inPolygon);
  return false;
}

function localizedRegionName(name){
  if(state.countryCode!=='CHN')return name;
  const chinaNames={Hainan:'海南',Taiwan:'台湾',Guangxi:'广西',Fujian:'福建',Yunnan:'云南',Guizhou:'贵州',Jiangxi:'江西',Hunan:'湖南',Zhejiang:'浙江',Shanghai:'上海',Chongqing:'重庆',Hubei:'湖北',Sichuan:'四川',Anhui:'安徽',Jiangsu:'江苏',Henan:'河南',Tibet:'西藏',Shandong:'山东',Qinghai:'青海',Ningxia:'宁夏',Shaanxi:'陕西',Tianjin:'天津',Shanxi:'山西',Beijing:'北京',Gansu:'甘肃',Hebei:'河北',Liaoning:'辽宁',Jilin:'吉林',Xinjiang:'新疆',Inner:'内蒙古',Heilongjiang:'黑龙江',Macau:'澳门',Hong:'香港',Guangzhou:'广东'};
  const key=Object.keys(chinaNames).find(item=>name.startsWith(item));
  return key?chinaNames[key]:name;
}

function hasValidCoordinates(person){const lat=Number(person.lat),lng=Number(person.lng);return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180;}
function addPersonMarkers(people,preferredBounds=null,fitView=true){
  const pointBounds=[];
  people.filter(hasValidCoordinates).forEach(p=>{
    const marker=L.circleMarker([Number(p.lat),Number(p.lng)],{radius:8,color:'#f7f4ee',weight:2,fillColor:'#8b3e36',fillOpacity:1}).addTo(state.map);
    marker.bindPopup(`<div class="popup-person"><img src="${p.photo}" alt=""><div><strong>${esc(p.name)}</strong><small>${esc(p.place)}</small><button class="new-tag popup-open" data-id="${p.id}">查看档案 →</button></div></div>`);
    marker.on('popupopen',()=>setTimeout(()=>document.querySelector(`.popup-open[data-id="${p.id}"]`)?.addEventListener('click',()=>setRoute('detail',{id:p.id})),0));
    pointBounds.push([p.lat,p.lng]);
  });
  if(fitView&&preferredBounds)state.map.fitBounds(preferredBounds,{padding:[45,45]});
  else if(fitView&&pointBounds.length)state.map.fitBounds(pointBounds,{padding:[70,70],maxZoom:14});
}

async function addAdministrativeRegions(countryPeople){
  const code=state.countryCode||countryPeople.find(p=>p.countryCode)?.countryCode;
  if(!code)throw new Error('Missing country code');
  const meta=await fetch(`https://www.geoboundaries.org/api/current/gbOpen/${code}/ADM1/`).then(r=>{if(!r.ok)throw new Error('ADM1 metadata');return r.json();});
  const boundaryUrl=(meta.simplifiedGeometryGeoJSON||meta.gjDownloadURL).replace('https://github.com/wmgeolab/geoBoundaries/raw/','https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/');
  const geo=await fetch(boundaryUrl).then(r=>{if(!r.ok)throw new Error('ADM1 geometry');return r.json();});
  if(!state.map||!document.querySelector('#map'))return;
  const peopleForFeature=feature=>countryPeople.filter(p=>pointInGeometry([Number(p.lng),Number(p.lat)],feature.geometry));
  const adminStat=document.querySelector('#mapSecondaryStat');if(adminStat)adminStat.textContent=geo.features.length;
  state.mapLayer=L.geoJSON(geo,{style:f=>({fillColor:densityColor(peopleForFeature(f).length),fillOpacity:.84,color:'#91a097',weight:.85}),onEachFeature:(feature,layer)=>{
    const matches=peopleForFeature(feature);const rawName=feature.properties.shapeName||feature.properties.name||'未命名行政区';const name=localizedRegionName(rawName);
    layer.bindTooltip(`${esc(name)} · ${matches.length} 条`,{sticky:true});
    layer.on('mouseover',()=>layer.setStyle({weight:1.8,color:'#392f2b'}));
    layer.on('mouseout',()=>state.mapLayer?.resetStyle(layer));
    layer.on('click',()=>{const bounds=layer.getBounds();setRoute('overview',{region:{name,personIds:matches.map(p=>p.id),bounds:[[bounds.getSouth(),bounds.getWest()],[bounds.getNorth(),bounds.getEast()]]}});});
  }}).addTo(state.map);
  state.map.fitBounds(state.mapLayer.getBounds(),{padding:[28,28]});
}

async function initMap() {
  if(!window.L){document.querySelector('.map-loading').textContent='地图资源加载失败，请检查网络';return;}
  const people=activePeople();
  const countryPeople=state.country?state.people.filter(p=>countryName(p)===state.country):state.people;
  state.map=L.map('map',{zoomControl:false,worldCopyJump:true,minZoom:state.country?3:2}).setView(state.country?[countryPeople[0]?.lat||20,countryPeople[0]?.lng||0]:[22,12],state.country?5:2);
  L.control.zoom({position:'bottomleft'}).addTo(state.map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(state.map);
  if(state.region){
    addPersonMarkers(people,state.region.bounds);
  }else if(state.country){
    try{await addAdministrativeRegions(countryPeople);addPersonMarkers(countryPeople,null,false);}
    catch(error){console.error('Unable to load ADM1 boundaries',error);if(state.map){addPersonMarkers(countryPeople);toast('一级行政区边界暂时无法加载，已显示具体地点');}}
  }else{
    try{
      const geo=await fetch(GEOJSON_URL).then(r=>{if(!r.ok)throw Error();return r.json();});
      if(!state.map||!document.querySelector('#map'))return;
      registerCountries(geo.features);
      let migrated=false;state.people.forEach(p=>{if(!p.countryCode){p.countryCode=resolveCountryCode(p.country);migrated=migrated||Boolean(p.countryCode);}});if(migrated)savePeople();
      const counts=Object.fromEntries(state.people.reduce((m,p)=>p.countryCode?m.set(p.countryCode,(m.get(p.countryCode)||0)+1):m,new Map()));
      const featureCount=f=>counts[f.properties['ISO3166-1-Alpha-3']]||state.people.filter(p=>countryKey(p)===f.properties['ISO3166-1-Alpha-3']).length;
      state.mapLayer=L.geoJSON(geo,{style:f=>({fillColor:densityColor(featureCount(f)),fillOpacity:.92,color:'#aeb8b0',weight:.6}),onEachFeature:(f,l)=>{
        const code=f.properties['ISO3166-1-Alpha-3'];const n=featureCount(f);const name=f.properties.name;
        const storedCountry=state.people.find(p=>countryKey(p)===code)?.country||name;
         l.bindTooltip(`${esc(name)} · ${n} 条`,{sticky:true});
        if(n){l.on('mouseover',()=>l.setStyle({weight:1.5,color:'#392f2b'}));l.on('mouseout',()=>state.mapLayer.resetStyle(l));l.on('click',()=>setRoute('overview',{country:storedCountry,countryCode:code,region:null}));}
      }}).addTo(state.map);
      addPersonMarkers(state.people,null,false);
    }catch{const loading=document.querySelector('.map-loading');if(loading)loading.textContent='国家边界加载失败，底图仍可使用';return;}
  }
  document.querySelector('.map-loading')?.remove();
}

function filteredPeople() {
  let list=activePeople().filter(p=>{
    const hay=[p.name,p.storeName,p.place,p.country,p.storeType,p.bio].join(' ').toLowerCase();
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
  const places=unique('place',people), countries=unique('country',people), stores=unique('storeName',people);
  main.innerHTML=`<section class="dashboard page"><div class="page-head"><div><p class="eyebrow">${state.country?'COUNTRY DIRECTORY':'DIRECTORY VIEW'}</p><h1>${state.country?esc(state.country)+' · 档案':'探店档案'}</h1><p>按地点、店类型和所属店铺整理人物关系</p></div>${state.country?'<button class="ghost-button" id="clearCountry">查看全部国家</button>':''}</div>
    <div class="content-tabs"><span>店铺信息</span><span class="active">人物档案</span><span>探店手记</span></div>
    <div class="overview-grid single-overview">
      <div class="metric-card total-card"><span>档案总数</span><strong>${people.length}</strong></div>
    </div>
    <section class="filter-panel filter-panel-top"><div class="filter-panel-head"><h3>筛选档案</h3><span>可组合选择多个分类</span></div>
      <div class="filter-top-row"><input class="search-input" id="searchPeople" value="${esc(state.search)}" placeholder="搜索昵称、店铺、地点或类型" />
        <label class="sort-control"><span>排序方式</span><select id="sortFilter"><option value="recent" ${state.sort==='recent'?'selected':''}>最近到访</option><option value="name" ${state.sort==='name'?'selected':''}>名称</option><option value="place" ${state.sort==='place'?'selected':''}>地理位置</option></select></label>
      </div>
      <div class="facet-grid">${facetGroup('具体地点','place',places,people)}
        ${facetGroup('国家','country',countries,people)}
        ${facetGroup('店类型','storeType',STORE_TYPES,people)}
        ${facetGroup('所属店铺','storeName',stores,people)}</div>
    </section>
    <div class="results-head"><h2>人物列表</h2><span>找到 ${list.length} 条</span></div><div class="people-grid">${list.length?list.map(personCard).join(''):'<div class="empty-state"><span class="empty-index">00</span><div><strong>尚无档案</strong><span>添加第一位人物，或调整当前筛选条件。</span></div></div>'}</div>
  </section>`;
  document.querySelector('#clearCountry')?.addEventListener('click',()=>{state.country=null;render();});
  document.querySelector('#searchPeople').addEventListener('input',e=>{state.search=e.target.value;renderDirectory(document.querySelector('#mainContent'));});
  document.querySelector('#sortFilter').addEventListener('change',e=>{state.sort=e.target.value;render();});
  document.querySelectorAll('[data-filter-key]').forEach(b=>b.onclick=()=>{state.filters[b.dataset.filterKey]=b.dataset.filterValue;render();});
  document.querySelectorAll('.person-card').forEach(c=>c.onclick=()=>setRoute('detail',{id:c.dataset.id}));
}

function personCard(p,index){const type=p.storeType||'未设置',visits=p.encounters?.length||0;return `<article class="person-card" data-id="${p.id}" tabindex="0"><div class="person-photo"><img src="${p.photo}" alt="${esc(p.name)}"><span class="person-type">${esc(type)}</span></div><div class="person-info"><p class="person-number">No.${String(index+1).padStart(3,'0')}</p><h3>${esc(p.name)}</h3>${p.storeName?`<p class="store-relation">${esc(p.storeName)}</p>`:'<p class="store-relation">独立档案</p>'}<p class="person-rating">★ ${p.ratings.overall?`${p.ratings.overall}.0 / 5`:'尚未评分'} <span>· ${visits} 篇手记</span></p><p class="person-bio">${esc(p.bio||'暂无简介')}</p><div class="tags"><span class="tag location-tag">⌖ ${esc(p.place)}</span><span class="tag country-tag">◎ ${esc(p.country)}</span><span class="tag store-tag">${esc(type)}</span></div><strong class="card-link">查看完整档案 →</strong></div></article>`;}

function encounterDefaultTitle(number){return number<=3?['','第一次到访','第二次到访','第三次到访'][number]:`第${number}次到访`;}
function encounterCard(entry,index){return `<article class="encounter-entry"><div class="encounter-index">${String(index+1).padStart(2,'0')}</div><div class="encounter-body"><div class="encounter-display"><div class="encounter-head"><h3>${esc(entry.title||encounterDefaultTitle(index+1))}</h3><time>${esc(entry.date||'未填写日期')}</time><button type="button" class="back-button edit-encounter">编辑</button></div><p>${esc(entry.content).replace(/\n/g,'<br>')}</p></div><form class="encounter-form encounter-edit hidden" data-index="${index}"><div class="two-columns"><label>记录标题<input name="title" required value="${esc(entry.title||encounterDefaultTitle(index+1))}" /></label><label>到访日期<input name="date" type="date" required value="${esc(entry.date||'')}" /></label></div><label>手记内容<textarea name="content" required>${esc(entry.content)}</textarea></label><div class="article-actions"><button type="button" class="ghost-button cancel-encounter-edit">取消</button><button class="primary-button" type="submit">保存修改</button></div></form></div></article>`;}

function renderDetail(main) {
  const p=state.people.find(x=>x.id===state.selectedId);
  if(!p){setRoute('people');return;}
  const encounters=p.encounters||[],nextNumber=encounters.length+1;
  main.innerHTML=`<section class="detail-page page"><div class="detail-toolbar"><button class="back-button" id="backPeople">← 返回分类视图</button><button class="ghost-button" id="editPersonButton">编辑基本信息</button></div><div class="detail-banner"><small>PERSON RECORD</small><strong>${esc(p.name)}</strong><span>${esc(p.storeName||'独立档案')} · ${esc(p.country)}</span></div>
    <div class="detail-layout"><article class="profile-main"><div class="profile-hero"><img src="${p.photo}" alt="${esc(p.name)}"><div><p class="eyebrow">${esc(p.storeName||'独立档案')} · ${esc(p.country)}</p><h1>${esc(p.name)}</h1>${p.storeName?`<p class="store-relation">所属店铺 · ${esc(p.storeName)}</p>`:''}<div class="tags"><span class="tag location-tag">⌖ ${esc(p.place)}</span><span class="tag country-tag">◎ ${esc(p.country)}</span><span class="tag store-tag">${esc(p.storeType||'未设置')}</span>${p.storeName?`<span class="tag relation-tag">店铺 · ${esc(p.storeName)}</span>`:''}</div><p class="bio">${esc(p.bio||'暂无简介')}</p></div></div>
      <div class="article-editor"><div class="section-title"><h2>探店手记</h2><small>共 ${encounters.length} 次到访</small></div>
        <div class="encounter-timeline">${encounters.length?encounters.map(encounterCard).join(''):'<div class="encounter-empty">还没有到访记录，从第一次开始写吧。</div>'}</div>
        <form class="encounter-form" id="encounterForm"><div class="section-title"><h3>添加${encounterDefaultTitle(nextNumber)}</h3><small>NEW VISIT</small></div><div class="two-columns"><label>记录标题<input name="title" required value="${encounterDefaultTitle(nextNumber)}" /></label><label>到访日期<input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}" /></label></div><label>本次手记<textarea name="content" required placeholder="写下这次探店的体验、观察与评价…"></textarea></label><div class="article-actions"><button class="primary-button" type="submit">保存本次到访</button></div></form>
      </div></article>
      <aside class="profile-side"><p class="eyebrow">RATING</p><h3>综合评价</h3>${ratingHTML('综合','overall',p.ratings.overall)}<div class="rating-group-label">人物感受</div>${ratingHTML('长相','appearance',p.ratings.appearance)}${ratingHTML('语言能力','language',p.ratings.language)}${ratingHTML('沟通','communication',p.ratings.communication)}${ratingHTML('情绪价值','emotionalValue',p.ratings.emotionalValue)}<div class="rating-group-label">到访体验</div>${ratingHTML('环境','environment',p.ratings.environment)}${ratingHTML('服务','service',p.ratings.service)}${ratingHTML('专业度','professionalism',p.ratings.professionalism)}${ratingHTML('卫生印象','hygiene',p.ratings.hygiene)}${ratingHTML('性价比','value',p.ratings.value)}
      <div class="meta-list"><div class="meta-item"><small>建档日期</small>${esc(p.date)}</div><div class="meta-item"><small>精确坐标</small>${Number(p.lat).toFixed(5)}, ${Number(p.lng).toFixed(5)}</div><div class="meta-item"><small>店类型</small>${esc(p.storeType||'未设置')}</div><div class="meta-item"><small>所属店铺</small>${esc(p.storeName||'未关联')}</div></div></aside></div></section>`;
  document.querySelector('#backPeople').onclick=()=>setRoute('people');
  document.querySelector('#editPersonButton').onclick=()=>openModal(p);
  document.querySelectorAll('.encounter-entry').forEach(card=>{
    const form=card.querySelector('.encounter-edit'),display=card.querySelector('.encounter-display');
    const toggle=editing=>{form.classList.toggle('hidden',!editing);display.classList.toggle('hidden',editing);};
    card.querySelector('.edit-encounter').onclick=()=>{form.reset();toggle(true);form.elements.title.focus();};
    card.querySelector('.cancel-encounter-edit').onclick=()=>{form.reset();toggle(false);};
    form.onsubmit=e=>{e.preventDefault();const f=new FormData(form);const entry=p.encounters[Number(form.dataset.index)];Object.assign(entry,{title:f.get('title').trim(),date:f.get('date'),content:f.get('content').trim()});savePeople();renderDetail(main);toast('手记修改已保存');};
  });
  document.querySelector('#encounterForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);p.encounters.push({id:'e'+Date.now(),title:f.get('title').trim(),date:f.get('date'),content:f.get('content').trim()});savePeople();renderDetail(main);toast(`${encounterDefaultTitle(p.encounters.length)}已保存`);};
  document.querySelectorAll('.star').forEach(s=>s.onclick=()=>{
    const value=Number(s.dataset.value),rating=s.closest('.rating');p.ratings[s.dataset.key]=value;savePeople();
    rating.querySelector('.rating-head strong').textContent=`${value}.0 / 5`;
    rating.querySelectorAll('.star').forEach(star=>{const active=Number(star.dataset.value)<=value;star.classList.toggle('active',active);star.setAttribute('aria-pressed',String(active));});
    toast('评价已更新');
  });
}
function ratingHTML(label,key,value=0){return `<div class="rating"><div class="rating-head"><span>${label}</span><strong>${value ? `${value}.0 / 5` : '未评分'}</strong></div><div class="stars" aria-label="${label}">${[1,2,3,4,5].map(n=>`<button class="star ${n<=value?'active':''}" data-key="${key}" data-value="${n}" aria-label="${n} 星" aria-pressed="${n<=value}">★</button>`).join('')}</div></div>`;}

function destroyMap(){ if(state.map){state.map.remove();state.map=null;state.mapLayer=null;} }
function fillDatalist(id,values){document.querySelector(id).innerHTML=[...new Set(values.filter(Boolean))].map(v=>`<option value="${esc(v)}"></option>`).join('');}
function openModal(person=null){
  state.editingPersonId=person?.id||null;state.pendingPhoto=person?.photo||'';
  const form=document.querySelector('#personForm');form.reset();
  document.querySelector('#modalTitle').textContent=person?'编辑基本信息':'添加探店档案';
  form.querySelector('[type="submit"]').textContent=person?'保存修改':'保存档案';
  if(person)for(const key of ['name','country','storeType','storeName','place','lat','lng','bio'])form.elements[key].value=person[key]??'';
  const photo=document.querySelector('#photoPreview');photo.style.backgroundImage=person?.photo?`url(${JSON.stringify(person.photo)})`:'';photo.textContent=person?.photo?'':'＋';
  const place=document.querySelector('#placePreview');place.textContent=`⌖ ${person?.place||'地点标签'}`;place.classList.toggle('hidden',!person?.place);
  fillDatalist('#countryOptions',[...unique('country',state.people),...countryCatalog.flatMap(c=>[c.zh,c.en,`${c.zh} / ${c.en}`])]);fillDatalist('#locationOptions',unique('place',state.people));fillDatalist('#storeOptions',unique('storeName',state.people));document.querySelector('#personModal').classList.remove('hidden');form.elements.name.focus();
}
function closeModal(){document.querySelector('#personModal').classList.add('hidden');state.editingPersonId=null;state.pendingPhoto='';}

document.querySelector('#homeButton').onclick=()=>{state.view='map';setRoute('overview',{country:null});};
document.querySelectorAll('.view-button').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;if(state.route==='detail')state.route=state.view==='map'?'overview':'people';render();});
document.querySelector('#addPersonButton').onclick=()=>openModal();
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
document.querySelector('#personForm').onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.target);const name=f.get('name').trim();
  const existing=state.editingPersonId?state.people.find(p=>p.id===state.editingPersonId):null;
  const colors=['#554d48','#765148','#52615d','#8a7462'];
  const country=f.get('country').trim(),resolvedCode=resolveCountryCode(country);
  const fields={name,country,place:f.get('place').trim(),lat:Number(f.get('lat')),lng:Number(f.get('lng')),storeType:f.get('storeType').trim(),storeName:f.get('storeName').trim(),bio:f.get('bio').trim(),photo:state.pendingPhoto||existing?.photo||avatar(name,colors[state.people.length%colors.length])};
  if(existing){
    const nextCode=resolvedCode||(existing.country===country?existing.countryCode:'');
    const locationChanged=countryKey(existing)!==(nextCode||countryText(country))||existing.lat!==fields.lat||existing.lng!==fields.lng;
    Object.assign(existing,fields,{countryCode:nextCode});savePeople();closeModal();
    if(locationChanged){state.country=null;state.countryCode=null;state.region=null;}
    render();toast('基本信息修改已保存');return;
  }
  state.people.unshift({id:'p'+Date.now(),...fields,countryCode:resolvedCode,tags:[],ratings:{...RATING_DEFAULTS},date:new Date().toISOString().slice(0,10),article:'',encounters:[]});savePeople();closeModal();state.country=null;state.countryCode=null;state.region=null;state.search='';state.filters={place:'全部',country:'全部',storeType:'全部',storeName:'全部'};state.view='directory';state.route='people';render();toast(`${name} 已加入私人档案`);
};

render();
