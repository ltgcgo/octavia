var L=Object.create;var R=Object.defineProperty;var N=Object.getOwnPropertyDescriptor;var B=Object.getOwnPropertyNames;var G=Object.getPrototypeOf,H=Object.prototype.hasOwnProperty;var _=(a,s)=>()=>(s||a((s={exports:{}}).exports,s),s.exports);var F=(a,s,o,t)=>{if(s&&typeof s=="object"||typeof s=="function")for(let e of B(s))!H.call(a,e)&&e!==o&&R(a,e,{get:()=>s[e],enumerable:!(t=N(s,e))||t.enumerable});return a};var V=(a,s,o)=>(o=a!=null?L(G(a)):{},F(s||!a||!a.__esModule?R(o,"default",{value:a,enumerable:!0}):o,a));var D=_((Pe,x)=>{(function(){"use strict";let a={fatal:!0},s=[new TextDecoder("iso-8859-15",a),new TextDecoder("sjis",a),new TextDecoder("euc-jp",a),new TextDecoder("utf-8",a),new TextDecoder("utf-16",a),new TextDecoder("ascii")],o={debug:!1,parse:function(t,e){if(t instanceof Uint8Array)return o.Uint8(t);if(typeof t=="string")return o.Base64(t);if(t instanceof HTMLElement&&t.type==="file")return o.addListener(t,e);throw new Error("MidiParser.parse() : Invalid input provided")},addListener:function(t,e){if(!File||!FileReader)throw new Error("The File|FileReader APIs are not supported in this browser. Use instead MidiParser.Base64() or MidiParser.Uint8()");if(t===void 0||!(t instanceof HTMLElement)||t.tagName!=="INPUT"||t.type.toLowerCase()!=="file")return console.warn("MidiParser.addListener() : Provided element is not a valid FILE INPUT element"),!1;e=e||function(){},t.addEventListener("change",function(r){if(!r.target.files.length)return!1;console.log("MidiParser.addListener() : File detected in INPUT ELEMENT processing data..");let c=new FileReader;c.readAsArrayBuffer(r.target.files[0]),c.onload=function(d){e(o.Uint8(new Uint8Array(d.target.result)))}})},Base64:function(t){let e=function(d){var $="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";if(d=d.replace(/^.*?base64,/,""),d=String(d).replace(/[\t\n\f\r ]+/g,""),!/^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/.test(d))throw new TypeError("Failed to execute _atob() : The string to be decoded is not correctly encoded.");d+="==".slice(2-(3&d.length));let u,p="",i,n,l=0;for(;l<d.length;)u=$.indexOf(d.charAt(l++))<<18|$.indexOf(d.charAt(l++))<<12|(i=$.indexOf(d.charAt(l++)))<<6|(n=$.indexOf(d.charAt(l++))),p+=i===64?String.fromCharCode(u>>16&255):n===64?String.fromCharCode(u>>16&255,u>>8&255):String.fromCharCode(u>>16&255,u>>8&255,255&u);return p}(t=String(t));var r=e.length;let c=new Uint8Array(new ArrayBuffer(r));for(let d=0;d<r;d++)c[d]=e.charCodeAt(d);return o.Uint8(c)},Uint8:function(c){let e={data:null,pointer:0,movePointer:function(i){return this.pointer+=i,this.pointer},readInt:function(i){if((i=Math.min(i,this.data.byteLength-this.pointer))<1)return-1;let n=0;if(1<i)for(let l=1;l<=i-1;l++)n+=this.data.getUint8(this.pointer)*Math.pow(256,i-l),this.pointer++;return n+=this.data.getUint8(this.pointer),this.pointer++,n},readStr:function(i){let n=new Uint8Array(i),l=!1,f;n.forEach((b,h)=>{n[h]=this.readInt(1)});for(let b=0;b<s.length;b++)if(!l)try{if(f=s[b].decode(n),b==0)for(let h=0;h<f.length;h++){let g=f.charCodeAt(h);if(g>191||g>127&&g<160)throw new RangeError(`Invalid code point: ${g}`)}l=!0,console.debug(`String byte sequence in ${s[b].encoding}`)}catch(h){console.debug(`SMF string ${h}`)}return f||"String byte sequence read failed."},backOne:function(){this.pointer--},readIntVLV:function(){let i=0;if(this.pointer>=this.data.byteLength)return-1;if(this.data.getUint8(this.pointer)<128)i=this.readInt(1);else{let l=[];for(;128<=this.data.getUint8(this.pointer);)l.push(this.readInt(1)-128);var n=this.readInt(1);for(let f=1;f<=l.length;f++)i+=l[l.length-f]*Math.pow(128,f);i+=n}return i}};if(e.data=new DataView(c.buffer,c.byteOffset,c.byteLength),e.readInt(4)!==1297377380)return console.warn("Header validation failed (not MIDI standard or file corrupt.)"),!1;e.readInt(4);let r={};r.formatType=e.readInt(2),r.tracks=e.readInt(2),r.track=[];var c=e.readInt(1),d=e.readInt(1);128<=c?(r.timeDivision=[],r.timeDivision[0]=c-128,r.timeDivision[1]=d):r.timeDivision=256*c+d;for(let i=1;i<=r.tracks;i++){r.track[i-1]={event:[]};var $,u=e.readInt(4);if(u===-1)break;if(u!==1297379947)return!1;e.readInt(4);let n=0,l=!1,f,b;for(;!l&&(n++,r.track[i-1].event[n-1]={},r.track[i-1].event[n-1].deltaTime=e.readIntVLV(),(f=e.readInt(1))!==-1);)if(128<=f?b=f:(f=b,e.movePointer(-1)),f===255){r.track[i-1].event[n-1].type=255,r.track[i-1].event[n-1].metaType=e.readInt(1);var p=e.readIntVLV();switch(r.track[i-1].event[n-1].metaType){case 47:case-1:l=!0;break;case 1:case 2:case 3:case 4:case 5:case 7:case 6:r.track[i-1].event[n-1].data=e.readStr(p);break;case 33:case 89:case 81:r.track[i-1].event[n-1].data=e.readInt(p);break;case 84:r.track[i-1].event[n-1].data=[],r.track[i-1].event[n-1].data[0]=e.readInt(1),r.track[i-1].event[n-1].data[1]=e.readInt(1),r.track[i-1].event[n-1].data[2]=e.readInt(1),r.track[i-1].event[n-1].data[3]=e.readInt(1),r.track[i-1].event[n-1].data[4]=e.readInt(1);break;case 88:r.track[i-1].event[n-1].data=[],r.track[i-1].event[n-1].data[0]=e.readInt(1),r.track[i-1].event[n-1].data[1]=e.readInt(1),r.track[i-1].event[n-1].data[2]=e.readInt(1),r.track[i-1].event[n-1].data[3]=e.readInt(1);break;default:this.customInterpreter!==null&&(r.track[i-1].event[n-1].data=this.customInterpreter(r.track[i-1].event[n-1].metaType,e,p)),this.customInterpreter!==null&&r.track[i-1].event[n-1].data!==!1||(e.readInt(p),r.track[i-1].event[n-1].data=e.readInt(p),this.debug&&console.info("Unimplemented 0xFF meta event! data block readed as Integer"))}}else switch((f=f.toString(16).split(""))[1]||f.unshift("0"),r.track[i-1].event[n-1].type=parseInt(f[0],16),r.track[i-1].event[n-1].channel=parseInt(f[1],16),r.track[i-1].event[n-1].type){case 15:this.customInterpreter!==null&&(r.track[i-1].event[n-1].data=this.customInterpreter(r.track[i-1].event[n-1].type,e,!1)),this.customInterpreter!==null&&r.track[i-1].event[n-1].data!==!1||($=e.readIntVLV(),r.track[i-1].event[n-1].data=e.readInt($),this.debug&&console.info("Unimplemented 0xF exclusive events! data block readed as Integer"));break;case 10:case 11:case 14:case 8:case 9:r.track[i-1].event[n-1].data=[],r.track[i-1].event[n-1].data[0]=e.readInt(1),r.track[i-1].event[n-1].data[1]=e.readInt(1);break;case 12:case 13:r.track[i-1].event[n-1].data=e.readInt(1);break;case-1:l=!0;break;default:if(this.customInterpreter!==null&&(r.track[i-1].event[n-1].data=this.customInterpreter(r.track[i-1].event[n-1].metaType,e,!1)),this.customInterpreter===null||r.track[i-1].event[n-1].data===!1)return console.log("Unknown EVENT detected... reading cancelled!"),!1}}return r},customInterpreter:null};if(typeof x<"u")x.exports=o;else{let t=typeof window=="object"&&window.self===window&&window||typeof self=="object"&&self.self===self&&self||typeof global=="object"&&global.global===global&&global;t.MidiParser=o}})()});var E=class{#e={};addEventListener(a,s){this.#e[a]||(this.#e[a]=[]),this.#e[a].unshift(s)}removeEventListener(a,s){if(this.#e[a]){let o=this.#e[a].indexOf(s);o>-1&&this.#e[a].splice(o,1),this.#e[a].length<1&&delete this.#e[a]}}dispatchEvent(a,s){let o=new Event(a),t=this;o.data=s,this.#e[a]?.length>0&&this.#e[a].forEach(function(e){try{e?.call(t,o)}catch(r){console.error(r)}}),this[`on${a}`]&&this[`on${a}`](o)}};var X=["off","hall","room","stage","plate","delay LCR","delay LR","echo","cross delay","early reflections","gate reverb","reverse gate"].concat(new Array(4),["white room","tunnel","canyon","basement","karaoke"],new Array(43),["pass through","chorus","celeste","flanger","symphonic","rotary speaker","tremelo","auto pan","phaser","distortion","overdrive","amplifier","3-band EQ","2-band EQ","auto wah"],new Array(1),["pitch change","harmonic","touch wah","compressor","noise gate","voice channel","2-way rotary speaker","ensemble detune","ambience"],new Array(4),["talking mod","Lo-Fi","dist + delay","comp + dist + delay","wah + dist + delay","V dist","dual rotor speaker"]);var K=",a,i,u,e,o,ka,ki,ku,ke,ko,ky,kw,sa,si,su,se,so,sh,ta,ti,tu,te,to,t,ch,t,s,na,ni,nu,ne,no,ny,nn,ha,hi,hu,he,ho,hy,fa,fi,fu,fe,fo,ma,mi,mu,me,mo,my,mm,ya,yu,ye,yo,ra,ri,ru,re,ro,ry,wa,wi,we,wo,ga,gi,gu,ge,go,gy,gw,za,zi,zu,ze,zo,ja,ji,ju,je,jo,jy,da,di,du,de,do,dy,ba,bi,bu,be,bo,by,va,vi,vu,ve,vo,pa,pi,pu,pe,po,py,nga,ngi,ngu,nge,ngo,ngy,ng,hha,hhi,hhu,hhe,hho,hhy,hhw,*,_,,,~,.".split(","),z={};`hi*,
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
`).forEach(a=>{let s=a.split(",");z[s[0]]=s[1]});var O=function(a,s,o){let t=[],e=o==!1?s.readIntVLV():o;a==0||a==127;for(let r=0;r<e;r++){let c=s.readInt(1);if(t.push(c),c!=247){if(c!=240){if(c>127)return console.debug(`Early termination: ${t}`),t.pop(),s.backOne(),s.backOne(),new Uint8Array(t)}}}return new Uint8Array(t)};var q=["?","gm","gs","xg","g2","mt32","ns5r","ag10","x5d","05rw","krs","k11","sg"];var k=[20,21,22,23,24,25,26,28,29,30,31,36,37,64,65],v=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101,128,12,13,16,17,18,19];var Q={};q.forEach((a,s)=>{Q[a]=s});var m={length:v.length};v.forEach((a,s)=>{m[a]=s});var A={length:k.length};k.forEach((a,s)=>{A[a]=s});var Ie={ch:128,cc:v.length,nn:128,pl:512,tr:256,cmt:14,rpn:6,ace:8,drm:8,dpn:k.length,dnc:128,efx:7};var C=V(D(),1);var I=class{#e=!1;constructor(a,s,o,t){this.#e=a,this.start=s,this.end=o,this.data=t}get duration(){return this.ranged?this.end-this.start:0}get ranged(){return this.#e}},S=class extends I{constructor(a,s,o){super(!0,a,s,o)}},U=class extends I{constructor(a,s){super(!1,a,a,s)}},T=class extends Array{#e=-1;constructor(){super(...arguments)}resetIndex(a){this.#e=-1}fresh(){this.sort(function(a,s){return a.start==s.start?0:(+(a.start>s.start)<<1)-1}),this.forEach(function(a,s){a.index=s})}step(a,s=!1){let o=[];if(s)for(let t=0;t<this.length&&!(this[t].start>a);t++){if(this[t].end<a)continue;o.push(this[t])}else{let t=this.getRange(this.#e==-1?0:a-1,a),e=this;t.forEach(function(r){r.index>e.#e&&(o.push(r),e.#e=r.index)})}return o}getRange(a,s){a>s&&([a,s]=[s,a]);let o=[],t=-1,e=Math.ceil(Math.sqrt(this.length)),r=!0;for(let c=0;c<this.length;c+=e)this[c+e]?t<0&&this[c+e].start>=a&&(t=c):t=t<0?c:t;for(;r;)this[t]?.end<s?this[t].start>=a&&o.push(this[t]):r=!1,t++;return o}};var j=0xffffffffffff;{let a=function(s,o){let t=new FileReader;return new Promise((e,r)=>{switch(t.addEventListener("abort",()=>{r(new Error("Blob read aborted"))}),t.addEventListener("error",c=>{r(t.error||c.data||new Error("Blob read error"))}),t.addEventListener("load",()=>{e(t.result)}),o.toLowerCase()){case"arraybuffer":case"buffer":{t.readAsArrayBuffer(s);break}case"string":case"text":{t.readAsText(s);break}default:r(new Error(`Unknown target ${o}`))}})};Blob.prototype.arrayBuffer=Blob.prototype.arrayBuffer||function(){return a(this,"buffer")},Blob.prototype.text=Blob.prototype.text||function(){return a(this,"text")}}var P=function(a){let s=new T,o=this,t=a.timeDivision,e=120,r=new T,c=0,d=0;r.push(new S(0,j,[120,0])),a.track.forEach(function(i){c=0,i.event.forEach(function(n){c+=n.deltaTime,n.type==255&&n?.metaType==81&&(e=6e7/n.data,r[r.length-1]&&r.push(new S(c,0xffffffffffff,[e,0])))})}),r.fresh(),r.forEach(function(i,n,l){n>0&&(l[n-1].end=i.start)});let $=120;r.forEach(function(i,n,l){n>0&&(i.end==i.start?l.splice(l.indexOf(i),1):$==i.data[0]&&(l[n-1].end=i.end,l.splice(l.indexOf(i),1)),$=i.data[0])});let u=0,p=120;return r.forEach(function(i){let n=i.start,l=n/p/t*60+u;p=i.data[0],u=l-n/p/t*60,i.data[1]=u}),console.debug("All tempo changes: ",r),e=120,c=0,d=0,a.track.forEach(function(i,n){c=0,d=0;let l=n+1;i.event.forEach(function(f,b){c+=f.deltaTime;let h=r.step(c,!0)[0];h&&(e=h.data[0],d=h.data[1]);let g={type:f.type,data:f.data,track:l,part:0};f.type>14?g.meta=f.metaType:g.part=f.channel,s.push(new U(c/e/t*60+d,g))})}),s.fresh(),self.midiEvents=s,console.debug(`Parsed a type ${a.formatType} MIDI sequence.`),s};C.default.customInterpreter=O;var qe=class extends E{device;#e;#i="";#s=[];#n=new Uint8ClampedArray(128);#h=new Uint8ClampedArray(128);#a=.5;#l=120;#t=4;#o=4;#r=0;#c=0;smoothingAtk=0;smoothingDcy=0;reset(){this.dispatchEvent("reset"),this.#e?.resetIndex(),this.device.init(),this.#i="",this.#a=.5,this.#l=120,this.#t=4,this.#o=4,this.#r=0,this.#c=0}async loadFile(a){this.#e=P(C.default.parse(new Uint8Array(await a.arrayBuffer())))}switchMode(a,s=!1){this.device.switchMode(a,s)}getMode(){return this.device.getMode()}getVoice(){return this.device.getVoice(...arguments)}getChVoice(a){return this.device.getChVoice(a)}get noteProgress(){return this.#c/this.#a}get noteOverall(){return this.noteProgress-this.#r}get noteBar(){return Math.floor(this.noteOverall/this.#t)}get noteBeat(){let a=this.noteOverall%this.#t;return a<0&&(a+=this.#t),a}getTimeSig(){return[this.#t,this.#o]}getTempo(){return this.#l}sendCmd(a){this.device.runJson(a)}render(a){a>this.#c&&(this.#c=a);let s=this.#e?.step(a)||[],o=0,t=new Set,e=this,r=[];this.device.getStrength().forEach((b,h)=>{this.#h[h]=b}),e.device.newStrength(),s.forEach(function(b){let h=b.data;h.type==9&&(h.data[1]>0?t.add(h.part*128+h.data[0]):t.has(h.part*128+h.data[0])&&o++),b.data.type==8&&t.has(h.part*128+h.data[0])&&o++;let g=e.device.runJson(h);switch(g?.reply){case"meta":{r.push(g);break}}g?.reply&&delete g.reply}),r?.length>0&&this.dispatchEvent("meta",r);let c=this.device.getActive(),d=[],$=e.device.getPitch(),u=e.device.getCcAll(),p=e.device.getProgram(),i=e.device.getChType(),n=this.device.getStrength();n.forEach(function(b,h,g){g[h]=Math.max(e.#h[h],b);let y=g[h]-e.#n[h],M=m.length*h;if(y>=0){let w=4*.25**(u[M+m[73]]/64);e.#n[h]+=Math.ceil(y-y*e.smoothingAtk**w)}else{let w=4*.25**(u[M+m[72]]/64);e.#n[h]+=Math.floor(y-y*e.smoothingDcy**w)}});let l=0;return c.forEach(function(b,h){b&&(d[h]=e.device.getVel(h),l+=d[h].size)}),{extraPoly:o,curPoly:l,chInUse:c,chKeyPr:d,chPitch:$,chProgr:p,chContr:u,chType:i,eventCount:s.length,title:this.#i,bitmap:this.device.getBitmap(),letter:this.device.getLetter(),texts:this.device.getTexts(),master:this.device.getMaster(),mode:this.device.getMode(),strength:this.#n.slice(),velo:n,rpn:this.device.getRpn(),tSig:this.getTimeSig(),tempo:this.getTempo(),noteBar:this.noteBar,noteBeat:this.noteBeat,ace:this.device.getAce()}}constructor(a,s=.5,o=.5){super();let t=this;this.smoothingAtk=s,this.smoothingDcy=o,this.device=a,this.addEventListener("meta",function(e){e?.data?.forEach(function(r){(t.#s[r.meta]||console.debug).call(t,r.meta,r.data)})}),this.device.addEventListener("mode",function(e){t.dispatchEvent("mode",e.data)}),this.device.addEventListener("channelactive",function(e){t.dispatchEvent("channelactive",e.data)}),this.device.addEventListener("channelmin",function(e){t.dispatchEvent("channelmin",e.data)}),this.device.addEventListener("channelmax",function(e){t.dispatchEvent("channelmax",e.data)}),this.device.addEventListener("channelreset",function(e){t.dispatchEvent("channelreset")}),this.device.addEventListener("screen",function(e){t.dispatchEvent("screen",e.data)}),this.#s[3]=function(e,r){t.#i?.length<1&&(t.#i=r)},this.#s[81]=function(e,r){let c=t.noteProgress,d=t.#a||.5;t.#l=6e7/r,t.#a=r/1e6,t.#r+=c*(d/t.#a)-c},this.#s[88]=function(e,r){let c=t.noteProgress,d=t.noteOverall,$=t.noteBar,u=t.noteBeat,p=t.#t,i=t.#o;t.#t=r[0],t.#o=1<<r[1];let n=24*(32/r[3])/r[2];if(p!=t.#t){let l=$;t.#r-=l*(t.#t-p),u+1>=p&&(p<t.#t?t.#r-=Math.ceil(t.#t-u-1):t.#r+=t.#t)}}}};export{qe as RootDisplay,m as ccToPos,A as dnToPos};
