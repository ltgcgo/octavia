var C=function(t,o){let r=Math.min(t.length,o.length),i=t.slice(0,r),s=o.slice(0,r),l=0,a=0;for(;a<r&&l==0;)l=Math.sign(i[a]-s[a]),a++;return l},b=function(){this.pool=[],this.point=function(t,o=!1){if(this.pool.length>0){let r=this.pool.length,i=1<<Math.floor(Math.log2(r)),s=i,l=64;for(;i>=1&&l>=0;){if(l<=0)throw new Error("TTL reached.");if(s==r)s-=i;else{let n=C(t,this.pool[s]);switch(n){case 0:{l=0;break}case 1:{s+i<=r&&(s+=i);break}case-1:{s!=0&&(s-=i);break}default:console.warn(`Unexpected result ${n}.`)}}i=i>>1,l--}let a=!0;if(s>=this.pool.length)a=!1;else{let n=this;this.pool[s].forEach(function(u,f,c){a&&u!=t[f]&&(a=!1)}),!a&&C(t,this.pool[s])>0&&s++}return a||o?s:-1}else return o?0:-1},this.add=function(t,o){return t.data=o,this.pool.splice(this.point(t,!0),0,t),this},this.default=function(t){console.warn(`No match for "${t}". Default action not defined.`)},this.get=function(t){let o=this.point(t);if(o>-1)return this.pool[o].data;this.default(t)},this.run=function(t,...o){let r=this.point(t);r>-1?this.pool[r].data(t.slice(this.pool[r].length),...o):this.default(t,...o)}};var S=class{#t={};addEventListener(t,o){this.#t[t]||(this.#t[t]=[]),this.#t[t].unshift(o)}removeEventListener(t,o){if(this.#t[t]){let r=this.#t[t].indexOf(o);r>-1&&this.#t[t].splice(r,1),this.#t[t].length<1&&delete this.#t[t]}}dispatchEvent(t,o){let r=new Event(t),i=this;r.data=o,this.#t[t]?.length>0&&this.#t[t].forEach(function(s){s?.call(i,r)}),this[`on${t}`]&&this[`on${t}`](r)}};var E=["off","hall","room","stage","plate","delay LCR","delay LR","echo","cross delay","early reflections","gate reverb","reverse gate"].concat(new Array(4),["white room","tunnel","canyon","basement","karaoke"],new Array(43),["pass through","chorus","celeste","flanger","symphonic","rotary speaker","tremelo","auto pan","phaser","distortion","overdrive","amplifier","3-band EQ","2-band EQ","auto wah"],new Array(1),["pitch change","harmonic","touch wah","compressor","noise gate","voice channel","2-way rotary speaker","ensemble detune","ambience"],new Array(4),["talking mod","Lo-Fi","dist + delay","comp + dist + delay","wah + dist + delay","V dist","dual rotor speaker"]),T=["melodic","drum","drum set 1","drum set 2","drum set 3","drum set 4"],Q=[17.1,18.6,20.2,21.8,23.3,24.9,26.5,28,29.6,31.2,32.8,34.3,35.9,37.5,39,40.6,42.2,43.7,45.3,46.9,48.4,50],y=[20,22,25,28,32,36,40,45,50,56,63,70,80,90,100,110,125,140,160,180,200,225,250,280,315,355,400,450,500,560,630,700,800,900,1e3,1100,1200,1400,1600,1800,2e3,2200,2500,2800,3200,3600,4e3,4500,5e3,5600,6300,7e3,8e3,9e3,1e4,11e3,12e3,14e3,16e3,18e3,2e4],G=[0,.04,.08,.13,.17,.21,.25,.29,.34,.38,.42,.46,.51,.55,.59,.63,.67,.72,.76,.8,.84,.88,.93,.97,1.01,1.05,1.09,1.14,1.18,1.22,1.26,1.3,1.35,1.39,1.43,1.47,1.51,1.56,1.6,1.64,1.68,1.72,1.77,1.81,1.85,1.89,1.94,1.98,2.02,2.06,2.1,2.15,2.19,2.23,2.27,2.31,2.36,2.4,2.44,2.48,2.52,2.57,2.61,2.65,2.69,2.78,2.86,2.94,3.03,3.11,3.2,3.28,3.37,3.45,3.53,3.62,3.7,3.87,4.04,4.21,4,37,4.54,4.71,4.88,5.05,5.22,5.38,5.55,5.72,6.06,6.39,6.73,7.07,7.4,7.74,8.08,8.41,8.75,9.08,9.42,9.76,10.1,10.8,11.4,12.1,12.8,13.5,14.1,14.8,15.5,16.2,16.8,17.5,18.2,19.5,20.9,22.2,23.6,24.9,26.2,27.6,28.9,30.3,31.6,33,34.3,37,39.7],A=function(t){let o=.1,r=-.3;return t>66?(o=5,r=315):t>56?(o=1,r=47):t>46&&(o=.5,r=18.5),o*t-r},D=function(t){return t>105?Q[t-106]:t>100?t*1.1-100:t/10};var P=["room 1","room 2","room 3","hall 1","hall 2","plate","delay","panning delay"],U=["chorus 1","chorus 2","chorus 3","chorus 4","feedback","flanger","short delay","short delay feedback"],O=["delay 1","delay 2","delay 3","delay 4","pan delay 1","pan delay 2","pan delay 3","pan delay 4","delay to reverb","pan repeat"];var z={0:"thru",256:"stereo EQ",257:"spectrum",258:"enhancer",259:"humanizer",272:"overdrive",273:"distortion",288:"phaser",289:"auto wah",290:"rotary",291:"stereo flanger",292:"step flanger",293:"tremelo",294:"auto pan",304:"compressor",305:"limiter",320:"hexa chorus",321:"tremelo chorus",322:"stereo chorus",323:"space D",324:"3D chorus",336:"stereo delay",337:"modulated delay",338:"3-tap delay",339:"4-tap delay",340:"tremelo control delay",341:"reverb",342:"gate reverb",343:"3D delay",352:"2-pitch shifter",353:"feedback pitch shifter",368:"3D auto",369:"3D manual",370:"Lo-Fi 1",371:"Lo-Fi 2",512:"overdrive - chorus",513:"overdrive - flanger",514:"overdrive - delay",515:"distortion - chorus",516:"distortion - flanger",517:"distortion - delay",518:"enhancer - chorus",519:"enhancer - flanger",520:"enhancer - delay",521:"chorus - delay",522:"flanger - delay",523:"chorus - flanger",524:"rotary multi",1024:"guitar multi 1",1025:"guitar multi 2",1026:"guitar multi 3",1027:"clean guitar multi 1",1028:"clean guitar multi 2",1029:"bass multi",1030:"rhodes multi",1280:"keyboard multi",4352:"chorus / delay",4353:"flanger / delay",4354:"chorus / flanger",4355:"overdrive / distortion",4356:"overdrive / rotary",4357:"overdrive / phaser",4358:"overdrive / auto wah",4359:"phaser / rotary",4360:"phaser / auto wah"},q={66307:["drive"],66309:["vowel",t=>"aiueo"[t]],94723:["pre-filter"],94724:["Lo-Fi type"],94725:["post-filter"],94979:["Lo-Fi type"],94980:["fill type",t=>["off","LPF","HPF"][t]],94984:["noise type",t=>["white","pink"][t]],94987:["disc type",t=>["LP","SP","EP","RND"]],94990:["hum type",t=>`${t+5}0Hz`],94993:["M/S",t=>["mono","stereo"][t]]},v=function(t){return z[(t[0]<<8)+t[1]]||`0x${t[0].toString(16).padStart(2,"0")}${t[1].toString(16).padStart(2,"0")}`},L=function(t,o,r){let i=(t[0]<<16)+(t[1]<<8)+o,s=q[i]||{},l=s[0];if(l?.length)return l+=`: ${(s[1]||function(){})(r)||r}`,l};var g=function(t=64){return Math.round(2e3*Math.log10(t/64))/100},I=function(t){let o=0;return t.forEach(r=>{o+=r,o>127&&(o%=128)}),128-o};var M=["?","gm","gs","xg","g2","mt32","ns5r","ag10","x5d","05rw","krs","k11","sg"],F=[[0,0,0,0,121,0,0,56,82,81,63,0,0],[0,0,1,0,0,127,0,0,0,0,0,0,0]],w=[120,127,120,127,120,127,61,62,62,62,120,122,127],K=[0,3,81,84,88],N={8:"Off",9:"On",10:"Note aftertouch",11:"cc",12:"pc",13:"Channel aftertouch",14:"Pitch"},R={0:0,1:1,2:3,5:4},B=[[0,24],[0,127],[0,127],[40,88],[0,127],[0,127]],H=[36,37];var k=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101,12,13,16,17,18,19],V=[33,99,100,32,102,8,9,10],x={};M.forEach((t,o)=>{x[t]=o});var h={length:k.length};k.forEach((t,o)=>{h[t]=o});var J=function(t){let o=[[]];return t?.forEach(function(r){r==247||(r==240?o.push([]):o[o.length-1].push(r))}),o},X=function(t,o="",r="",i=2){return t?`${o}${t.toString().padStart(i,"0")}${r}`:""},d={ch:128,cc:k.length,nn:128,pl:512,tr:256,rpn:6},ce=class extends S{#t=0;#b=0;#x=0;#w=new Array(10);get#d(){return this.#w[this.#b]}set#d(t){this.#w[this.#b]=t}#y=new Uint8Array(d.ch);#R=new Uint8Array(d.ch);#e=new Uint8ClampedArray(d.ch*d.cc);#m=new Uint8ClampedArray(d.ch);#o=new Uint8ClampedArray(d.ch*d.nn);#M=new Uint8Array(d.ch);#n=new Uint16Array(d.pl);#k=new Int16Array(d.ch);#A=new Array(d.ch);#h=new Uint8Array(d.ch);#C=0;#r=new Uint8Array(d.ch*d.rpn);#D=new Int8Array(d.ch*H.length);#S=0;#E=0;#f=100;#c=0;#a="";#T=0;#s=!1;#I;#u=new Uint8Array(2);#i=[];#$=new Uint8Array(d.ch);#v=new Uint8Array(d.tr);chRedir(t,o,r){if(this.#v[o])return(this.#v[o]-1)*16+t;if([x.gs,x.ns5r].indexOf(this.#t)>-1){if(r==1)return t;let i=0,s=!0;for(;s;)this.#$[t+i]==0?(this.#$[t+i]=o,console.debug(`Assign track ${o} to channel ${t+i+1}.`),s=!1):this.#$[t+i]==o?s=!1:(i+=16,i>=128&&(i=0,s=!1));return t+i}else return t}#l=[];#P;#g={ano:t=>{this.#n.forEach((o,r,i)=>{let s=o>>7;o==0&&this.#o[0]==0||s==t&&(this.#o[o]=0,i[r]=0)})}};#F={8:function(t){let r=t.channel*128+t.data[0],i=this.#n.indexOf(r);i>-1&&(this.#n[i]=0,this.#o[r]=0)},9:function(t){let o=t.channel;this.#y[o]=1;let r=o*128+t.data[0];if(t.data[1]>0){let i=0;for(;this.#n[i]>0;)i++;i<this.#n.length?(this.#n[i]=r,this.#o[r]=t.data[1],this.#h[o]<t.data[1]&&(this.#h[o]=t.data[1])):console.error("Polyphony exceeded.")}else{let i=this.#n.indexOf(r);i>-1&&(this.#n[i]=0,this.#o[r]=0)}},10:function(t){let r=t.channel*128+t.data[0];this.#n.indexOf(r)>-1&&(this.#o[r]=data[1])},11:function(t){let o=t.channel;this.#y[o]=1;let r=o*d.cc;switch(t.data[0]){case 96:return;case 97:return;case 120:return;case 121:{this.#g.ano(o),this.#k[o]=0;let i=o*d.cc;this.#e[i+h[1]]=0,this.#e[i+h[5]]=0,this.#e[i+h[64]]=0,this.#e[i+h[65]]=0,this.#e[i+h[66]]=0,this.#e[i+h[67]]=0,this.#e[i+h[11]]=127,this.#e[i+h[101]]=127,this.#e[i+h[100]]=127,this.#e[i+h[99]]=127,this.#e[i+h[98]]=127;return}case 123:{this.#g.ano(o);return}case 124:{this.#g.ano(o);return}case 125:{this.#g.ano(o);return}case 126:{this.#M[o]=1,this.#g.ano(o);return}case 127:{this.#M[o]=0,this.#g.ano(o);return}}if(h[t.data[0]]==null)console.warn(`cc${t.data[0]} is not accepted.`);else{switch(t.data[0]){case 0:{if(this.#t==0)t.data[1]<48?(this.#e[r]>119&&(t.data[1]=this.#e[r],t.data[1]=120,console.debug(`Forced channel ${o+1} to stay drums.`)),t.data[1]>0&&(console.debug(`Roland GS detected with MSB: ${t.data[1]}`),this.switchMode("gs"))):t.data[1]==62?this.switchMode("x5d"):t.data[1]==63&&this.switchMode("krs");else if(this.#t==x.gs)t.data[1]<56&&this.#e[r]>119&&(t.data[1]=this.#e[r],t.data[1]=120,console.debug(`Forced channel ${o+1} to stay drums.`));else if(this.#t==x.gm)t.data[1]<48&&this.#e[r]>119&&(t.data[1]=120,this.switchMode("gs",!0),console.debug(`Forced channel ${o+1} to stay drums.`));else if(this.#t==x.x5d){if(t.data[1]>0&&t.data[1]<8)this.switchMode("05rw",!0);else if(t.data[1]==56){let i=0;for(let s=0;s<16;s++){let l=this.#e[d.cc*s];(l==56||l==62)&&i++}i>14&&this.switchMode("ag10",!0)}}break}case 6:{if(this.#C){let i=this.#e[r+h[99]],s=this.#e[r+h[98]];if(i==1){let l=V.indexOf(s);if(l>-1)this.#e[r+h[71+l]]=t.data[1],console.debug(`Redirected NRPN 1 ${s} to cc${71+l}.`);else{let a=H.indexOf(s);a>-1&&(this.#D[o*10+a]=t.data[1]-64),console.debug(`CH${o+1} voice NRPN ${s} commit`)}}}else{let i=R[this.#e[r+h[100]]];this.#e[r+h[101]]==0&&i!=null&&(console.debug(`CH${o+1} RPN 0 ${this.#e[r+h[100]]} commit: ${t.data[1]}`),t.data[1]=Math.min(Math.max(t.data[1],B[i][0]),B[i][1]),this.#r[o*d.rpn+i]=t.data[1])}break}case 38:{this.#C||this.#e[r+101]==0&&R[this.#e[r+100]]!=null&&(this.#r[o*d.rpn+R[this.#e[r+100]]+1]=t.data[1]);break}case 98:case 99:{this.#C=1;break}case 100:case 101:{this.#C=0;break}}this.#e[r+h[t.data[0]]]=t.data[1]}},12:function(t){let o=t.channel;this.#y[o]=1,this.#m[o]=t.data,this.#A[o]=0},13:function(t){let o=this,r=t.channel;this.#n.forEach(function(i){let s=i>>7;r==s&&(o.#o[i]=t.data)})},14:function(t){let o=t.channel;this.#k[o]=t.data[1]*128+t.data[0]-8192},15:function(t){J(t.data).forEach(o=>{let r=o[0],i=o[1];(this.#X[r]||function(){console.debug(`Unknown manufacturer ${r}.`)})(i,o.slice(2),t.track)})},255:function(t){if((this.#l[t.meta]||function(r,i,s){}).call(this,t.data,t.track,t.meta),t.meta!=32&&(this.#c=0),K.indexOf(t.meta)>-1)return t.reply="meta",t;self.debugMode&&console.debug(t)}};#X={64:(t,o,r)=>{this.#L.run(o,r,t)},65:(t,o,r)=>{if(o[0]<64)this.#p.run(o,r,t);else{let i=o.pop(),s=I(o.slice(2));i==s?this.#p.run(o,r,t):console.warn(`Bad GS checksum ${i}. Should be ${s}.`)}},66:(t,o,r)=>{this.#N.run(o,r,t)},67:(t,o,r)=>{this.#G.run(o,r,t)},68:(t,o,r)=>{this.#H.run(o,r,t)},71:(t,o,r)=>{this.#B.run(o,r,t)},126:(t,o,r)=>{this.#U.run(o,r,t)},127:(t,o,r)=>{this.switchMode("gm"),this.#O.run(o,r,t)}};#U;#O;#G;#p;#N;#L;#B;#H;buildRchTree(){let t=[];this.#R.forEach((o,r)=>{t[o]?.constructor||(t[o]=[]),t[o].push(r)}),this.#I=t}getActive(){let t=this.#y.slice();return this.#t==x.mt32,t}getCc(t){let o=t*d.cc,r=this.#e.slice(o,o+d.cc);return r[h[0]]=r[h[0]]||this.#S,r[h[32]]=r[h[32]]||this.#E,r}getCcAll(){let t=this.#e.slice();for(let o=0;o<64;o++){let r=o*d.cc;t[r+h[0]]=t[r+h[0]]||this.#S,t[r+h[32]]=t[r+h[32]]||this.#E}return t}getPitch(){return this.#k}getProgram(){return this.#m}getTexts(){return this.#i.slice()}getVel(t){let o=new Map,r=this;return this.#n.forEach(function(i){let s=Math.floor(i/128),l=i%128;t==s&&r.#o[i]>0&&o.set(l,r.#o[i])}),o}getBitmap(){return{bitmap:this.#d,expire:this.#x}}getCustomNames(){return this.#A.slice()}getLetter(){return{text:this.#a,expire:this.#T}}getMode(){return M[this.#t]}getMaster(){return{volume:this.#f}}getRawStrength(){let t=this;return this.#n.forEach(function(o){let r=Math.floor(o/128);t.#o[o]>t.#h[r]&&(t.#h[r]=t.#o[o])}),this.#h}getStrength(){let t=[],o=this;return this.getRawStrength().forEach(function(r,i){t[i]=Math.floor(r*o.#e[i*d.cc+h[7]]*o.#e[i*d.cc+h[11]]*o.#f/803288)}),t}getRpn(){return this.#r}getNrpn(){return this.#D}init(t=0){this.dispatchEvent("mode","?"),this.#t=0,this.#S=0,this.#E=0,this.#c=0,this.#y.fill(0),this.#e.fill(0),this.#m.fill(0),this.#o.fill(0),this.#n.fill(0),this.#h.fill(0),this.#k.fill(0),this.#D.fill(0),this.#f=100,this.#i=[],this.#T=0,this.#a="",this.#x=0,this.#b=0,this.#d.fill(0),this.#A.fill(0),this.#s=!1,this.#R.forEach(function(o,r,i){i[r]=r}),this.buildRchTree(),this.#$.fill(0),this.#v.fill(0),this.#e[d.cc*9]=w[0],this.#e[d.cc*25]=w[0],this.#e[d.cc*41]=w[0],this.#e[d.cc*57]=w[0],this.#u.fill(0);for(let o=0;o<64;o++){let r=o*d.cc;this.#e[r+h[7]]=100,this.#e[r+h[11]]=127,this.#e[r+h[10]]=64,this.#e[r+h[71]]=64,this.#e[r+h[72]]=64,this.#e[r+h[73]]=64,this.#e[r+h[74]]=64,this.#e[r+h[75]]=64,this.#e[r+h[76]]=64,this.#e[r+h[77]]=64,this.#e[r+h[78]]=64,this.#e[r+h[91]]=40,this.#e[r+h[101]]=127,this.#e[r+h[100]]=127,this.#e[r+h[99]]=127,this.#e[r+h[98]]=127;let i=o*d.rpn;this.#r[i]=2,this.#r[i+1]=64,this.#r[i+2]=0,this.#r[i+3]=64,this.#r[i+4]=0,this.#r[i+5]=0}}switchMode(t,o=!1){let r=M.indexOf(t);if(r>-1){if(this.#t==0||o){this.#t=r,this.#b=0,this.#S=F[0][r],this.#E=F[1][r];for(let i=0;i<64;i++)w.indexOf(this.#e[i*d.cc])>-1&&(this.#e[i*d.cc]=w[r]);this.dispatchEvent("mode",t)}}else throw new Error(`Unknown mode ${t}`)}newStrength(){this.#h.fill(0)}runJson(t){if(t.type>14)return this.#F[t.type].call(this,t);{let o=this.chRedir(t.part,t.track),r=!1;this.#I[o]?.forEach(i=>{t.channel=i,r=!0,this.#F[t.type].call(this,t)}),r||console.warn(`${N[t.type]?N[t.type]:t.type}${[11,12].includes(t.type)?(t.data[0]!=null?t.data[0]:t.data).toString():""} event sent to CH${o+1} without any recipient.`)}}runRaw(t){}constructor(){super();let t=this;this.#d=new Uint8Array(256),this.#P=new b,this.#l[1]=function(i){switch(i.slice(0,2)){case"@I":{this.#s=!0,this.#i.unshift(`Kar.Info: ${i.slice(2)}`);break}case"@K":{this.#s=!0,this.#i.unshift("Karaoke mode active."),console.debug(`Karaoke mode active: ${i.slice(2)}`);break}case"@L":{this.#s=!0,this.#i.unshift(`Language: ${i.slice(2)}`);break}case"@T":{this.#s=!0,this.#i.unshift(`Ka.Title: ${i.slice(2)}`);break}case"@V":{this.#s=!0,this.#i.unshift(`Kara.Ver: ${i.slice(2)}`);break}default:this.#s?i[0]=="\\"?this.#i.unshift(`@ ${i.slice(1)}`):i[0]=="/"?this.#i.unshift(i.slice(1)):this.#i[0]+=i:(this.#i[0]=i,this.#i.unshift(""))}},this.#l[2]=function(i){this.#i.unshift(`Copyrite: ${i}`)},this.#l[3]=function(i,s){s<1&&this.#c<1&&this.#i.unshift(`TrkTitle: ${i}`)},this.#l[4]=function(i,s){s<1&&this.#c<1&&this.#i.unshift(`${X(this.#c,""," ")}Instrmnt: ${i}`)},this.#l[5]=function(i){i.trim()==""?this.#i.unshift(""):this.#i[0]+=`${i}`},this.#l[6]=function(i){this.#i.unshift(`${X(this.#c,""," ")}C.Marker: ${i}`)},this.#l[7]=function(i){this.#i.unshift(`CuePoint: ${i}`)},this.#l[32]=function(i){this.#c=i[0]+1},this.#l[33]=function(i,s){console.debug(`Track ${s} requests to get assigned to output ${i}.`),t.#v[s]=i+1},this.#l[127]=function(i,s){t.#P.run(i,s)},this.#P.add([67,0,1],function(i,s){t.#v[s]=i[0]+1}),this.#U=new b,this.#O=new b,this.#G=new b,this.#p=new b,this.#N=new b,this.#L=new b,this.#B=new b,this.#H=new b,this.#U.add([9],i=>{t.switchMode(["gm","?","g2"][i[0]-1],!0),t.#s=t.#s||!1,console.info(`MIDI reset: ${["GM","Init","GM2"][i[0]-1]}`),i[0]==2&&t.init()}),this.#p.add([22,18,127,0,0,1],()=>{t.switchMode("mt32",!0),t.#s=!1,console.info("MIDI reset: MT-32")}),this.#L.add([16,0,8,0,0,0,0],()=>{t.switchMode("k11",!0),t.#s=!1,console.info("MIDI reset: KAWAI GMega/K11")}),this.#O.add([4,1],i=>{t.#f=((i[1]<<7)+i[0])/16383*100}).add([4,3],i=>((i[1]<<7)+i[0]-8192)/8192).add([4,4],i=>i[1]-64),this.#G.add([76,0,0],i=>{switch(i[0]){case 126:{t.switchMode("xg",!0),t.#s=!1,console.info("MIDI reset: XG");break}default:{let s=[0,0,0,0],l=(a,n)=>{s[n]=a};if(i.slice(1).forEach((a,n)=>{let u=n+i[0];[l,l,l,l,f=>{this.#f=f*129/16383*100},f=>{},f=>{}][u](a,n)}),i[0]<4){let a=0;s.forEach(n=>{a=a<<4,a+=n}),a-=1024}}}}).add([76,2,1],i=>{let s="XG ";i[0]<32?(s+="reverb ",i.slice(1).forEach((l,a)=>{([n=>{console.info(`${s}main type: ${E[n]}`)},n=>{console.debug(`${s}sub type: ${n+1}`)},n=>{console.debug(`${s}time: ${A(n)}s`)},n=>{console.debug(`${s}diffusion: ${n}`)},n=>{console.debug(`${s}initial delay: ${n}`)},n=>{console.debug(`${s}HPF cutoff: ${y[n]}Hz`)},n=>{console.debug(`${s}LPF cutoff: ${y[n]}Hz`)},n=>{console.debug(`${s}width: ${n}`)},n=>{console.debug(`${s}height: ${n}`)},n=>{console.debug(`${s}depth: ${n}`)},n=>{console.debug(`${s}wall type: ${n}`)},n=>{console.debug(`${s}dry/wet: ${n}`)},n=>{console.debug(`${s}send: ${g(n)}dB`)},n=>{console.debug(`${s}pan: ${n-64}`)},!1,!1,n=>{console.debug(`${s}delay: ${n}`)},n=>{console.debug(`${s}density: ${n}`)},n=>{console.debug(`${s}balance: ${n}`)},n=>{},n=>{console.debug(`${s}feedback: ${n}`)},n=>{}][i[0]+a]||function(){console.warn(`Unknown XG reverb address: ${i[0]}.`)})(l)})):i[0]<64?(s+="chorus ",i.slice(1).forEach((l,a)=>{([n=>{console.info(`${s}main type: ${E[n]}`)},n=>{console.debug(`${s}sub type: ${n+1}`)},n=>{console.debug(`${s}LFO: ${G[n]}Hz`)},n=>{},n=>{console.debug(`${s}feedback: ${n}`)},n=>{console.debug(`${s}delay offset: ${D(n)}ms`)},n=>{},n=>{console.debug(`${s}low: ${y[n]}Hz`)},n=>{console.debug(`${s}low: ${n-64}dB`)},n=>{console.debug(`${s}high: ${y[n]}Hz`)},n=>{console.debug(`${s}high: ${n-64}dB`)},n=>{console.debug(`${s}dry/wet: ${n}`)},n=>{console.debug(`${s}send: ${g(n)}dB`)},n=>{console.debug(`${s}pan: ${n-64}`)},n=>{console.debug(`${s}to reverb: ${g(n)}dB`)},!1,n=>{},n=>{},n=>{},n=>{console.debug(`${s}LFO phase diff: ${(n-64)*3}deg`)},n=>{console.debug(`${s}input mode: ${n?"stereo":"mono"}`)},n=>{}][i[0]-32+a]||function(){console.warn(`Unknown XG chorus address: ${i[0]}.`)})(l)})):i[0]<86?(s+="variation ",i[0]==64&&console.info(`${s}type: ${E[i[1]]}${i[2]>0?" "+(i[2]+1):""}`)):i[0]<97?(s+="variation ",i.slice(1).forEach((l,a)=>{[n=>{console.debug(`${s}send: ${g(n)}dB`)},n=>{console.debug(`${s}pan: ${n-64}`)},n=>{console.debug(`${s}to reverb: ${g(n)}dB`)},n=>{console.debug(`${s}to chorus: ${g(n)}dB`)},n=>{console.debug(`${s}connection: ${n?"system":"insertion"}`)},n=>{console.debug(`${s}channel: CH${n+1}`)},n=>{console.debug(`${s}mod wheel: ${n-64}`)},n=>{console.debug(`${s}bend wheel: ${n-64}`)},n=>{console.debug(`${s}channel after touch: ${n-64}`)},n=>{console.debug(`${s}AC1: ${n-64}`)},n=>{console.debug(`${s}AC2: ${n-64}`)}][i[0]-86+a](l)})):i[0]>111&&i[0]<118?s+="variation ":console.warn(`Unknown XG variation address: ${i[0]}`)}).add([76,2,64],i=>{i.slice(1).forEach((s,l)=>{let a=l+i[0];if(a==0)console.debug(`XG EQ preset: ${["flat","jazz","pop","rock","classic"][s]}`);else{let n=a-1>>2,u=a-1&3,f=`XG EQ ${n} ${["gain","freq","Q","shape"][u]}: `;[()=>{console.debug(`${f}${s-64}dB`)},()=>{console.debug(`${f}${s} (raw)`)},()=>{console.debug(`${f}${s/10}`)},()=>{console.debug(`${f}${["shelf","peak"][+!!s]}`)}][u]()}})}).add([76,3],i=>{}).add([76,6,0],i=>{let s=i[0];t.#a=" ".repeat(s),t.#T=Date.now()+3200,i.slice(1).forEach(function(l){t.#a+=String.fromCharCode(l)}),t.#a=t.#a.padEnd(32," ")}).add([76,7,0],i=>{let s=i[0];t.#x=Date.now()+3200,t.#d.fill(0);let l=i.slice(1);for(let a=0;a<s;a++)l.unshift(0);l.forEach(function(a,n){let u=Math.floor(n/16),f=n%16,c=(f*3+u)*7,p=7,$=0;for(c-=f*5,u==2&&(p=2);$<p;)t.#d[c+$]=a>>6-$&1,$++})}).add([76,8],(i,s)=>{let l=t.chRedir(i[0],s,!0),a=i[1],n=d.cc*l,u=`XG CH${l+1} `,f=`Unknown XG part address ${a}.`;a<1?console.debug(f):a<41?i.slice(2).forEach((c,p)=>{([()=>{t.#e[n+h[0]]=c},()=>{t.#e[n+h[32]]=c},()=>{t.#m[l]=c},()=>{let $=t.chRedir(c,s,!0);t.#R[l]=$,l!=$&&(t.buildRchTree(),console.info(`${u}receives from CH${$+1}`))},()=>{t.#M[l]=+!c},()=>{},()=>{t.#e[n+h[0]]=c>1?127:0,console.debug(`${u}type: ${T[c]}`)},()=>{t.#e[d.rpn*l+3]=c},!1,!1,()=>{t.#e[n+h[7]]=c},!1,!1,()=>{t.#e[n+h[10]]=c||128},!1,!1,()=>{t.#e[n+h[11]]=c},()=>{t.#e[n+h[93]]=c},()=>{t.#e[n+h[91]]=c},()=>{t.#e[n+h[94]]=c},()=>{t.#e[n+h[76]]=c},()=>{t.#e[n+h[77]]=c},()=>{t.#e[n+h[78]]=c},()=>{t.#e[n+h[74]]=c},()=>{t.#e[n+h[71]]=c},()=>{t.#e[n+h[73]]=c},()=>{t.#e[n+h[75]]=c},()=>{t.#e[n+h[72]]=c}][a+p-1]||function(){})()}):a<48?console.debug(f):a<111?a>102&&a<105&&(t.#e[n+h[[5,65][a&1]]]=e):a<114?console.debug(f):a<116?console.debug(`${u}EQ ${["bass","treble"][a&1]} gain: ${e-64}dB`):a<118?console.debug(f):a<120?console.debug(`${u}EQ ${["bass","treble"][a&1]} freq: ${e}`):console.debug(f)}).add([76,10],i=>{}).add([76,16],i=>{}).add([76,17,0,0],i=>{}).add([112],i=>{console.debug(`XG plugin PLG100-${["VL","SG","DX"][i[0]]} enabled for channel ${i[2]+1}.`)}),this.#G.add([76,48],i=>{}).add([76,49],i=>{}).add([76,50],i=>{}).add([76,51],i=>{}),this.#p.add([66,18,0,0,127],i=>{t.switchMode("gs",!0),t.#e[d.cc*9]=120,t.#e[d.cc*25]=120,t.#e[d.cc*41]=120,t.#e[d.cc*57]=120,t.#E=3,t.#s=!1,t.#$.fill(0),console.info(`GS system to ${["single","dual"][i[0]]} mode.`)}).add([66,18,64,0],i=>{switch(i[0]){case 127:{t.switchMode("gs",!0),t.#e[d.cc*9]=120,t.#e[d.cc*25]=120,t.#e[d.cc*41]=120,t.#e[d.cc*57]=120,t.#s=!1,t.#$.fill(0),console.info("MIDI reset: GS");break}default:{let s=[0,0,0,0],l=(a,n)=>{s[n]=a};if(i.slice(1).forEach((a,n)=>{let u=n+i[0];[l,l,l,l,f=>{this.#f=f*129/16383*100},f=>{},f=>{}][u](a,n)}),i[0]<4){let a=0;s.forEach(n=>{a=a<<4,a+=n}),a-=1024}}}}).add([66,18,64,1],i=>{let s=i[0];if(s<16){let l="".padStart(s," ");i.slice(1).forEach((a,n)=>{l+=String.fromCharCode(Math.max(32,a))}),l=l.padEnd(16," "),console.debug(`GS patch name: ${l}`)}else s<48||(s<65?i.slice(1).forEach((l,a)=>{let n=`GS ${s+a>55?"chorus":"reverb"} `;([()=>{console.info(`${n}type: ${P[l]}`)},()=>{},()=>{},()=>{},()=>{},()=>{},!1,()=>{console.debug(`${n}predelay: ${l}ms`)},()=>{console.info(`${n}type: ${U[l]}`)},()=>{},()=>{},()=>{},()=>{},()=>{},()=>{},()=>{console.debug(`${n}to reverb: ${g(l)}`)},()=>{console.debug(`${n}to delay: ${g(l)}`)}][s+a-48]||function(){})()}):s<80?console.debug(`Unknown GS patch address: ${s}`):s<91?i.slice(1).forEach((l,a)=>{let n="GS delay ";([()=>{console.info(`${n}type: ${O[l]}`)},()=>{},()=>{},()=>{},()=>{},()=>{},()=>{},()=>{},()=>{},()=>{},()=>{console.debug(`${n}to reverb: ${g(l)}`)}][s+a-80]||function(){})()}):console.debug(`Unknown GS patch address: ${s}`))}).add([66,18,64,2],i=>{let s="GS EQ ";i.slice(1).forEach((l,a)=>{([()=>{console.debug(`${s}low freq: ${[200,400][l]}Hz`)},()=>{console.debug(`${s}low gain: ${l-64}dB`)},()=>{console.debug(`${s}high freq: ${[3e3,6e3][l]}Hz`)},()=>{console.debug(`${s}high gain: ${l-64}dB`)}][i[0]+a]||function(){console.warn(`Unknown GS EQ address: ${i[0]+a}`)})()})}).add([66,18,64,3],i=>{let s="GS EFX ",l=function(a,n){let u=L(t.#u,n,a);u&&console.debug(`${s}${v(t.#u)} ${u}`)};i.slice(1).forEach((a,n)=>{([()=>{t.#u[0]=a},()=>{t.#u[1]=a,console.info(`${s}type: ${v(t.#u)}`)},!1,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,()=>{console.debug(`${s}to reverb: ${g(a)}dB`)},()=>{console.debug(`${s}to chorus: ${g(a)}dB`)},()=>{console.debug(`${s}to delay: ${g(a)}dB`)},!1,()=>{console.debug(`${s}1 source: ${a}`)},()=>{console.debug(`${s}1 depth: ${a-64}`)},()=>{console.debug(`${s}2 source: ${a}`)},()=>{console.debug(`${s}2 depth: ${a-64}`)},()=>{console.debug(`${s}to EQ: ${a?"ON":"OFF"}`)}][i[0]+n]||function(u,f){console.warn(`Unknown GS EFX address: ${f}`)})(a,i[0]+n)})}).add([66,18,65],i=>{}).add([69,18,16],i=>{switch(i[0]){case 0:{t.#T=Date.now()+3200;let s=i[1];t.#a=" ".repeat(s),i.slice(2).forEach(function(l){l<128&&(t.#a+=String.fromCharCode(l))});break}case 32:{t.#x=Date.now()+3200,i[1]==0&&(t.#b=Math.max(Math.min(i[2]-1,9),0));break}default:if(i[0]<11){t.#x=Date.now()+3200,t.#w[i[0]-1]?.length||(t.#w[i[0]-1]=new Uint8Array(256));let s=t.#w[i[0]-1],l=i[1];s.fill(0);let a=i.slice(2);for(let n=0;n<l;n++)a.unshift(0);a.forEach(function(n,u){let f=Math.floor(u/16),c=u%16,p=(c*4+f)*5,$=5,m=0;for(p-=c*4,f==3&&($=1);m<$;)s[p+m]=n>>4-m&1,m++})}else console.warn(`Unknown GS display section: ${i[0]}`)}});let o=function(i,s,l){let a=i[0],n=d.cc*s,u=d.rpn*s,f=`GS CH${s+1} `;a<3?i.slice(1).forEach((c,p)=>{[()=>{t.#e[n+h[0]]=c},()=>{t.#m[s]=c},()=>{let $=t.chRedir(c,l,!0);t.#R[s]=$,s!=c&&(t.buildRchTree(),console.info(`${f}receives from CH${$+1}`))}][a+p]()}):a<19||(a<44?i.slice(1).forEach((c,p)=>{([()=>{t.#M[s]=+!c},!1,()=>{t.#e[n+h[0]]=c?120:0,console.debug(`${f}type: ${c?"drum ":"melodic"}${c||""}`)},()=>{t.#r[u+3]=c},!1,()=>{t.#e[n+h[7]]=c},!1,!1,()=>{t.#e[n+h[10]]=c||128},!1,!1,()=>{console.debug(`${f}CC 1: cc${c}`)},()=>{console.debug(`${f}CC 2: cc${c}`)},()=>{t.#e[n+h[93]]=c},()=>{t.#e[n+h[91]]=c},!1,!1,()=>{t.#r[u+1]=c},()=>{t.#r[u+2]=c},()=>{t.#e[n+h[94]]=c}][a+p-19]||function(){})()}):a<76||console.debug(`Unknown GS part address: ${a}`))},r=function(i,s){let l=i[0],a=`GS CH${s+1} `;l<2?i.slice(1).forEach((n,u)=>{[()=>{t.#e[d.cc*s+h[32]]=n},()=>{}][l+u]()}):l<32?console.warn(`Unknown GS misc address: ${l}`):l<35?i.slice(1).forEach((n,u)=>{[()=>{console.debug(`${a}EQ: o${["ff","n"][n]}`)},()=>{},()=>{console.debug(`${a}EFX: o${["ff","n"][n]}`)}][l+u-32]()}):console.warn(`Unknown GS misc address: ${l}`)};this.#p.add([66,18,64,16],(i,s)=>{o(i,t.chRedir(9,s,!0),s)}).add([66,18,64,17],(i,s)=>{o(i,t.chRedir(0,s,!0),s)}).add([66,18,64,18],(i,s)=>{o(i,t.chRedir(1,s,!0),s)}).add([66,18,64,19],(i,s)=>{o(i,t.chRedir(2,s,!0),s)}).add([66,18,64,20],(i,s)=>{o(i,t.chRedir(3,s,!0),s)}).add([66,18,64,21],(i,s)=>{o(i,t.chRedir(4,s,!0),s)}).add([66,18,64,22],(i,s)=>{o(i,t.chRedir(5,s,!0),s)}).add([66,18,64,23],(i,s)=>{o(i,t.chRedir(6,s,!0),s)}).add([66,18,64,24],(i,s)=>{o(i,t.chRedir(7,s,!0),s)}).add([66,18,64,25],(i,s)=>{o(i,t.chRedir(8,s,!0),s)}).add([66,18,64,26],(i,s)=>{o(i,t.chRedir(10,s,!0),s)}).add([66,18,64,27],(i,s)=>{o(i,t.chRedir(11,s,!0),s)}).add([66,18,64,28],(i,s)=>{o(i,t.chRedir(12,s,!0),s)}).add([66,18,64,29],(i,s)=>{o(i,t.chRedir(13,s,!0),s)}).add([66,18,64,30],(i,s)=>{o(i,t.chRedir(14,s,!0),s)}).add([66,18,64,31],(i,s)=>{o(i,t.chRedir(15,s,!0),s)}).add([66,18,64,64],(i,s)=>{r(i,t.chRedir(9,s,!0))}).add([66,18,64,65],(i,s)=>{r(i,t.chRedir(0,s,!0))}).add([66,18,64,66],(i,s)=>{r(i,t.chRedir(1,s,!0))}).add([66,18,64,67],(i,s)=>{r(i,t.chRedir(2,s,!0))}).add([66,18,64,68],(i,s)=>{r(i,t.chRedir(3,s,!0))}).add([66,18,64,69],(i,s)=>{r(i,t.chRedir(4,s,!0))}).add([66,18,64,70],(i,s)=>{r(i,t.chRedir(5,s,!0))}).add([66,18,64,71],(i,s)=>{r(i,t.chRedir(6,s,!0))}).add([66,18,64,72],(i,s)=>{r(i,t.chRedir(7,s,!0))}).add([66,18,64,73],(i,s)=>{r(i,t.chRedir(8,s,!0))}).add([66,18,64,74],(i,s)=>{r(i,t.chRedir(10,s,!0))}).add([66,18,64,75],(i,s)=>{r(i,t.chRedir(11,s,!0))}).add([66,18,64,76],(i,s)=>{r(i,t.chRedir(12,s,!0))}).add([66,18,64,77],(i,s)=>{r(i,t.chRedir(13,s,!0))}).add([66,18,64,78],(i,s)=>{r(i,t.chRedir(14,s,!0))}).add([66,18,64,79],(i,s)=>{r(i,t.chRedir(15,s,!0))})}};export{ce as OctaviaDevice,d as allocated,h as ccToPos};
