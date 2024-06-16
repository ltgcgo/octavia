var z=Object.create;var B=Object.defineProperty;var q=Object.getOwnPropertyDescriptor;var Q=Object.getOwnPropertyNames;var W=Object.getPrototypeOf,Y=Object.prototype.hasOwnProperty;var Z=(t,a)=>()=>(a||t((a={exports:{}}).exports,a),a.exports);var J=(t,a,i,e)=>{if(a&&typeof a=="object"||typeof a=="function")for(let c of Q(a))!Y.call(t,c)&&c!==i&&B(t,c,{get:()=>a[c],enumerable:!(e=q(a,c))||e.enumerable});return t};var j=(t,a,i)=>(i=t!=null?z(W(t)):{},J(a||!t||!t.__esModule?B(i,"default",{value:t,enumerable:!0}):i,t));var X=Z((at,A)=>{(function(){"use strict";let t={fatal:!0},a=[new TextDecoder("iso-8859-15",t),new TextDecoder("sjis",t),new TextDecoder("euc-jp",t),new TextDecoder("utf-8",t),new TextDecoder("utf-16",t),new TextDecoder("ascii")],i={debug:!1,parse:function(e,c){if(e instanceof Uint8Array)return i.Uint8(e);if(typeof e=="string")return i.Base64(e);if(e instanceof HTMLElement&&e.type==="file")return i.addListener(e,c);throw new Error("MidiParser.parse() : Invalid input provided")},addListener:function(e,c){if(!File||!FileReader)throw new Error("The File|FileReader APIs are not supported in this browser. Use instead MidiParser.Base64() or MidiParser.Uint8()");if(e===void 0||!(e instanceof HTMLElement)||e.tagName!=="INPUT"||e.type.toLowerCase()!=="file")return console.warn("MidiParser.addListener() : Provided element is not a valid FILE INPUT element"),!1;c=c||function(){},e.addEventListener("change",function(s){if(!s.target.files.length)return!1;console.log("MidiParser.addListener() : File detected in INPUT ELEMENT processing data..");let o=new FileReader;o.readAsArrayBuffer(s.target.files[0]),o.onload=function(h){c(i.Uint8(new Uint8Array(h.target.result)))}})},Base64:function(e){let c=function(h){var b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";if(h=h.replace(/^.*?base64,/,""),h=String(h).replace(/[\t\n\f\r ]+/g,""),!/^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/.test(h))throw new TypeError("Failed to execute _atob() : The string to be decoded is not correctly encoded.");h+="==".slice(2-(3&h.length));let u,f="",r,n,d=0;for(;d<h.length;)u=b.indexOf(h.charAt(d++))<<18|b.indexOf(h.charAt(d++))<<12|(r=b.indexOf(h.charAt(d++)))<<6|(n=b.indexOf(h.charAt(d++))),f+=r===64?String.fromCharCode(u>>16&255):n===64?String.fromCharCode(u>>16&255,u>>8&255):String.fromCharCode(u>>16&255,u>>8&255,255&u);return f}(e=String(e));var s=c.length;let o=new Uint8Array(new ArrayBuffer(s));for(let h=0;h<s;h++)o[h]=c.charCodeAt(h);return i.Uint8(o)},Uint8:function(o){let c={data:null,pointer:0,movePointer:function(r){return this.pointer+=r,this.pointer},readInt:function(r){if((r=Math.min(r,this.data.byteLength-this.pointer))<1)return-1;let n=0;if(1<r)for(let d=1;d<=r-1;d++)n+=this.data.getUint8(this.pointer)*Math.pow(256,r-d),this.pointer++;return n+=this.data.getUint8(this.pointer),this.pointer++,n},readStr:function(r){let n=new Uint8Array(r),d=!1,l;n.forEach((g,p)=>{n[p]=this.readInt(1)});for(let g=0;g<a.length;g++)if(!d)try{if(l=a[g].decode(n),g==0)for(let p=0;p<l.length;p++){let E=l.charCodeAt(p);if(E>191||E>127&&E<160)throw new RangeError(`Invalid code point: ${E}`)}d=!0,console.debug(`String byte sequence in ${a[g].encoding}`)}catch(p){console.debug(`SMF string ${p}`)}return l||"String byte sequence read failed."},backOne:function(){this.pointer--},readIntVLV:function(){let r=0;if(this.pointer>=this.data.byteLength)return-1;if(this.data.getUint8(this.pointer)<128)r=this.readInt(1);else{let d=[];for(;128<=this.data.getUint8(this.pointer);)d.push(this.readInt(1)-128);var n=this.readInt(1);for(let l=1;l<=d.length;l++)r+=d[d.length-l]*Math.pow(128,l);r+=n}return r}};if(c.data=new DataView(o.buffer,o.byteOffset,o.byteLength),c.readInt(4)!==1297377380)return console.warn("Header validation failed (not MIDI standard or file corrupt.)"),!1;c.readInt(4);let s={};s.formatType=c.readInt(2),s.tracks=c.readInt(2),s.track=[];var o=c.readInt(1),h=c.readInt(1);128<=o?(s.timeDivision=[],s.timeDivision[0]=o-128,s.timeDivision[1]=h):s.timeDivision=256*o+h;for(let r=1;r<=s.tracks;r++){s.track[r-1]={event:[]};var b,u=c.readInt(4);if(u===-1)break;if(u!==1297379947)return!1;c.readInt(4);let n=0,d=!1,l,g;for(;!d&&(n++,s.track[r-1].event[n-1]={},s.track[r-1].event[n-1].deltaTime=c.readIntVLV(),(l=c.readInt(1))!==-1);)if(128<=l?g=l:(l=g,c.movePointer(-1)),l===255){s.track[r-1].event[n-1].type=255,s.track[r-1].event[n-1].metaType=c.readInt(1);var f=c.readIntVLV();switch(s.track[r-1].event[n-1].metaType){case 47:case-1:d=!0;break;case 1:case 2:case 3:case 4:case 5:case 7:case 6:s.track[r-1].event[n-1].data=c.readStr(f);break;case 33:case 89:case 81:s.track[r-1].event[n-1].data=c.readInt(f);break;case 84:s.track[r-1].event[n-1].data=[],s.track[r-1].event[n-1].data[0]=c.readInt(1),s.track[r-1].event[n-1].data[1]=c.readInt(1),s.track[r-1].event[n-1].data[2]=c.readInt(1),s.track[r-1].event[n-1].data[3]=c.readInt(1),s.track[r-1].event[n-1].data[4]=c.readInt(1);break;case 88:s.track[r-1].event[n-1].data=[],s.track[r-1].event[n-1].data[0]=c.readInt(1),s.track[r-1].event[n-1].data[1]=c.readInt(1),s.track[r-1].event[n-1].data[2]=c.readInt(1),s.track[r-1].event[n-1].data[3]=c.readInt(1);break;default:this.customInterpreter!==null&&(s.track[r-1].event[n-1].data=this.customInterpreter(s.track[r-1].event[n-1].metaType,c,f)),this.customInterpreter!==null&&s.track[r-1].event[n-1].data!==!1||(c.readInt(f),s.track[r-1].event[n-1].data=c.readInt(f),this.debug&&console.info("Unimplemented 0xFF meta event! data block readed as Integer"))}}else switch((l=l.toString(16).split(""))[1]||l.unshift("0"),s.track[r-1].event[n-1].type=parseInt(l[0],16),s.track[r-1].event[n-1].channel=parseInt(l[1],16),s.track[r-1].event[n-1].type){case 15:this.customInterpreter!==null&&(s.track[r-1].event[n-1].data=this.customInterpreter(s.track[r-1].event[n-1].type,c,!1)),this.customInterpreter!==null&&s.track[r-1].event[n-1].data!==!1||(b=c.readIntVLV(),s.track[r-1].event[n-1].data=c.readInt(b),this.debug&&console.info("Unimplemented 0xF exclusive events! data block readed as Integer"));break;case 10:case 11:case 14:case 8:case 9:s.track[r-1].event[n-1].data=[],s.track[r-1].event[n-1].data[0]=c.readInt(1),s.track[r-1].event[n-1].data[1]=c.readInt(1);break;case 12:case 13:s.track[r-1].event[n-1].data=c.readInt(1);break;case-1:d=!0;break;default:if(this.customInterpreter!==null&&(s.track[r-1].event[n-1].data=this.customInterpreter(s.track[r-1].event[n-1].metaType,c,!1)),this.customInterpreter===null||s.track[r-1].event[n-1].data===!1)return console.log("Unknown EVENT detected... reading cancelled!"),!1}}return s},customInterpreter:null};if(typeof A<"u")A.exports=i;else{let e=typeof window=="object"&&window.self===window&&window||typeof self=="object"&&self.self===self&&self||typeof global=="object"&&global.global===global&&global;e.MidiParser=i}})()});var M=class{#e={};addEventListener(t,a){this.#e[t]||(this.#e[t]=[]),this.#e[t].unshift(a)}removeEventListener(t,a){if(this.#e[t]){let i=this.#e[t].indexOf(a);i>-1&&this.#e[t].splice(i,1),this.#e[t].length<1&&delete this.#e[t]}}dispatchEvent(t,a){let i=new Event(t),e=this;i.data=a,this.#e[t]?.length>0&&this.#e[t].forEach(function(c){try{c?.call(e,i)}catch(s){console.error(s)}}),this[`on${t}`]&&this[`on${t}`](i)}};var N=class{#e={};context;set(t,a){this.#e[t]=a}has(t){return!!this.#e[t]}async read(t,a){if(!this.has(t))throw new Error(`No decoder registered for "${t}"`);return await this.#e[t].call(this.context||this,a)}};var ee=function(t,a){let i=!0;return a.forEach((e,c)=>{i=i&&t[c]==e}),i},T=function(t){let a=0;return t.forEach(i=>{a*=256,a+=i}),a},$=new TextDecoder,R=new N;R.set("s7e",async function(t){let a=new Uint8Array(await t.slice(0,65536).arrayBuffer()),i="MSB	LSB	PRG	NME",e=[0,0,0,0],c=32,s=0,o=0,h=!0,b=[],u=0;for(;h;){let f=a.subarray(s);([()=>{$.decode(f.subarray(0,4))=="YSFC"?(s+=80,o=1):s++},()=>{if(ee(f.subarray(0,4),e))b.forEach((r,n,d)=>{let l=T(a.subarray(r.start+4,r.start+8));r.length=l}),o=2;else{let r=$.decode(f.subarray(0,4)),n=T(f.subarray(4,8));b.push({type:r,start:n}),s+=8}},()=>{let r=b[u],n=a.subarray(r.start,r.start+r.length),d=32;switch(r.type){case"ENVC":{let l=c;for(;l<n.length;){let g=n.subarray(l,l+d),p=$.decode(g.subarray(0,10)).trimEnd();p.slice(0,5)=="Init "&&(p=""),p&&(i+=`
063	${(g[17]+13).toString().padStart(3,"0")}	${g[19].toString().padStart(3,"0")}	${p}`),l+=d}break}case"EDVC":{let l=c;for(;l<n.length;){let g=n.subarray(l,l+d),p=$.decode(g.subarray(0,10)).trimEnd();p.slice(0,5)=="Init "&&(p=""),p&&(i+=`
063	024	${g[19].toString().padStart(3,"0")}	${p}`),l+=d}break}case"EPVC":{let l=32,g=c;for(;g<n.length;){let p=n.subarray(g,g+l),E=$.decode(p.subarray(0,10)).trimEnd();E=="----------"&&(E=""),E&&(i+=`
063	${(p[17]+1).toString().padStart(3,"0")}	${p[19].toString().padStart(3,"0")}	${E}`),g+=l}break}}u++,u>=b.length&&(o=3,h=!1)}][o]||(()=>{h=!1}))()}return i});R.set("pcg",async function(t){let a=new Uint8Array(await t.arrayBuffer()),i="MSB	LSB	PRG	NME",e=100,c=0,s=0,o=!0,h=[],b=0;for(;o;){let u=a.subarray(e);([()=>{o=$.decode(u.subarray(0,4))=="INI2",s=u[15],e+=16,c=1},()=>{let f=$.decode(u.subarray(0,4)),r=u[5],n=u[7],d=u[11],l=T(u.subarray(12,16)),g=T(u.subarray(16,20)),p=T(u.subarray(36,40)),E=$.decode(u.subarray(44,44+d));h.push({type:f,tipMsb:r,tipLsb:n,nameLen:d,length:l,start:g,entryLen:p,name:E}),e+=64,s--,s<1&&(c=2)},()=>{let f=h[b],r=a.subarray(f.start,f.start+f.length);switch(f.type){case"PRG1":break;case"PBK1":{let n=63,d=(f.tipMsb?6:0)+f.tipLsb;for(let l=0;l<128;l++){let g=l*f.entryLen,p=r.subarray(g,g+f.entryLen),E=$.decode(p.subarray(0,24)).trimEnd().replace("InitProg","");E.length&&d>5&&(i+=`
${n.toString().padStart(3,"0")}	${d.toString().padStart(3,"0")}	${l.toString().padStart(3,"0")}	${E}`)}break}case"CBK1":{let n=63,d=(f.tipMsb?3:0)+f.tipLsb+10;for(let l=0;l<128;l++){let g=l*f.entryLen,p=r.subarray(g,g+f.entryLen),E=$.decode(p.subarray(0,24)).trimEnd().replace("InitCombi","");E.length&&d>12&&(i+=`
${n.toString().padStart(3,"0")}	${d.toString().padStart(3,"0")}	${l.toString().padStart(3,"0")}	${E}`)}break}}b++,b>=h.length&&(c=3,o=!1)}][c]||(()=>{o=!1}))()}return i});var te=["off","hall","room","stage","plate","delay LCR","delay LR","echo","cross delay","early reflections","gate reverb","reverse gate"].concat(new Array(4),["white room","tunnel","canyon","basement","karaoke"],new Array(43),["pass through","chorus","celeste","flanger","symphonic","rotary speaker","tremelo","auto pan","phaser","distortion","overdrive","amplifier","3-band EQ","2-band EQ","auto wah"],new Array(1),["pitch change","harmonic","touch wah","compressor","noise gate","voice channel","2-way rotary speaker","ensemble detune","ambience"],new Array(4),["talking mod","Lo-Fi","dist + delay","comp + dist + delay","wah + dist + delay","V dist","dual rotor speaker"]);var ae=",a,i,u,e,o,ka,ki,ku,ke,ko,ky,kw,sa,si,su,se,so,sh,ta,ti,tu,te,to,t,ch,t,s,na,ni,nu,ne,no,ny,nn,ha,hi,hu,he,ho,hy,fa,fi,fu,fe,fo,ma,mi,mu,me,mo,my,mm,ya,yu,ye,yo,ra,ri,ru,re,ro,ry,wa,wi,we,wo,ga,gi,gu,ge,go,gy,gw,za,zi,zu,ze,zo,ja,ji,ju,je,jo,jy,da,di,du,de,do,dy,ba,bi,bu,be,bo,by,va,vi,vu,ve,vo,pa,pi,pu,pe,po,py,nga,ngi,ngu,nge,ngo,ngy,ng,hha,hhi,hhu,hhe,hho,hhy,hhw,*,_,,,~,.".split(","),re={};`hi*,
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
mm,
ra,ら
ri,り
ru,る
re,れ
ro,ろ
ry,り!
wa,わ
wi,うぃ
we,うぇ
wo,を
nga,ガ
ngi,ギ
ngu,グ
nge,ゲ
ngo,ゴ
ngy,ギ!
ng,
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
ye,いぇ
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
`).forEach(t=>{let a=t.split(",");re[a[0]]=a[1]});var H=function(t,a,i){let e=[],c=i==!1?a.readIntVLV():i;t==0||t==127;for(let s=0;s<c;s++){let o=a.readInt(1);if(e.push(o),o!=247){if(o!=240){if(o>127)return console.debug(`Early termination: ${e}`),e.pop(),a.backOne(),a.backOne(),new Uint8Array(e)}}}return new Uint8Array(e)};var se=["?","gm","gs","sc","xg","g2","mt32","doc","qy10","qy20","ns5r","x5d","05rw","k11","sg","sd","krs","s90es","motif","trin"];var ie=["melodic","drum","menu"];var D=[20,21,22,23,24,25,26,28,29,30,31,36,37,48,49,52,53,64,65];var P=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101,128,12,13,16,17,18,19,14,15,20,21,26,28,80,81,83,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157];var ne={};se.forEach((t,a)=>{ne[t]=a});var S={length:P.length};P.forEach((t,a)=>{S[t]=a});var _={length:D.length};D.forEach((t,a)=>{_[t]=a});var ce={};ie.forEach((t,a)=>{ce[t]=a});var G=8,oe={port:G,ch:G<<4,cc:P.length,nn:128,pl:512,tr:256,cmt:14,rpn:6,rpnt:4,ace:8,drm:8,dpn:D.length,dnc:128,ext:3,efx:7,cvn:12,redir:32,invalidCh:255},w={bank0:128};var L=j(X(),1);var V=class{#e=!1;constructor(t,a,i,e){this.#e=t,this.start=a,this.end=i,this.data=e}get duration(){return this.ranged?this.end-this.start:0}get ranged(){return this.#e}},O=class extends V{constructor(t,a,i){super(!0,t,a,i)}},F=class extends V{constructor(t,a){super(!1,t,t,a)}},I=class extends Array{#e=-1;constructor(){super(...arguments)}resetIndex(t){this.#e=-1}fresh(){this.sort(function(t,a){return t.start==a.start?0:(+(t.start>a.start)<<1)-1}),this.forEach(function(t,a){t.index=a})}step(t,a=!1){let i=[];if(a)for(let e=0;e<this.length&&!(this[e].start>t);e++){if(this[e].end<t)continue;i.push(this[e])}else{let e=this.getRange(this.#e==-1?0:t-1,t),c=this;e.forEach(function(s){s.index>c.#e&&(i.push(s),c.#e=s.index)})}return i}getRange(t,a){t>a&&([t,a]=[a,t]);let i=[],e=-1,c=Math.ceil(Math.sqrt(this.length)),s=!0;for(let o=0;o<this.length;o+=c)this[o+c]?e<0&&this[o+c].start>=t&&(e=o):e=e<0?o:e;for(;s;)this[e]?.end<a?this[e].start>=t&&i.push(this[e]):s=!1,e++;return i}};var le=0xffffffffffff,K=function(t){let a=new I,i=this,e=t.timeDivision,c=120,s=new I,o=0,h=0;s.push(new O(0,le,[120,0])),t.track.forEach(function(r){o=0,r.event.forEach(function(n){o+=n.deltaTime,n.type==255&&n?.metaType==81&&(c=6e7/n.data,s[s.length-1]&&s.push(new O(o,0xffffffffffff,[c,0])))})}),s.fresh(),s.forEach(function(r,n,d){n>0&&(d[n-1].end=r.start)});let b=120;s.forEach(function(r,n,d){n>0&&(r.end==r.start?d.splice(d.indexOf(r),1):b==r.data[0]&&(d[n-1].end=r.end,d.splice(d.indexOf(r),1)),b=r.data[0])});let u=0,f=120;return s.forEach(function(r){let n=r.start,d=n/f/e*60+u;f=r.data[0],u=d-n/f/e*60,r.data[1]=u}),console.debug("All tempo changes: ",s),c=120,o=0,h=0,t.track.forEach(function(r,n){o=0,h=0;let d=n+1;r.event.forEach(function(l,g){o+=l.deltaTime;let p=s.step(o,!0)[0];p&&(c=p.data[0],h=p.data[1]);let E={type:l.type,data:l.data,track:d,part:0};l.type>14?E.meta=l.metaType:E.part=l.channel,a.push(new F(o/c/e*60+h,E))})}),a.fresh(),self.midiEvents=a,console.debug(`Parsed a type ${t.formatType} MIDI sequence.`),a};L.default.customInterpreter=H;var m=function(t,a,i){t.addEventListener(i,e=>{a.dispatchEvent(i,e.data)})},pt=class extends M{device;#e;#n={};#f=[];#a="";#c=[];#h=[];#o=new Uint8ClampedArray(128);#u=new Uint8ClampedArray(128);#s=.5;#i=120;#t=4;#l=4;#r=0;#d=0;smoothingAtk=0;smoothingDcy=0;reset(){let t=this;t.dispatchEvent("reset"),t.#e?.resetIndex(),t.device.init(),t.#a="",t.#s=.5,t.#i=120,t.#t=4,t.#l=4,t.#r=0,t.#d=0,t.dispatchEvent("tempo",t.#i),t.dispatchEvent("title",t.#a)}init(){this.reset(),this.#e=void 0}async loadFile(t){this.#e=K(L.default.parse(new Uint8Array(await t.arrayBuffer())))}async loadMap(t,a){let i=this,e=0,c=0,s=0,o,h;t.split(`
`).forEach((b,u)=>{if(!b)return;let f=b.split("	");if(u){if(!s)return;let r="",n="";f.forEach((d,l)=>{switch(l){case o:{r=d;break}case h:{n=d;break}}}),!i.#n[r]||a?(i.#n[r]=n,e++):self.debugMode&&console.debug(`Voice "${n}" (${r}) seems to be in conflict with (${i.#n[r]}).`),c++}else f.forEach((r,n)=>{switch(r){case"ID":{o=n,s++;break}case"Name":{h=n,s++;break}default:console.debug(`Unknown map field: ${r}`)}})}),console.debug(`Voice names: ${c} total, ${e} loaded.`),i?.device.forceVoiceRefresh()}async loadEfx(t,a){let i=this,e=0,c=0,s,o,h;t.split(`
`).forEach((b,u)=>{if(b)if(u){let f=0,r;b.split("	").forEach((n,d)=>{switch(d){case s:{f|=parseInt(n,16)<<8;break}case o:{f|=parseInt(n,16);break}case h:{r=n;break}}}),!i.#f[f]||a?(i.#f[f]=r,e++):self.debugMode&&console.debug(`EFX ID 0x${f.toString(16).padStart(4,"0")} (${r}) seems to be in conflict.`),c++}else b.split("	").forEach((f,r)=>{switch(f){case"MSB":{s=r;break}case"LSB":{o=r;break}case"Name":{h=r;break}default:console.debug(`Unknown EFX field: ${f}`)}})}),console.debug(`EFX: ${c} total, ${e} loaded.`),i.dispatchEvent("efxreverb",i.device.getEffectType(0)),i.dispatchEvent("efxchorus",i.device.getEffectType(1)),i.dispatchEvent("efxdelay",i.device.getEffectType(2)),i.dispatchEvent("efxinsert0",i.device.getEffectType(3)),i.dispatchEvent("efxinsert1",i.device.getEffectType(4)),i.dispatchEvent("efxinsert2",i.device.getEffectType(5)),i.dispatchEvent("efxinsert3",i.device.getEffectType(6))}switchMode(t,a=!1){this.device.switchMode(t,a)}getMode(){return this.device.getMode()}getVoice(){return this.device.getVoice(...arguments)}getChVoice(t){return this.device.getChVoice(t)}getMapped(t){return this.#n[t]||t}getEfx([t,a]){let i=t<<8|a;return this.#f[i]||`0x${i.toString(16).padStart(4,"0")}`}getVoxBm(t){if(!t)throw new Error("Voice object must be valid");let a=this;if(!a.voxBm)throw new Error("Voice bitmap repository isn't yet initialized");let i=a.voxBm.getBm(t.name);if(!i)switch(t.mode){case"xg":{switch(t.sid[0]){case 0:case 80:case 81:case 83:case 84:case 96:case 97:case 99:case 100:{i=a.voxBm.getBm(a.getVoice(w.bank0,t.sid[1],w.bank0,t.mode).name);break}}break}case"g2":case"sd":{switch(t.sid[0]){case 96:case 97:case 98:case 99:{i=a.voxBm.getBm(a.getVoice(w.bank0,t.sid[1],w.bank0,t.mode).name);break}case 104:case 105:case 106:case 107:{i=a.voxBm.getBm(a.getVoice(120,t.sid[1],w.bank0,t.mode).name);break}}break}case"gs":case"sc":case"k11":case"sg":case"gm":{switch(t.sid[0]){case 120:break;case 122:case 127:{i=a.voxBm.getBm(a.getVoice(120,t.sid[1],0,t.mode).name);break}default:i=a.voxBm.getBm(a.getVoice(0,t.sid[1],0,t.mode).name)}break}default:switch(t.sid[0]){case 56:{i=a.voxBm.getBm(a.getVoice(0,t.sid[1],0,t.mode).name);break}}}return i||(i=a.voxBm.getBm(a.getVoice(t.sid[0],t.sid[1],0,t.mode).name)),i}getChBm(t,a){let i=this;return a=a||i.getChVoice(t),i.getVoxBm(a)}get noteProgress(){return this.#d/this.#s}get noteOverall(){return this.noteProgress-this.#r}get noteBar(){return Math.floor(this.noteOverall/this.#t)}get noteBeat(){let t=this.noteOverall%this.#t;return t<0&&(t+=this.#t),t}getTimeSig(){return[this.#t,this.#l]}getTempo(){return this.#i}sendCmd(t){this.device.runJson(t)}render(t){t>this.#d&&(this.#d=t);let a=this.#e?.step(t)||[],i=0,e=new Set,c={},s=[],o=this,h=[];for(o.device.getStrength().forEach((v,y)=>{o.#u[y]=v}),o.device.newStrength(),a.forEach(function(v){let y=v.data,k=o.device.runJson(y);switch(k?.reply){case"meta":{h.push(k);break}}k?.reply&&delete k.reply});o.#h.length>0;){let v=o.#h.shift(),y=v.part<<7|v.note;v.state?(e.add(y),c[y]=v.velo):e.has(y)&&(s.push({part:v.part,note:v.note,velo:c[y],state:o.device.NOTE_SUSTAIN}),i++)}h?.length>0&&o.dispatchEvent("meta",h);let b=o.device.getActive(),u=[],f=o.device.getPitch(),r=o.device.getCcAll(),n=o.device.getProgram(),d=o.device.getChType(),l=[],g=o.device.getStrength();g.forEach(function(v,y,k){k[y]=Math.max(o.#u[y],v);let x=k[y]-o.#o[y],U=S.length*y;if(x>=0){let C=4*.25**(r[U+S[73]]/64);o.#o[y]+=Math.ceil(x-x*o.smoothingAtk**C)}else{let C=4*.25**(r[U+S[72]]/64);o.#o[y]+=Math.floor(x-x*o.smoothingDcy**C)}});let p=0;return b.forEach(function(v,y){v&&(u[y]=o.device.getVel(y),l[y]=o.device.getExt(y),p+=u[y].size)}),{extraPoly:i,extraNotes:s,curPoly:p,chInUse:b,chKeyPr:u,chPitch:f,chProgr:n,chContr:r,chType:d,chExt:l,eventCount:a.length,title:o.#a,bitmap:o.device.getBitmap(),letter:o.device.getLetter(),texts:o.device.getTexts(),master:o.device.getMaster(),mode:o.device.getMode(),strength:o.#o.slice(),velo:g,rpn:o.device.getRpn(),tSig:o.getTimeSig(),tempo:o.getTempo(),noteBar:o.noteBar,noteBeat:o.noteBeat,ace:o.device.getAce(),rawVelo:o.device.getStrength(),rawStrength:o.device.getRawStrength(),rawPitch:o.device.getRawPitch(),efxSink:o.device.getEffectSink()}}constructor(t,a=.5,i=.5){super();let e=this;e.smoothingAtk=a,e.smoothingDcy=i,e.device=t,e.addEventListener("meta",function(c){c?.data?.forEach(function(s){(e.#c[s.meta]||console.debug).call(e,s.meta,s.data)})}),m(e.device,e,"mode"),m(e.device,e,"mastervolume"),m(e.device,e,"channelactive"),m(e.device,e,"channelmin"),m(e.device,e,"channelmax"),m(e.device,e,"portrange"),m(e.device,e,"portstart"),m(e.device,e,"channelreset"),m(e.device,e,"channeltoggle"),m(e.device,e,"screen"),m(e.device,e,"metacommit"),m(e.device,e,"voice"),m(e.device,e,"pitch"),m(e.device,e,"note"),m(e.device,e,"reset"),m(e.device,e,"banklevel"),m(e.device,e,"efxreverb"),m(e.device,e,"efxchorus"),m(e.device,e,"efxdelay"),m(e.device,e,"efxinsert0"),m(e.device,e,"efxinsert1"),m(e.device,e,"efxinsert2"),m(e.device,e,"efxinsert3"),m(e.device,e,"partefxtoggle"),e.addEventListener("note",function({data:c}){e.#h.push(c)}),e.#c[3]=function(c,s){e.#a?.length<1&&(e.#a=s,e.dispatchEvent("title",e.#a))},e.#c[81]=function(c,s){let o=e.noteProgress,h=e.#s||.5;e.#i=6e7/s,e.#s=s/1e6,e.#r+=o*(h/e.#s)-o,e.dispatchEvent("tempo",e.#i)},e.#c[88]=function(c,s){let o=e.noteProgress,h=e.noteOverall,b=e.noteBar,u=e.noteBeat,f=e.#t,r=e.#l;e.#t=s[0],e.#l=1<<s[1];let n=24*(32/s[3])/s[2];if(f!=e.#t){let d=b;e.#r-=d*(e.#t-f),u+1>=f&&(f<e.#t?e.#r-=Math.ceil(e.#t-u-1):e.#r+=e.#t)}e.dispatchEvent("tsig",e.getTimeSig())}}};export{pt as RootDisplay,oe as allocated,S as ccToPos,_ as dnToPos};
