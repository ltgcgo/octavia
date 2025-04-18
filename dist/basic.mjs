var q=Object.create;var N=Object.defineProperty;var Q=Object.getOwnPropertyDescriptor;var Z=Object.getOwnPropertyNames;var J=Object.getPrototypeOf,j=Object.prototype.hasOwnProperty;var ee=(t,a)=>()=>(a||t((a={exports:{}}).exports,a),a.exports);var te=(t,a,r,e)=>{if(a&&typeof a=="object"||typeof a=="function")for(let n of Z(a))!j.call(t,n)&&n!==r&&N(t,n,{get:()=>a[n],enumerable:!(e=Q(a,n))||e.enumerable});return t};var _=(t,a,r)=>(r=t!=null?q(J(t)):{},te(a||!t||!t.__esModule?N(r,"default",{value:t,enumerable:!0}):r,t));var A=ee((Oe,R)=>{(function(){"use strict";let t={fatal:!0},a=[new TextDecoder("iso-8859-15",t),new TextDecoder("utf-8",t),new TextDecoder("sjis",t),new TextDecoder("euc-jp",t),new TextDecoder("ascii")],r={debug:!1,parse:function(e,n){if(e instanceof Uint8Array)return r.Uint8(e);if(typeof e=="string")return r.Base64(e);if(e instanceof HTMLElement&&e.type==="file")return r.addListener(e,n);throw new Error("MidiParser.parse() : Invalid input provided")},addListener:function(e,n){if(!File||!FileReader)throw new Error("The File|FileReader APIs are not supported in this browser. Use instead MidiParser.Base64() or MidiParser.Uint8()");if(e===void 0||!(e instanceof HTMLElement)||e.tagName!=="INPUT"||e.type.toLowerCase()!=="file")return console.warn("MidiParser.addListener() : Provided element is not a valid FILE INPUT element"),!1;n=n||function(){},e.addEventListener("change",function(s){if(!s.target.files.length)return!1;console.log("MidiParser.addListener() : File detected in INPUT ELEMENT processing data..");let h=new FileReader;h.readAsArrayBuffer(s.target.files[0]),h.onload=function(c){n(r.Uint8(new Uint8Array(c.target.result)))}})},Base64:function(e){let n=function(c){var g="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";if(c=c.replace(/^.*?base64,/,""),c=String(c).replace(/[\t\n\f\r ]+/g,""),!/^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/.test(c))throw new TypeError("Failed to execute _atob() : The string to be decoded is not correctly encoded.");c+="==".slice(2-(3&c.length));let u,f="",i,o,l=0;for(;l<c.length;)u=g.indexOf(c.charAt(l++))<<18|g.indexOf(c.charAt(l++))<<12|(i=g.indexOf(c.charAt(l++)))<<6|(o=g.indexOf(c.charAt(l++))),f+=i===64?String.fromCharCode(u>>16&255):o===64?String.fromCharCode(u>>16&255,u>>8&255):String.fromCharCode(u>>16&255,u>>8&255,255&u);return f}(e=String(e));var s=n.length;let h=new Uint8Array(new ArrayBuffer(s));for(let c=0;c<s;c++)h[c]=n.charCodeAt(c);return r.Uint8(h)},Uint8:function(h){let n={data:null,pointer:0,movePointer:function(i){return this.pointer+=i,this.pointer},readInt:function(i){if((i=Math.min(i,this.data.byteLength-this.pointer))<1)return-1;let o=0;if(1<i)for(let l=1;l<=i-1;l++)o+=this.data.getUint8(this.pointer)*Math.pow(256,i-l),this.pointer++;return o+=this.data.getUint8(this.pointer),this.pointer++,o},readStr:function(i){let o=new Uint8Array(i),l=!1,d;o.forEach((b,p)=>{o[p]=this.readInt(1)});for(let b=0;b<a.length;b++)if(!l)try{if(d=a[b].decode(o),b===0)for(let p=0;p<d.length;p++){let E=d.charCodeAt(p);if(E>191||E>127&&E<160)throw new RangeError(`Invalid code point: ${E}`)}l=!0,console.debug(`String byte sequence in ${a[b].encoding}`)}catch(p){console.debug(`SMF string ${p}`)}return d||"String byte sequence read failed."},backOne:function(){this.pointer--},readIntVLV:function(){let i=0;if(this.pointer>=this.data.byteLength)return-1;if(this.data.getUint8(this.pointer)<128)i=this.readInt(1);else{let l=[];for(;128<=this.data.getUint8(this.pointer);)l.push(this.readInt(1)-128);var o=this.readInt(1);for(let d=1;d<=l.length;d++)i+=l[l.length-d]*Math.pow(128,d);i+=o}return i}};if(n.data=new DataView(h.buffer,h.byteOffset,h.byteLength),n.readInt(4)!==1297377380)return console.warn("Header validation failed (not MIDI standard or file corrupt.)"),!1;n.readInt(4);let s={};s.formatType=n.readInt(2),s.tracks=n.readInt(2),s.track=[];var h=n.readInt(1),c=n.readInt(1);128<=h?(s.timeDivision=[],s.timeDivision[0]=h-128,s.timeDivision[1]=c):s.timeDivision=256*h+c;for(let i=1;i<=s.tracks;i++){s.track[i-1]={event:[]};var g,u=n.readInt(4);if(u===-1)break;if(u!==1297379947)return!1;n.readInt(4);let o=0,l=!1,d,b;for(;!l&&(o++,s.track[i-1].event[o-1]={},s.track[i-1].event[o-1].deltaTime=n.readIntVLV(),(d=n.readInt(1))!==-1);)if(128<=d?b=d:(d=b,n.movePointer(-1)),d===255){s.track[i-1].event[o-1].type=255,s.track[i-1].event[o-1].metaType=n.readInt(1);var f=n.readIntVLV();switch(s.track[i-1].event[o-1].metaType){case 47:case-1:l=!0;break;case 1:case 2:case 3:case 4:case 5:case 7:case 6:s.track[i-1].event[o-1].data=n.readStr(f);break;case 33:case 89:case 81:s.track[i-1].event[o-1].data=n.readInt(f);break;case 84:s.track[i-1].event[o-1].data=[],s.track[i-1].event[o-1].data[0]=n.readInt(1),s.track[i-1].event[o-1].data[1]=n.readInt(1),s.track[i-1].event[o-1].data[2]=n.readInt(1),s.track[i-1].event[o-1].data[3]=n.readInt(1),s.track[i-1].event[o-1].data[4]=n.readInt(1);break;case 88:s.track[i-1].event[o-1].data=[],s.track[i-1].event[o-1].data[0]=n.readInt(1),s.track[i-1].event[o-1].data[1]=n.readInt(1),s.track[i-1].event[o-1].data[2]=n.readInt(1),s.track[i-1].event[o-1].data[3]=n.readInt(1);break;default:this.customInterpreter!==null&&(s.track[i-1].event[o-1].data=this.customInterpreter(s.track[i-1].event[o-1].metaType,n,f)),this.customInterpreter!==null&&s.track[i-1].event[o-1].data!==!1||(n.readInt(f),s.track[i-1].event[o-1].data=n.readInt(f),this.debug&&console.info("Unimplemented 0xFF meta event! data block readed as Integer"))}}else switch((d=d.toString(16).split(""))[1]||d.unshift("0"),s.track[i-1].event[o-1].type=parseInt(d[0],16),s.track[i-1].event[o-1].channel=parseInt(d[1],16),s.track[i-1].event[o-1].type){case 15:this.customInterpreter!==null&&(s.track[i-1].event[o-1].data=this.customInterpreter(s.track[i-1].event[o-1].type,n,!1)),this.customInterpreter!==null&&s.track[i-1].event[o-1].data!==!1||(g=n.readIntVLV(),s.track[i-1].event[o-1].data=n.readInt(g),this.debug&&console.info("Unimplemented 0xF exclusive events! data block readed as Integer"));break;case 10:case 11:case 14:case 8:case 9:s.track[i-1].event[o-1].data=[],s.track[i-1].event[o-1].data[0]=n.readInt(1),s.track[i-1].event[o-1].data[1]=n.readInt(1);break;case 12:case 13:s.track[i-1].event[o-1].data=n.readInt(1);break;case-1:l=!0;break;default:if(this.customInterpreter!==null&&(s.track[i-1].event[o-1].data=this.customInterpreter(s.track[i-1].event[o-1].metaType,n,!1)),this.customInterpreter===null||s.track[i-1].event[o-1].data===!1)return console.log("Unknown EVENT detected... reading cancelled!"),!1}}return s},customInterpreter:null};if(typeof R<"u")R.exports=r;else{let e=typeof window=="object"&&window.self===window&&window||typeof self=="object"&&self.self===self&&self||typeof global=="object"&&global.global===global&&global;e.MidiParser=r}})()});var M=class{#e={};addEventListener(t,a){this.#e[t]||(this.#e[t]=[]),this.#e[t].unshift(a)}removeEventListener(t,a){if(this.#e[t]){let r=this.#e[t].indexOf(a);r>-1&&this.#e[t].splice(r,1),this.#e[t].length<1&&delete this.#e[t]}}dispatchEvent(t,a){let r=new Event(t),e=this;r.data=a,this.#e[t]?.length>0&&this.#e[t].forEach(function(n){try{n?.call(e,r)}catch(s){console.error(s)}}),this[`on${t}`]&&this[`on${t}`](r)}};var H=class{#e={};context;set(t,a){this.#e[t]=a}has(t){return!!this.#e[t]}async read(t,a){if(!this.has(t))throw new Error(`No decoder registered for "${t}"`);return await this.#e[t].call(this.context||this,a)}};var ae=function(t,a){let r=!0;return a.forEach((e,n)=>{r=r&&t[n]===e}),r},S=function(t){let a=0;return t.forEach(r=>{a*=256,a+=r}),a},k=new TextDecoder,P=new H;P.set("s7e",async function(t){let a=new Uint8Array(await t.slice(0,65536).arrayBuffer()),r="MSB	LSB	PRG	NME",e=[0,0,0,0],n=32,s=0,h=0,c=!0,g=[],u=0;for(;c;){let f=a.subarray(s);([()=>{k.decode(f.subarray(0,4))==="YSFC"?(s+=80,h=1):s++},()=>{if(ae(f.subarray(0,4),e))g.forEach((i,o,l)=>{let d=S(a.subarray(i.start+4,i.start+8));i.length=d}),h=2;else{let i=k.decode(f.subarray(0,4)),o=S(f.subarray(4,8));g.push({type:i,start:o}),s+=8}},()=>{let i=g[u],o=a.subarray(i.start,i.start+i.length),l=32;switch(i.type){case"ENVC":{let d=n;for(;d<o.length;){let b=o.subarray(d,d+l),p=k.decode(b.subarray(0,10)).trimEnd();p.slice(0,5)==="Init "&&(p=""),p&&(r+=`
063	${(b[17]+13).toString().padStart(3,"0")}	${b[19].toString().padStart(3,"0")}	${p}`),d+=l}break}case"EDVC":{let d=n;for(;d<o.length;){let b=o.subarray(d,d+l),p=k.decode(b.subarray(0,10)).trimEnd();p.slice(0,5)==="Init "&&(p=""),p&&(r+=`
063	024	${b[19].toString().padStart(3,"0")}	${p}`),d+=l}break}case"EPVC":{let d=32,b=n;for(;b<o.length;){let p=o.subarray(b,b+d),E=k.decode(p.subarray(0,10)).trimEnd();E==="----------"&&(E=""),E&&(r+=`
063	${(p[17]+1).toString().padStart(3,"0")}	${p[19].toString().padStart(3,"0")}	${E}`),b+=d}break}}u++,u>=g.length&&(h=3,c=!1)}][h]||(()=>{c=!1}))()}return r});P.set("pcg",async function(t){let a=new Uint8Array(await t.arrayBuffer()),r="MSB	LSB	PRG	NME",e=100,n=0,s=0,h=!0,c=[],g=0;for(;h;){let u=a.subarray(e);([()=>{h=k.decode(u.subarray(0,4))==="INI2",s=u[15],e+=16,n=1},()=>{let f=k.decode(u.subarray(0,4)),i=u[5],o=u[7],l=u[11],d=S(u.subarray(12,16)),b=S(u.subarray(16,20)),p=S(u.subarray(36,40)),E=k.decode(u.subarray(44,44+l));c.push({type:f,tipMsb:i,tipLsb:o,nameLen:l,length:d,start:b,entryLen:p,name:E}),e+=64,s--,s<1&&(n=2)},()=>{let f=c[g],i=a.subarray(f.start,f.start+f.length);switch(f.type){case"PRG1":break;case"PBK1":{let o=63,l=(f.tipMsb?6:0)+f.tipLsb;for(let d=0;d<128;d++){let b=d*f.entryLen,p=i.subarray(b,b+f.entryLen),E=k.decode(p.subarray(0,24)).trimEnd().replace("InitProg","");E.length&&l>5&&(r+=`
${o.toString().padStart(3,"0")}	${l.toString().padStart(3,"0")}	${d.toString().padStart(3,"0")}	${E}`)}break}case"CBK1":{let o=63,l=(f.tipMsb?3:0)+f.tipLsb+10;for(let d=0;d<128;d++){let b=d*f.entryLen,p=i.subarray(b,b+f.entryLen),E=k.decode(p.subarray(0,24)).trimEnd().replace("InitCombi","");E.length&&l>12&&(r+=`
${o.toString().padStart(3,"0")}	${l.toString().padStart(3,"0")}	${d.toString().padStart(3,"0")}	${E}`)}break}}g++,g>=c.length&&(n=3,h=!1)}][n]||(()=>{h=!1}))()}return r});var re=["off","hall","room","stage","plate","delay LCR","delay LR","echo","cross delay","early reflections","gate reverb","reverse gate"].concat(new Array(4),["white room","tunnel","canyon","basement","karaoke"],new Array(43),["pass through","chorus","celeste","flanger","symphonic","rotary speaker","tremelo","auto pan","phaser","distortion","overdrive","amplifier","3-band EQ","2-band EQ","auto wah"],new Array(1),["pitch change","harmonic","touch wah","compressor","noise gate","voice channel","2-way rotary speaker","ensemble detune","ambience"],new Array(4),["talking mod","Lo-Fi","dist + delay","comp + dist + delay","wah + dist + delay","V dist","dual rotor speaker"]);var se=",a,i,u,e,o,ka,ki,ku,ke,ko,ky,kw,sa,si,su,se,so,sh,ta,ti,tu,te,to,t,ch,t,s,na,ni,nu,ne,no,ny,nn,ha,hi,hu,he,ho,hy,fa,fi,fu,fe,fo,ma,mi,mu,me,mo,my,mm,ya,yu,ye,yo,ra,ri,ru,re,ro,ry,wa,wi,we,wo,ga,gi,gu,ge,go,gy,gw,za,zi,zu,ze,zo,ja,ji,ju,je,jo,jy,da,di,du,de,do,dy,ba,bi,bu,be,bo,by,va,vi,vu,ve,vo,pa,pi,pu,pe,po,py,nga,ngi,ngu,nge,ngo,ngy,ng,hha,hhi,hhu,hhe,hho,hhy,hhw,*,_,,,~,.".split(","),ie={};`hi*,
ka,か
ki,き
ku,く
ke,け
ko,こ
ky,き!
kw,くl
tsu,つ
ts,つl
sa,さ
si,すぃ
su,す
se,せ
so,そ
shi,し
sh,し!
ta,た
ti,てぃ
tu,とぅ
te,て
to,と
tchy,ち!
tchi,ち
na,な
ni,に
nu,ぬ
ne,ね
no,の
ny,に!
nn,ん
ha,は
hi,ひ
hu,ほぅ
he,へ
ho,ほ
hy,ひ!
fa,ふぁ
fi,ふぃ
fu,ふ
fe,ふぇ
fo,ふぉ
ma,ま
mi,み
mu,む
me,め
mo,も
my,み!
mm,ㇺ
ra,ら
ri,り
ru,る
re,れ
ro,ろ
ry,り!
wa,わ
wi,ゐ
we,ゑ
wo,を
nga,か゚
ngi,き゚
ngu,く゚
nge,け゚
ngo,こ゚
ngy,き゚!
ng,ン
ga,が
gi,ぎ
gu,ぐ
ge,げ
go,ご
gy,ぎ!
gw,ぐl
za,ざ
zi,ずぃ
zu,ず
ze,ぜ
zo,ぞ
ja,じゃ
ji,じ
ju,じゅ
je,じぇ
jo,じょ
jy,じ!
da,だ
di,でぃ
du,どぅ
de,で
do,ど
dy,で!
ba,ば
bi,び
bu,ぶ
be,べ
bo,ぼ
by,び!
va,ゔぁ
vi,ゔぃ
vu,ゔ
ve,ゔぇ
vo,ゔぉ
pa,ぱ
pi,ぴ
pu,ぷ
pe,ペ
po,ぽ
py,ぴ!
!ya,ゃ
!yu,ゅ
!ye,ぇ
!yo,ょ
ya,や
yu,ゆ
ye,𛀁
yo,よ
!a,ゃ
!u,ゅ
!e,ぇ
!o,ょ
!a,ゃ
!u,ゅ
!e,ぇ
!o,ょ
la,ぁ
li,ぃ
lu,ぅ
le,ぇ
lo,ぉ
a,あ
i,い
u,う
e,え
o,お
*,っ
~,
^,
_,`.split(`
`).forEach(t=>{let a=t.split(",");ie[a[0]]=a[1]});var G=function(t,a,r){let e=[],n=r==!1?a.readIntVLV():r;t==0||t==127;for(let s=0;s<n;s++){let h=a.readInt(1);if(e.push(h),h!=247){if(h!=240){if(h>127)return console.debug(`Early termination: ${e}`),e.pop(),a.backOne(),a.backOne(),new Uint8Array(e)}}}return new Uint8Array(e)};var De="♭𝄫,𝄫,♭,,♯,𝄪,𝄪♯".split(",");var bt=_(A(),1),ne=["?","gm","gs","sc","xg","g2","mt32","doc","qy10","qy20","ns5r","x5d","05rw","k11","sg","sd","pa","krs","s90es","motif","cs6x","trin","an1x","cs1x"];var ce=["melodic","drum","menu"];var oe=[36,37,48,49,52,53],I=[20,21,22,23,24,25,26,28,29,30,31,36,37,48,49,52,53,64,65];var V=[0,1,2,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20,21,22,26,28,32,38,40,41,42,43,44,45,46,47,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,80,81,82,83,84,91,92,93,94,95,98,99,100,101,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157];var le={};ne.forEach((t,a)=>{le[t]=a});var K=[];V.forEach((t,a)=>{K[t]=a});var F={length:I.length};I.forEach((t,a)=>{F[t]=a});var de={};ce.forEach((t,a)=>{de[t]=a});var D=8,y={port:D,ch:D<<4,chShift:Math.ceil(Math.log2(D))+4,cc:V.length,nn:128,pl:512,tr:256,cmt:14,rpn:6,rpnt:4,nrpn:oe.length,ace:8,drm:8,dpn:I.length,dnc:128,ext:3,efx:7,cvn:12,redir:32,vxPrim:3,invalidCh:255};y.chcc=y.cc*y.ch;var $={bank0:128},Et=new TextDecoder("l9"),he=new Uint16Array(y.ch),fe=new Uint16Array(y.ch),ue=new Uint16Array(y.ch),pe=new Uint16Array(y.ch),be=new Uint16Array(y.ch),ge=new Uint16Array(y.ch),X=new Array(y.drm);for(let t=0;t<y.ch;t++)he[t]=t*y.cc,fe[t]=t*y.rpn,ue[t]=t*y.nrpn,pe[t]=t*y.ace,be[t]=t*y.ext,ge[t]=t*y.cvn;for(let t=0;t<y.drm;t++){X[t]=new Uint16Array(y.dpn);let a=t*y.dpn*y.dnc;for(let r=0;r<y.dpn;r++)X[t][r]=a+r*y.dnc}var U=_(A(),1);var Y=class{#e=!1;constructor(t,a,r,e){this.#e=t,this.start=a,this.end=r,this.data=e}get duration(){return this.ranged?this.end-this.start:0}get ranged(){return this.#e}},O=class extends Y{constructor(t,a,r){super(!0,t,a,r)}},z=class extends Y{constructor(t,a){super(!1,t,t,a)}},L=class extends Array{#e=-1;constructor(){super(...arguments)}resetIndex(t){this.#e=-1}fresh(){this.sort(function(t,a){return t.start==a.start?0:(+(t.start>a.start)<<1)-1}),this.forEach(function(t,a){t.index=a})}step(t,a=!1){let r=[];if(a)for(let e=0;e<this.length&&!(this[e].start>t);e++){if(this[e].end<t)continue;r.push(this[e])}else{let e=this.getRange(this.#e==-1?0:t-1,t),n=this;e.forEach(function(s){s.index>n.#e&&(r.push(s),n.#e=s.index)})}return r}getRange(t,a){t>a&&([t,a]=[a,t]);let r=[],e=-1,n=Math.ceil(Math.sqrt(this.length)),s=!0;for(let h=0;h<this.length;h+=n)this[h+n]?e<0&&this[h+n].start>=t&&(e=h):e=e<0?h:e;for(;s;)this[e]?.end<a?this[e].start>=t&&r.push(this[e]):s=!1,e++;return r}};var Ee=0xffffffffffff,W=function(t){let a=new L,r=this,e=t.timeDivision,n=120,s=new L,h=0,c=0;s.push(new O(0,Ee,[120,0])),t.track.forEach(function(i){h=0,i.event.forEach(function(o){h+=o.deltaTime,o.type===255&&o?.metaType===81&&(n=6e7/o.data,s[s.length-1]&&s.push(new O(h,0xffffffffffff,[n,0])))})}),s.fresh(),s.forEach(function(i,o,l){o>0&&(l[o-1].end=i.start)});let g=120;s.forEach(function(i,o,l){o>0&&(i.end===i.start?l.splice(l.indexOf(i),1):g===i.data[0]&&(l[o-1].end=i.end,l.splice(l.indexOf(i),1)),g=i.data[0])});let u=0,f=120;return s.forEach(function(i){let o=i.start,l=o/f/e*60+u;f=i.data[0],u=l-o/f/e*60,i.data[1]=u}),console.debug("All tempo changes: ",s),n=120,h=0,c=0,t.track.forEach(function(i,o){h=0,c=0;let l=o+1;i.event.forEach(function(d,b){h+=d.deltaTime;let p=s.step(h,!0)[0];p&&(n=p.data[0],c=p.data[1]);let E={type:d.type,data:d.data,track:l,part:0};d.type>14?E.meta=d.metaType:E.part=d.channel,a.push(new z(h/n/e*60+c,E))})}),a.fresh(),self.midiEvents=a,console.debug(`Parsed a type ${t.formatType} MIDI sequence.`),a};U.default.customInterpreter=G;var v=function(t,a,r){t.addEventListener(r,e=>{a.dispatchEvent(r,e.data)})},Rt=class extends M{device;#e;#i={};#f=[];#s="";#l=[];#u=[];#d=new Uint8ClampedArray(128);#p=new Uint8ClampedArray(128);#n=.5;#c=120;#t=4;#a=4;#r=0;#h=0;#b=new Array(y.ch);#o=new Uint8Array(y.ch);smoothAttack=0;smoothDecay=0;reset(){let t=this;t.dispatchEvent("reset"),t.#e?.resetIndex(),t.device.init(),t.#s="",t.#n=.5,t.#c=120,t.#t=4,t.#a=4,t.#r=0,t.#h=0,t.dispatchEvent("tempo",t.#c),t.dispatchEvent("title",t.#s)}init(){this.reset(),this.#e=void 0}async loadFile(t){this.#e=W(U.default.parse(new Uint8Array(await t.arrayBuffer())))}async loadMap(t,a,r){let e=this,n=0,s=0,h=0,c=0,g,u;t.split(`
`).forEach((f,i)=>{if(!f)return;let o=f.split("	");if(i){if(!c)return;let l="",d="";o.forEach((p,E)=>{switch(E){case g:{l=p;break}case u:{d=p;break}}});let b=!1;e.#i[l]?.priority>r&&(b=!0,h++),!e.#i[l]||b||a?(e.#i[l]={name:d,priority:r},n++):self.debugMode&&console.debug(`Voice "${d}" (${l}) seems to be in conflict with (${e.#i[l]}).`),s++}else o.forEach((l,d)=>{switch(l){case"ID":{g=d,c++;break}case"Name":{u=d,c++;break}default:console.debug(`Unknown map field: ${l}`)}})}),console.debug(`Voice names: ${s} total, ${n} loaded (${n-h} + ${h}).`),e?.device.forceVoiceRefresh()}async loadMapPaths(t){let a=this;t.forEach(async(r,e)=>{a.loadMap(await(await fetch(r)).text(),0,e)})}async loadEfx(t,a){let r=this,e=0,n=0,s,h,c;t.split(`
`).forEach((g,u)=>{if(g)if(u){let f=0,i;g.split("	").forEach((o,l)=>{switch(l){case s:{f|=(parseInt(o,16)&255)<<8;break}case h:{f|=parseInt(o,16)&255;break}case c:{i=o;break}}}),!r.#f[f]||a?(r.#f[f]=i,e++):self.debugMode&&console.debug(`EFX ID 0x${f.toString(16).padStart(4,"0")} (${i}) seems to be in conflict.`),n++}else g.split("	").forEach((f,i)=>{switch(f){case"MSB":{s=i;break}case"LSB":{h=i;break}case"Name":{c=i;break}default:console.debug(`Unknown EFX field: ${f}`)}})}),console.debug(`EFX: ${n} total, ${e} loaded.`),r.dispatchEvent("efxreverb",r.device.getEffectType(0)),r.dispatchEvent("efxchorus",r.device.getEffectType(1)),r.dispatchEvent("efxdelay",r.device.getEffectType(2)),r.dispatchEvent("efxinsert0",r.device.getEffectType(3)),r.dispatchEvent("efxinsert1",r.device.getEffectType(4)),r.dispatchEvent("efxinsert2",r.device.getEffectType(5)),r.dispatchEvent("efxinsert3",r.device.getEffectType(6))}async loadModels(t,a){let r=this,e=0,n=0}async loadStyles(t,a){let r=this,e=0,n=0}switchMode(t,a=!1){this.device.switchMode(t,a)}getMode(){return this.device.getMode()}getVoice(){return this.device.getVoice(...arguments)}getChVoice(t){return this.device.getChVoice(t)}getChPrimitive(t,a,r){return this.device.getChPrimitive(t,a,r)}getChPrimitives(t,a){return this.device.getChPrimitives(t,a)}getMapped(t){return this.#i[t]?.name||t}getEfx([t,a]){let r=t<<8|a;return this.#f[r]||`0x${r.toString(16).padStart(4,"0")}`}getVoxBm(t){if(!t)throw new Error("Voice object must be valid");let a=this;if(!a.voxBm)throw new Error("Voice bitmap repository isn't yet initialized");let r=a.voxBm.getBm(t.name);if(!r)switch(t.mode){case"xg":{switch(t.sid[0]){case 0:case 80:case 81:case 83:case 84:case 96:case 97:case 99:case 100:{r=a.voxBm.getBm(a.getVoice($.bank0,t.sid[1],$.bank0,t.mode).name);break}}break}case"g2":case"sd":{switch(t.sid[0]){case 96:case 97:case 98:case 99:{r=a.voxBm.getBm(a.getVoice($.bank0,t.sid[1],$.bank0,t.mode).name);break}case 104:case 105:case 106:case 107:{r=a.voxBm.getBm(a.getVoice(120,t.sid[1],$.bank0,t.mode).name);break}}break}case"gs":case"sc":case"k11":case"sg":case"gm":{switch(t.sid[0]){case 120:break;case 122:case 127:{r=a.voxBm.getBm(a.getVoice(120,t.sid[1],0,t.mode).name);break}default:r=a.voxBm.getBm(a.getVoice(0,t.sid[1],0,t.mode).name)}break}default:switch(t.sid[0]){case 56:{r=a.voxBm.getBm(a.getVoice(0,t.sid[1],0,t.mode).name);break}}}return r||(r=a.voxBm.getBm(a.getVoice(t.sid[0],t.sid[1],0,t.mode).name)),r}getChBm(t,a){let r=this;a=a||r.getChVoice(t);let e=r.getVoxBm(a);if(!e){if(!r.sysBm)return;switch(a.mode){case"xg":{switch(a.sid[0]){case 126:{a.sid[1]>>1===56&&(e=r.sysBm.getBm("cat_smpl"));break}case 16:{e=r.sysBm.getBm("cat_smpl");break}case 64:case 67:{e=r.sysBm.getBm("cat_sfx");break}case 32:case 33:case 34:case 35:case 36:case 48:case 82:{e=r.sysBm.getBm("cat_xg");break}}break}default:switch(a.sid[0]){case 63:case 32:case 33:case 34:case 35:case 36:case 48:case 82:{e=r.sysBm.getBm("cat_mex");break}}}}return e||(r.device.getChType()[t]?e=r.sysBm.getBm("cat_drm"):e=r.sysBm.getBm("no_vox")),e}get noteProgress(){return this.#h/this.#n}get noteOverall(){return(this.noteProgress-this.#r)*this.#a/4}get noteBar(){return Math.floor(this.noteOverall/this.#t)}get noteBeat(){let t=this.noteOverall%this.#t;return t<0&&(t+=this.#t),t}get noteOffset(){return this.#r}getTimeSig(){return[this.#t,this.#a]}getTempo(){return this.#c}eachVoice(t){this.#b.forEach(t)}sendCmd(t){this.device.runJson(t)}render(t){t>this.#h&&(this.#h=t);let a=this.#e?.step(t)||[],r=0,e=0,n=new Set,s={},h=[],c=this,g=[];for(c.device.getStrength().forEach((C,m)=>{c.#p[m]=C}),c.device.newStrength(),a.forEach(function(C){let m=C.data,w=c.device.runJson(m);switch(w?.reply){case"meta":{g.push(w);break}}w?.reply&&delete w.reply});c.#u.length>0;){let C=c.#u.shift(),m=C.part<<7|C.note;C.state?(n.add(m),s[m]=C.velo):n.has(m)&&(h.push({part:C.part,note:C.note,velo:s[m],state:c.device.NOTE_SUSTAIN}),r++,e+=c.#o[C.part])}g?.length>0&&c.dispatchEvent("meta",g);let u=c.device.getActive(),f=[],i=c.device.getPitch(),o=c.device.getCcAll(),l=c.device.getProgram(),d=c.device.getChType(),b=[],p=c.device.getStrength();p.forEach(function(C,m,w){w[m]=Math.max(c.#p[m],C);let x=w[m]-c.#d[m];if(x>=0){let T=4*.25**(c.device.getChCc(m,73)/64);c.#d[m]+=Math.ceil(x-x*c.smoothAttack**T)}else{let T=4*.25**(c.device.getChCc(m,72)/64);c.#d[m]+=Math.floor(x-x*c.smoothDecay**T)}});let E=0,B=0;return u.forEach(function(C,m){C&&(f[m]=c.device.getVel(m),b[m]=c.device.getExt(m),E+=f[m].size,B+=f[m].size*c.#o[m])}),{extraPoly:r,extraPolyEC:e,extraNotes:h,curPoly:E,curPolyEC:B,chInUse:u,chKeyPr:f,chPitch:i,chProgr:l,chContr:o,chType:d,chExt:b,eventCount:a.length,title:c.#s,bitmap:c.device.getBitmap(),letter:c.device.getLetter(),texts:c.device.getTexts(),master:c.device.getMaster(),mode:c.device.getMode(),strength:c.#d.slice(),velo:p,rpn:c.device.getRpn(),tSig:c.getTimeSig(),tempo:c.getTempo(),noteBar:c.noteBar,noteBeat:c.noteBeat,ace:c.device.getAce(),rawVelo:c.device.getStrength(),rawStrength:c.device.getRawStrength(),rawPitch:c.device.getRawPitch(),efxSink:c.device.getEffectSink()}}constructor(t,a=.5,r=.5){super();let e=this;e.smoothAttack=a,e.smoothDecay=r,e.device=t,e.addEventListener("meta",function(n){n?.data?.forEach(function(s){(e.#l[s.meta]||console.debug).call(e,s.meta,s.data)})}),v(e.device,e,"mode"),v(e.device,e,"mastervolume"),v(e.device,e,"channelactive"),v(e.device,e,"channelmin"),v(e.device,e,"channelmax"),v(e.device,e,"portrange"),v(e.device,e,"portstart"),v(e.device,e,"channelreset"),v(e.device,e,"channeltoggle"),v(e.device,e,"screen"),v(e.device,e,"metacommit"),v(e.device,e,"voice"),v(e.device,e,"pitch"),v(e.device,e,"note"),v(e.device,e,"reset"),v(e.device,e,"banklevel"),v(e.device,e,"efxreverb"),v(e.device,e,"efxchorus"),v(e.device,e,"efxdelay"),v(e.device,e,"efxinsert0"),v(e.device,e,"efxinsert1"),v(e.device,e,"efxinsert2"),v(e.device,e,"efxinsert3"),v(e.device,e,"partefxtoggle"),v(e.device,e,"chmode"),e.addEventListener("note",function({data:n}){e.#u.push(n)}),e.addEventListener("voice",({data:n})=>{let s=e.getChVoice(n.part);e.#b[n.part]=s,e.#o[n.part]=s.poly??1}),e.addEventListener("reset",({data:n})=>{e.#o.fill(1)}),e.#o.fill(1),e.#l[3]=function(n,s){e.#s?.length<1&&(e.#s=s,e.dispatchEvent("title",e.#s))},e.#l[81]=function(n,s){let h=e.noteProgress,c=e.#n||.5;e.#c=6e7/s,e.#n=s/1e6,e.#r+=h*(c/e.#n)-h,e.dispatchEvent("tempo",e.#c)},e.#l[88]=function(n,s){let h=e.noteBar,c=e.noteBeat,g=e.#t,u=e.#a;if(e.#t=s[0],e.#a=1<<s[1],g!==e.#t){let f=h;e.#r-=f*(e.#t-g)*(4/e.#a),c+1>=g&&(g<e.#t?e.#r-=Math.ceil(e.#t-c-1):e.#r+=e.#t)}if(u!==e.#a){let f=h;console.debug(`${h}/${c}`),u<e.#a?e.#r+=f*(e.#a-u)*(u/e.#a):e.#r+=f*(e.#a-u)*(e.#a/u)}e.dispatchEvent("tsig",e.getTimeSig())}}};export{Rt as RootDisplay,y as allocated,K as ccToPos,F as dnToPos};
