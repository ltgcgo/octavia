var N=function(e,t){let a=Math.min(e.length,t.length),s=e.slice(0,a),r=t.slice(0,a),n=0,l=0;for(;l<a&&n==0;)n=Math.sign(s[l]-r[l]),l++;return n},w=function(e=""){this.name=e,this.pool=[],this.point=function(t,a=!1){if(this.pool.length>0){let s=this.pool.length,r=1<<Math.floor(Math.log2(s)),n=r,l=64;for(;r>=1&&l>=0;){if(l<=0)throw new Error("TTL reached.");if(n==s)n-=r;else{let p=N(t,this.pool[n]);switch(p){case 0:{l=0;break}case 1:{n+r<=s&&(n+=r);break}case-1:{n!=0&&(n-=r);break}default:console.warn(`Unexpected result ${p}.`)}}r=r>>1,l--}let u=!0;if(n>=this.pool.length)u=!1;else{let p=this;this.pool[n].forEach(function(i,h,c){u&&i!=t[h]&&(u=!1)}),!u&&N(t,this.pool[n])>0&&n++}return u||a?n:-1}else return a?0:-1},this.add=function(t,a){return t.data=a,this.pool.splice(this.point(t,!0),0,t),this},this.default=function(t){console.warn(`No match in "${this.name||"(unknown)"}" for "${t}". Default action not defined.`)},this.get=function(t){let a=this.point(t);if(a>-1)return this.pool[a].data;this.default(t)},this.run=function(t,...a){let s=this.point(t);s>-1?t.subarray?this.pool[s].data(t.subarray(this.pool[s].length),...a):this.pool[s].data(t.slice(this.pool[s].length),...a):this.default(t,...a)}};var T=class{#t={};addEventListener(e,t){this.#t[e]||(this.#t[e]=[]),this.#t[e].unshift(t)}removeEventListener(e,t){if(this.#t[e]){let a=this.#t[e].indexOf(t);a>-1&&this.#t[e].splice(a,1),this.#t[e].length<1&&delete this.#t[e]}}dispatchEvent(e,t){let a=new Event(e),s=this;a.data=t,this.#t[e]?.length>0&&this.#t[e].forEach(function(r){try{r?.call(s,a)}catch(n){console.error(n)}}),this[`on${e}`]&&this[`on${e}`](a)}};var L=class{#t={};context;set(e,t){this.#t[e]=t}has(e){return!!this.#t[e]}async read(e,t){if(!this.has(e))throw new Error(`No decoder registered for "${e}"`);return await this.#t[e].call(this.context||this,t)}};var F=function(e,t){let a=!0;return t.forEach((s,r)=>{a=a&&e[r]==s}),a},I=function(e){let t=0;return e.forEach(a=>{t*=256,t+=a}),t},x=new TextDecoder,G=new L;G.set("s7e",async function(e){let t=new Uint8Array(await e.slice(0,65536).arrayBuffer()),a="MSB	LSB	PRG	NME",s=[0,0,0,0],r=32,n=0,l=0,u=!0,p=[],i=0;for(;u;){let h=t.subarray(n);([()=>{x.decode(h.subarray(0,4))=="YSFC"?(n+=80,l=1):n++},()=>{if(F(h.subarray(0,4),s))p.forEach((c,b,g)=>{let y=I(t.subarray(c.start+4,c.start+8));c.length=y}),l=2;else{let c=x.decode(h.subarray(0,4)),b=I(h.subarray(4,8));p.push({type:c,start:b}),n+=8}},()=>{let c=p[i],b=t.subarray(c.start,c.start+c.length),g=32;switch(c.type){case"ENVC":{let y=r;for(;y<b.length;){let m=b.subarray(y,y+g),d=x.decode(m.subarray(0,10)).trimEnd();d.slice(0,5)=="Init "&&(d=""),d&&(a+=`
063	${(m[17]+13).toString().padStart(3,"0")}	${m[19].toString().padStart(3,"0")}	${d}`),y+=g}break}case"EDVC":{let y=r;for(;y<b.length;){let m=b.subarray(y,y+g),d=x.decode(m.subarray(0,10)).trimEnd();d.slice(0,5)=="Init "&&(d=""),d&&(a+=`
063	024	${m[19].toString().padStart(3,"0")}	${d}`),y+=g}break}case"EPVC":{let y=32,m=r;for(;m<b.length;){let d=b.subarray(m,m+y),$=x.decode(d.subarray(0,10)).trimEnd();$=="----------"&&($=""),$&&(a+=`
063	${(d[17]+1).toString().padStart(3,"0")}	${d[19].toString().padStart(3,"0")}	${$}`),m+=y}break}}i++,i>=p.length&&(l=3,u=!1)}][l]||(()=>{u=!1}))()}return a});var z=["off","hall","room","stage","plate","delay LCR","delay LR","echo","cross delay","early reflections","gate reverb","reverse gate"].concat(new Array(4),["white room","tunnel","canyon","basement","karaoke"],new Array(43),["pass through","chorus","celeste","flanger","symphonic","rotary speaker","tremelo","auto pan","phaser","distortion","overdrive","amplifier","3-band EQ","2-band EQ","auto wah"],new Array(1),["pitch change","harmonic","touch wah","compressor","noise gate","voice channel","2-way rotary speaker","ensemble detune","ambience"],new Array(4),["talking mod","Lo-Fi","dist + delay","comp + dist + delay","wah + dist + delay","V dist","dual rotor speaker"]);var q=",a,i,u,e,o,ka,ki,ku,ke,ko,ky,kw,sa,si,su,se,so,sh,ta,ti,tu,te,to,t,ch,t,s,na,ni,nu,ne,no,ny,nn,ha,hi,hu,he,ho,hy,fa,fi,fu,fe,fo,ma,mi,mu,me,mo,my,mm,ya,yu,ye,yo,ra,ri,ru,re,ro,ry,wa,wi,we,wo,ga,gi,gu,ge,go,gy,gw,za,zi,zu,ze,zo,ja,ji,ju,je,jo,jy,da,di,du,de,do,dy,ba,bi,bu,be,bo,by,va,vi,vu,ve,vo,pa,pi,pu,pe,po,py,nga,ngi,ngu,nge,ngo,ngy,ng,hha,hhi,hhu,hhe,hho,hhy,hhw,*,_,,,~,.".split(","),Q={};`hi*,
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
`).forEach(e=>{let t=e.split(",");Q[t[0]]=t[1]});var Y=["?","gm","gs","xg","g2","mt32","ns5r","x5d","05rw","sd","k11","sg","krs","s90es","motif"],W=["melodic","drum","menu"];var R=[20,21,22,23,24,25,26,28,29,30,31,36,37,48,49,52,53,64,65];var O=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101,128,12,13,16,17,18,19,14,15,20,21,26,28];var J={};Y.forEach((e,t)=>{J[e]=t});var Z={length:O.length};O.forEach((e,t)=>{Z[e]=t});var j={length:R.length};R.forEach((e,t)=>{j[e]=t});var ee={};W.forEach((e,t)=>{ee[e]=t});var _e={ch:128,cc:O.length,nn:128,pl:512,tr:256,cmt:14,rpn:6,rpnt:4,ace:8,drm:8,dpn:R.length,dnc:128,efx:7};var te=["MSB","PRG","LSB","NME","ELC","DRM"],D=function(e){let t=Math.floor(e/10),a=e%10;return`${t.toString(16)}${a}`},M=class{#t;strictMode=!1;get(e=0,t=0,a=0,s){let r=[e,t,a],n,l=1,u=0,p,i=Array.from(arguments);switch(s){case"xg":{switch(e){case 0:{a==126?i[2]=125:a==127&&(i[2]=0);break}case 16:{a==126&&(i[2]=0);break}case 32:{a>125&&(i[2]=0),i[2]+=4;break}case 33:case 34:case 35:case 36:{a>125&&(i[2]=0),i[2]+=5;break}case 79:case 80:case 81:case 82:case 83:case 84:i[0]+=16;case 95:case 96:case 97:case 98:case 99:case 100:{a==126&&(i[2]=0);break}case 48:case 64:case 126:case 127:{a==126&&(i[2]=0);break}}break}case"gs":{e==0&&a<5?i[2]=0:e>125&&a<5&&a!=2&&(i[2]=e,i[0]=0);break}case"g2":case"sd":{(e>>1==40||e>95&&e<100)&&(i[2]|=16);break}case"sg":{e==8&&a==0&&(i[2]=5);break}case"s90es":{a<8?i[2]+=17:a<32?i[2]+=13:i[2]=(i[2]>>3)+19;break}case"motif":{a<8?i[2]+=28:a<32?i[2]+=13:i[2]=(i[2]>>3)+19;break}}let h=" ",c="M",b=0,g=0;switch(i[0]){case 0:{i[2]==127?c="MT-a":i[2]==126?c="MT-b":i[2]==7?c="GM-k":i[2]==5?c="SG-a":i[2]==4?c="SP-l":i[2]==0||s=="gs"&&i[2]<5?c="GM-a":(c="y",b=3);break}case 8:{s=="sg"?c="GM-s":c="r:";break}case 32:case 33:case 34:case 35:case 36:{s=="xg"&&(c=`${["AP","VL","PF","DX","AN"][e&7]}-${"abcdefgh"[a]}`);break}case 48:{c=`yM${(i[2]>>3).toString().padStart(2,"0")}`,b=1;break}case 56:{c="GM-b";break}case 61:case 120:{c="rDrm";break}case 62:{c="kDrm";break}case 63:{if(i[2]<17){let $=i[2];c=$<10?"kP:":"kC:",c+=$%10}else i[2]<34?c=["Pre1","Pre2","Pre3","Pre4","Usr1","Usr2","DrmP","DrmU","Plg1","Plg2","Plg3","Pre1","Pre2","Pre3","Pre4","Pre5","Pre6"][i[2]-17]:c="Ds";break}case 64:{c="ySFX";break}case 67:{c="DX:S";break}case 80:case 81:case 82:case 83:{c=`Prg${"UABC"[i[0]-80]}`;break}case 88:case 89:case 90:case 91:{c=`Cmb${"UABC"[i[0]-88]}`;break}case 95:{c=`${["DR","PC"][i[2]]}-d`;break}case 96:{c=i[2]==106?"AP-a":i[2]>>4==1?"SDg":"PF",i[2]>63?g=63:i[2]>>4==1&&(g=16),b=3;break}case 97:{c=i[2]>>4==1?"SDa":"VL:",b=3,i[2]>>4==1?g=16:g=112;break}case 98:{c=i[2]>>4==1?"SDb":"SG-a",b=3,g=16;break}case 99:{c=i[2]>>4==1?"SDc":"DX",i[2]>63?g=63:i[2]>>4==1&&(g=16),b=3;break}case 100:{c="AN",i[2]>63?g=63:i[2]>>4==1&&(g=16),b=3;break}case 104:case 105:case 106:case 107:{c="SDd",g=104;break}case 121:{c=`GM-${i[2]?"":"a"}`,b=3;break}case 122:{c="lDrm";break}case 126:{c="yDrS";break}case 127:{i[2]==127?c="rDrm":c="yDrm";break}default:i[0]<48?c="r:":c="M"}c.length<4&&(c+=`${[e,a,i[0],i[2]][b]-g}`.padStart(4-c.length,"0")),s=="xg"&&(e==0?i[2]<100?c=c.replace("y0","y:"):i[2]==125&&(c="y126"):e==16&&(n=`Voice${(i[2]*128+i[1]+1).toString().padStart(3,"0")}`,h=" "));let y=[i[0],i[1],i[2]];for(;!(n?.length>=0);)if(n=this.#t[i[1]||0][(i[0]<<7)+i[2]]?.name,n){let $=this.#t[i[1]||0][(i[0]<<7)+i[2]];l=$?.poly||l,u=$?.type||u,p=$?.drum}else if(this.strictMode)n="",h="?";else if(i[0]==0&&i[1]==0&&i[2]==0)n="Unloaded";else if(this.#t[i[1]||0][i[0]<<7])i[0]==0?(i[2]=0,h="^"):i[2]<1?(i[0]=0,h="*"):(i[2]--,h="^");else if(e==48)i[0]=0,i[2]=0,h="!";else if(e==62)i[1]--,h=" ",i[1]<1&&!n?.length&&(i[0]=0,h="!");else if(e<63)i[0]==0?(i[2]=0,h="^"):i[2]<1?(i[0]=0,h="*"):i[2]--;else if(e==80)n=`PrgU:${t.toString().padStart(3,"0")}`,h="!";else if(e==88)n=`CmbU:${t.toString().padStart(3,"0")}`,h="!";else if(e==121)n=`GM2Vox0${a}`,h="#";else if(e==122)if(i[1]==32?i[1]==0:i[1]%=7,n=this.#t[i[1]||0][(i[0]<<7)+i[2]]?.name,n){h=" ";let $=this.#t[i[1]||0][(i[0]<<7)+i[2]];l=$?.poly||l,u=$?.type||u,p=$?.drum}else n="",h="*";else i[1]==0?(n=`${e.toString().padStart(3,"0")} ${t.toString().padStart(3,"0")} ${a.toString().padStart(3,"0")}`,h="!"):i[0]==0?(i[2]=0,h="^"):i[2]>0?i[2]--:i[1]>0?(i[1]=0,h="!"):(i[0]=0,h="?");let m=[i[0],i[1],i[2]];(s=="gs"||s=="ns5r")&&h=="^"&&(h=" "),e==127&&h=="^"&&(h=" "),h!=" "&&self.debugMode&&(n="");let d="??";switch(i[0]){case 0:{i[2]==0?d="GM":i[2]==5||i[2]==7?d="KG":i[2]<126?d="XG":i[2]==127&&(d="MT");break}case 32:case 33:case 35:case 36:{i[2]>4?d=["AP","VL","PF","DX","AN"][i[0]-32]:d="GS";break}case 48:{d="MU";break}case 56:{d="AG";break}case 61:case 80:case 83:case 88:case 89:case 91:{d="AI";break}case 62:case 82:case 90:{d="XD";break}case 63:{i[2]<17?d="KR":i[2]<34?d="ES":d="DS";break}case 64:case 126:{d="XG";break}case 67:case 99:{d=i[2]>>4==1?"SD":"DX";break}case 81:{d="RW";break}case 95:{d=["DR","PC"][i[2]];break}case 96:{d=i[2]==106?"AP":i[2]>>4==1?"SD":"PF";break}case 97:{d=i[2]>>4==1?"SD":"VL";break}case 98:{d=i[2]>>4==1?"SD":"SG";break}case 100:{d="AN";break}case 104:case 105:case 106:case 107:{d="SD";break}case 120:{d="GS";break}case 121:{d=i[2]?"G2":"GM";break}case 122:{d="KG";break}case 127:{d=i[2]==127?"MT":t==0?"GM":"XG";break}default:i[0]<48&&(i[0]==16&&s=="xg"?d="XG":d="GS")}return{name:n||`${D(e||0)} ${D(t||0)} ${D(a||0)}`,poly:l,type:u,drum:p,iid:y,eid:m,sid:r,ending:h,sect:c,standard:d}}async load(e,t,a="(internal)"){let s=this,r=[],n=0,l=0;e.split(`
`).forEach(function(u,p){let i=u.split("	"),h=[];if(p==0){if(i.forEach(function(c,b){r[te.indexOf(c)]=b}),r.length<4){console.debug("Debugger launched.");debugger}}else{let c=0,b=0,g=0,y,m=1,d=0,$;i.forEach(async function(E,V){switch(V){case r[0]:{c=parseInt(E);break}case r[1]:{b=parseInt(E);break}case r[2]:{g=parseInt(E);break}case r[3]:{y=E;break}case r[4]:{E=parseInt(E),E<16?m=E+1:d=(E&15)+1;break}case r[5]:{$=E;break}}}),s.#t[b]=s.#t[b]||[];let P=s.#t[b];if(!P[c<<7|g]||t){let E={msb:c,prg:b,lsb:g,name:y,poly:m,type:d,drum:$};P[c<<7|g]=E,n++}l++}}),t||console.debug(`Map "${a}": ${l} total, ${n} loaded.`)}clearRange(e){let t=e.prg!=null?e.prg.constructor==Array?e.prg:[e.prg,e.prg]:[0,127],a=e.msb!=null?e.msb.constructor==Array?e.msb:[e.msb,e.msb]:[0,127],s=e.lsb!=null?e.lsb.constructor==Array?e.lsb:[e.lsb,e.lsb]:[0,127];for(let r=a[0];r<=a[1];r++){let n=r<<7;for(let l=s[0];l<=s[1];l++){let u=n+l;for(let p=t[0];p<=t[1];p++)delete this.#t[p][u]}}}init(){this.#t=[];for(let e=0;e<128;e++)this.#t.push([""])}async loadFiles(...e){this.init();let t=this;e.forEach(async function(a){try{await fetch(`./data/bank/${a}.tsv`).then(function(s){return s.text()}).then(s=>{t.load(s,!1,a)})}catch{console.error(`Failed loading "${a}.tsv".`)}})}constructor(...e){this.loadFiles(...e)}};var v=["?","gm","gs","xg","g2","mt32","ns5r","ag10","x5d","05rw","krs","k11","sg"],H=[[0,0,0,0,121,0,0,56,82,81,63,0,0],[0,0,4,0,0,127,0,0,0,0,0,0,0]],C=[120,127,120,127,120,127,61,62,62,62,120,122,122],ae=[0,3,81,84,88],B={8:"Off",9:"On",10:"Note aftertouch",11:"cc",12:"pc",13:"Channel aftertouch",14:"Pitch"},A={0:0,1:1,2:3,5:4},_=[[0,24],[0,127],[0,127],[40,88],[0,127],[0,127]],X=[36,37];var U=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101,12,13,16,17,18,19],se=[33,99,100,32,102,8,9,10];var k={};v.forEach((e,t)=>{k[e]=t});var f={length:U.length};U.forEach((e,t)=>{f[e]=t});var S=function(){return!!self.Bun||self.debugMode||!1},ie=function(e){let t=[],a=0;return e?.forEach(function(s,r){s==247?t.push(e.subarray(a,r)):s==240&&(a=r+1)}),t.length||t.push(e.subarray(0)),S(),t},K=function(e,t="",a="",s=2){return e?`${t}${e.toString().padStart(s,"0")}${a}`:""},o={ch:128,cc:U.length,nn:128,pl:512,tr:256,cmt:14,rpn:6},We=class extends T{#t=0;#w=0;#b=0;#g=new Array(11);get#h(){return this.#g[this.#w]}set#h(e){this.#g[this.#w]=e}#y=new Uint8Array(o.ch);#G=new Uint8Array(o.ch);#e=new Uint8ClampedArray(o.ch*o.cc);#$=new Uint8ClampedArray(o.ch);#o=new Uint8ClampedArray(o.ch*o.nn);#D=new Uint8Array(o.ch);#n=new Uint16Array(o.pl);#f=new Uint8Array(o.pl);#C=new Int16Array(o.ch);#d=new Uint8Array(o.ch);#x=0;#l=new Uint8Array(o.ch*o.rpn);#A=new Int8Array(o.ch*X.length);#U=new Uint8Array(o.ch);#V=new Uint8Array(128);#H=new Uint8Array(o.cmt*8);#F=new Uint8Array(1024);#B=new Uint8Array(o.cmt*64);#k=0;#u=0;#M=100;#m=0;#_=500;#z=0;#i="";#p=0;#q=0;#Q=!0;#s=!1;#X;#Y=new Uint8Array(2);#a=[];#E=new Uint8Array(o.ch);#v=new Uint8Array(o.tr);baseBank=new M("gm","gm2","xg","gs","ns5r","gmega","plg-150vl","plg-150pf","plg-150dx","plg-150an","plg-150dr","plg-100sg","kross");userBank=new M("gm");initOnReset=!1;chRedir(e,t,a){if(this.#v[t])return(this.#v[t]-1)*16+e;if([k.gs,k.ns5r].indexOf(this.#t)>-1){if(a==1)return e;let s=0,r=!0;for(;r;)this.#E[e+s]==0?(this.#E[e+s]=t,console.debug(`Assign track ${t} to channel ${e+s+1}.`),r=!1):this.#E[e+s]==t?r=!1:(s+=16,s>=128&&(s=0,r=!1));return e+s}else return e}#c=[];#T;#r={nOff:(e,t)=>{let a=e*128+t,s=this.#n.lastIndexOf(a);s>-1&&(this.#e[o.cc*e+f[64]]>63&&!this.config?.disableCc64?this.#f[s]=4:(this.#n[s]=0,this.#o[a]=0,this.#f[s]=0))},nOn:(e,t,a)=>{let s=e*128+t,r=0;for(this.#D[e]&&this.#r.ano(e);this.#f[r]>0&&this.#n[r]!=s;)r++;r<o.pl?(this.#n[r]=s,this.#o[s]=a,this.#f[r]=3,this.#d[e]<a&&(this.#d[e]=a)):console.error("Polyphony exceeded.")},nAt:(e,t,a)=>{},cAt:(e,t)=>{},hoOf:e=>{this.#f.forEach((t,a)=>{if(t==4){let s=this.#n[a],r=s>>7;e==r&&(this.#f[a]=0,this.#n[a]=0,this.#o[s]=0)}})},soOf:e=>{},ano:e=>{this.#n.forEach((t,a,s)=>{let r=t>>7,n=t&127;t==0&&this.#o[0]==0||r==e&&this.#r.nOff(r,n)})}};#K={8:function(e){let t=e.channel,a=e.data[0];this.#r.nOff(t,a)},9:function(e){let t=e.channel;this.#y[t]=1;let a=e.data[0],s=e.data[1];s>0?this.#r.nOn(t,a,s):this.#r.nOff(t,a)},10:function(e){let a=e.channel*128+e.data[0];this.#n.indexOf(a)>-1&&(this.#o[a]=data[1])},11:function(e){let t=e.channel;this.#y[t]=1;let a=t*o.cc;switch(e.data[0]){case 96:return;case 97:return;case 120:return;case 121:{this.#r.ano(t),this.#C[t]=0;let s=t*o.cc;this.#e[s+f[1]]=0,this.#e[s+f[5]]=0,this.#e[s+f[64]]=0,this.#e[s+f[65]]=0,this.#e[s+f[66]]=0,this.#e[s+f[67]]=0,this.#e[s+f[11]]=127,this.#e[s+f[101]]=127,this.#e[s+f[100]]=127,this.#e[s+f[99]]=127,this.#e[s+f[98]]=127;return}case 123:{this.#r.ano(t);return}case 124:{this.#r.ano(t);return}case 125:{this.#r.ano(t);return}case 126:{this.#D[t]=1,this.#r.ano(t);return}case 127:{this.#D[t]=0,this.#r.ano(t);return}}if(f[e.data[0]]==null)console.warn(`cc${e.data[0]} is not accepted.`);else{switch(e.data[0]){case 0:{if(S()&&console.debug(`${v[this.#t]}, CH${t+1}: ${e.data[1]}`),this.#t==0)e.data[1]<48?(this.#e[a]>119&&(e.data[1]=this.#e[a],e.data[1]=120,console.debug(`Forced channel ${t+1} to stay drums.`)),e.data[1]>0&&(console.debug(`Roland GS detected with MSB: ${e.data[1]}`),this.switchMode("gs"))):e.data[1]==62?this.switchMode("x5d"):e.data[1]==63?this.switchMode("krs"):(e.data[1]==64||e.data[1]==127)&&this.switchMode("xg");else if(this.#t==k.gs)e.data[1]<56&&this.#e[a]>119&&(e.data[1]=this.#e[a],e.data[1]=120,console.debug(`Forced channel ${t+1} to stay drums.`));else if(this.#t==k.gm)e.data[1]<48?this.#e[a]>119&&(e.data[1]=120,this.switchMode("gs",!0),console.debug(`Forced channel ${t+1} to stay drums.`)):(e.data[1]==64||e.data[1]==127)&&this.switchMode("xg",!0);else if(this.#t==k.x5d){if(e.data[1]>0&&e.data[1]<8)this.switchMode("05rw",!0);else if(e.data[1]==56){let s=0;for(let r=0;r<16;r++){let n=this.#e[o.cc*r];(n==56||n==62)&&s++}s>14&&this.switchMode("ag10",!0)}}break}case 6:{if(this.#x){let s=this.#e[a+f[99]],r=this.#e[a+f[98]];if(s==1){let n=se.indexOf(r);if(n>-1)this.#e[a+f[71+n]]=e.data[1],S()&&console.debug(`Redirected NRPN 1 ${r} to cc${71+n}.`);else{let l=X.indexOf(r);l>-1&&(this.#A[t*10+l]=e.data[1]-64),S()&&console.debug(`CH${t+1} voice NRPN ${r} commit`)}}}else{let s=A[this.#e[a+f[100]]];this.#e[a+f[101]]==0&&s!=null&&(S()&&console.debug(`CH${t+1} RPN 0 ${this.#e[a+f[100]]} commit: ${e.data[1]}`),e.data[1]=Math.min(Math.max(e.data[1],_[s][0]),_[s][1]),this.#l[t*o.rpn+s]=e.data[1])}break}case 38:{this.#x||this.#e[a+101]==0&&A[this.#e[a+100]]!=null&&(this.#l[t*o.rpn+A[this.#e[a+100]]+1]=e.data[1]);break}case 64:{e.data[1]<64&&this.#r.hoOf(t);break}case 66:{console.debug(`Sostenuto pedal: ${e.data[1]}`);break}case 98:case 99:{this.#x=1;break}case 100:case 101:{this.#x=0;break}}this.#e[a+f[e.data[0]]]=e.data[1]}},12:function(e){let t=e.channel;this.#y[t]=1,this.#$[t]=e.data,this.#U[t]=0,S()&&console.debug(`T:${e.track} C:${t} P:${e.data}`)},13:function(e){let t=this,a=e.channel;this.#n.forEach(function(s){let r=s>>7;a==r&&(t.#o[s]=e.data)})},14:function(e){let t=e.channel;this.#C[t]=e.data[1]*128+e.data[0]-8192},15:function(e){ie(e.data).forEach(t=>{let a=t[0],s=t[1];(this.#W[a]||function(){console.debug(`Unknown manufacturer ${a}.`)})(s,t.subarray(2),e.track)})},248:function(e){},250:function(e){},251:function(e){},252:function(e){},254:function(e){},255:function(e){if((this.#c[e.meta]||function(a,s,r){}).call(this,e.data,e.track,e.meta),e.meta!=32&&(this.#m=0),ae.indexOf(e.meta)>-1)return e.reply="meta",e;S()&&console.debug(e)}};#W={64:(e,t,a)=>{this.#L.run(t,a,e)},65:(e,t,a)=>{if(t[0]<16)this.#S.run(t,a,e),console.warn("Unknown device SysEx!");else{let s=t[t.length-1],r=gsChecksum(t.subarray(2,t.length-1));s==r?this.#S.run(t.subarray(0,t.length-1),a,e):console.warn(`Bad GS checksum ${s}. Should be ${r}.`)}},66:(e,t,a)=>{this.#O.run(t,a,e)},67:(e,t,a)=>{this.#R.run(t,a,e)},68:(e,t,a)=>{this.#J.run(t,a,e)},71:(e,t,a)=>{this.#I.run(t,a,e)},126:(e,t,a)=>{this.#P.run(t,a,e)},127:(e,t,a)=>{this.switchMode("gm"),this.#N.run(t,a,e)}};#P;#N;#R;#S;#O;#L;#I;#J;buildRchTree(){let e=[];this.#G.forEach((t,a)=>{e[t]?.constructor||(e[t]=[]),e[t].push(a)}),this.#X=e}getActive(){let e=this.#y.slice();return this.#t==k.mt32,e}getCc(e){let t=e*o.cc,a=this.#e.slice(t,t+o.cc);return a[f[0]]=a[f[0]]||this.#k,a[f[32]]=a[f[32]]||this.#u,a}getCcAll(){let e=this.#e.slice();for(let t=0;t<o.ch;t++){let a=t*o.cc;e[a+f[0]]=e[a+f[0]]||this.#k,e[a+f[32]]=e[a+f[32]]||this.#u}return e}getPitch(){return this.#C}getProgram(){return this.#$}getTexts(){return this.#a.slice()}getVel(e){let t=new Map,a=this;return a.#n.forEach(function(s,r){let n=Math.floor(s/128),l=s%128;e==n&&a.#o[s]>0&&t.set(l,{v:a.#o[s],s:a.#f[r]})}),t}getBitmap(){return{bitmap:this.#h,expire:this.#b}}getLetter(){return{text:this.#i,expire:this.#p}}getMode(){return v[this.#t]}getMaster(){return{volume:this.#M}}getRawStrength(){let e=this;return this.#n.forEach(function(t){let a=Math.floor(t/128);e.#o[t]>e.#d[a]&&(e.#d[a]=e.#o[t])}),this.#d}getStrength(){let e=[],t=this;return this.getRawStrength().forEach(function(a,s){e[s]=Math.floor(a*t.#e[s*o.cc+f[7]]*t.#e[s*o.cc+f[11]]*t.#M/803288)}),e}getRpn(){return this.#l}getNrpn(){return this.#A}getVoice(e,t,a,s){let r=e||this.#k,n=t,l=a||this.#u;v[this.#t]=="ns5r"&&r>0&&r<56&&(l=3);let u=this.userBank.get(r,n,l,s);if(v[this.#t]=="mt32"&&u.name.indexOf("MT-m:")==0){let p=parseInt(u.name.slice(5)),i=p*o.cmt,h="";this.#B.subarray(i,i+10).forEach(c=>{c>31&&(h+=String.fromCharCode(c))}),this.userBank.load(`MSB	LSB	PRG
0	127	${n}	${h}`,!0),u.name=h,u.ending=" "}return(u.ending!=" "||!u.name.length)&&(u=this.baseBank.get(r,n,l,s)),u}getChVoice(e){let t=this.getVoice(this.#e[e*o.cc+f[0]],this.#$[e],this.#e[e*o.cc+f[32]],v[this.#t]);if(this.#U[e])switch(this.#t){case k.mt32:t.ending="~",t.name="",this.#H.subarray(14*(e-1),14*(e-1)+10).forEach(a=>{a>31&&(t.name+=String.fromCharCode(a))})}return t}init(e=0){this.dispatchEvent("mode","?"),this.#t=0,this.#k=0,this.#u=0,this.#m=0,this.#y.fill(0),this.#e.fill(0),this.#$.fill(0),this.#o.fill(0),this.#n.fill(0),this.#d.fill(0),this.#C.fill(0),this.#A.fill(0),this.#M=100,this.#a=[],this.#_=500,this.#z=0,this.#p=0,this.#i="",this.#b=0,this.#w=0,this.#h.fill(0),this.#s=!1,this.#q=0,this.#Q=!0,this.#G.forEach(function(t,a,s){s[a]=a}),this.buildRchTree(),e==0&&(this.#E.fill(0),this.#v.fill(0)),this.#e[o.cc*9]=C[0],this.#e[o.cc*25]=C[0],this.#e[o.cc*41]=C[0],this.#e[o.cc*57]=C[0],this.#Y.fill(0),this.#F.fill(0),this.#B.fill(0),this.#V.fill(0),this.#H.fill(0),this.#U.fill(0),this.userBank.clearRange({msb:0,lsb:127,prg:[0,127]});for(let t=0;t<o.ch;t++){let a=t*o.cc;this.#e[a+f[7]]=100,this.#e[a+f[11]]=127,this.#e[a+f[10]]=64,this.#e[a+f[71]]=64,this.#e[a+f[72]]=64,this.#e[a+f[73]]=64,this.#e[a+f[74]]=64,this.#e[a+f[75]]=64,this.#e[a+f[76]]=64,this.#e[a+f[77]]=64,this.#e[a+f[78]]=64,this.#e[a+f[91]]=40,this.#e[a+f[101]]=127,this.#e[a+f[100]]=127,this.#e[a+f[99]]=127,this.#e[a+f[98]]=127;let s=t*o.rpn;this.#l[s]=2,this.#l[s+1]=64,this.#l[s+2]=0,this.#l[s+3]=64,this.#l[s+4]=0,this.#l[s+5]=0}}switchMode(e,t=!1){let a=v.indexOf(e);if(a>-1){if(this.#t==0||t){this.#t=a,this.#w=0,this.#k=H[0][a],this.#u=H[1][a];for(let s=0;s<o.ch;s++)C.indexOf(this.#e[s*o.cc])>-1&&(this.#e[s*o.cc]=C[a]);switch(this.initOnReset,a){case k.mt32:{mt32DefProg.forEach((s,r)=>{let n=r+1;this.#y[n]||(this.#$[n]=s,this.#e[n*o.cc+f[91]]=127)});break}}this.dispatchEvent("mode",e)}}else throw new Error(`Unknown mode ${e}`)}newStrength(){this.#d.fill(0)}runJson(e){if(e.type>14)return e.type==15&&e.data.constructor!=Uint8Array&&(e.data=Uint8Array.from(e.data)),this.#K[e.type].call(this,e);{let t=this.chRedir(e.part,e.track),a=!1;this.#X[t]?.forEach(s=>{e.channel=s,a=!0,this.#K[e.type].call(this,e)}),a||console.warn(`${B[e.type]?B[e.type]:e.type}${[11,12].includes(e.type)?(e.data[0]!=null?e.data[0]:e.data).toString():""} event sent to CH${t+1} without any recipient.`)}this.#a.length>100&&this.#a.splice(100,this.#a.length-99)}runRaw(e){}constructor(){super();let e=this;this.#h=new Uint8Array(256),this.#g[10]=new Uint8Array(512),this.#T=new w,this.userBank.strictMode=!0,this.userBank.load(`MSB	PRG	LSB	NME
062	000	000	
122	000	000	
122	001	000	
122	002	000	
122	003	000	
122	004	000	
122	005	000	
122	006	000	`),this.#c[1]=function(t){switch(t.slice(0,2)){case"@I":{this.#s=!0,this.#a.unshift(`Kar.Info: ${t.slice(2)}`);break}case"@K":{this.#s=!0,this.#a.unshift("Karaoke mode active."),console.debug(`Karaoke mode active: ${t.slice(2)}`);break}case"@L":{this.#s=!0,this.#a.unshift(`Language: ${t.slice(2)}`);break}case"@T":{this.#s=!0,this.#a.unshift(`Ka.Title: ${t.slice(2)}`);break}case"@V":{this.#s=!0,this.#a.unshift(`Kara.Ver: ${t.slice(2)}`);break}case"XF":{let a=t.slice(2).split(":");switch(a[0]){case"hd":{a.slice(1).forEach((s,r)=>{s.length&&this.#a.unshift(`${["SongDate","SnRegion","SongCat.","SongBeat","SongInst","Sn.Vocal","SongCmp.","SongLrc.","SongArr.","SongPerf","SongPrg.","SongTags"][r]}: ${s}`)});break}case"ln":{a.slice(1).forEach((s,r)=>{s.length&&this.#a.unshift(`${["Kar.Lang","Kar.Name","Kar.Cmp.","Kar.Lrc.","kar.Arr.","Kar.Perf","Kar.Prg."][r]}: ${s}`)});break}default:this.#a.unshift(`XGF_Data: ${t}`)}break}default:this.#s?t[0]=="\\"?this.#a.unshift(`@ ${t.slice(1)}`):t[0]=="/"?this.#a.unshift(t.slice(1)):this.#a[0]+=t:(this.#a[0]=t,this.#a.unshift(""))}},this.#c[2]=function(t){this.#a.unshift(`Copyrite: ${t}`)},this.#c[3]=function(t,a){a<1&&this.#m<1&&this.#a.unshift(`TrkTitle: ${t}`)},this.#c[4]=function(t,a){this.#a.unshift(`${K(this.#m,""," ")}Instrmnt: ${t}`)},this.#c[5]=function(t){t.trim()==""?this.#a.unshift(""):this.#a[0]+=`${t}`},this.#c[6]=function(t){this.#a.unshift(`${K(this.#m,""," ")}C.Marker: ${t}`)},this.#c[7]=function(t){this.#a.unshift(`CuePoint: ${t}`)},this.#c[32]=function(t){this.#m=t[0]+1},this.#c[33]=function(t,a){console.debug(`Track ${a} requests to get assigned to output ${t}.`),e.#v[a]=t+1},this.#c[81]=function(t,a){e.#_=t/1e3},this.#c[127]=function(t,a){e.#T.run(t,a)},this.#T.default=function(t){console.warn(`Unrecognized sequencer-specific byte sequence: ${t}`)},this.#T.add([67,0,1],function(t,a){e.#v[a]=t[0]+1}),this.#P=new w,this.#N=new w,this.#R=new w,this.#S=new w,this.#O=new w,this.#L=new w,this.#I=new w,this.#P.add([9],t=>{e.switchMode(["gm","?","g2"][t[0]-1],!0),e.#s=e.#s||!1,console.info(`MIDI reset: ${["GM","Init","GM2"][t[0]-1]}`),t[0]==2&&e.init()}),this.#N.add([4,1],t=>{e.#M=((t[1]<<7)+t[0])/16383*100}).add([4,3],t=>((t[1]<<7)+t[0]-8192)/8192).add([4,4],t=>t[1]-64),this.#R.add([76,0,0],t=>{switch(t[0]){case 126:{e.switchMode("xg",!0),e.#s=!1,console.info("MIDI reset: XG");break}}}).add([76,6,0],t=>{let a=t[0];a<64?(e.#i=" ".repeat(a),e.#p=Date.now()+3200,t.subarray(1).forEach(function(s){e.#i+=String.fromCharCode(s)}),e.#i=e.#i.padEnd(32," ")):e.#p=Date.now()}).add([76,7,0],t=>{let a=t[0];e.#b=Date.now()+3200,e.#h.fill(0);let s=t.subarray(1);for(let r=0;r<a;r++)s.unshift(0);s.forEach(function(r,n){let l=Math.floor(n/16),u=n%16,p=(u*3+l)*7,i=7,h=0;for(p-=u*5,l==2&&(i=2);h<i;)e.#h[p+h]=r>>6-h&1,h++})}),this.#R.add([43,7,0],(t,a,s)=>{e.#i=" ".repeat(offset),e.#p=Date.now()+3200,t.subarray(1).forEach(function(r){e.#i+=String.fromCharCode(r)}),e.#i=e.#i.padEnd(32," ")}).add([43,7,1],(t,a,s)=>{e.#b=Date.now()+3200,e.#h.fill(0),t.forEach(function(r,n){let l=Math.floor(n/16),u=n%16,p=(u*3+l)*7,i=7,h=0;for(p-=u*5,l==2&&(i=2);h<i;)e.#h[p+h]=r>>6-h&1,h++})}),this.#S.add([66,18,0,0,127],(t,a,s)=>{e.switchMode("gs",!0),e.#e[o.cc*9]=120,e.#e[o.cc*25]=120,e.#e[o.cc*41]=120,e.#e[o.cc*57]=120,e.#u=3,e.#s=!1,e.#E.fill(0),console.info(`GS system to ${["single","dual"][t[0]]} mode.`)}).add([66,18,64,0],(t,a,s)=>{switch(t[0]){case 127:{e.switchMode("gs",!0),e.#e[o.cc*9]=120,e.#e[o.cc*25]=120,e.#e[o.cc*41]=120,e.#e[o.cc*57]=120,e.#s=!1,e.#E.fill(0),console.info("MIDI reset: GS");break}}}).add([69,18,16],t=>{switch(t[0]){case 0:{e.#p=Date.now()+3200;let a=t[1];e.#i=" ".repeat(a),t.subarray(2).forEach(function(s){s<128&&(e.#i+=String.fromCharCode(s))});break}case 32:{e.#b=Date.now()+3200,t[1]==0&&(e.#w=Math.max(Math.min(t[2]-1,9),0));break}default:if(t[0]<11){e.#b=Date.now()+3200,e.#g[t[0]-1]?.length||(e.#g[t[0]-1]=new Uint8Array(256));let a=e.#g[t[0]-1],s=t[1];a.fill(0);let r=t.subarray(2);for(let n=0;n<s;n++)r.unshift(0);r.forEach(function(n,l){let u=Math.floor(l/16),p=l%16,i=(p*4+u)*5,h=5,c=0;for(i-=p*4,u==3&&(h=1);c<h;)a[i+c]=n>>4-c&1,c++})}else console.warn(`Unknown GS display section: ${t[0]}`)}}),this.#S.add([22,18,127],t=>{e.switchMode("mt32",!0),e.#s=!1,e.userBank.clearRange({msb:0,lsb:127,prg:[0,127]}),console.info("MIDI reset: MT-32")}).add([22,18,32],t=>{e.switchMode("mt32");let a=t[1],s=" ".repeat(a);t.subarray(2).forEach(r=>{r>31&&(s+=String.fromCharCode(r))}),e.#i=s.padStart(20," "),e.#p=Date.now()+3200}).add([22,18,82],(t,a)=>{let s=e.chRedir(0,a,!0);for(let r=0;r<16;r++)e.#r.ano(s+r),r&&r<10&&(e.#$[s+r]=mt32DefProg[r-1]);console.info("MT-32 alt reset complete.")}),this.#O.add([66,0],(t,a)=>{e.switchMode("ns5r",!0),e.#s=!1,console.debug(`NS5R mode switch requested: ${["global","multi","prog edit","comb edit","drum edit","effect edit"][t[0]]} mode.`)}).add([66,1],(t,a)=>{e.switchMode(["ns5r","05rw"][t[0]],!0),e.#s=!1}).add([66,18,0,0],(t,a)=>{switch(t[0]){case 124:case 126:case 127:{e.switchMode("ns5r",!0),e.#s=!1;break}}}).add([66,18,8,0],(t,a)=>{}).add([66,125],t=>{e.dispatchEvent("backlight",["green","orange","red",!1,"yellow","blue","purple"][t[0]]||"white")}).add([66,127],t=>{let a=new Uint8Array(5760);korgFilter(t,(s,r,n)=>{if(r<720)for(let l=0;l<8;l++)a[r*8+l]=s>>7-l&1}),e.dispatchEvent("screen",{type:"ns5r",data:a})}).add([76],(t,a,s)=>{e.#O.run([66,...t],a,s)}),this.#L.add([16,0,8,0],(t,a,s)=>{let r=(t[2]<<4)+t[3],n="K11 ";([()=>{e.switchMode("k11",!0),e.#s=!1,e.#u=r?4:0,console.info("MIDI reset: GMega/K11")}][t[0]]||(()=>{}))()}),this.#I.add([66,93,64],(t,a,s)=>{let r=t[2];switch(t[0]){case 0:{switch(t[1]){case 127:{e.switchMode("sg",!0);break}}break}}})}};export{We as OctaviaDevice,o as allocated,f as ccToPos};
