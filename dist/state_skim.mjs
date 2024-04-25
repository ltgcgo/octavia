var N=function(e,t){let a=Math.min(e.length,t.length),r=e.slice(0,a),i=t.slice(0,a),c=0,l=0;for(;l<a&&c==0;)c=Math.sign(r[l]-i[l]),l++;return c},w=function(e=""){this.name=e,this.pool=[],this.point=function(t,a=!1){if(this.pool.length>0){let r=this.pool.length,i=1<<Math.floor(Math.log2(r)),c=i,l=64;for(;i>=1&&l>=0;){if(l<=0)throw new Error("TTL reached.");if(c==r)c-=i;else{let p=N(t,this.pool[c]);switch(p){case 0:{l=0;break}case 1:{c+i<=r&&(c+=i);break}case-1:{c!=0&&(c-=i);break}default:console.warn(`Unexpected result ${p}.`)}}i=i>>1,l--}let u=!0;if(c>=this.pool.length)u=!1;else{let p=this;this.pool[c].forEach(function(s,o,n){u&&s!=t[o]&&(u=!1)}),!u&&N(t,this.pool[c])>0&&c++}return u||a?c:-1}else return a?0:-1},this.add=function(t,a){return t.data=a,this.pool.splice(this.point(t,!0),0,t),this},this.default=function(t){console.warn(`No match in "${this.name||"(unknown)"}" for "${t}". Default action not defined.`)},this.get=function(t){let a=this.point(t);if(a>-1)return this.pool[a].data;this.default(t)},this.run=function(t,...a){let r=this.point(t);r>-1?t.subarray?this.pool[r].data(t.subarray(this.pool[r].length),...a):this.pool[r].data(t.slice(this.pool[r].length),...a):this.default(t,...a)}};var R=class{#t={};addEventListener(e,t){this.#t[e]||(this.#t[e]=[]),this.#t[e].unshift(t)}removeEventListener(e,t){if(this.#t[e]){let a=this.#t[e].indexOf(t);a>-1&&this.#t[e].splice(a,1),this.#t[e].length<1&&delete this.#t[e]}}dispatchEvent(e,t){let a=new Event(e),r=this;a.data=t,this.#t[e]?.length>0&&this.#t[e].forEach(function(i){try{i?.call(r,a)}catch(c){console.error(c)}}),this[`on${e}`]&&this[`on${e}`](a)}};var B=class{#t={};context;set(e,t){this.#t[e]=t}has(e){return!!this.#t[e]}async read(e,t){if(!this.has(e))throw new Error(`No decoder registered for "${e}"`);return await this.#t[e].call(this.context||this,t)}};var z=function(e,t){let a=!0;return t.forEach((r,i)=>{a=a&&e[i]==r}),a},M=function(e){let t=0;return e.forEach(a=>{t*=256,t+=a}),t},k=new TextDecoder,D=new B;D.set("s7e",async function(e){let t=new Uint8Array(await e.slice(0,65536).arrayBuffer()),a="MSB	LSB	PRG	NME",r=[0,0,0,0],i=32,c=0,l=0,u=!0,p=[],s=0;for(;u;){let o=t.subarray(c);([()=>{k.decode(o.subarray(0,4))=="YSFC"?(c+=80,l=1):c++},()=>{if(z(o.subarray(0,4),r))p.forEach((n,b,g)=>{let m=M(t.subarray(n.start+4,n.start+8));n.length=m}),l=2;else{let n=k.decode(o.subarray(0,4)),b=M(o.subarray(4,8));p.push({type:n,start:b}),c+=8}},()=>{let n=p[s],b=t.subarray(n.start,n.start+n.length),g=32;switch(n.type){case"ENVC":{let m=i;for(;m<b.length;){let E=b.subarray(m,m+g),f=k.decode(E.subarray(0,10)).trimEnd();f.slice(0,5)=="Init "&&(f=""),f&&(a+=`
063	${(E[17]+13).toString().padStart(3,"0")}	${E[19].toString().padStart(3,"0")}	${f}`),m+=g}break}case"EDVC":{let m=i;for(;m<b.length;){let E=b.subarray(m,m+g),f=k.decode(E.subarray(0,10)).trimEnd();f.slice(0,5)=="Init "&&(f=""),f&&(a+=`
063	024	${E[19].toString().padStart(3,"0")}	${f}`),m+=g}break}case"EPVC":{let m=32,E=i;for(;E<b.length;){let f=b.subarray(E,E+m),y=k.decode(f.subarray(0,10)).trimEnd();y=="----------"&&(y=""),y&&(a+=`
063	${(f[17]+1).toString().padStart(3,"0")}	${f[19].toString().padStart(3,"0")}	${y}`),E+=m}break}}s++,s>=p.length&&(l=3,u=!1)}][l]||(()=>{u=!1}))()}return a});D.set("pcg",async function(e){let t=new Uint8Array(await e.arrayBuffer()),a="MSB	LSB	PRG	NME",r=100,i=0,c=0,l=!0,u=[],p=0;for(;l;){let s=t.subarray(r);([()=>{l=k.decode(s.subarray(0,4))=="INI2",c=s[15],r+=16,i=1},()=>{let o=k.decode(s.subarray(0,4)),n=s[5],b=s[7],g=s[11],m=M(s.subarray(12,16)),E=M(s.subarray(16,20)),f=M(s.subarray(36,40)),y=k.decode(s.subarray(44,44+g));u.push({type:o,tipMsb:n,tipLsb:b,nameLen:g,length:m,start:E,entryLen:f,name:y}),r+=64,c--,c<1&&(i=2)},()=>{let o=u[p],n=t.subarray(o.start,o.start+o.length);switch(o.type){case"PRG1":break;case"PBK1":{let b=63,g=(o.tipMsb?6:0)+o.tipLsb;for(let m=0;m<128;m++){let E=m*o.entryLen,f=n.subarray(E,E+o.entryLen),y=k.decode(f.subarray(0,24)).trimEnd().replace("InitProg","");y.length&&g>5&&(a+=`
${b.toString().padStart(3,"0")}	${g.toString().padStart(3,"0")}	${m.toString().padStart(3,"0")}	${y}`)}break}case"CBK1":{let b=63,g=(o.tipMsb?3:0)+o.tipLsb+10;for(let m=0;m<128;m++){let E=m*o.entryLen,f=n.subarray(E,E+o.entryLen),y=k.decode(f.subarray(0,24)).trimEnd().replace("InitCombi","");y.length&&g>12&&(a+=`
${b.toString().padStart(3,"0")}	${g.toString().padStart(3,"0")}	${m.toString().padStart(3,"0")}	${y}`)}break}}p++,p>=u.length&&(i=3,l=!1)}][i]||(()=>{l=!1}))()}return a});var q=["off","hall","room","stage","plate","delay LCR","delay LR","echo","cross delay","early reflections","gate reverb","reverse gate"].concat(new Array(4),["white room","tunnel","canyon","basement","karaoke"],new Array(43),["pass through","chorus","celeste","flanger","symphonic","rotary speaker","tremelo","auto pan","phaser","distortion","overdrive","amplifier","3-band EQ","2-band EQ","auto wah"],new Array(1),["pitch change","harmonic","touch wah","compressor","noise gate","voice channel","2-way rotary speaker","ensemble detune","ambience"],new Array(4),["talking mod","Lo-Fi","dist + delay","comp + dist + delay","wah + dist + delay","V dist","dual rotor speaker"]);var W=",a,i,u,e,o,ka,ki,ku,ke,ko,ky,kw,sa,si,su,se,so,sh,ta,ti,tu,te,to,t,ch,t,s,na,ni,nu,ne,no,ny,nn,ha,hi,hu,he,ho,hy,fa,fi,fu,fe,fo,ma,mi,mu,me,mo,my,mm,ya,yu,ye,yo,ra,ri,ru,re,ro,ry,wa,wi,we,wo,ga,gi,gu,ge,go,gy,gw,za,zi,zu,ze,zo,ja,ji,ju,je,jo,jy,da,di,du,de,do,dy,ba,bi,bu,be,bo,by,va,vi,vu,ve,vo,pa,pi,pu,pe,po,py,nga,ngi,ngu,nge,ngo,ngy,ng,hha,hhi,hhu,hhe,hho,hhy,hhw,*,_,,,~,.".split(","),Q={};`hi*,
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
`).forEach(e=>{let t=e.split(",");Q[t[0]]=t[1]});var Y=["?","gm","gs","sc","xg","g2","mt32","doc","qy10","qy20","ns5r","x5d","05rw","k11","sg","sd","krs","s90es","motif","trin"];var J=["melodic","drum","menu"];var P=[20,21,22,23,24,25,26,28,29,30,31,36,37,48,49,52,53,64,65];var O=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101,128,12,13,16,17,18,19,14,15,20,21,26,28,80,81,83,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157];var Z={};Y.forEach((e,t)=>{Z[e]=t});var j={length:O.length};O.forEach((e,t)=>{j[e]=t});var ee={length:P.length};P.forEach((e,t)=>{ee[e]=t});var te={};J.forEach((e,t)=>{te[e]=t});var H=8,Ke={port:H,ch:H<<4,cc:O.length,nn:128,pl:512,tr:256,cmt:14,rpn:6,rpnt:4,ace:8,drm:8,dpn:P.length,dnc:128,ext:3,efx:7,cvn:12,redir:32,invalidCh:255};var ae=["MSB","PRG","LSB","NME","ELC","DRM"],A=function(e){let t=Math.floor(e/10),a=e%10;return`${t.toString(16)}${a}`},T=class{#t;strictMode=!1;get(e=0,t=0,a=0,r){let i=[e,t,a],c,l=1,u=0,p,s=Array.from(arguments);switch(r){case"xg":{switch(e){case 0:{a==126?s[2]=125:a==127&&(s[2]=0);break}case 16:{a==126&&(s[2]=0);break}case 32:{a>125&&(s[2]=0),s[2]+=4;break}case 33:case 34:case 35:case 36:{a>125&&(s[2]=0),s[2]+=5;break}case 79:case 80:case 81:case 82:case 83:case 84:s[0]+=16;case 95:case 96:case 97:case 98:case 99:case 100:{a==126&&(s[2]=0);break}case 48:case 64:case 126:case 127:{a==126&&(s[2]=0);break}}break}case"gs":case"sc":{e==0&&a<5?s[2]=0:e>125&&a<5&&a!=2&&(s[2]=e,s[0]=0);break}case"g2":case"sd":{e>>1==40?s[2]|=16:e>95&&e<100&&(s[2]|=16,t>>4==7&&(s[0]=96));break}case"sg":{e==8&&a==0&&(s[2]=5);break}case"s90es":{a<8?s[2]+=17:a<32?s[2]+=13:s[2]=(s[2]>>3)+19;break}case"motif":{a<8?s[2]+=28:a<32?s[2]+=13:s[2]=(s[2]>>3)+19;break}}let o=" ",n="M",b=0,g=0;switch(s[0]){case 0:{s[2]==127?n="MT-a":s[2]==126?n="MT-b":s[2]==7?n="GM-k":s[2]==5?n="SG-a":s[2]==4?n="SP-l":s[2]==0||(r=="gs"||r=="sc")&&s[2]<5?n="GM-a":(n="y",b=3);break}case 8:{r=="sg"?n="GM-s":n="r:";break}case 32:case 33:case 34:case 35:case 36:{r=="xg"&&(n=`${["AP","VL","PF","DX","AN"][e&7]}-${"abcdefgh"[a]}`);break}case 48:{n=`yM${(s[2]>>3).toString().padStart(2,"0")}`,b=1;break}case 56:{n="GM-b";break}case 57:n=["yDOC","QY10","QY20"][s[2]-112]||"yMxv";case 61:case 120:{n="rDrm";break}case 62:{n="kDrm";break}case 63:{if(s[2]<17){let y=s[2];n=y<10?"kP:":"kC:",n+=y%10}else s[2]<34?n=["Pre1","Pre2","Pre3","Pre4","Usr1","Usr2","DrmP","DrmU","Plg1","Plg2","Plg3","Pre1","Pre2","Pre3","Pre4","Pre5","Pre6"][s[2]-17]:n="Ds";break}case 64:{n="ySFX";break}case 67:{n="DX:S";break}case 80:case 81:case 82:case 83:{n=`Prg${"UABC"[s[0]-80]}`;break}case 88:case 89:case 90:case 91:{n=`Cmb${"UABC"[s[0]-88]}`;break}case 95:{n=`${["DR","PC"][s[2]]}-d`;break}case 96:{n=s[2]==106?"AP-a":s[2]>>4==1?"SDg":"PF",s[2]>63?g=63:s[2]>>4==1&&(g=16),b=3;break}case 97:{n=s[2]>>4==1?"SDa":"VL:",b=3,s[2]>>4==1?g=16:g=112;break}case 98:{n=s[2]>>4==1?"SDb":"SG-a",b=3,g=16;break}case 99:{n=s[2]>>4==1?"SDc":"DX",s[2]>63?g=63:s[2]>>4==1&&(g=16),b=3;break}case 100:{n="AN",s[2]>63?g=63:s[2]>>4==1&&(g=16),b=3;break}case 104:case 105:case 106:case 107:{n="SDd",g=104;break}case 121:{n=`GM-${s[2]?"":"a"}`,b=3;break}case 122:{n="lDrm";break}case 126:{n="yDrS";break}case 127:{s[2]==127?n="rDrm":n="yDrm";break}default:s[0]<48?n="r:":n="M"}n.length<4&&(n+=`${[e,a,s[0],s[2]][b]-g}`.padStart(4-n.length,"0")),r=="xg"&&(e==0?s[2]<100?n=n.replace("y0","y:"):s[2]==125&&(n="y126"):e==16?(c=`Voice${((s[2]<<7)+s[1]+1).toString().padStart(3,"0")}`,o=" "):e==35&&a>>1==2&&(c=`DXCH_${(((s[2]&1)<<7)+t+1).toString().padStart(3,"0")}`,o=" "));let m=[s[0],s[1],s[2]];for(;!(c?.length>=0);)if(c=this.#t[s[1]||0][(s[0]<<7)+s[2]]?.name,c){let y=this.#t[s[1]||0][(s[0]<<7)+s[2]];l=y?.poly||l,u=y?.type||u,p=y?.drum}else if(this.strictMode)c="",o="?";else if(s[0]==0&&s[1]==0&&s[2]==0)c="Unloaded";else if(this.#t[s[1]||0][s[0]<<7])s[0]==0?(s[2]=0,o="^"):s[2]<1?(s[0]=0,o="*"):(s[2]--,o="^");else if(e==48)s[0]=0,s[2]=0,o="!";else if(e==62)s[1]--,o=" ",s[1]<1&&!c?.length&&(s[0]=0,o="!");else if(e<63)s[0]==0?(s[2]=0,o="^"):s[2]<1?(s[0]=0,o="*"):s[2]--;else if(e==80)c=`PrgU:${t.toString().padStart(3,"0")}`,o="!";else if(e==88)c=`CmbU:${t.toString().padStart(3,"0")}`,o="!";else if(e==121)c=`GM2Vox0${a}`,o="#";else if(e==122)if(s[1]==32?s[1]==0:s[1]%=7,c=this.#t[s[1]||0][(s[0]<<7)+s[2]]?.name,c){o=" ";let y=this.#t[s[1]||0][(s[0]<<7)+s[2]];l=y?.poly||l,u=y?.type||u,p=y?.drum}else c="",o="*";else s[1]==0?(c=`${e.toString().padStart(3,"0")} ${t.toString().padStart(3,"0")} ${a.toString().padStart(3,"0")}`,o="!"):s[0]==0?(s[2]=0,o="^"):s[2]>0?s[2]--:s[1]>0?(s[1]=0,o="!"):(s[0]=0,o="?");let E=[s[0],s[1],s[2]];(r=="gs"||r=="sc"||r=="ns5r")&&o=="^"&&(o=" "),e==127&&o=="^"&&(o=" "),o!=" "&&self.debugMode&&(c="");let f="??";switch(s[0]){case 0:{s[2]==0?f="GM":s[2]==5||s[2]==7?f="KG":s[2]<126?f="XG":s[2]==127&&(f="MT");break}case 32:case 33:case 35:case 36:{s[2]>4?f=["AP","VL","PF","DX","AN"][s[0]-32]:f="GS";break}case 48:{f="MU";break}case 56:{f="AG";break}case 61:case 80:case 83:case 88:case 89:case 91:{f="AI";break}case 62:case 82:case 90:{f="XD";break}case 63:{s[2]<17?f="KR":s[2]<34?f="ES":f="DS";break}case 64:case 126:{f="XG";break}case 67:case 99:{f=s[2]>>4==1?"SD":"DX";break}case 81:{f="RW";break}case 95:{f=["DR","PC"][s[2]];break}case 96:{f=s[2]==106?"AP":s[2]>>4==1?"SD":"PF";break}case 97:{f=s[2]>>4==1?"SD":"VL";break}case 98:{f=s[2]>>4==1?"SD":"SG";break}case 100:{f="AN";break}case 104:case 105:case 106:case 107:{f="SD";break}case 120:{f="GS";break}case 121:{f=s[2]?"G2":"GM";break}case 122:{f="KG";break}case 127:{f=s[2]==127?"MT":t==0?"GM":"XG";break}default:s[0]<48&&(s[0]==16&&r=="xg"?f="XG":f="GS")}return{name:c||`${A(e||0)} ${A(t||0)} ${A(a||0)}`,poly:l,type:u,drum:p,iid:m,eid:E,sid:i,ending:o,sect:n,standard:f}}async load(e,t,a="(internal)"){let r=this,i=[],c=0,l=0;e.split(`
`).forEach(function(u,p){let s=u.split("	"),o=[];if(p==0){if(s.forEach(function(n,b){i[ae.indexOf(n)]=b}),i.length<4){console.debug("Debugger launched.");debugger}}else{let n=0,b=0,g=0,m,E=1,f=0,y;s.forEach(async function($,K){switch(K){case i[0]:{n=parseInt($);break}case i[1]:{b=parseInt($);break}case i[2]:{g=parseInt($);break}case i[3]:{m=$;break}case i[4]:{$=parseInt($),$<16?E=$+1:f=($&15)+1;break}case i[5]:{y=$;break}}}),r.#t[b]=r.#t[b]||[];let I=r.#t[b];if(!I[n<<7|g]||t){let $={msb:n,prg:b,lsb:g,name:m,poly:E,type:f,drum:y};I[n<<7|g]=$,c++}l++}}),t||console.debug(`Map "${a}": ${l} total, ${c} loaded.`)}clearRange(e){let t=e.prg!=null?e.prg.constructor==Array?e.prg:[e.prg,e.prg]:[0,127],a=e.msb!=null?e.msb.constructor==Array?e.msb:[e.msb,e.msb]:[0,127],r=e.lsb!=null?e.lsb.constructor==Array?e.lsb:[e.lsb,e.lsb]:[0,127];for(let i=a[0];i<=a[1];i++){let c=i<<7;for(let l=r[0];l<=r[1];l++){let u=c+l;for(let p=t[0];p<=t[1];p++)delete this.#t[p][u]}}}init(){this.#t=[];for(let e=0;e<128;e++)this.#t.push([""])}async loadFiles(...e){this.init();let t=this;e.forEach(async function(a){try{await fetch(`./data/bank/${a}.tsv`).then(function(r){return r.text()}).then(r=>{t.load(r,!1,a)})}catch{console.error(`Failed loading "${a}.tsv".`)}})}constructor(...e){this.loadFiles(...e)}};var x=["?","gm","gs","xg","g2","mt32","ns5r","ag10","x5d","05rw","krs","k11","sg"],G=[[0,0,0,0,121,0,0,56,82,81,63,0,0],[0,0,4,0,0,127,0,0,0,0,0,0,0]],C=[120,127,120,127,120,127,61,62,62,62,120,122,122],re=[0,3,81,84,88],_={8:"Off",9:"On",10:"Note aftertouch",11:"cc",12:"pc",13:"Channel aftertouch",14:"Pitch"},U={0:0,1:1,2:3,5:4},X=[[0,24],[0,127],[0,127],[40,88],[0,127],[0,127]],V=[36,37];var L=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101,12,13,16,17,18,19],se=[33,99,100,32,102,8,9,10];var v={};x.forEach((e,t)=>{v[e]=t});var d={length:L.length};L.forEach((e,t)=>{d[e]=t});var S=function(){return!!self.Bun||self.debugMode||!1},ie=function(e){let t=[],a=0;return e?.forEach(function(r,i){r==247?t.push(e.subarray(a,i)):r==240&&(a=i+1)}),t.length||t.push(e.subarray(0)),S(),t},F=function(e,t="",a="",r=2){return e?`${t}${e.toString().padStart(r,"0")}${a}`:""},h={ch:128,cc:L.length,nn:128,pl:512,tr:256,cmt:14,rpn:6},et=class extends R{#t=0;#w=0;#b=0;#g=new Array(11);get#h(){return this.#g[this.#w]}set#h(e){this.#g[this.#w]=e}#m=new Uint8Array(h.ch);#B=new Uint8Array(h.ch);#e=new Uint8ClampedArray(h.ch*h.cc);#y=new Uint8ClampedArray(h.ch);#o=new Uint8ClampedArray(h.ch*h.nn);#P=new Uint8Array(h.ch);#c=new Uint16Array(h.pl);#f=new Uint8Array(h.pl);#S=new Int16Array(h.ch);#d=new Uint8Array(h.ch);#C=0;#l=new Uint8Array(h.ch*h.rpn);#O=new Int8Array(h.ch*V.length);#A=new Uint8Array(h.ch);#F=new Uint8Array(128);#H=new Uint8Array(h.cmt*8);#K=new Uint8Array(1024);#G=new Uint8Array(h.cmt*64);#k=0;#u=0;#M=100;#E=0;#_=500;#z=0;#s="";#p=0;#q=0;#W=!0;#r=!1;#X;#Q=new Uint8Array(2);#a=[];#$=new Uint8Array(h.ch);#v=new Uint8Array(h.tr);baseBank=new T("gm","gm2","xg","gs","ns5r","gmega","plg-150vl","plg-150pf","plg-150dx","plg-150an","plg-150dr","plg-100sg","kross");userBank=new T("gm");initOnReset=!1;chRedir(e,t,a){if(this.#v[t])return(this.#v[t]-1)*16+e;if([v.gs,v.ns5r].indexOf(this.#t)>-1){if(a==1)return e;let r=0,i=!0;for(;i;)this.#$[e+r]==0?(this.#$[e+r]=t,console.debug(`Assign track ${t} to channel ${e+r+1}.`),i=!1):this.#$[e+r]==t?i=!1:(r+=16,r>=128&&(r=0,i=!1));return e+r}else return e}#n=[];#T;#i={nOff:(e,t)=>{let a=e*128+t,r=this.#c.lastIndexOf(a);r>-1&&(this.#e[h.cc*e+d[64]]>63&&!this.config?.disableCc64?this.#f[r]=4:(this.#c[r]=0,this.#o[a]=0,this.#f[r]=0))},nOn:(e,t,a)=>{let r=e*128+t,i=0;for(this.#P[e]&&this.#i.ano(e);this.#f[i]>0&&this.#c[i]!=r;)i++;i<h.pl?(this.#c[i]=r,this.#o[r]=a,this.#f[i]=3,this.#d[e]<a&&(this.#d[e]=a)):console.error("Polyphony exceeded.")},nAt:(e,t,a)=>{},cAt:(e,t)=>{},hoOf:e=>{this.#f.forEach((t,a)=>{if(t==4){let r=this.#c[a],i=r>>7;e==i&&(this.#f[a]=0,this.#c[a]=0,this.#o[r]=0)}})},soOf:e=>{},ano:e=>{this.#c.forEach((t,a,r)=>{let i=t>>7,c=t&127;t==0&&this.#o[0]==0||i==e&&this.#i.nOff(i,c)})}};#V={8:function(e){let t=e.channel,a=e.data[0];this.#i.nOff(t,a)},9:function(e){let t=e.channel;this.#m[t]=1;let a=e.data[0],r=e.data[1];r>0?this.#i.nOn(t,a,r):this.#i.nOff(t,a)},10:function(e){let a=e.channel*128+e.data[0];this.#c.indexOf(a)>-1&&(this.#o[a]=data[1])},11:function(e){let t=e.channel;this.#m[t]=1;let a=t*h.cc;switch(e.data[0]){case 96:return;case 97:return;case 120:return;case 121:{this.#i.ano(t),this.#S[t]=0;let r=t*h.cc;this.#e[r+d[1]]=0,this.#e[r+d[5]]=0,this.#e[r+d[64]]=0,this.#e[r+d[65]]=0,this.#e[r+d[66]]=0,this.#e[r+d[67]]=0,this.#e[r+d[11]]=127,this.#e[r+d[101]]=127,this.#e[r+d[100]]=127,this.#e[r+d[99]]=127,this.#e[r+d[98]]=127;return}case 123:{this.#i.ano(t);return}case 124:{this.#i.ano(t);return}case 125:{this.#i.ano(t);return}case 126:{this.#P[t]=1,this.#i.ano(t);return}case 127:{this.#P[t]=0,this.#i.ano(t);return}}if(d[e.data[0]]==null)console.warn(`cc${e.data[0]} is not accepted.`);else{switch(e.data[0]){case 0:{if(S()&&console.debug(`${x[this.#t]}, CH${t+1}: ${e.data[1]}`),this.#t==0)e.data[1]<48?(this.#e[a]>119&&(e.data[1]=this.#e[a],e.data[1]=120,console.debug(`Forced channel ${t+1} to stay drums.`)),e.data[1]>0&&(console.debug(`Roland GS detected with MSB: ${e.data[1]}`),this.switchMode("gs"))):e.data[1]==62?this.switchMode("x5d"):e.data[1]==63?this.switchMode("krs"):(e.data[1]==64||e.data[1]==127)&&this.switchMode("xg");else if(this.#t==v.gs)e.data[1]<56&&this.#e[a]>119&&(e.data[1]=this.#e[a],e.data[1]=120,console.debug(`Forced channel ${t+1} to stay drums.`));else if(this.#t==v.gm)e.data[1]<48?this.#e[a]>119&&(e.data[1]=120,this.switchMode("gs",!0),console.debug(`Forced channel ${t+1} to stay drums.`)):(e.data[1]==64||e.data[1]==127)&&this.switchMode("xg",!0);else if(this.#t==v.x5d){if(e.data[1]>0&&e.data[1]<8)this.switchMode("05rw",!0);else if(e.data[1]==56){let r=0;for(let i=0;i<16;i++){let c=this.#e[h.cc*i];(c==56||c==62)&&r++}r>14&&this.switchMode("ag10",!0)}}break}case 6:{if(this.#C){let r=this.#e[a+d[99]],i=this.#e[a+d[98]];if(r==1){let c=se.indexOf(i);if(c>-1)this.#e[a+d[71+c]]=e.data[1],S()&&console.debug(`Redirected NRPN 1 ${i} to cc${71+c}.`);else{let l=V.indexOf(i);l>-1&&(this.#O[t*10+l]=e.data[1]-64),S()&&console.debug(`CH${t+1} voice NRPN ${i} commit`)}}}else{let r=U[this.#e[a+d[100]]];this.#e[a+d[101]]==0&&r!=null&&(S()&&console.debug(`CH${t+1} RPN 0 ${this.#e[a+d[100]]} commit: ${e.data[1]}`),e.data[1]=Math.min(Math.max(e.data[1],X[r][0]),X[r][1]),this.#l[t*h.rpn+r]=e.data[1])}break}case 38:{this.#C||this.#e[a+101]==0&&U[this.#e[a+100]]!=null&&(this.#l[t*h.rpn+U[this.#e[a+100]]+1]=e.data[1]);break}case 64:{e.data[1]<64&&this.#i.hoOf(t);break}case 66:{console.debug(`Sostenuto pedal: ${e.data[1]}`);break}case 98:case 99:{this.#C=1;break}case 100:case 101:{this.#C=0;break}}this.#e[a+d[e.data[0]]]=e.data[1]}},12:function(e){let t=e.channel;this.#m[t]=1,this.#y[t]=e.data,this.#A[t]=0,S()&&console.debug(`T:${e.track} C:${t} P:${e.data}`)},13:function(e){let t=this,a=e.channel;this.#c.forEach(function(r){let i=r>>7;a==i&&(t.#o[r]=e.data)})},14:function(e){let t=e.channel;this.#S[t]=e.data[1]*128+e.data[0]-8192},15:function(e){ie(e.data).forEach(t=>{let a=t[0],r=t[1];(this.#Y[a]||function(){console.debug(`Unknown manufacturer ${a}.`)})(r,t.subarray(2),e.track)})},248:function(e){},250:function(e){},251:function(e){},252:function(e){},254:function(e){},255:function(e){if((this.#n[e.meta]||function(a,r,i){}).call(this,e.data,e.track,e.meta),e.meta!=32&&(this.#E=0),re.indexOf(e.meta)>-1)return e.reply="meta",e;S()&&console.debug(e)}};#Y={64:(e,t,a)=>{this.#I.run(t,a,e)},65:(e,t,a)=>{if(t[0]<16)this.#x.run(t,a,e),console.warn("Unknown device SysEx!");else{let r=t[t.length-1],i=gsChecksum(t.subarray(2,t.length-1));r==i?this.#x.run(t.subarray(0,t.length-1),a,e):console.warn(`Bad GS checksum ${r}. Should be ${i}.`)}},66:(e,t,a)=>{this.#D.run(t,a,e)},67:(e,t,a)=>{this.#R.run(t,a,e)},68:(e,t,a)=>{this.#J.run(t,a,e)},71:(e,t,a)=>{this.#N.run(t,a,e)},126:(e,t,a)=>{this.#U.run(t,a,e)},127:(e,t,a)=>{this.switchMode("gm"),this.#L.run(t,a,e)}};#U;#L;#R;#x;#D;#I;#N;#J;buildRchTree(){let e=[];this.#B.forEach((t,a)=>{e[t]?.constructor||(e[t]=[]),e[t].push(a)}),this.#X=e}getActive(){let e=this.#m.slice();return this.#t==v.mt32,e}getCc(e){let t=e*h.cc,a=this.#e.slice(t,t+h.cc);return a[d[0]]=a[d[0]]||this.#k,a[d[32]]=a[d[32]]||this.#u,a}getCcAll(){let e=this.#e.slice();for(let t=0;t<h.ch;t++){let a=t*h.cc;e[a+d[0]]=e[a+d[0]]||this.#k,e[a+d[32]]=e[a+d[32]]||this.#u}return e}getPitch(){return this.#S}getProgram(){return this.#y}getTexts(){return this.#a.slice()}getVel(e){let t=new Map,a=this;return a.#c.forEach(function(r,i){let c=Math.floor(r/128),l=r%128;e==c&&a.#o[r]>0&&t.set(l,{v:a.#o[r],s:a.#f[i]})}),t}getBitmap(){return{bitmap:this.#h,expire:this.#b}}getLetter(){return{text:this.#s,expire:this.#p}}getMode(){return x[this.#t]}getMaster(){return{volume:this.#M}}getRawStrength(){let e=this;return this.#c.forEach(function(t){let a=Math.floor(t/128);e.#o[t]>e.#d[a]&&(e.#d[a]=e.#o[t])}),this.#d}getStrength(){let e=[],t=this;return this.getRawStrength().forEach(function(a,r){e[r]=Math.floor(a*t.#e[r*h.cc+d[7]]*t.#e[r*h.cc+d[11]]*t.#M/803288)}),e}getRpn(){return this.#l}getNrpn(){return this.#O}getVoice(e,t,a,r){let i=e||this.#k,c=t,l=a||this.#u;x[this.#t]=="ns5r"&&i>0&&i<56&&(l=3);let u=this.userBank.get(i,c,l,r);if(x[this.#t]=="mt32"&&u.name.indexOf("MT-m:")==0){let p=parseInt(u.name.slice(5)),s=p*h.cmt,o="";this.#G.subarray(s,s+10).forEach(n=>{n>31&&(o+=String.fromCharCode(n))}),this.userBank.load(`MSB	LSB	PRG
0	127	${c}	${o}`,!0),u.name=o,u.ending=" "}return(u.ending!=" "||!u.name.length)&&(u=this.baseBank.get(i,c,l,r)),u}getChVoice(e){let t=this.getVoice(this.#e[e*h.cc+d[0]],this.#y[e],this.#e[e*h.cc+d[32]],x[this.#t]);if(this.#A[e])switch(this.#t){case v.mt32:t.ending="~",t.name="",this.#H.subarray(14*(e-1),14*(e-1)+10).forEach(a=>{a>31&&(t.name+=String.fromCharCode(a))})}return t}init(e=0){this.dispatchEvent("mode","?"),this.#t=0,this.#k=0,this.#u=0,this.#E=0,this.#m.fill(0),this.#e.fill(0),this.#y.fill(0),this.#o.fill(0),this.#c.fill(0),this.#d.fill(0),this.#S.fill(0),this.#O.fill(0),this.#M=100,this.#a=[],this.#_=500,this.#z=0,this.#p=0,this.#s="",this.#b=0,this.#w=0,this.#h.fill(0),this.#r=!1,this.#q=0,this.#W=!0,this.#B.forEach(function(t,a,r){r[a]=a}),this.buildRchTree(),e==0&&(this.#$.fill(0),this.#v.fill(0)),this.#e[h.cc*9]=C[0],this.#e[h.cc*25]=C[0],this.#e[h.cc*41]=C[0],this.#e[h.cc*57]=C[0],this.#Q.fill(0),this.#K.fill(0),this.#G.fill(0),this.#F.fill(0),this.#H.fill(0),this.#A.fill(0),this.userBank.clearRange({msb:0,lsb:127,prg:[0,127]});for(let t=0;t<h.ch;t++){let a=t*h.cc;this.#e[a+d[7]]=100,this.#e[a+d[11]]=127,this.#e[a+d[10]]=64,this.#e[a+d[71]]=64,this.#e[a+d[72]]=64,this.#e[a+d[73]]=64,this.#e[a+d[74]]=64,this.#e[a+d[75]]=64,this.#e[a+d[76]]=64,this.#e[a+d[77]]=64,this.#e[a+d[78]]=64,this.#e[a+d[91]]=40,this.#e[a+d[101]]=127,this.#e[a+d[100]]=127,this.#e[a+d[99]]=127,this.#e[a+d[98]]=127;let r=t*h.rpn;this.#l[r]=2,this.#l[r+1]=64,this.#l[r+2]=0,this.#l[r+3]=64,this.#l[r+4]=0,this.#l[r+5]=0}}switchMode(e,t=!1){let a=x.indexOf(e);if(a>-1){if(this.#t==0||t){this.#t=a,this.#w=0,this.#k=G[0][a],this.#u=G[1][a];for(let r=0;r<h.ch;r++)C.indexOf(this.#e[r*h.cc])>-1&&(this.#e[r*h.cc]=C[a]);switch(this.initOnReset,a){case v.mt32:{mt32DefProg.forEach((r,i)=>{let c=i+1;this.#m[c]||(this.#y[c]=r,this.#e[c*h.cc+d[91]]=127)});break}}this.dispatchEvent("mode",e)}}else throw new Error(`Unknown mode ${e}`)}newStrength(){this.#d.fill(0)}runJson(e){if(e.type>14)return e.type==15&&e.data.constructor!=Uint8Array&&(e.data=Uint8Array.from(e.data)),this.#V[e.type].call(this,e);{let t=this.chRedir(e.part,e.track),a=!1;this.#X[t]?.forEach(r=>{e.channel=r,a=!0,this.#V[e.type].call(this,e)}),a||console.warn(`${_[e.type]?_[e.type]:e.type}${[11,12].includes(e.type)?(e.data[0]!=null?e.data[0]:e.data).toString():""} event sent to CH${t+1} without any recipient.`)}this.#a.length>100&&this.#a.splice(100,this.#a.length-99)}runRaw(e){}constructor(){super();let e=this;this.#h=new Uint8Array(256),this.#g[10]=new Uint8Array(512),this.#T=new w,this.userBank.strictMode=!0,this.userBank.load(`MSB	PRG	LSB	NME
062	000	000	
122	000	000	
122	001	000	
122	002	000	
122	003	000	
122	004	000	
122	005	000	
122	006	000	`),this.#n[1]=function(t){switch(t.slice(0,2)){case"@I":{this.#r=!0,this.#a.unshift(`Kar.Info: ${t.slice(2)}`);break}case"@K":{this.#r=!0,this.#a.unshift("Karaoke mode active."),console.debug(`Karaoke mode active: ${t.slice(2)}`);break}case"@L":{this.#r=!0,this.#a.unshift(`Language: ${t.slice(2)}`);break}case"@T":{this.#r=!0,this.#a.unshift(`Ka.Title: ${t.slice(2)}`);break}case"@V":{this.#r=!0,this.#a.unshift(`Kara.Ver: ${t.slice(2)}`);break}case"XF":{let a=t.slice(2).split(":");switch(a[0]){case"hd":{a.slice(1).forEach((r,i)=>{r.length&&this.#a.unshift(`${["SongDate","SnRegion","SongCat.","SongBeat","SongInst","Sn.Vocal","SongCmp.","SongLrc.","SongArr.","SongPerf","SongPrg.","SongTags"][i]}: ${r}`)});break}case"ln":{a.slice(1).forEach((r,i)=>{r.length&&this.#a.unshift(`${["Kar.Lang","Kar.Name","Kar.Cmp.","Kar.Lrc.","kar.Arr.","Kar.Perf","Kar.Prg."][i]}: ${r}`)});break}default:this.#a.unshift(`XGF_Data: ${t}`)}break}default:this.#r?t[0]=="\\"?this.#a.unshift(`@ ${t.slice(1)}`):t[0]=="/"?this.#a.unshift(t.slice(1)):this.#a[0]+=t:(this.#a[0]=t,this.#a.unshift(""))}},this.#n[2]=function(t){this.#a.unshift(`Copyrite: ${t}`)},this.#n[3]=function(t,a){a<1&&this.#E<1&&this.#a.unshift(`TrkTitle: ${t}`)},this.#n[4]=function(t,a){this.#a.unshift(`${F(this.#E,""," ")}Instrmnt: ${t}`)},this.#n[5]=function(t){t.trim()==""?this.#a.unshift(""):this.#a[0]+=`${t}`},this.#n[6]=function(t){this.#a.unshift(`${F(this.#E,""," ")}C.Marker: ${t}`)},this.#n[7]=function(t){this.#a.unshift(`CuePoint: ${t}`)},this.#n[32]=function(t){this.#E=t[0]+1},this.#n[33]=function(t,a){console.debug(`Track ${a} requests to get assigned to output ${t}.`),e.#v[a]=t+1},this.#n[81]=function(t,a){e.#_=t/1e3},this.#n[127]=function(t,a){e.#T.run(t,a)},this.#T.default=function(t){console.warn(`Unrecognized sequencer-specific byte sequence: ${t}`)},this.#T.add([67,0,1],function(t,a){e.#v[a]=t[0]+1}),this.#U=new w,this.#L=new w,this.#R=new w,this.#x=new w,this.#D=new w,this.#I=new w,this.#N=new w,this.#U.add([9],t=>{e.switchMode(["gm","?","g2"][t[0]-1],!0),e.#r=e.#r||!1,console.info(`MIDI reset: ${["GM","Init","GM2"][t[0]-1]}`),t[0]==2&&e.init()}),this.#L.add([4,1],t=>{e.#M=((t[1]<<7)+t[0])/16383*100}).add([4,3],t=>((t[1]<<7)+t[0]-8192)/8192).add([4,4],t=>t[1]-64),this.#R.add([76,0,0],t=>{switch(t[0]){case 126:{e.switchMode("xg",!0),e.#r=!1,console.info("MIDI reset: XG");break}}}).add([76,6,0],t=>{let a=t[0];a<64?(e.#s=" ".repeat(a),e.#p=Date.now()+3200,t.subarray(1).forEach(function(r){e.#s+=String.fromCharCode(r)}),e.#s=e.#s.padEnd(32," ")):e.#p=Date.now()}).add([76,7,0],t=>{let a=t[0];e.#b=Date.now()+3200,e.#h.fill(0);let r=t.subarray(1);for(let i=0;i<a;i++)r.unshift(0);r.forEach(function(i,c){let l=Math.floor(c/16),u=c%16,p=(u*3+l)*7,s=7,o=0;for(p-=u*5,l==2&&(s=2);o<s;)e.#h[p+o]=i>>6-o&1,o++})}),this.#R.add([43,7,0],(t,a,r)=>{e.#s=" ".repeat(offset),e.#p=Date.now()+3200,t.subarray(1).forEach(function(i){e.#s+=String.fromCharCode(i)}),e.#s=e.#s.padEnd(32," ")}).add([43,7,1],(t,a,r)=>{e.#b=Date.now()+3200,e.#h.fill(0),t.forEach(function(i,c){let l=Math.floor(c/16),u=c%16,p=(u*3+l)*7,s=7,o=0;for(p-=u*5,l==2&&(s=2);o<s;)e.#h[p+o]=i>>6-o&1,o++})}),this.#x.add([66,18,0,0,127],(t,a,r)=>{e.switchMode("gs",!0),e.#e[h.cc*9]=120,e.#e[h.cc*25]=120,e.#e[h.cc*41]=120,e.#e[h.cc*57]=120,e.#u=3,e.#r=!1,e.#$.fill(0),console.info(`GS system to ${["single","dual"][t[0]]} mode.`)}).add([66,18,64,0],(t,a,r)=>{switch(t[0]){case 127:{e.switchMode("gs",!0),e.#e[h.cc*9]=120,e.#e[h.cc*25]=120,e.#e[h.cc*41]=120,e.#e[h.cc*57]=120,e.#r=!1,e.#$.fill(0),console.info("MIDI reset: GS");break}}}).add([69,18,16],t=>{switch(t[0]){case 0:{e.#p=Date.now()+3200;let a=t[1];e.#s=" ".repeat(a),t.subarray(2).forEach(function(r){r<128&&(e.#s+=String.fromCharCode(r))});break}case 32:{e.#b=Date.now()+3200,t[1]==0&&(e.#w=Math.max(Math.min(t[2]-1,9),0));break}default:if(t[0]<11){e.#b=Date.now()+3200,e.#g[t[0]-1]?.length||(e.#g[t[0]-1]=new Uint8Array(256));let a=e.#g[t[0]-1],r=t[1];a.fill(0);let i=t.subarray(2);for(let c=0;c<r;c++)i.unshift(0);i.forEach(function(c,l){let u=Math.floor(l/16),p=l%16,s=(p*4+u)*5,o=5,n=0;for(s-=p*4,u==3&&(o=1);n<o;)a[s+n]=c>>4-n&1,n++})}else console.warn(`Unknown GS display section: ${t[0]}`)}}),this.#x.add([22,18,127],t=>{e.switchMode("mt32",!0),e.#r=!1,e.userBank.clearRange({msb:0,lsb:127,prg:[0,127]}),console.info("MIDI reset: MT-32")}).add([22,18,32],t=>{e.switchMode("mt32");let a=t[1],r=" ".repeat(a);t.subarray(2).forEach(i=>{i>31&&(r+=String.fromCharCode(i))}),e.#s=r.padStart(20," "),e.#p=Date.now()+3200}).add([22,18,82],(t,a)=>{let r=e.chRedir(0,a,!0);for(let i=0;i<16;i++)e.#i.ano(r+i),i&&i<10&&(e.#y[r+i]=mt32DefProg[i-1]);console.info("MT-32 alt reset complete.")}),this.#D.add([66,0],(t,a)=>{e.switchMode("ns5r",!0),e.#r=!1,console.debug(`NS5R mode switch requested: ${["global","multi","prog edit","comb edit","drum edit","effect edit"][t[0]]} mode.`)}).add([66,1],(t,a)=>{e.switchMode(["ns5r","05rw"][t[0]],!0),e.#r=!1}).add([66,18,0,0],(t,a)=>{switch(t[0]){case 124:case 126:case 127:{e.switchMode("ns5r",!0),e.#r=!1;break}}}).add([66,18,8,0],(t,a)=>{}).add([66,125],t=>{e.dispatchEvent("backlight",["green","orange","red",!1,"yellow","blue","purple"][t[0]]||"white")}).add([66,127],t=>{let a=new Uint8Array(5760);korgFilter(t,(r,i,c)=>{if(i<720)for(let l=0;l<8;l++)a[i*8+l]=r>>7-l&1}),e.dispatchEvent("screen",{type:"ns5r",data:a})}).add([76],(t,a,r)=>{e.#D.run([66,...t],a,r)}),this.#I.add([16,0,8,0],(t,a,r)=>{let i=(t[2]<<4)+t[3],c="K11 ";([()=>{e.switchMode("k11",!0),e.#r=!1,e.#u=i?4:0,console.info("MIDI reset: GMega/K11")}][t[0]]||(()=>{}))()}),this.#N.add([66,93,64],(t,a,r)=>{let i=t[2];switch(t[0]){case 0:{switch(t[1]){case 127:{e.switchMode("sg",!0);break}}break}}})}};export{et as OctaviaDevice,h as allocated,d as ccToPos};
