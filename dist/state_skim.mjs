var U=function(e,t){let s=Math.min(e.length,t.length),i=e.slice(0,s),r=t.slice(0,s),n=0,a=0;for(;a<s&&n==0;)n=Math.sign(i[a]-r[a]),a++;return n},m=function(e=""){this.name=e,this.pool=[],this.point=function(t,s=!1){if(this.pool.length>0){let i=this.pool.length,r=1<<Math.floor(Math.log2(i)),n=r,a=64;for(;r>=1&&a>=0;){if(a<=0)throw new Error("TTL reached.");if(n==i)n-=r;else{let c=U(t,this.pool[n]);switch(c){case 0:{a=0;break}case 1:{n+r<=i&&(n+=r);break}case-1:{n!=0&&(n-=r);break}default:console.warn(`Unexpected result ${c}.`)}}r=r>>1,a--}let o=!0;if(n>=this.pool.length)o=!1;else{let c=this;this.pool[n].forEach(function(u,f,p){o&&u!=t[f]&&(o=!1)}),!o&&U(t,this.pool[n])>0&&n++}return o||s?n:-1}else return s?0:-1},this.add=function(t,s){return t.data=s,this.pool.splice(this.point(t,!0),0,t),this},this.default=function(t){console.warn(`No match in "${this.name||"(unknown)"}" for "${t}". Default action not defined.`)},this.get=function(t){let s=this.point(t);if(s>-1)return this.pool[s].data;this.default(t)},this.run=function(t,...s){let i=this.point(t);i>-1?t.subarray?this.pool[i].data(t.subarray(this.pool[i].length),...s):this.pool[i].data(t.slice(this.pool[i].length),...s):this.default(t,...s)}};var M=class{#t={};addEventListener(e,t){this.#t[e]||(this.#t[e]=[]),this.#t[e].unshift(t)}removeEventListener(e,t){if(this.#t[e]){let s=this.#t[e].indexOf(t);s>-1&&this.#t[e].splice(s,1),this.#t[e].length<1&&delete this.#t[e]}}dispatchEvent(e,t){let s=new Event(e),i=this;s.data=t,this.#t[e]?.length>0&&this.#t[e].forEach(function(r){try{r?.call(i,s)}catch(n){console.error(n)}}),this[`on${e}`]&&this[`on${e}`](s)}};var P=class{#t={};context;set(e,t){this.#t[e]=t}has(e){return!!this.#t[e]}async read(e,t){if(!this.has(e))throw new Error(`No decoder registered for "${e}"`);return await this.#t[e].call(this.context||this,t)}};var X=function(e,t){let s=!0;return t.forEach((i,r)=>{s=s&&e[r]==i}),s},N=function(e){let t=0;return e.forEach(s=>{t*=256,t+=s}),t},S=new TextDecoder,L=new P;L.set("s7e",async function(e){let t=new Uint8Array(await e.slice(0,65536).arrayBuffer()),s="MSB	LSB	PRG	NME",i=[0,0,0,0],r=32,n=0,a=0,o=!0,c=[],u=0;for(;o;){let f=t.subarray(n);([()=>{S.decode(f.subarray(0,4))=="YSFC"?(n+=80,a=1):n++},()=>{if(X(f.subarray(0,4),i))c.forEach((p,g,d)=>{let b=N(t.subarray(p.start+4,p.start+8));p.length=b}),a=2;else{let p=S.decode(f.subarray(0,4)),g=N(f.subarray(4,8));c.push({type:p,start:g}),n+=8}},()=>{let p=c[u],g=t.subarray(p.start,p.start+p.length),d=32;switch(p.type){case"ENVC":{let b=r;for(;b<g.length;){let $=g.subarray(b,b+d),y=S.decode($.subarray(0,10)).trimEnd();y.slice(0,5)=="Init "&&(y=""),y&&(s+=`
063	${($[17]+13).toString().padStart(3,"0")}	${$[19].toString().padStart(3,"0")}	${y}`),b+=d}break}case"EDVC":{let b=r;for(;b<g.length;){let $=g.subarray(b,b+d),y=S.decode($.subarray(0,10)).trimEnd();y.slice(0,5)=="Init "&&(y=""),y&&(s+=`
063	024	${$[19].toString().padStart(3,"0")}	${y}`),b+=d}break}case"EPVC":{let b=32,$=r;for(;$<g.length;){let y=g.subarray($,$+b),C=S.decode(y.subarray(0,10)).trimEnd();C=="----------"&&(C=""),C&&(s+=`
063	${(y[17]+1).toString().padStart(3,"0")}	${y[19].toString().padStart(3,"0")}	${C}`),$+=b}break}}u++,u>=c.length&&(a=3,o=!1)}][a]||(()=>{o=!1}))()}return s});var K=["off","hall","room","stage","plate","delay LCR","delay LR","echo","cross delay","early reflections","gate reverb","reverse gate"].concat(new Array(4),["white room","tunnel","canyon","basement","karaoke"],new Array(43),["pass through","chorus","celeste","flanger","symphonic","rotary speaker","tremelo","auto pan","phaser","distortion","overdrive","amplifier","3-band EQ","2-band EQ","auto wah"],new Array(1),["pitch change","harmonic","touch wah","compressor","noise gate","voice channel","2-way rotary speaker","ensemble detune","ambience"],new Array(4),["talking mod","Lo-Fi","dist + delay","comp + dist + delay","wah + dist + delay","V dist","dual rotor speaker"]);var V=",a,i,u,e,o,ka,ki,ku,ke,ko,ky,kw,sa,si,su,se,so,sh,ta,ti,tu,te,to,t,ch,t,s,na,ni,nu,ne,no,ny,nn,ha,hi,hu,he,ho,hy,fa,fi,fu,fe,fo,ma,mi,mu,me,mo,my,mm,ya,yu,ye,yo,ra,ri,ru,re,ro,ry,wa,wi,we,wo,ga,gi,gu,ge,go,gy,gw,za,zi,zu,ze,zo,ja,ji,ju,je,jo,jy,da,di,du,de,do,dy,ba,bi,bu,be,bo,by,va,vi,vu,ve,vo,pa,pi,pu,pe,po,py,nga,ngi,ngu,nge,ngo,ngy,ng,hha,hhi,hhu,hhe,hho,hhy,hhw,*,_,,,~,.".split(","),F={};`hi*,
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
`).forEach(e=>{let t=e.split(",");F[t[0]]=t[1]});var z=["?","gm","gs","xg","g2","mt32","ns5r","x5d","05rw","sd","k11","sg","krs","s90es","motif"];var T=[20,21,22,23,24,25,26,28,29,30,31,36,37,48,49,52,53,64,65];var R=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101,128,12,13,16,17,18,19];var q={};z.forEach((e,t)=>{q[e]=t});var Q={length:R.length};R.forEach((e,t)=>{Q[e]=t});var Y={length:T.length};T.forEach((e,t)=>{Y[e]=t});var Le={ch:128,cc:R.length,nn:128,pl:512,tr:256,cmt:14,rpn:6,rpnt:4,ace:8,drm:8,dpn:T.length,dnc:128,efx:7};var W=["MSB","PRG","LSB"],O=function(e){let t=Math.floor(e/10),s=e%10;return`${t.toString(16)}${s}`},x=class{#t;strictMode=!1;get(e=0,t=0,s=0,i){let r=[e,t,s],n,a=Array.from(arguments);switch(i){case"xg":{switch(e){case 0:{s==126?a[2]=125:s==127&&(a[2]=0);break}case 16:{s==126&&(a[2]=0);break}case 32:{a[2]+=4;break}case 33:case 35:case 36:{a[2]+=5;break}case 79:case 80:case 81:case 82:case 83:case 84:a[0]+=16;case 95:case 96:case 97:case 98:case 99:case 100:{s==126&&(a[2]=0);break}case 48:case 64:case 126:case 127:{s==126&&(a[2]=0);break}}break}case"gs":{e==0&&s<5?a[2]=0:e>125&&s<5&&s!=2&&(a[2]=e,a[0]=0);break}case"g2":case"sd":{(e>>1==40||e>95&&e<100)&&(a[2]|=16);break}case"sg":{e==8&&s==0&&(a[2]=5);break}case"s90es":{s<8?a[2]+=17:s<32?a[2]+=13:a[2]=(a[2]>>3)+19;break}case"motif":{s<8?a[2]+=28:s<32?a[2]+=13:a[2]=(a[2]>>3)+19;break}}let o=" ",c="M",u=0,f=0;switch(a[0]){case 0:{a[2]==127?c="MT-a":a[2]==126?c="MT-b":a[2]==7?c="GM-k":a[2]==5?c="SG-a":a[2]==4?c="SP-l":a[2]==0||i=="gs"&&a[2]<5?c="GM-a":(c="y",u=3);break}case 8:{i=="sg"?c="GM-s":c="r:";break}case 48:{c=`yM${(a[2]>>3).toString().padStart(2,"0")}`,u=1;break}case 56:{c="GM-b";break}case 61:case 120:{c="rDrm";break}case 62:{c="kDrm";break}case 63:{if(a[2]<17){let b=a[2];c=b<10?"kP:":"kC:",c+=b%10}else a[2]<34?c=["Pre1","Pre2","Pre3","Pre4","Usr1","Usr2","DrmP","DrmU","Plg1","Plg2","Plg3","Pre1","Pre2","Pre3","Pre4","Pre5","Pre6"][a[2]-17]:c="Ds";break}case 64:{c="ySFX";break}case 67:{c="DX:S";break}case 80:case 81:case 82:case 83:{c=`Prg${"UABC"[a[0]-80]}`;break}case 88:case 89:case 90:case 91:{c=`Cmb${"UABC"[a[0]-88]}`;break}case 95:{c=`${["DR","PC"][a[2]]}-d`;break}case 96:{c=a[2]==106?"AP-a":a[2]>>4==1?"SDg":"PF",a[2]>63?f=63:a[2]>>4==1&&(f=16),u=3;break}case 97:{c=a[2]>>4==1?"SDa":"VL:",u=3,a[2]>>4==1?f=16:f=112;break}case 98:{c=a[2]>>4==1?"SDb":"SG-a",u=3,f=16;break}case 99:{c=a[2]>>4==1?"SDc":"DX",a[2]>63?f=63:a[2]>>4==1&&(f=16),u=3;break}case 100:{c="AN",a[2]>63?f=63:a[2]>>4==1&&(f=16),u=3;break}case 104:case 105:case 106:case 107:{c="SDd",f=104;break}case 121:{c=`GM-${a[2]?"":"a"}`,u=3;break}case 122:{c="lDrm";break}case 126:{c="yDrS";break}case 127:{a[2]==127?c="rDrm":c="yDrm";break}default:a[0]<48?c="r:":c="M"}c.length<4&&(c+=`${[e,s,a[0],a[2]][u]-f}`.padStart(4-c.length,"0")),i=="xg"&&(e==0?a[2]<100?c=c.replace("y0","y:"):a[2]==125&&(c="y126"):e==16&&(n=`Voice${(a[2]*128+a[1]+1).toString().padStart(3,"0")}`,o=" "));let p=[a[0],a[1],a[2]];for(;!(n?.length>=0);)n=this.#t[a[1]||0][(a[0]<<7)+a[2]],n||(this.strictMode?(n="",o="?"):this.#t[a[1]||0][a[0]<<7]?a[0]==0?(a[2]=0,o="^"):a[2]<1?(a[0]=0,o="*"):(a[2]--,o="^"):e==48?(a[0]=0,a[2]=0,o="!"):e==62?(a[1]--,o=" ",a[1]<1&&!n?.length&&(a[0]=0,o="!")):e<63?a[0]==0?(a[2]=0,o="^"):a[2]<1?(a[0]=0,o="*"):a[2]--:e==80?(n=`PrgU:${t.toString().padStart(3,"0")}`,o="!"):e==88?(n=`CmbU:${t.toString().padStart(3,"0")}`,o="!"):e==121?(n=`GM2Vox0${s}`,o="#"):e==122?(a[1]==32?a[1]==0:a[1]%=7,n=this.#t[a[1]||0][(a[0]<<7)+a[2]],n?o=" ":(n="",o="*")):a[1]==0?(n=`${e.toString().padStart(3,"0")} ${t.toString().padStart(3,"0")} ${s.toString().padStart(3,"0")}`,o="!"):a[0]==0?(a[2]=0,o="^"):a[2]>0?a[2]--:a[1]>0?(a[1]=0,o="!"):(a[0]=0,o="?"));let g=[a[0],a[1],a[2]];(i=="gs"||i=="ns5r")&&o=="^"&&(o=" "),e==127&&o=="^"&&(o=" "),o!=" "&&self.debugMode&&(n="");let d="??";switch(a[0]){case 0:{a[2]==0?d="GM":a[2]==5||a[2]==7?d="KG":a[2]<126?d="XG":a[2]==127&&(d="MT");break}case 48:{d="MU";break}case 56:{d="AG";break}case 61:case 80:case 83:case 88:case 89:case 91:{d="AI";break}case 62:case 82:case 90:{d="XD";break}case 63:{a[2]<17?d="KR":a[2]<34?d="ES":d="DS";break}case 64:case 126:{d="XG";break}case 67:case 99:{d=a[2]>>4==1?"SD":"DX";break}case 81:{d="RW";break}case 95:{d=["DR","PC"][a[2]];break}case 96:{d=a[2]==106?"AP":a[2]>>4==1?"SD":"PF";break}case 97:{d=a[2]>>4==1?"SD":"VL";break}case 98:{d=a[2]>>4==1?"SD":"SG";break}case 100:{d="AN";break}case 104:case 105:case 106:case 107:{d="SD";break}case 120:{d="GS";break}case 121:{d=a[2]?"G2":"GM";break}case 122:{d="KG";break}case 127:{d=a[2]==127?"MT":t==0?"GM":"XG";break}default:a[0]<48&&(a[0]==16&&i=="xg"?d="XG":d="GS")}return{name:n||`${O(e||0)} ${O(t||0)} ${O(s||0)}`,iid:p,eid:g,sid:r,ending:o,sect:c,standard:d}}async load(e,t,s){let i=this,r=[],n=0,a=0;e.split(`
`).forEach(function(o,c){let u=o.split("	"),f=[];c==0?u.forEach(function(p,g){r[W.indexOf(p)]=g}):u.forEach(async function(p,g){g>2?(i.#t[f[r[1]]]=i.#t[f[r[1]]]||[],(!i.#t[f[r[1]]][(f[r[0]]<<7)+f[r[2]]]?.length||t)&&(i.#t[f[r[1]]][(f[r[0]]<<7)+f[r[2]]]=u[3],n++),a++):f.push(parseInt(u[g]))})}),t||console.debug(`Map "${s||"(internal)"}": ${a} total, ${n} loaded.`)}clearRange(e){let t=e.prg!=null?e.prg.constructor==Array?e.prg:[e.prg,e.prg]:[0,127],s=e.msb!=null?e.msb.constructor==Array?e.msb:[e.msb,e.msb]:[0,127],i=e.lsb!=null?e.lsb.constructor==Array?e.lsb:[e.lsb,e.lsb]:[0,127];for(let r=s[0];r<=s[1];r++){let n=r<<7;for(let a=i[0];a<=i[1];a++){let o=n+a;for(let c=t[0];c<=t[1];c++)delete this.#t[c][o]}}}init(){this.#t=[];for(let e=0;e<128;e++)this.#t.push([""])}async loadFiles(...e){this.init();let t=this;e.forEach(async function(s,i){try{await fetch(`./data/bank/${s}.tsv`).then(function(r){return r.text()}).then(r=>{t.load(r,!1,s)})}catch{console.error(`Failed loading "${s}.tsv".`)}})}constructor(...e){this.loadFiles(...e)}};var w=["?","gm","gs","xg","g2","mt32","ns5r","ag10","x5d","05rw","krs","k11","sg"],G=[[0,0,0,0,121,0,0,56,82,81,63,0,0],[0,0,4,0,0,127,0,0,0,0,0,0,0]],v=[120,127,120,127,120,127,61,62,62,62,120,122,122],J=[0,3,81,84,88],B={8:"Off",9:"On",10:"Note aftertouch",11:"cc",12:"pc",13:"Channel aftertouch",14:"Pitch"},D={0:0,1:1,2:3,5:4},H=[[0,24],[0,127],[0,127],[40,88],[0,127],[0,127]],I=[36,37];var A=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101,12,13,16,17,18,19],Z=[33,99,100,32,102,8,9,10];var E={};w.forEach((e,t)=>{E[e]=t});var h={length:A.length};A.forEach((e,t)=>{h[e]=t});var k=function(){return!!self.Bun||self.debugMode||!1},j=function(e){let t=[],s=0;return e?.forEach(function(i,r){i==247?t.push(e.subarray(s,r)):i==240&&(s=r+1)}),t.length||t.push(e.subarray(0)),k(),t},_=function(e,t="",s="",i=2){return e?`${t}${e.toString().padStart(i,"0")}${s}`:""},l={ch:128,cc:A.length,nn:128,pl:512,tr:256,cmt:14,rpn:6},Fe=class extends M{#t=0;#w=0;#b=0;#g=new Array(11);get#h(){return this.#g[this.#w]}set#h(e){this.#g[this.#w]=e}#y=new Uint8Array(l.ch);#B=new Uint8Array(l.ch);#e=new Uint8ClampedArray(l.ch*l.cc);#$=new Uint8ClampedArray(l.ch);#o=new Uint8ClampedArray(l.ch*l.nn);#D=new Uint8Array(l.ch);#n=new Uint16Array(l.pl);#f=new Uint8Array(l.pl);#C=new Int16Array(l.ch);#d=new Uint8Array(l.ch);#x=0;#l=new Uint8Array(l.ch*l.rpn);#A=new Int8Array(l.ch*I.length);#U=new Uint8Array(l.ch);#V=new Uint8Array(128);#H=new Uint8Array(l.cmt*8);#F=new Uint8Array(1024);#I=new Uint8Array(l.cmt*64);#k=0;#u=0;#M=100;#m=0;#_=500;#z=0;#i="";#p=0;#q=0;#Q=!0;#a=!1;#X;#Y=new Uint8Array(2);#s=[];#E=new Uint8Array(l.ch);#v=new Uint8Array(l.tr);baseBank=new x("gm","gm2","xg","gs","ns5r","gmega","plg-150vl","plg-150pf","plg-150dx","plg-150an","plg-150dr","plg-100sg","kross");userBank=new x("gm");initOnReset=!1;chRedir(e,t,s){if(this.#v[t])return(this.#v[t]-1)*16+e;if([E.gs,E.ns5r].indexOf(this.#t)>-1){if(s==1)return e;let i=0,r=!0;for(;r;)this.#E[e+i]==0?(this.#E[e+i]=t,console.debug(`Assign track ${t} to channel ${e+i+1}.`),r=!1):this.#E[e+i]==t?r=!1:(i+=16,i>=128&&(i=0,r=!1));return e+i}else return e}#c=[];#T;#r={nOff:(e,t)=>{let s=e*128+t,i=this.#n.lastIndexOf(s);i>-1&&(this.#e[l.cc*e+h[64]]>63&&!this.config?.disableCc64?this.#f[i]=4:(this.#n[i]=0,this.#o[s]=0,this.#f[i]=0))},nOn:(e,t,s)=>{let i=e*128+t,r=0;for(this.#D[e]&&this.#r.ano(e);this.#f[r]>0&&this.#n[r]!=i;)r++;r<l.pl?(this.#n[r]=i,this.#o[i]=s,this.#f[r]=3,this.#d[e]<s&&(this.#d[e]=s)):console.error("Polyphony exceeded.")},nAt:(e,t,s)=>{},cAt:(e,t)=>{},hoOf:e=>{this.#f.forEach((t,s)=>{if(t==4){let i=this.#n[s],r=i>>7;e==r&&(this.#f[s]=0,this.#n[s]=0,this.#o[i]=0)}})},soOf:e=>{},ano:e=>{this.#n.forEach((t,s,i)=>{let r=t>>7,n=t&127;t==0&&this.#o[0]==0||r==e&&this.#r.nOff(r,n)})}};#K={8:function(e){let t=e.channel,s=e.data[0];this.#r.nOff(t,s)},9:function(e){let t=e.channel;this.#y[t]=1;let s=e.data[0],i=e.data[1];i>0?this.#r.nOn(t,s,i):this.#r.nOff(t,s)},10:function(e){let s=e.channel*128+e.data[0];this.#n.indexOf(s)>-1&&(this.#o[s]=data[1])},11:function(e){let t=e.channel;this.#y[t]=1;let s=t*l.cc;switch(e.data[0]){case 96:return;case 97:return;case 120:return;case 121:{this.#r.ano(t),this.#C[t]=0;let i=t*l.cc;this.#e[i+h[1]]=0,this.#e[i+h[5]]=0,this.#e[i+h[64]]=0,this.#e[i+h[65]]=0,this.#e[i+h[66]]=0,this.#e[i+h[67]]=0,this.#e[i+h[11]]=127,this.#e[i+h[101]]=127,this.#e[i+h[100]]=127,this.#e[i+h[99]]=127,this.#e[i+h[98]]=127;return}case 123:{this.#r.ano(t);return}case 124:{this.#r.ano(t);return}case 125:{this.#r.ano(t);return}case 126:{this.#D[t]=1,this.#r.ano(t);return}case 127:{this.#D[t]=0,this.#r.ano(t);return}}if(h[e.data[0]]==null)console.warn(`cc${e.data[0]} is not accepted.`);else{switch(e.data[0]){case 0:{if(k()&&console.debug(`${w[this.#t]}, CH${t+1}: ${e.data[1]}`),this.#t==0)e.data[1]<48?(this.#e[s]>119&&(e.data[1]=this.#e[s],e.data[1]=120,console.debug(`Forced channel ${t+1} to stay drums.`)),e.data[1]>0&&(console.debug(`Roland GS detected with MSB: ${e.data[1]}`),this.switchMode("gs"))):e.data[1]==62?this.switchMode("x5d"):e.data[1]==63?this.switchMode("krs"):(e.data[1]==64||e.data[1]==127)&&this.switchMode("xg");else if(this.#t==E.gs)e.data[1]<56&&this.#e[s]>119&&(e.data[1]=this.#e[s],e.data[1]=120,console.debug(`Forced channel ${t+1} to stay drums.`));else if(this.#t==E.gm)e.data[1]<48?this.#e[s]>119&&(e.data[1]=120,this.switchMode("gs",!0),console.debug(`Forced channel ${t+1} to stay drums.`)):(e.data[1]==64||e.data[1]==127)&&this.switchMode("xg",!0);else if(this.#t==E.x5d){if(e.data[1]>0&&e.data[1]<8)this.switchMode("05rw",!0);else if(e.data[1]==56){let i=0;for(let r=0;r<16;r++){let n=this.#e[l.cc*r];(n==56||n==62)&&i++}i>14&&this.switchMode("ag10",!0)}}break}case 6:{if(this.#x){let i=this.#e[s+h[99]],r=this.#e[s+h[98]];if(i==1){let n=Z.indexOf(r);if(n>-1)this.#e[s+h[71+n]]=e.data[1],k()&&console.debug(`Redirected NRPN 1 ${r} to cc${71+n}.`);else{let a=I.indexOf(r);a>-1&&(this.#A[t*10+a]=e.data[1]-64),k()&&console.debug(`CH${t+1} voice NRPN ${r} commit`)}}}else{let i=D[this.#e[s+h[100]]];this.#e[s+h[101]]==0&&i!=null&&(k()&&console.debug(`CH${t+1} RPN 0 ${this.#e[s+h[100]]} commit: ${e.data[1]}`),e.data[1]=Math.min(Math.max(e.data[1],H[i][0]),H[i][1]),this.#l[t*l.rpn+i]=e.data[1])}break}case 38:{this.#x||this.#e[s+101]==0&&D[this.#e[s+100]]!=null&&(this.#l[t*l.rpn+D[this.#e[s+100]]+1]=e.data[1]);break}case 64:{e.data[1]<64&&this.#r.hoOf(t);break}case 66:{console.debug(`Sostenuto pedal: ${e.data[1]}`);break}case 98:case 99:{this.#x=1;break}case 100:case 101:{this.#x=0;break}}this.#e[s+h[e.data[0]]]=e.data[1]}},12:function(e){let t=e.channel;this.#y[t]=1,this.#$[t]=e.data,this.#U[t]=0,k()&&console.debug(`T:${e.track} C:${t} P:${e.data}`)},13:function(e){let t=this,s=e.channel;this.#n.forEach(function(i){let r=i>>7;s==r&&(t.#o[i]=e.data)})},14:function(e){let t=e.channel;this.#C[t]=e.data[1]*128+e.data[0]-8192},15:function(e){j(e.data).forEach(t=>{let s=t[0],i=t[1];(this.#W[s]||function(){console.debug(`Unknown manufacturer ${s}.`)})(i,t.subarray(2),e.track)})},248:function(e){},250:function(e){},251:function(e){},252:function(e){},254:function(e){},255:function(e){if((this.#c[e.meta]||function(s,i,r){}).call(this,e.data,e.track,e.meta),e.meta!=32&&(this.#m=0),J.indexOf(e.meta)>-1)return e.reply="meta",e;k()&&console.debug(e)}};#W={64:(e,t,s)=>{this.#L.run(t,s,e)},65:(e,t,s)=>{if(t[0]<16)this.#S.run(t,s,e),console.warn("Unknown device SysEx!");else{let i=t[t.length-1],r=gsChecksum(t.subarray(2,t.length-1));i==r?this.#S.run(t.subarray(0,t.length-1),s,e):console.warn(`Bad GS checksum ${i}. Should be ${r}.`)}},66:(e,t,s)=>{this.#O.run(t,s,e)},67:(e,t,s)=>{this.#R.run(t,s,e)},68:(e,t,s)=>{this.#J.run(t,s,e)},71:(e,t,s)=>{this.#G.run(t,s,e)},126:(e,t,s)=>{this.#P.run(t,s,e)},127:(e,t,s)=>{this.switchMode("gm"),this.#N.run(t,s,e)}};#P;#N;#R;#S;#O;#L;#G;#J;buildRchTree(){let e=[];this.#B.forEach((t,s)=>{e[t]?.constructor||(e[t]=[]),e[t].push(s)}),this.#X=e}getActive(){let e=this.#y.slice();return this.#t==E.mt32,e}getCc(e){let t=e*l.cc,s=this.#e.slice(t,t+l.cc);return s[h[0]]=s[h[0]]||this.#k,s[h[32]]=s[h[32]]||this.#u,s}getCcAll(){let e=this.#e.slice();for(let t=0;t<l.ch;t++){let s=t*l.cc;e[s+h[0]]=e[s+h[0]]||this.#k,e[s+h[32]]=e[s+h[32]]||this.#u}return e}getPitch(){return this.#C}getProgram(){return this.#$}getTexts(){return this.#s.slice()}getVel(e){let t=new Map,s=this;return s.#n.forEach(function(i,r){let n=Math.floor(i/128),a=i%128;e==n&&s.#o[i]>0&&t.set(a,{v:s.#o[i],s:s.#f[r]})}),t}getBitmap(){return{bitmap:this.#h,expire:this.#b}}getLetter(){return{text:this.#i,expire:this.#p}}getMode(){return w[this.#t]}getMaster(){return{volume:this.#M}}getRawStrength(){let e=this;return this.#n.forEach(function(t){let s=Math.floor(t/128);e.#o[t]>e.#d[s]&&(e.#d[s]=e.#o[t])}),this.#d}getStrength(){let e=[],t=this;return this.getRawStrength().forEach(function(s,i){e[i]=Math.floor(s*t.#e[i*l.cc+h[7]]*t.#e[i*l.cc+h[11]]*t.#M/803288)}),e}getRpn(){return this.#l}getNrpn(){return this.#A}getVoice(e,t,s,i){let r=e||this.#k,n=t,a=s||this.#u;w[this.#t]=="ns5r"&&r>0&&r<56&&(a=3);let o=this.userBank.get(r,n,a,i);if(w[this.#t]=="mt32"&&o.name.indexOf("MT-m:")==0){let c=parseInt(o.name.slice(5)),u=c*l.cmt,f="";this.#I.subarray(u,u+10).forEach(p=>{p>31&&(f+=String.fromCharCode(p))}),this.userBank.load(`MSB	LSB	PRG
0	127	${n}	${f}`,!0),o.name=f,o.ending=" "}return(o.ending!=" "||!o.name.length)&&(o=this.baseBank.get(r,n,a,i)),o}getChVoice(e){let t=this.getVoice(this.#e[e*l.cc+h[0]],this.#$[e],this.#e[e*l.cc+h[32]],w[this.#t]);if(this.#U[e])switch(this.#t){case E.mt32:t.ending="~",t.name="",this.#H.subarray(14*(e-1),14*(e-1)+10).forEach(s=>{s>31&&(t.name+=String.fromCharCode(s))})}return t}init(e=0){this.dispatchEvent("mode","?"),this.#t=0,this.#k=0,this.#u=0,this.#m=0,this.#y.fill(0),this.#e.fill(0),this.#$.fill(0),this.#o.fill(0),this.#n.fill(0),this.#d.fill(0),this.#C.fill(0),this.#A.fill(0),this.#M=100,this.#s=[],this.#_=500,this.#z=0,this.#p=0,this.#i="",this.#b=0,this.#w=0,this.#h.fill(0),this.#a=!1,this.#q=0,this.#Q=!0,this.#B.forEach(function(t,s,i){i[s]=s}),this.buildRchTree(),e==0&&(this.#E.fill(0),this.#v.fill(0)),this.#e[l.cc*9]=v[0],this.#e[l.cc*25]=v[0],this.#e[l.cc*41]=v[0],this.#e[l.cc*57]=v[0],this.#Y.fill(0),this.#F.fill(0),this.#I.fill(0),this.#V.fill(0),this.#H.fill(0),this.#U.fill(0),this.userBank.clearRange({msb:0,lsb:127,prg:[0,127]});for(let t=0;t<l.ch;t++){let s=t*l.cc;this.#e[s+h[7]]=100,this.#e[s+h[11]]=127,this.#e[s+h[10]]=64,this.#e[s+h[71]]=64,this.#e[s+h[72]]=64,this.#e[s+h[73]]=64,this.#e[s+h[74]]=64,this.#e[s+h[75]]=64,this.#e[s+h[76]]=64,this.#e[s+h[77]]=64,this.#e[s+h[78]]=64,this.#e[s+h[91]]=40,this.#e[s+h[101]]=127,this.#e[s+h[100]]=127,this.#e[s+h[99]]=127,this.#e[s+h[98]]=127;let i=t*l.rpn;this.#l[i]=2,this.#l[i+1]=64,this.#l[i+2]=0,this.#l[i+3]=64,this.#l[i+4]=0,this.#l[i+5]=0}}switchMode(e,t=!1){let s=w.indexOf(e);if(s>-1){if(this.#t==0||t){this.#t=s,this.#w=0,this.#k=G[0][s],this.#u=G[1][s];for(let i=0;i<l.ch;i++)v.indexOf(this.#e[i*l.cc])>-1&&(this.#e[i*l.cc]=v[s]);switch(this.initOnReset,s){case E.mt32:{mt32DefProg.forEach((i,r)=>{let n=r+1;this.#y[n]||(this.#$[n]=i,this.#e[n*l.cc+h[91]]=127)});break}}this.dispatchEvent("mode",e)}}else throw new Error(`Unknown mode ${e}`)}newStrength(){this.#d.fill(0)}runJson(e){if(e.type>14)return e.type==15&&e.data.constructor!=Uint8Array&&(e.data=Uint8Array.from(e.data)),this.#K[e.type].call(this,e);{let t=this.chRedir(e.part,e.track),s=!1;this.#X[t]?.forEach(i=>{e.channel=i,s=!0,this.#K[e.type].call(this,e)}),s||console.warn(`${B[e.type]?B[e.type]:e.type}${[11,12].includes(e.type)?(e.data[0]!=null?e.data[0]:e.data).toString():""} event sent to CH${t+1} without any recipient.`)}this.#s.length>100&&this.#s.splice(100,this.#s.length-99)}runRaw(e){}constructor(){super();let e=this;this.#h=new Uint8Array(256),this.#g[10]=new Uint8Array(512),this.#T=new m,this.userBank.strictMode=!0,this.userBank.load(`MSB	PRG	LSB	NME
062	000	000	
122	000	000	
122	001	000	
122	002	000	
122	003	000	
122	004	000	
122	005	000	
122	006	000	`),this.#c[1]=function(t){switch(t.slice(0,2)){case"@I":{this.#a=!0,this.#s.unshift(`Kar.Info: ${t.slice(2)}`);break}case"@K":{this.#a=!0,this.#s.unshift("Karaoke mode active."),console.debug(`Karaoke mode active: ${t.slice(2)}`);break}case"@L":{this.#a=!0,this.#s.unshift(`Language: ${t.slice(2)}`);break}case"@T":{this.#a=!0,this.#s.unshift(`Ka.Title: ${t.slice(2)}`);break}case"@V":{this.#a=!0,this.#s.unshift(`Kara.Ver: ${t.slice(2)}`);break}case"XF":{let s=t.slice(2).split(":");switch(s[0]){case"hd":{s.slice(1).forEach((i,r)=>{i.length&&this.#s.unshift(`${["SongDate","SnRegion","SongCat.","SongBeat","SongInst","Sn.Vocal","SongCmp.","SongLrc.","SongArr.","SongPerf","SongPrg.","SongTags"][r]}: ${i}`)});break}case"ln":{s.slice(1).forEach((i,r)=>{i.length&&this.#s.unshift(`${["Kar.Lang","Kar.Name","Kar.Cmp.","Kar.Lrc.","kar.Arr.","Kar.Perf","Kar.Prg."][r]}: ${i}`)});break}default:this.#s.unshift(`XGF_Data: ${t}`)}break}default:this.#a?t[0]=="\\"?this.#s.unshift(`@ ${t.slice(1)}`):t[0]=="/"?this.#s.unshift(t.slice(1)):this.#s[0]+=t:(this.#s[0]=t,this.#s.unshift(""))}},this.#c[2]=function(t){this.#s.unshift(`Copyrite: ${t}`)},this.#c[3]=function(t,s){s<1&&this.#m<1&&this.#s.unshift(`TrkTitle: ${t}`)},this.#c[4]=function(t,s){this.#s.unshift(`${_(this.#m,""," ")}Instrmnt: ${t}`)},this.#c[5]=function(t){t.trim()==""?this.#s.unshift(""):this.#s[0]+=`${t}`},this.#c[6]=function(t){this.#s.unshift(`${_(this.#m,""," ")}C.Marker: ${t}`)},this.#c[7]=function(t){this.#s.unshift(`CuePoint: ${t}`)},this.#c[32]=function(t){this.#m=t[0]+1},this.#c[33]=function(t,s){console.debug(`Track ${s} requests to get assigned to output ${t}.`),e.#v[s]=t+1},this.#c[81]=function(t,s){e.#_=t/1e3},this.#c[127]=function(t,s){e.#T.run(t,s)},this.#T.default=function(t){console.warn(`Unrecognized sequencer-specific byte sequence: ${t}`)},this.#T.add([67,0,1],function(t,s){e.#v[s]=t[0]+1}),this.#P=new m,this.#N=new m,this.#R=new m,this.#S=new m,this.#O=new m,this.#L=new m,this.#G=new m,this.#P.add([9],t=>{e.switchMode(["gm","?","g2"][t[0]-1],!0),e.#a=e.#a||!1,console.info(`MIDI reset: ${["GM","Init","GM2"][t[0]-1]}`),t[0]==2&&e.init()}),this.#N.add([4,1],t=>{e.#M=((t[1]<<7)+t[0])/16383*100}).add([4,3],t=>((t[1]<<7)+t[0]-8192)/8192).add([4,4],t=>t[1]-64),this.#R.add([76,0,0],t=>{switch(t[0]){case 126:{e.switchMode("xg",!0),e.#a=!1,console.info("MIDI reset: XG");break}}}).add([76,6,0],t=>{let s=t[0];s<64?(e.#i=" ".repeat(s),e.#p=Date.now()+3200,t.subarray(1).forEach(function(i){e.#i+=String.fromCharCode(i)}),e.#i=e.#i.padEnd(32," ")):e.#p=Date.now()}).add([76,7,0],t=>{let s=t[0];e.#b=Date.now()+3200,e.#h.fill(0);let i=t.subarray(1);for(let r=0;r<s;r++)i.unshift(0);i.forEach(function(r,n){let a=Math.floor(n/16),o=n%16,c=(o*3+a)*7,u=7,f=0;for(c-=o*5,a==2&&(u=2);f<u;)e.#h[c+f]=r>>6-f&1,f++})}),this.#R.add([43,7,0],(t,s,i)=>{e.#i=" ".repeat(offset),e.#p=Date.now()+3200,t.subarray(1).forEach(function(r){e.#i+=String.fromCharCode(r)}),e.#i=e.#i.padEnd(32," ")}).add([43,7,1],(t,s,i)=>{e.#b=Date.now()+3200,e.#h.fill(0),t.forEach(function(r,n){let a=Math.floor(n/16),o=n%16,c=(o*3+a)*7,u=7,f=0;for(c-=o*5,a==2&&(u=2);f<u;)e.#h[c+f]=r>>6-f&1,f++})}),this.#S.add([66,18,0,0,127],(t,s,i)=>{e.switchMode("gs",!0),e.#e[l.cc*9]=120,e.#e[l.cc*25]=120,e.#e[l.cc*41]=120,e.#e[l.cc*57]=120,e.#u=3,e.#a=!1,e.#E.fill(0),console.info(`GS system to ${["single","dual"][t[0]]} mode.`)}).add([66,18,64,0],(t,s,i)=>{switch(t[0]){case 127:{e.switchMode("gs",!0),e.#e[l.cc*9]=120,e.#e[l.cc*25]=120,e.#e[l.cc*41]=120,e.#e[l.cc*57]=120,e.#a=!1,e.#E.fill(0),console.info("MIDI reset: GS");break}}}).add([69,18,16],t=>{switch(t[0]){case 0:{e.#p=Date.now()+3200;let s=t[1];e.#i=" ".repeat(s),t.subarray(2).forEach(function(i){i<128&&(e.#i+=String.fromCharCode(i))});break}case 32:{e.#b=Date.now()+3200,t[1]==0&&(e.#w=Math.max(Math.min(t[2]-1,9),0));break}default:if(t[0]<11){e.#b=Date.now()+3200,e.#g[t[0]-1]?.length||(e.#g[t[0]-1]=new Uint8Array(256));let s=e.#g[t[0]-1],i=t[1];s.fill(0);let r=t.subarray(2);for(let n=0;n<i;n++)r.unshift(0);r.forEach(function(n,a){let o=Math.floor(a/16),c=a%16,u=(c*4+o)*5,f=5,p=0;for(u-=c*4,o==3&&(f=1);p<f;)s[u+p]=n>>4-p&1,p++})}else console.warn(`Unknown GS display section: ${t[0]}`)}}),this.#S.add([22,18,127],t=>{e.switchMode("mt32",!0),e.#a=!1,e.userBank.clearRange({msb:0,lsb:127,prg:[0,127]}),console.info("MIDI reset: MT-32")}).add([22,18,32],t=>{e.switchMode("mt32");let s=t[1],i=" ".repeat(s);t.subarray(2).forEach(r=>{r>31&&(i+=String.fromCharCode(r))}),e.#i=i.padStart(20," "),e.#p=Date.now()+3200}).add([22,18,82],(t,s)=>{let i=e.chRedir(0,s,!0);for(let r=0;r<16;r++)e.#r.ano(i+r),r&&r<10&&(e.#$[i+r]=mt32DefProg[r-1]);console.info("MT-32 alt reset complete.")}),this.#O.add([66,0],(t,s)=>{e.switchMode("ns5r",!0),e.#a=!1,console.debug(`NS5R mode switch requested: ${["global","multi","prog edit","comb edit","drum edit","effect edit"][t[0]]} mode.`)}).add([66,1],(t,s)=>{e.switchMode(["ns5r","05rw"][t[0]],!0),e.#a=!1}).add([66,18,0,0],(t,s)=>{switch(t[0]){case 124:case 126:case 127:{e.switchMode("ns5r",!0),e.#a=!1;break}}}).add([66,18,8,0],(t,s)=>{}).add([66,125],t=>{e.dispatchEvent("backlight",["green","orange","red",!1,"yellow","blue","purple"][t[0]]||"white")}).add([66,127],t=>{let s=new Uint8Array(5760);korgFilter(t,(i,r,n)=>{if(r<720)for(let a=0;a<8;a++)s[r*8+a]=i>>7-a&1}),e.dispatchEvent("screen",{type:"ns5r",data:s})}).add([76],(t,s,i)=>{e.#O.run([66,...t],s,i)}),this.#L.add([16,0,8,0],(t,s,i)=>{let r=(t[2]<<4)+t[3],n="K11 ";([()=>{e.switchMode("k11",!0),e.#a=!1,e.#u=r?4:0,console.info("MIDI reset: GMega/K11")}][t[0]]||(()=>{}))()}),this.#G.add([66,93,64],(t,s,i)=>{let r=t[2];switch(t[0]){case 0:{switch(t[1]){case 127:{e.switchMode("sg",!0);break}}break}}})}};export{Fe as OctaviaDevice,l as allocated,h as ccToPos};
