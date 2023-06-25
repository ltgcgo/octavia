var G=Object.create;var O=Object.defineProperty;var _=Object.getOwnPropertyDescriptor;var F=Object.getOwnPropertyNames;var V=Object.getPrototypeOf,X=Object.prototype.hasOwnProperty;var z=(e,i)=>()=>(i||e((i={exports:{}}).exports,i),i.exports);var K=(e,i,o,r)=>{if(i&&typeof i=="object"||typeof i=="function")for(let t of F(i))!X.call(e,t)&&t!==o&&O(e,t,{get:()=>i[t],enumerable:!(r=_(i,t))||r.enumerable});return e};var q=(e,i,o)=>(o=e!=null?G(V(e)):{},K(i||!e||!e.__esModule?O(o,"default",{value:e,enumerable:!0}):o,e));var N=z((ze,x)=>{(function(){"use strict";let e={fatal:!0},i=[new TextDecoder("iso-8859-15",e),new TextDecoder("sjis",e),new TextDecoder("euc-jp",e),new TextDecoder("utf-8",e),new TextDecoder("utf-16",e),new TextDecoder("ascii")],o={debug:!1,parse:function(r,t){if(r instanceof Uint8Array)return o.Uint8(r);if(typeof r=="string")return o.Base64(r);if(r instanceof HTMLElement&&r.type==="file")return o.addListener(r,t);throw new Error("MidiParser.parse() : Invalid input provided")},addListener:function(r,t){if(!File||!FileReader)throw new Error("The File|FileReader APIs are not supported in this browser. Use instead MidiParser.Base64() or MidiParser.Uint8()");if(r===void 0||!(r instanceof HTMLElement)||r.tagName!=="INPUT"||r.type.toLowerCase()!=="file")return console.warn("MidiParser.addListener() : Provided element is not a valid FILE INPUT element"),!1;t=t||function(){},r.addEventListener("change",function(a){if(!a.target.files.length)return!1;console.log("MidiParser.addListener() : File detected in INPUT ELEMENT processing data..");let l=new FileReader;l.readAsArrayBuffer(a.target.files[0]),l.onload=function(f){t(o.Uint8(new Uint8Array(f.target.result)))}})},Base64:function(r){let t=function(f){var $="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";if(f=f.replace(/^.*?base64,/,""),f=String(f).replace(/[\t\n\f\r ]+/g,""),!/^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/.test(f))throw new TypeError("Failed to execute _atob() : The string to be decoded is not correctly encoded.");f+="==".slice(2-(3&f.length));let p,b="",s,n,h=0;for(;h<f.length;)p=$.indexOf(f.charAt(h++))<<18|$.indexOf(f.charAt(h++))<<12|(s=$.indexOf(f.charAt(h++)))<<6|(n=$.indexOf(f.charAt(h++))),b+=s===64?String.fromCharCode(p>>16&255):n===64?String.fromCharCode(p>>16&255,p>>8&255):String.fromCharCode(p>>16&255,p>>8&255,255&p);return b}(r=String(r));var a=t.length;let l=new Uint8Array(new ArrayBuffer(a));for(let f=0;f<a;f++)l[f]=t.charCodeAt(f);return o.Uint8(l)},Uint8:function(l){let t={data:null,pointer:0,movePointer:function(s){return this.pointer+=s,this.pointer},readInt:function(s){if((s=Math.min(s,this.data.byteLength-this.pointer))<1)return-1;let n=0;if(1<s)for(let h=1;h<=s-1;h++)n+=this.data.getUint8(this.pointer)*Math.pow(256,s-h),this.pointer++;return n+=this.data.getUint8(this.pointer),this.pointer++,n},readStr:function(s){let n=new Uint8Array(s),h=!1,d;n.forEach((u,c)=>{n[c]=this.readInt(1)});for(let u=0;u<i.length;u++)if(!h)try{if(d=i[u].decode(n),u==0)for(let c=0;c<d.length;c++){let g=d.charCodeAt(c);if(g>191||g>127&&g<160)throw new RangeError(`Invalid code point: ${g}`)}h=!0,console.debug(`String byte sequence in ${i[u].encoding}`)}catch(c){console.debug(`SMF string ${c}`)}return d||"String byte sequence read failed."},backOne:function(){this.pointer--},readIntVLV:function(){let s=0;if(this.pointer>=this.data.byteLength)return-1;if(this.data.getUint8(this.pointer)<128)s=this.readInt(1);else{let h=[];for(;128<=this.data.getUint8(this.pointer);)h.push(this.readInt(1)-128);var n=this.readInt(1);for(let d=1;d<=h.length;d++)s+=h[h.length-d]*Math.pow(128,d);s+=n}return s}};if(t.data=new DataView(l.buffer,l.byteOffset,l.byteLength),t.readInt(4)!==1297377380)return console.warn("Header validation failed (not MIDI standard or file corrupt.)"),!1;t.readInt(4);let a={};a.formatType=t.readInt(2),a.tracks=t.readInt(2),a.track=[];var l=t.readInt(1),f=t.readInt(1);128<=l?(a.timeDivision=[],a.timeDivision[0]=l-128,a.timeDivision[1]=f):a.timeDivision=256*l+f;for(let s=1;s<=a.tracks;s++){a.track[s-1]={event:[]};var $,p=t.readInt(4);if(p===-1)break;if(p!==1297379947)return!1;t.readInt(4);let n=0,h=!1,d,u;for(;!h&&(n++,a.track[s-1].event[n-1]={},a.track[s-1].event[n-1].deltaTime=t.readIntVLV(),(d=t.readInt(1))!==-1);)if(128<=d?u=d:(d=u,t.movePointer(-1)),d===255){a.track[s-1].event[n-1].type=255,a.track[s-1].event[n-1].metaType=t.readInt(1);var b=t.readIntVLV();switch(a.track[s-1].event[n-1].metaType){case 47:case-1:h=!0;break;case 1:case 2:case 3:case 4:case 5:case 7:case 6:a.track[s-1].event[n-1].data=t.readStr(b);break;case 33:case 89:case 81:a.track[s-1].event[n-1].data=t.readInt(b);break;case 84:a.track[s-1].event[n-1].data=[],a.track[s-1].event[n-1].data[0]=t.readInt(1),a.track[s-1].event[n-1].data[1]=t.readInt(1),a.track[s-1].event[n-1].data[2]=t.readInt(1),a.track[s-1].event[n-1].data[3]=t.readInt(1),a.track[s-1].event[n-1].data[4]=t.readInt(1);break;case 88:a.track[s-1].event[n-1].data=[],a.track[s-1].event[n-1].data[0]=t.readInt(1),a.track[s-1].event[n-1].data[1]=t.readInt(1),a.track[s-1].event[n-1].data[2]=t.readInt(1),a.track[s-1].event[n-1].data[3]=t.readInt(1);break;default:this.customInterpreter!==null&&(a.track[s-1].event[n-1].data=this.customInterpreter(a.track[s-1].event[n-1].metaType,t,b)),this.customInterpreter!==null&&a.track[s-1].event[n-1].data!==!1||(t.readInt(b),a.track[s-1].event[n-1].data=t.readInt(b),this.debug&&console.info("Unimplemented 0xFF meta event! data block readed as Integer"))}}else switch((d=d.toString(16).split(""))[1]||d.unshift("0"),a.track[s-1].event[n-1].type=parseInt(d[0],16),a.track[s-1].event[n-1].channel=parseInt(d[1],16),a.track[s-1].event[n-1].type){case 15:this.customInterpreter!==null&&(a.track[s-1].event[n-1].data=this.customInterpreter(a.track[s-1].event[n-1].type,t,!1)),this.customInterpreter!==null&&a.track[s-1].event[n-1].data!==!1||($=t.readIntVLV(),a.track[s-1].event[n-1].data=t.readInt($),this.debug&&console.info("Unimplemented 0xF exclusive events! data block readed as Integer"));break;case 10:case 11:case 14:case 8:case 9:a.track[s-1].event[n-1].data=[],a.track[s-1].event[n-1].data[0]=t.readInt(1),a.track[s-1].event[n-1].data[1]=t.readInt(1);break;case 12:case 13:a.track[s-1].event[n-1].data=t.readInt(1);break;case-1:h=!0;break;default:if(this.customInterpreter!==null&&(a.track[s-1].event[n-1].data=this.customInterpreter(a.track[s-1].event[n-1].metaType,t,!1)),this.customInterpreter===null||a.track[s-1].event[n-1].data===!1)return console.log("Unknown EVENT detected... reading cancelled!"),!1}}return a},customInterpreter:null};if(typeof x<"u")x.exports=o;else{let r=typeof window=="object"&&window.self===window&&window||typeof self=="object"&&self.self===self&&self||typeof global=="object"&&global.global===global&&global;r.MidiParser=o}})()});var k=class{#e={};addEventListener(e,i){this.#e[e]||(this.#e[e]=[]),this.#e[e].unshift(i)}removeEventListener(e,i){if(this.#e[e]){let o=this.#e[e].indexOf(i);o>-1&&this.#e[e].splice(o,1),this.#e[e].length<1&&delete this.#e[e]}}dispatchEvent(e,i){let o=new Event(e),r=this;o.data=i,this.#e[e]?.length>0&&this.#e[e].forEach(function(t){try{t?.call(r,o)}catch(a){console.error(a)}}),this[`on${e}`]&&this[`on${e}`](o)}};var D=class{#e={};context;set(e,i){this.#e[e]=i}has(e){return!!this.#e[e]}async read(e,i){if(!this.has(e))throw new Error(`No decoder registered for "${e}"`);return await this.#e[e].call(this.context||this,i)}};var Q=function(e,i){let o=!0;return i.forEach((r,t)=>{o=o&&e[t]==r}),o},P=function(e){let i=0;return e.forEach(o=>{i*=256,i+=o}),i},m=new TextDecoder,I=new D;I.set("s7e",async function(e){let i=new Uint8Array(await e.slice(0,65536).arrayBuffer()),o="MSB	LSB	PRG	NME",r=[0,0,0,0],t=32,a=0,l=0,f=!0,$=[],p=0;for(;f;){let b=i.subarray(a);([()=>{m.decode(b.subarray(0,4))=="YSFC"?(a+=80,l=1):a++},()=>{if(Q(b.subarray(0,4),r))$.forEach((s,n,h)=>{let d=P(i.subarray(s.start+4,s.start+8));s.length=d}),l=2;else{let s=m.decode(b.subarray(0,4)),n=P(b.subarray(4,8));$.push({type:s,start:n}),a+=8}},()=>{let s=$[p],n=i.subarray(s.start,s.start+s.length),h=32;switch(s.type){case"ENVC":{let d=t;for(;d<n.length;){let u=n.subarray(d,d+h),c=m.decode(u.subarray(0,10)).trimEnd();c.slice(0,5)=="Init "&&(c=""),c&&(o+=`
063	${(u[17]+13).toString().padStart(3,"0")}	${u[19].toString().padStart(3,"0")}	${c}`),d+=h}break}case"EDVC":{let d=t;for(;d<n.length;){let u=n.subarray(d,d+h),c=m.decode(u.subarray(0,10)).trimEnd();c.slice(0,5)=="Init "&&(c=""),c&&(o+=`
063	024	${u[19].toString().padStart(3,"0")}	${c}`),d+=h}break}case"EPVC":{let d=32,u=t;for(;u<n.length;){let c=n.subarray(u,u+d),g=m.decode(c.subarray(0,10)).trimEnd();g=="----------"&&(g=""),g&&(o+=`
063	${(c[17]+1).toString().padStart(3,"0")}	${c[19].toString().padStart(3,"0")}	${g}`),u+=d}break}}p++,p>=$.length&&(l=3,f=!1)}][l]||(()=>{f=!1}))()}return o});var j=["off","hall","room","stage","plate","delay LCR","delay LR","echo","cross delay","early reflections","gate reverb","reverse gate"].concat(new Array(4),["white room","tunnel","canyon","basement","karaoke"],new Array(43),["pass through","chorus","celeste","flanger","symphonic","rotary speaker","tremelo","auto pan","phaser","distortion","overdrive","amplifier","3-band EQ","2-band EQ","auto wah"],new Array(1),["pitch change","harmonic","touch wah","compressor","noise gate","voice channel","2-way rotary speaker","ensemble detune","ambience"],new Array(4),["talking mod","Lo-Fi","dist + delay","comp + dist + delay","wah + dist + delay","V dist","dual rotor speaker"]);var Y=",a,i,u,e,o,ka,ki,ku,ke,ko,ky,kw,sa,si,su,se,so,sh,ta,ti,tu,te,to,t,ch,t,s,na,ni,nu,ne,no,ny,nn,ha,hi,hu,he,ho,hy,fa,fi,fu,fe,fo,ma,mi,mu,me,mo,my,mm,ya,yu,ye,yo,ra,ri,ru,re,ro,ry,wa,wi,we,wo,ga,gi,gu,ge,go,gy,gw,za,zi,zu,ze,zo,ja,ji,ju,je,jo,jy,da,di,du,de,do,dy,ba,bi,bu,be,bo,by,va,vi,vu,ve,vo,pa,pi,pu,pe,po,py,nga,ngi,ngu,nge,ngo,ngy,ng,hha,hhi,hhu,hhe,hho,hhy,hhw,*,_,,,~,.".split(","),W={};`hi*,
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
`).forEach(e=>{let i=e.split(",");W[i[0]]=i[1]});var U=function(e,i,o){let r=[],t=o==!1?i.readIntVLV():o;e==0||e==127;for(let a=0;a<t;a++){let l=i.readInt(1);if(r.push(l),l!=247){if(l!=240){if(l>127)return console.debug(`Early termination: ${r}`),r.pop(),i.backOne(),i.backOne(),new Uint8Array(r)}}}return new Uint8Array(r)};var Z=["?","gm","gs","xg","g2","mt32","ns5r","ag10","x5d","05rw","k11","sg","krs","s90es","motif"];var v=[20,21,22,23,24,25,26,28,29,30,31,36,37,64,65],S=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101,128,12,13,16,17,18,19];var J={};Z.forEach((e,i)=>{J[e]=i});var w={length:S.length};S.forEach((e,i)=>{w[e]=i});var A={length:v.length};v.forEach((e,i)=>{A[e]=i});var Ve={ch:128,cc:S.length,nn:128,pl:512,tr:256,cmt:14,rpn:6,ace:8,drm:8,dpn:v.length,dnc:128,efx:7};var M=q(N(),1);var L=class{#e=!1;constructor(e,i,o,r){this.#e=e,this.start=i,this.end=o,this.data=r}get duration(){return this.ranged?this.end-this.start:0}get ranged(){return this.#e}},C=class extends L{constructor(e,i,o){super(!0,e,i,o)}},B=class extends L{constructor(e,i){super(!1,e,e,i)}},T=class extends Array{#e=-1;constructor(){super(...arguments)}resetIndex(e){this.#e=-1}fresh(){this.sort(function(e,i){return e.start==i.start?0:(+(e.start>i.start)<<1)-1}),this.forEach(function(e,i){e.index=i})}step(e,i=!1){let o=[];if(i)for(let r=0;r<this.length&&!(this[r].start>e);r++){if(this[r].end<e)continue;o.push(this[r])}else{let r=this.getRange(this.#e==-1?0:e-1,e),t=this;r.forEach(function(a){a.index>t.#e&&(o.push(a),t.#e=a.index)})}return o}getRange(e,i){e>i&&([e,i]=[i,e]);let o=[],r=-1,t=Math.ceil(Math.sqrt(this.length)),a=!0;for(let l=0;l<this.length;l+=t)this[l+t]?r<0&&this[l+t].start>=e&&(r=l):r=r<0?l:r;for(;a;)this[r]?.end<i?this[r].start>=e&&o.push(this[r]):a=!1,r++;return o}};var ee=0xffffffffffff,H=function(e){let i=new T,o=this,r=e.timeDivision,t=120,a=new T,l=0,f=0;a.push(new C(0,ee,[120,0])),e.track.forEach(function(s){l=0,s.event.forEach(function(n){l+=n.deltaTime,n.type==255&&n?.metaType==81&&(t=6e7/n.data,a[a.length-1]&&a.push(new C(l,0xffffffffffff,[t,0])))})}),a.fresh(),a.forEach(function(s,n,h){n>0&&(h[n-1].end=s.start)});let $=120;a.forEach(function(s,n,h){n>0&&(s.end==s.start?h.splice(h.indexOf(s),1):$==s.data[0]&&(h[n-1].end=s.end,h.splice(h.indexOf(s),1)),$=s.data[0])});let p=0,b=120;return a.forEach(function(s){let n=s.start,h=n/b/r*60+p;b=s.data[0],p=h-n/b/r*60,s.data[1]=p}),console.debug("All tempo changes: ",a),t=120,l=0,f=0,e.track.forEach(function(s,n){l=0,f=0;let h=n+1;s.event.forEach(function(d,u){l+=d.deltaTime;let c=a.step(l,!0)[0];c&&(t=c.data[0],f=c.data[1]);let g={type:d.type,data:d.data,track:h,part:0};d.type>14?g.meta=d.metaType:g.part=d.channel,i.push(new B(l/t/r*60+f,g))})}),i.fresh(),self.midiEvents=i,console.debug(`Parsed a type ${e.formatType} MIDI sequence.`),i};M.default.customInterpreter=U;var rt=class extends k{device;#e;#s="";#i=[];#n=new Uint8ClampedArray(128);#h=new Uint8ClampedArray(128);#r=.5;#l=120;#t=4;#o=4;#a=0;#c=0;smoothingAtk=0;smoothingDcy=0;reset(){this.dispatchEvent("reset"),this.#e?.resetIndex(),this.device.init(),this.#s="",this.#r=.5,this.#l=120,this.#t=4,this.#o=4,this.#a=0,this.#c=0}async loadFile(e){this.#e=H(M.default.parse(new Uint8Array(await e.arrayBuffer())))}switchMode(e,i=!1){this.device.switchMode(e,i)}getMode(){return this.device.getMode()}getVoice(){return this.device.getVoice(...arguments)}getChVoice(e){return this.device.getChVoice(e)}get noteProgress(){return this.#c/this.#r}get noteOverall(){return this.noteProgress-this.#a}get noteBar(){return Math.floor(this.noteOverall/this.#t)}get noteBeat(){let e=this.noteOverall%this.#t;return e<0&&(e+=this.#t),e}getTimeSig(){return[this.#t,this.#o]}getTempo(){return this.#l}sendCmd(e){this.device.runJson(e)}render(e){e>this.#c&&(this.#c=e);let i=this.#e?.step(e)||[],o=0,r=new Set,t=this,a=[];this.device.getStrength().forEach((u,c)=>{this.#h[c]=u}),t.device.newStrength(),i.forEach(function(u){let c=u.data;c.type==9&&(c.data[1]>0?r.add(c.part*128+c.data[0]):r.has(c.part*128+c.data[0])&&o++),u.data.type==8&&r.has(c.part*128+c.data[0])&&o++;let g=t.device.runJson(c);switch(g?.reply){case"meta":{a.push(g);break}}g?.reply&&delete g.reply}),a?.length>0&&this.dispatchEvent("meta",a);let l=this.device.getActive(),f=[],$=t.device.getPitch(),p=t.device.getCcAll(),b=t.device.getProgram(),s=t.device.getChType(),n=this.device.getStrength();n.forEach(function(u,c,g){g[c]=Math.max(t.#h[c],u);let y=g[c]-t.#n[c],R=w.length*c;if(y>=0){let E=4*.25**(p[R+w[73]]/64);t.#n[c]+=Math.ceil(y-y*t.smoothingAtk**E)}else{let E=4*.25**(p[R+w[72]]/64);t.#n[c]+=Math.floor(y-y*t.smoothingDcy**E)}});let h=0;return l.forEach(function(u,c){u&&(f[c]=t.device.getVel(c),h+=f[c].size)}),{extraPoly:o,curPoly:h,chInUse:l,chKeyPr:f,chPitch:$,chProgr:b,chContr:p,chType:s,eventCount:i.length,title:this.#s,bitmap:this.device.getBitmap(),letter:this.device.getLetter(),texts:this.device.getTexts(),master:this.device.getMaster(),mode:this.device.getMode(),strength:this.#n.slice(),velo:n,rpn:this.device.getRpn(),tSig:this.getTimeSig(),tempo:this.getTempo(),noteBar:this.noteBar,noteBeat:this.noteBeat,ace:this.device.getAce()}}constructor(e,i=.5,o=.5){super();let r=this;this.smoothingAtk=i,this.smoothingDcy=o,this.device=e,this.addEventListener("meta",function(t){t?.data?.forEach(function(a){(r.#i[a.meta]||console.debug).call(r,a.meta,a.data)})}),this.device.addEventListener("mode",function(t){r.dispatchEvent("mode",t.data)}),this.device.addEventListener("channelactive",function(t){r.dispatchEvent("channelactive",t.data)}),this.device.addEventListener("channelmin",function(t){r.dispatchEvent("channelmin",t.data)}),this.device.addEventListener("channelmax",function(t){r.dispatchEvent("channelmax",t.data)}),this.device.addEventListener("channelreset",function(t){r.dispatchEvent("channelreset")}),this.device.addEventListener("screen",function(t){r.dispatchEvent("screen",t.data)}),this.#i[3]=function(t,a){r.#s?.length<1&&(r.#s=a)},this.#i[81]=function(t,a){let l=r.noteProgress,f=r.#r||.5;r.#l=6e7/a,r.#r=a/1e6,r.#a+=l*(f/r.#r)-l},this.#i[88]=function(t,a){let l=r.noteProgress,f=r.noteOverall,$=r.noteBar,p=r.noteBeat,b=r.#t,s=r.#o;r.#t=a[0],r.#o=1<<a[1];let n=24*(32/a[3])/a[2];if(b!=r.#t){let h=$;r.#a-=h*(r.#t-b),p+1>=b&&(b<r.#t?r.#a-=Math.ceil(r.#t-p-1):r.#a+=r.#t)}}}};export{rt as RootDisplay,w as ccToPos,A as dnToPos};
