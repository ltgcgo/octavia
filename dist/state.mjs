var E=function(t,e){let n=Math.min(t.length,e.length),i=t.slice(0,n),o=e.slice(0,n),s=0,r=0;for(;r<n&&s==0;)s=Math.sign(i[r]-o[r]),r++;return s},g=function(){this.pool=[],this.point=function(t,e=!1){if(this.pool.length>0){let n=this.pool.length,i=1<<Math.floor(Math.log2(n)),o=i,s=64;for(;i>=1&&s>=0;){if(s<=0)throw new Error("TTL reached.");if(o==n)o-=i;else{let a=E(t,this.pool[o]);switch(a){case 0:{s=0;break}case 1:{o+i<=n&&(o+=i);break}case-1:{o!=0&&(o-=i);break}default:console.warn(`Unexpected result ${a}.`)}}i=i>>1,s--}let r=!0;if(o>=this.pool.length)r=!1;else{let a=this;this.pool[o].forEach(function(c,b,f){r&&c!=t[b]&&(r=!1)}),!r&&E(t,this.pool[o])>0&&o++}return r||e?o:-1}else return e?0:-1},this.add=function(t,e){return t.data=e,this.pool.splice(this.point(t,!0),0,t),this},this.default=function(t){console.warn(`No match for "${t}". Default action not defined.`)},this.get=function(t){let e=this.point(t);if(e>-1)return this.pool[e].data;this.default(t)},this.run=function(t,...e){let n=this.point(t);n>-1?this.pool[n].data(t.slice(this.pool[n].length),...e):this.default(t,...e)}};var y=class{#t={};addEventListener(t,e){this.#t[t]||(this.#t[t]=[]),this.#t[t].unshift(e)}removeEventListener(t,e){if(this.#t[t]){let n=this.#t[t].indexOf(e);n>-1&&this.#t[t].splice(n,1),this.#t[t].length<1&&delete this.#t[t]}}dispatchEvent(t,e){let n=new Event(t),i=this;n.data=e,this.#t[t]?.length>0&&this.#t[t].forEach(function(o){o?.call(i,n)}),this[`on${t}`]&&this[`on${t}`](n)}};var d=["off","hall","room","stage","plate","delay LCR","delay LR","echo","cross delay","early reflections","gate reverb","reverse gate"];d[16]="white room";d[17]="tunnel";d[19]="basement";d[20]="karaoke";d[64]="pass through";d[65]="chorus";d[66]="celeste";d[67]="flanger";d[68]="symphonic";d[69]="rotary speaker";d[70]="tremelo";d[71]="auto pan";d[72]="phaser";d[73]="distortion";d[74]="overdrive";d[75]="amplifier";d[76]="3-band EQ";d[77]="2-band EQ";d[78]="auto wah";var R=["melodic","drum","drum set 1","drum set 2"],A=[17.1,18.6,20.2,21.8,23.3,24.9,26.5,28,29.6,31.2,32.8,34.3,35.9,37.5,39,40.6,42.2,43.7,45.3,46.9,48.4,50],w=[20,22,25,28,32,36,40,45,50,56,63,70,80,90,100,110,125,140,160,180,200,225,250,280,315,355,400,450,500,560,630,700,800,900,1e3,1100,1200,1400,1600,1800,2e3,2200,2500,2800,3200,3600,4e3,4500,5e3,5600,6300,7e3,8e3,9e3,1e4,11e3,12e3,14e3,16e3,18e3,2e4],k=[0,.04,.08,.13,.17,.21,.25,.29,.34,.38,.42,.46,.51,.55,.59,.63,.67,.72,.76,.8,.84,.88,.93,.97,1.01,1.05,1.09,1.14,1.18,1.22,1.26,1.3,1.35,1.39,1.43,1.47,1.51,1.56,1.6,1.64,1.68,1.72,1.77,1.81,1.85,1.89,1.94,1.98,2.02,2.06,2.1,2.15,2.19,2.23,2.27,2.31,2.36,2.4,2.44,2.48,2.52,2.57,2.61,2.65,2.69,2.78,2.86,2.94,3.03,3.11,3.2,3.28,3.37,3.45,3.53,3.62,3.7,3.87,4.04,4.21,4,37,4.54,4.71,4.88,5.05,5.22,5.38,5.55,5.72,6.06,6.39,6.73,7.07,7.4,7.74,8.08,8.41,8.75,9.08,9.42,9.76,10.1,10.8,11.4,12.1,12.8,13.5,14.1,14.8,15.5,16.2,16.8,17.5,18.2,19.5,20.9,22.2,23.6,24.9,26.2,27.6,28.9,30.3,31.6,33,34.3,37,39.7],S=function(t){let e=.1,n=-.3;return t>66?(e=5,n=315):t>56?(e=1,n=47):t>46&&(e=.5,n=18.5),e*t-n},x=function(t){return t>105?A[t-106]:t>100?t*1.1-100:t/10};var C=["room 1","room 2","room 3","hall 1","hall 2","plate","delay","panning delay"],P=["chorus 1","chorus 2","chorus 3","chorus 4","feedback","flanger","short delay","short delay feedback"];var l=function(t=64){return Math.round(2e3*Math.log10(t/64))/100},p=function(t,e){let n=0;for(let i=0;i<t.length;i++)i%8!=0&&(e(t[i],n,t),n++)},v=function(t){return Math.floor(t*14.2)};var X=["?","gm","gs","xg","g2","mt32","ns5r","ag10","x5d","05rw"],T=[[0,0,0,0,121,0,0,56,82,81],[0,0,1,0,0,127,0,0,0,0]],m=[120,127,120,127,120,127,61,62,62,62],L=[0,3,81,84,88],D={8:"Off",9:"On",10:"Note aftertouch",11:"cc",12:"pc",13:"Channel aftertouch",14:"Pitch"},G={0:0,1:1,2:3,5:4},N=[8,9,10,32,33,36,37,99,100,101];var M=[0,1,2,4,5,6,7,8,10,11,32,38,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,84,91,92,93,94,95,98,99,100,101],$={};X.forEach((t,e)=>{$[t]=e});var I={length:M.length};M.forEach((t,e)=>{I[t]=e});var h=function(t,e,n){n[e]=0},B=function(t){let e=[[]];return t?.forEach(function(n){n==247||(n==240?e.push([]):e[e.length-1].push(n))}),e},O=function(t,e="",n="",i=2){return t?`${e}${t.toString().padStart(i,"0")}${n}`:""},u={ch:64,cc:M.length,nn:128,pl:512,tr:256,rpn:6},_=class extends y{#t=0;#y=new Uint8Array(256);#R=0;#b=new Uint8Array(u.ch);#w=new Uint8Array(u.ch);#e=new Uint8ClampedArray(8192);#g=new Uint8ClampedArray(u.ch);#a=new Uint8ClampedArray(u.ch*u.nn);#N=new Uint8Array(u.ch);#r=new Uint16Array(u.pl);#k=new Int16Array(u.ch);#S=new Array(u.ch);#$=new Uint8Array(u.ch);#x=0;#c=new Uint8Array(u.ch*u.rpn);#D=new Int8Array(u.ch*N.length);#C=0;#G=0;#v=100;#p=0;#d="";#X=0;#s=!1;#O;#n=[];#f=new Uint8Array(u.ch);#M=new Uint8Array(u.tr);chRedir(t,e,n){if([$.gs,$.ns5r].indexOf(this.#t)>-1){if(this.#M[e])return(this.#M[e]-1)*16+t;if(n==1)return t;let i=0;return this.#f[t]==0?(this.#f[t]=e,console.debug(`Assign track ${e} to channel ${t+1}.`)):this.#f[t]!=e&&(i=16,this.#f[t+i]==0?(this.#f[t+i]=e,console.debug(`Assign track ${e} to channel ${t+i+1}.`)):this.#f[t+i]!=e&&(i=0)),t+i}else return t}#u=[];#P;#E={ano:t=>{this.#r.forEach((e,n,i)=>{e>>128==t&&(this.#a[e]=0,i[n]=0)})}};#I={8:function(t){let n=t.channel*128+t.data[0],i=this.#r.indexOf(n);i>-1&&(this.#r[i]=0,this.#a[n]=0)},9:function(t){let e=t.channel;this.#b[e]=1;let n=e*128+t.data[0];if(t.data[1]>0){let i=0;for(;this.#r[i]>0;)i++;i<this.#r.length?(this.#r[i]=n,this.#a[n]=t.data[1],this.#$[e]<t.data[1]&&(this.#$[e]=t.data[1])):console.error("Polyphony exceeded.")}else{let i=this.#r.indexOf(n);i>-1&&(this.#r[i]=0,this.#a[n]=0)}},10:function(t){let n=t.channel*128+t.data[0];this.#r.indexOf(n)>-1&&(this.#a[n]=data[1])},11:function(t){let e=t.channel;this.#b[e]=1;let n=e*128;switch(I[t.data[0]]==null&&console.warn(`cc${t.data[0]} is not accepted.`),t.data[0]){case 0:{if(this.#t==$.gs||this.#t==0)t.data[1]<48?(this.#e[n]>119&&(t.data[1]=this.#e[n],this.#t||(t.data[1]=120,console.debug(`Forced channel ${e+1} to stay drums.`))),t.data[1]>0&&!this.#t&&(console.debug(`Roland GS detected with MSB: ${t.data[1]}`),this.switchMode("gs"))):t.data[1]==62&&this.switchMode("x5d");else if(this.#t==$.gm)t.data[1]<48&&this.#e[n]>119&&(t.data[1]=120,this.switchMode("gs",!0),console.debug(`Forced channel ${e+1} to stay drums.`));else if(this.#t==$.x5d){if(t.data[1]>0&&t.data[1]<8)this.switchMode("05rw",!0);else if(t.data[1]==56){let i=0;for(let o=0;o<16;o++){let s=this.#e[128*o];(s==56||s==62)&&i++}i>14&&this.switchMode("ag10",!0)}}break}case 6:{if(this.#x){if(this.#e[n+99]==1){let i=N.indexOf(this.#e[n+98]);i>-1&&(this.#D[e*10+i]=t.data[1]-64)}}else this.#e[n+101]==0&&G[this.#e[n+100]]!=null&&(this.#c[e*u.rpn+G[this.#e[n+100]]]=t.data[1]);break}case 38:{this.#x||this.#e[n+101]==0&&G[this.#e[n+100]]!=null&&(this.#c[e*u.rpn+G[this.#e[n+100]]+1]=t.data[1]);break}case 98:case 99:{this.#x=1;break}case 100:case 101:{this.#x=0;break}case 120:break;case 121:{this.#k[e]=0;let i=e*128;this.#e[i+1]=0,this.#e[i+5]=0,this.#e[i+64]=0,this.#e[i+65]=0,this.#e[i+66]=0,this.#e[i+67]=0,this.#e[i+11]=127,this.#e[i+101]=127,this.#e[i+100]=127,this.#e[i+99]=127,this.#e[i+98]=127;break}case 123:{this.#E.ano(e);break}case 124:{this.#E.ano(e);break}case 125:{this.#E.ano(e);break}case 126:{this.#N[e]=1,this.#E.ano(e);break}case 127:{this.#N[e]=0,this.#E.ano(e);break}}this.#e[n+t.data[0]]=t.data[1]},12:function(t){let e=t.channel;this.#b[e]=1,this.#g[e]=t.data,this.#S[e]=0},13:function(t){let e=this,n=t.channel;this.#r.forEach(function(i){let o=i>>7;n==o&&(e.#a[i]=t.data)})},14:function(t){let e=t.channel;this.#k[e]=t.data[1]*128+t.data[0]-8192},15:function(t){let e=this;B(t.data).forEach(function(n){e.#l.run(n,t.track)})},255:function(t){if((this.#u[t.meta]||function(n,i,o){}).call(this,t.data,t.track,t.meta),t.meta!=32&&(this.#p=0),L.indexOf(t.meta)>-1)return t.reply="meta",t;self.debugMode&&console.debug(t)}};#l;#i;#o;#T;#m;#h;buildRchTree(){let t=[];this.#w.forEach((e,n)=>{t[e]?.constructor||(t[e]=[]),t[e].push(n)}),this.#O=t}getActive(){let t=this.#b.slice();return this.#t==$.mt32,t}getCc(t){let e=t*128,n=this.#e.slice(e,e+128);return n[0]=n[0]||this.#C,n[32]=n[32]||this.#G,n}getCcAll(){let t=this.#e.slice();for(let e=0;e<64;e++){let n=e*128;t[n]=t[n]||this.#C,t[n+32]=t[n+32]||this.#G}return t}getPitch(){return this.#k}getProgram(){return this.#g}getTexts(){return this.#n.slice()}getVel(t){let e=new Map,n=this;return this.#r.forEach(function(i){let o=Math.floor(i/128),s=i%128;t==o&&n.#a[i]>0&&e.set(s,n.#a[i])}),e}getBitmap(){return{bitmap:this.#y,expire:this.#R}}getCustomNames(){return this.#S.slice()}getLetter(){return{text:this.#d,expire:this.#X}}getMode(){return X[this.#t]}getMaster(){return{volume:this.#v}}getRawStrength(){let t=this;return this.#r.forEach(function(e){let n=Math.floor(e/128);t.#a[e]>t.#$[n]&&(t.#$[n]=t.#a[e])}),this.#$}getStrength(){let t=[],e=this;return this.getRawStrength().forEach(function(n,i){t[i]=Math.floor(n*e.#e[i*128+7]*e.#e[i*128+11]*e.#v/803288)}),t}getRpn(){return this.#c}getNrpn(){return this.#D}init(t=0){this.dispatchEvent("mode","?"),this.#t=0,this.#C=0,this.#G=0,this.#p=0,this.#b.forEach(h),this.#e.forEach(h),this.#g.forEach(h),this.#a.forEach(h),this.#r.forEach(h),this.#$.forEach(h),this.#k.forEach(h),this.#D.forEach(h),this.#v=100,this.#n=[],this.#X=0,this.#d="",this.#R=0,this.#y.forEach(h),this.#S.forEach(h),this.#s=!1,this.#w.forEach(function(e,n,i){i[n]=n}),this.buildRchTree(),this.#f.forEach(h),this.#M.forEach(h),this.#e[1152]=m[0],this.#e[3200]=m[0],this.#e[5248]=m[0],this.#e[7296]=m[0];for(let e=0;e<64;e++){let n=e*128;this.#e[n+7]=127,this.#e[n+11]=127,this.#e[n+10]=64,this.#e[n+71]=64,this.#e[n+72]=64,this.#e[n+73]=64,this.#e[n+74]=64,this.#e[n+75]=64,this.#e[n+76]=64,this.#e[n+77]=64,this.#e[n+78]=64,this.#e[n+101]=127,this.#e[n+100]=127,this.#e[n+99]=127,this.#e[n+98]=127;let i=e*u.rpn;this.#c[i]=2,this.#c[i+1]=64,this.#c[i+2]=0,this.#c[i+3]=64,this.#c[i+4]=0,this.#c[i+5]=0}}switchMode(t,e=!1){let n=X.indexOf(t);if(n>-1){if(this.#t==0||e){this.#t=n,this.#C=T[0][n],this.#G=T[1][n];for(let i=0;i<64;i++)m.indexOf(this.#e[i*128])>-1&&(this.#e[i*128]=m[n]);this.dispatchEvent("mode",t)}}else throw new Error(`Unknown mode ${t}`)}newStrength(){this.#$.forEach(h)}runJson(t){if(t.type>14)return this.#I[t.type].call(this,t);{let e=this.chRedir(t.part,t.track),n=!1;this.#O[e]?.forEach(i=>{t.channel=i,n=!0,this.#I[t.type].call(this,t)}),n||console.warn(`${D[t.type]?D[t.type]:t.type}${[11,12].includes(t.type)?(t.data[0]!=null?t.data[0]:t.data).toString():""} event sent to CH${e+1} without any recipient.`)}}runRaw(t){}constructor(){super();let t=this;this.#P=new g,this.#l=new g,this.#i=new g,this.#o=new g,this.#T=new g,this.#m=new g,this.#h=new g,this.#P.default=function(e,n){console.debug(`Unparsed meta 127 sequence on track ${n}: `,e)},this.#l.default=function(e){console.debug("Unparsed SysEx: ",e)},this.#i.default=function(e,n){console.debug(`Unparsed GS Part on channel ${n}: `,e)},this.#T.default=function(e,n){console.debug(`Unparsed XG Part on channel ${n}: `,e)},this.#m.default=function(e,n){console.debug(`Unparsed XG Drum Part on channel ${n}: `,e)},this.#u[1]=function(e){switch(e.slice(0,2)){case"@I":{this.#s=!0,this.#n.unshift(`Kar.Info: ${e.slice(2)}`);break}case"@K":{this.#s=!0,this.#n.unshift("Karaoke mode active."),console.debug(`Karaoke mode active: ${e.slice(2)}`);break}case"@L":{this.#s=!0,this.#n.unshift(`Language: ${e.slice(2)}`);break}case"@T":{this.#s=!0,this.#n.unshift(`Ka.Title: ${e.slice(2)}`);break}case"@V":{this.#s=!0,this.#n.unshift(`Kara.Ver: ${e.slice(2)}`);break}default:this.#s?e[0]=="\\"?this.#n.unshift(`@ ${e.slice(1)}`):e[0]=="/"?this.#n.unshift(e.slice(1)):this.#n[0]+=e:(this.#n[0]=e,this.#n.unshift(""))}},this.#u[2]=function(e){this.#n.unshift(`Copyrite: ${e}`)},this.#u[3]=function(e,n){n<1&&this.#p<1&&this.#n.unshift(`TrkTitle: ${e}`)},this.#u[4]=function(e,n){n<1&&this.#p<1&&this.#n.unshift(`${O(this.#p,""," ")}Instrmnt: ${e}`)},this.#u[5]=function(e){e.trim()==""?this.#n.unshift(""):this.#n[0]+=`${e}`},this.#u[6]=function(e){this.#n.unshift(`${O(this.#p,""," ")}C.Marker: ${e}`)},this.#u[7]=function(e){this.#n.unshift(`CuePoint: ${e}`)},this.#u[32]=function(e){this.#p=e[0]+1},this.#u[33]=function(e,n){console.debug(`Track ${n} requests to get assigned to output ${e}.`),t.#M[n]=e+1},this.#u[127]=function(e,n){t.#P.run(e,n)},this.#l.add([126,127,9,1],function(){t.switchMode("gm",!0),t.#s=t.#s||!1,console.info("MIDI reset: GM")}).add([126,127,9,3],function(){t.switchMode("g2",!0),t.#s=t.#s||!1,console.info("MIDI reset: GM2")}).add([65,16,22,18,127,1],function(){t.switchMode("mt32",!0),t.#s=!1,console.info("MIDI reset: MT-32"),console.debug("Reset with the shorter one.")}).add([65,16,22,18,127,0,0,1,0],function(){t.switchMode("mt32",!0),t.#s=!1,console.info("MIDI reset: MT-32"),console.debug("Reset with the longer one.")}).add([65,16,66,18,64,0,127,0,65],function(){t.switchMode("gs",!0),t.#e[1152]=120,t.#e[3200]=120,t.#e[5248]=120,t.#e[7296]=120,t.#s=!1,t.#f.forEach(h),console.info("MIDI reset: GS")}).add([67,16,76,0,0,126,0],function(e){t.switchMode("xg",!0),t.#s=!1,console.info("MIDI reset: XG")}),this.#P.add([67,0,1],function(e,n){t.#M[n]=e[0]+1}),this.#l.add([127,127,4,1],function(e){t.switchMode("gm"),t.#v=(e[1]<<7+e[0])/163.83}),this.#l.add([67,16,76,6,0],function(e){let n=e[0];t.#d=" ".repeat(n),t.#X=Date.now()+3200,e.slice(1).forEach(function(i){t.#d+=String.fromCharCode(i)})}).add([67,16,76,7,0,0],function(e){for(t.#R=Date.now()+3200;e.length<48;)e.unshift(0);e.forEach(function(n,i){let o=Math.floor(i/16),s=i%16,r=(s*3+o)*7,a=7,c=0;for(r-=s*5,o==2&&(a=2);c<a;)t.#y[r+c]=n>>6-c&1,c++})}).add([67,16,76,2,1,0],function(e){console.debug(`XG reverb type: ${d[e[0]]}${e[1]>0?" "+(e[1]+1):""}`)}).add([67,16,76,2,1,2],function(e){console.debug(`XG reverb time: ${S(e)}s`)}).add([67,16,76,2,1,3],function(e){console.debug(`XG reverb diffusion: ${e}`)}).add([67,16,76,2,1,4],function(e){console.debug(`XG reverb initial delay: ${e}`)}).add([67,16,76,2,1,5],function(e){console.debug(`XG reverb high pass cutoff: ${w[e[0]]}Hz`)}).add([67,16,76,2,1,6],function(e){console.debug(`XG reverb low pass cutoff: ${w[e[0]]}Hz`)}).add([67,16,76,2,1,7],function(e){console.debug(`XG reverb width: ${e}`)}).add([67,16,76,2,1,8],function(e){console.debug(`XG reverb height: ${e}`)}).add([67,16,76,2,1,9],function(e){console.debug(`XG reverb depth: ${e}`)}).add([67,16,76,2,1,10],function(e){console.debug(`XG reverb wall type: ${e}`)}).add([67,16,76,2,1,11],function(e){console.debug(`XG reverb dry/wet: ${e[0]}`)}).add([67,16,76,2,1,12],function(e){console.debug(`XG reverb return: ${e}`)}).add([67,16,76,2,1,13],function(e){console.debug(`XG reverb pan: ${e[0]-64}`)}).add([67,16,76,2,1,16],function(e){console.debug(`XG reverb delay: ${e}`)}).add([67,16,76,2,1,17],function(e){console.debug(`XG density: ${e}`)}).add([67,16,76,2,1,18],function(e){console.debug(`XG reverb balance: ${e}`)}).add([67,16,76,2,1,20],function(e){console.debug(`XG reverb feedback: ${e}`)}).add([67,16,76,2,1,32],function(e){console.debug(`XG chorus type: ${d[e[0]]}${e[1]>0?" "+(e[1]+1):""}`)}).add([67,16,76,2,1,34],function(e){console.debug(`XG chorus LFO: ${k[e[0]]}Hz`)}).add([67,16,76,2,1,35],function(e){}).add([67,16,76,2,1,36],function(e){console.debug(`XG chorus feedback: ${e}`)}).add([67,16,76,2,1,37],function(e){console.debug(`XG chorus delay offset: ${x(e[0])}ms`)}).add([67,16,76,2,1,39],function(e){console.debug(`XG chorus low: ${w[e[0]]}Hz`)}).add([67,16,76,2,1,40],function(e){console.debug(`XG chorus low: ${e[0]-64}dB`)}).add([67,16,76,2,1,41],function(e){console.debug(`XG chorus high: ${w[e[0]]}Hz`)}).add([67,16,76,2,1,42],function(e){console.debug(`XG chorus high: ${e[0]-64}dB`)}).add([67,16,76,2,1,43],function(e){console.debug(`XG chorus dry/wet: ${e}`)}).add([67,16,76,2,1,44],function(e){console.debug(`XG chorus return: ${e}`)}).add([67,16,76,2,1,45],function(e){console.debug(`XG chorus pan: ${e[0]-64}`)}).add([67,16,76,2,1,46],function(e){console.debug(`XG chorus to reverb: ${e}`)}).add([67,16,76,2,1,64],function(e){console.debug(`XG variation type: ${d[e[0]]}${e[1]>0?" "+(e[1]+1):""}`)}).add([67,16,76,2,1,66],function(e){console.debug(`XG variation 1: ${e}`)}).add([67,16,76,2,1,68],function(e){console.debug(`XG variation 2: ${e}`)}).add([67,16,76,2,1,70],function(e){console.debug(`XG variation 3: ${e}`)}).add([67,16,76,2,1,72],function(e){console.debug(`XG variation 4: ${e}`)}).add([67,16,76,2,1,74],function(e){console.debug(`XG variation 5: ${e}`)}).add([67,16,76,2,1,76],function(e){console.debug(`XG variation 6: ${e}`)}).add([67,16,76,2,1,78],function(e){console.debug(`XG variation 7: ${e}`)}).add([67,16,76,2,1,80],function(e){console.debug(`XG variation 8: ${e}`)}).add([67,16,76,2,1,82],function(e){console.debug(`XG variation 9: ${e}`)}).add([67,16,76,2,1,84],function(e){console.debug(`XG variation 10: ${e}`)}).add([67,16,76,2,1,86],function(e){console.debug(`XG variation return: ${l(e[0])}dB`)}).add([67,16,76,2,1,87],function(e){console.debug(`XG variation pan: ${e[0]-64}`)}).add([67,16,76,2,1,88],function(e){console.debug(`XG variation to reverb: ${l(e[0])}dB`)}).add([67,16,76,2,1,89],function(e){console.debug(`XG variation to chorus: ${l(e[0])}dB`)}).add([67,16,76,2,1,90],function(e){console.debug(`XG variation connection: ${e[0]?"system":"insertion"}`)}).add([67,16,76,2,1,91],function(e){console.debug(`XG variation part: ${e}`)}).add([67,16,76,2,1,92],function(e){console.debug(`XG variation mod wheel: ${e[0]-64}`)}).add([67,16,76,2,1,93],function(e){console.debug(`XG variation bend wheel: ${e[0]-64}`)}).add([67,16,76,2,1,94],function(e){console.debug(`XG variation channel after touch: ${e[0]-64}`)}).add([67,16,76,2,1,95],function(e){console.debug(`XG variation AC1: ${e[0]-64}`)}).add([67,16,76,2,1,96],function(e){console.debug(`XG variation AC2: ${e[0]-64}`)}).add([67,16,76,8],function(e,n){t.#T.run(e.slice(1),t.chRedir(e[0],n))}).add([67,16,76,48],function(e){t.#m.run(e.slice(1),0,e[0])}).add([67,16,76,49],function(e){t.#m.run(e.slice(1),1,e[0])}).add([67,16,76,50],function(e){t.#m.run(e.slice(1),2,e[0])}).add([67,16,76,51],function(e){t.#m.run(e.slice(1),3,e[0])}),this.#l.add([65,1],function(e){t.switchMode("mt32"),t.#h.run(e,1)}).add([65,2],function(e){t.switchMode("mt32"),t.#h.run(e,2)}).add([65,3],function(e){t.switchMode("mt32"),t.#h.run(e,3)}).add([65,4],function(e){t.switchMode("mt32"),t.#h.run(e,4)}).add([65,5],function(e){t.switchMode("mt32"),t.#h.run(e,5)}).add([65,6],function(e){t.switchMode("mt32"),t.#h.run(e,6)}).add([65,7],function(e){t.switchMode("mt32"),t.#h.run(e,7)}).add([65,8],function(e){t.switchMode("mt32"),t.#h.run(e,8)}).add([65,9],function(e){t.switchMode("mt32"),t.#b[9]=1,t.#h.run(e,9)}).add([65,16,22,18,32,0],function(e){let n=e[0];t.#d=" ".repeat(n),e.unshift(),e.pop(),t.#d=" ".repeat(n),t.#X=Date.now()+3200,e.forEach(function(i){i>31&&(t.#d+=String.fromCharCode(i))}),t.#d+=" ".repeat(32-t.#d.length)}),this.#h.add([22,18,2,0,0],function(e,n){let i="";e.slice(0,10).forEach(function(o){o>31&&(i+=String.fromCharCode(o))}),t.#S[n]=i,console.debug(`MT-32 tone properties on channel ${n+1} (${i}): ${e.slice(10)}`)}),this.#l.add([65,16,66,18,0,0,127],function(e){t.switchMode("gs",!0),t.#e[1152]=120,t.#e[3200]=120,t.#e[5248]=120,t.#e[7296]=120,t.#f.forEach(h),t.#s=!1,t.#G=3,console.info(`GS system set to ${e[0]?"dual":"single"} mode.`)}).add([65,16,66,18,64,0,0],function(e){}).add([65,16,66,18,64,0,4],function(e){t.#v=e[0]*129/163.83}).add([65,16,66,18,64,0,5],function(e){console.debug(`GS master key shift: ${e[0]-64} semitones.`)}).add([65,16,66,18,64,0,6],function(e){console.debug(`GS master pan:${e[0]-64}.`)}).add([65,16,66,18,64,1,48],function(e){console.debug(`GS reverb type: ${C[e[0]]}`)}).add([65,16,66,18,64,1,49],function(e){}).add([65,16,66,18,64,1,50],function(e){console.debug(`GS reverb pre-LPF: ${e[0]}`)}).add([65,16,66,18,64,1,51],function(e){console.debug(`GS reverb level: ${e[0]}`)}).add([65,16,66,18,64,1,52],function(e){console.debug(`GS reverb time: ${e[0]}`)}).add([65,16,66,18,64,1,53],function(e){console.debug(`GS reverb delay feedback: ${e[0]}`)}).add([65,16,66,18,64,1,55],function(e){console.debug(`GS reverb pre-delay time: ${e[0]}`)}).add([65,16,66,18,64,1,56],function(e){console.debug(`GS chorus type: ${P[e[0]]}`)}).add([65,16,66,18,64,1,57],function(e){console.debug(`GS chorus pre-LPF: ${e[0]}`)}).add([65,16,66,18,64,2,0],function(e){console.debug(`GS EQ low: ${e[0]?400:200}Hz`)}).add([65,16,66,18,64,2,1],function(e){console.debug(`GS EQ low: ${e[0]-64}dB`)}).add([65,16,66,18,64,2,2],function(e){console.debug(`GS EQ high: ${e[0]?6e3:3e3}Hz`)}).add([65,16,66,18,64,2,3],function(e){console.debug(`GS EQ high: ${e[0]-64}dB`)}).add([65,16,66,18,64,3],function(e){}).add([65,16,69,18,16,0],function(e){let n=e[0];t.#d=" ".repeat(n),t.#X=Date.now()+3200,e.pop(),e.slice(1).forEach(function(i){t.#d+=String.fromCharCode(i)})}).add([65,16,69,18,16,1,0],function(e){t.#R=Date.now()+3200,e.forEach(function(n,i){if(i<64){let o=Math.floor(i/16),s=i%16,r=(s*4+o)*5,a=5,c=0;for(r-=s*4,o==3&&(a=1);c<a;)t.#y[r+c]=n>>4-c&1,c++}})}).add([65,16,66,18,64,16],function(e,n){t.#i.run(e,t.chRedir(9,n,!0),n)}).add([65,16,66,18,64,17],function(e,n){t.#i.run(e,t.chRedir(0,n,!0),n)}).add([65,16,66,18,64,18],function(e,n){t.#i.run(e,t.chRedir(1,n,!0),n)}).add([65,16,66,18,64,19],function(e,n){t.#i.run(e,t.chRedir(2,n,!0),n)}).add([65,16,66,18,64,20],function(e,n){t.#i.run(e,t.chRedir(3,n,!0),n)}).add([65,16,66,18,64,21],function(e,n){t.#i.run(e,t.chRedir(4,n,!0),n)}).add([65,16,66,18,64,22],function(e,n){t.#i.run(e,t.chRedir(5,n,!0),n)}).add([65,16,66,18,64,23],function(e,n){t.#i.run(e,t.chRedir(6,n,!0),n)}).add([65,16,66,18,64,24],function(e,n){t.#i.run(e,t.chRedir(7,n,!0),n)}).add([65,16,66,18,64,25],function(e,n){t.#i.run(e,t.chRedir(8,n,!0),n)}).add([65,16,66,18,64,26],function(e,n){t.#i.run(e,t.chRedir(10,n,!0),n)}).add([65,16,66,18,64,27],function(e,n){t.#i.run(e,t.chRedir(11,n,!0),n)}).add([65,16,66,18,64,28],function(e,n){t.#i.run(e,t.chRedir(12,n,!0),n)}).add([65,16,66,18,64,29],function(e,n){t.#i.run(e,t.chRedir(13,n,!0),n)}).add([65,16,66,18,64,30],function(e,n){t.#i.run(e,t.chRedir(14,n,!0),n)}).add([65,16,66,18,64,31],function(e,n){t.#i.run(e,t.chRedir(15,n,!0),n)}).add([65,16,66,18,64,64],function(e,n){t.#o.run(e,t.chRedir(9,n,!0))}).add([65,16,66,18,64,65],function(e,n){t.#o.run(e,t.chRedir(0,n,!0))}).add([65,16,66,18,64,66],function(e,n){t.#o.run(e,t.chRedir(1,n,!0))}).add([65,16,66,18,64,67],function(e,n){t.#o.run(e,t.chRedir(2,n,!0))}).add([65,16,66,18,64,68],function(e,n){t.#o.run(e,t.chRedir(3,n,!0))}).add([65,16,66,18,64,69],function(e,n){t.#o.run(e,t.chRedir(4,n,!0))}).add([65,16,66,18,64,70],function(e,n){t.#o.run(e,t.chRedir(5,n,!0))}).add([65,16,66,18,64,71],function(e,n){t.#o.run(e,t.chRedir(6,n,!0))}).add([65,16,66,18,64,72],function(e,n){t.#o.run(e,t.chRedir(7,n,!0))}).add([65,16,66,18,64,73],function(e,n){t.#o.run(e,t.chRedir(8,n,!0))}).add([65,16,66,18,64,74],function(e,n){t.#o.run(e,t.chRedir(10,n,!0))}).add([65,16,66,18,64,75],function(e,n){t.#o.run(e,t.chRedir(11,n,!0))}).add([65,16,66,18,64,76],function(e,n){t.#o.run(e,t.chRedir(12,n,!0))}).add([65,16,66,18,64,77],function(e,n){t.#o.run(e,t.chRedir(13,n,!0))}).add([65,16,66,18,64,78],function(e,n){t.#o.run(e,t.chRedir(14,n,!0))}).add([65,16,66,18,64,79],function(e,n){t.#o.run(e,t.chRedir(15,n,!0))}),t.#l.add([66,48,54,104],function(e,n){t.switchMode("x5d",!0),p(e,function(i,o){if(o<192){let s=t.chRedir(Math.floor(o/12),n,!0),r=s*128;switch(o%12){case 0:{t.#g[s]=i,i>0&&(t.#b[s]=1);break}case 1:{t.#e[r+7]=i;break}case 2:{t.#c[s*u.rpn+3]=i>127?256-i:64+i;break}case 3:{t.#c[s*u.rpn+1]=i>127?256-i:64+i;break}case 4:{i<31&&(t.#e[r+10]=Math.round((i-15)*4.2+64));break}case 5:{let a=i>>4,c=i&15;t.#e[r+91]=v(c),t.#e[r+93]=v(a);break}case 10:{t.#e[r]=i&3?82:56;break}case 11:{let a=i&15,c=i>>4;t.#w[s]=i,(a!=s||c)&&(console.info(`X5D Part CH${s+1} receives from CH${a+1}. Track is ${c?"inactive":"active"}.`),t.buildRchTree())}}}else{let s=t.chRedir(o-192,n,!0)}})}).add([66,48,54,76,0],function(e,n){t.switchMode("x5d",!0);let i="",o=82,s=0,r=0,a="MSB	PRG	LSB	NME";p(e,function(c,b){if(b<16400){let f=b%164;switch(!0){case f<10:{c>31&&(i+=String.fromCharCode(c));break}case f==11:{a+=`
${o}	${s}	${r}	${i.trim().replace("Init Voice","")}`,s++,i="";break}}s>99&&(o=90,s=0)}}),t.dispatchEvent("mapupdate",{clearRange:{msb:82,prg:[0,99],lsb:0},voiceMap:a})}).add([66,48,54,77,0],function(e,n){t.switchMode("x5d",!0);let i="",o=90,s=0,r=0,a="MSB	PRG	LSB	NME";p(e,function(c,b){if(b<13600){let f=b%136;switch(!0){case f<10:{c>31&&(i+=String.fromCharCode(c));break}case f==11:{a+=`
${o}	${s}	${r}	${i.trim().replace("Init Combi","")}`,s++,i="";break}}}}),t.dispatchEvent("mapupdate",{clearRange:{msb:90,prg:[0,99],lsb:0},voiceMap:a})}).add([66,48,66,54],function(e,n){t.switchMode("ns5r",!0);let i="",o=80,s=0,r=0,a="MSB	PRG	LSB	NME";p(e,function(c,b){let f=b%158;switch(!0){case f<10:{c>31&&(i+=String.fromCharCode(c));break}case f==11:{o=c;break}case f==12:{r=c;break}case f==13:{a+=`
${o}	${s}	${r}	${i.trim()}`,s++,i="";break}}}),t.dispatchEvent("mapupdate",{clearRange:{msb:80,lsb:0},voiceMap:a})}).add([66,48,66,52],function(e){t.switchMode("ns5r",!0),t.#s=!1}).add([66,48,66,53],function(e){t.switchMode("ns5r",!0),p(e,function(n,i){switch(!0){case i<2944:{let o=Math.floor(i/92),s=o*128;switch(i%92){case 0:{t.#e[s]=n;break}case 1:{t.#e[s+32]=n;break}case 2:{t.#g[o]=n,n>0&&(t.#b[o]=1);break}case 3:t.#w[o]=n,o!=n&&(console.info(`NS5R CH${o+1} receives from CH${n+1}.`),t.buildRchTree());case 7:break;case 8:{t.#c[o*u.rpn+3]=n;break}case 9:case 10:{t.#e[s+7]=n;break}case 11:{t.#e[s+11]=n;break}case 14:{t.#e[s+10]=n||128;break}case 19:{t.#e[s+93]=n;break}case 20:{t.#e[s+91]=n;break}case 84:{t.#e[s+65]=n;break}case 85:{t.#e[s+5]=n;break}}break}case i<3096:break;case i<3134:break;case i<8566:break}})}),t.#m.add([0],function(e,n,i){console.debug(`XG Drum ${n} note ${i} coarse pitch bend ${e[0]-64}.`)}).add([1],function(e,n,i){console.debug(`XG Drum ${n} note ${i} fine pitch bend ${e[0]-64}.`)}).add([2],function(e,n,i){console.debug(`XG Drum ${n} note ${i} level ${e[0]}.`)}).add([3],function(e,n,i){console.debug(`XG Drum ${n} note ${i} alt group ${e[0]}.`)}).add([4],function(e,n,i){console.debug(`XG Drum ${n} note ${i} pan ${e[0]-64}.`)}).add([5],function(e,n,i){console.debug(`XG Drum ${n} note ${i} reverb send ${l(e[0])}dB.`)}).add([6],function(e,n,i){console.debug(`XG Drum ${n} note ${i} chorus send ${l(e[0])}dB.`)}).add([7],function(e,n,i){console.debug(`XG Drum ${n} note ${i} variation send ${l(e[0])}dB.`)}).add([8],function(e,n,i){console.debug(`XG Drum ${n} note ${i} key assign as ${e[0]>0?"multi":"single"}.`)}).add([9],function(e,n,i){}).add([10],function(e,n,i){}).add([11],function(e,n,i){}).add([12],function(e,n,i){}).add([13],function(e,n,i){}).add([14],function(e,n,i){}).add([15],function(e,n,i){}),t.#T.add([0],function(e,n){console.debug(`XG Part reserve ${e[0]} elements for channel ${n}.`)}).add([1],function(e,n){t.#e[n*128]=e[0]}).add([2],function(e,n){t.#e[n*128+32]=e[0]}).add([3],function(e,n){t.#g[n]=e[0]}).add([4],function(e,n){t.#w[n]=e[0],n!=e[0]&&(console.info(`XG Part CH${n+1} receives from CH${e[0]+1}.`),t.buildRchTree())}).add([5],function(e,n){console.debug(`XG Part mono/poly set to ${e[0]?"mono":"poly"} for channel ${n}.`)}).add([6],function(e,n){console.debug(`XG Part repeat pressing set to ${["single","multi","inst"][e[0]]} mode for channel ${n}.`)}).add([7],function(e,n){let i=e[0];t.#e[128*n]=i>1?127:0,console.debug(`XG Part use mode "${R[i]}" for channel ${n}.`)}).add([14],function(e,n){t.#e[128*n+10]=e[0]||128}).add([17],function(e,n){console.debug(`XG Part dry level ${e[0]} for channel ${n}.`)}).add([18],function(e,n){console.debug(`XG Part chorus send ${l(e[0])}dB for channel ${n}.`)}).add([19],function(e,n){console.debug(`XG Part reverb send ${l(e[0])}dB for channel ${n}.`)}).add([20],function(e,n){console.debug(`XG Part variation send ${l(e[0])}dB for channel ${n}.`)}).add([21],function(e,n){console.debug(`XG Part LFO speed ${e[0]} for channel ${n}.`)}).add([29],function(e,n){console.debug(`XG Part MW bend ${e[0]-64} semitones for channel ${n}.`)}).add([32],function(e,n){console.debug(`XG Part MW LFO pitch depth ${e[0]} for channel ${n}.`)}).add([33],function(e,n){console.debug(`XG Part MW LFO filter depth ${e[0]} for channel ${n}.`)}).add([35],function(e,n){console.debug(`XG Part bend pitch ${e[0]-64} semitones for channel ${n}.`)}).add([83],function(e,n){}).add([103],function(e,n){t.#e[n*128+65]=e[0]}).add([104],function(e,n){t.#e[n*128+5]=e[0]}).add([105],function(e,n){console.debug(`XG Part EG initial ${e[0]-64} for channel ${n}.`)}).add([106],function(e,n){console.debug(`XG Part EG attack time ${e[0]-64} for channel ${n}.`)}),t.#i.add([0],function(e,n){t.#e[n*128]==120&&(e[0]=120),t.#e[n*128]=e[0]||0,t.#g[n]=e[1]||0}).add([2],function(e,n,i){let o=t.chRedir(e[0],i,!0);t.#w[n]=o,n!=o&&(console.info(`GS Part CH${n+1} receives from CH${o+1}.`),t.buildRchTree())}).add([19],function(e,n){}).add([20],function(e,n){}).add([21],function(e,n){console.debug(`GS Part ${n+1} type: ${["melodic","drum 1","drum 2"][e[0]]}.`),e[0]>0&&(t.#e[n*128]=120)}).add([25],function(e,n){t.#e[n*128+7]=e[0]}).add([28],function(e,n){t.#e[n*128+10]=e[0]||128}).add([33],function(e,n){t.#e[n*128+93]=e[0]}).add([34],function(e,n){t.#e[n*128+91]=e[0]}),t.#o.add([0],function(e,n){t.#e[n*128+32]=e[0]}).add([1],function(e,n){t.#e[n*128+32]=e[0]}).add([32],function(e,n){console.debug(`GS Part ${n+1} turned EQ ${e[0]?"on":"off"}.`)}).add([33],function(e,n){}).add([34],function(e,n){console.debug(`GS Part ${n+1} turned EFX ${e[0]?"on":"off"}.`)})}};export{_ as OctaviaDevice,I as ccToPos};
