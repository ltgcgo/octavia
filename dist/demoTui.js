"use strict";(()=>{var ee=Object.create;var S=Object.defineProperty;var te=Object.getOwnPropertyDescriptor;var re=Object.getOwnPropertyNames;var ae=Object.getPrototypeOf,ne=Object.prototype.hasOwnProperty;var ie=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var se=(e,t,r,a)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of re(t))!ne.call(e,n)&&n!==r&&S(e,n,{get:()=>t[n],enumerable:!(a=te(t,n))||a.enumerable});return e};var oe=(e,t,r)=>(r=e!=null?ee(ae(e)):{},se(t||!e||!e.__esModule?S(r,"default",{value:e,enumerable:!0}):r,e));var F=ie((Ve,A)=>{(function(){"use strict";let e={debug:!1,parse:function(t,r){if(t instanceof Uint8Array)return e.Uint8(t);if(typeof t=="string")return e.Base64(t);if(t instanceof HTMLElement&&t.type==="file")return e.addListener(t,r);throw new Error("MidiParser.parse() : Invalid input provided")},addListener:function(t,r){if(!File||!FileReader)throw new Error("The File|FileReader APIs are not supported in this browser. Use instead MidiParser.Base64() or MidiParser.Uint8()");if(t===void 0||!(t instanceof HTMLElement)||t.tagName!=="INPUT"||t.type.toLowerCase()!=="file")return console.warn("MidiParser.addListener() : Provided element is not a valid FILE INPUT element"),!1;r=r||function(){},t.addEventListener("change",function(a){if(!a.target.files.length)return!1;console.log("MidiParser.addListener() : File detected in INPUT ELEMENT processing data..");let n=new FileReader;n.readAsArrayBuffer(a.target.files[0]),n.onload=function(s){r(e.Uint8(new Uint8Array(s.target.result)))}})},Base64:function(t){let r=function(s){var i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";if(s=s.replace(/^.*?base64,/,""),s=String(s).replace(/[\t\n\f\r ]+/g,""),!/^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/.test(s))throw new TypeError("Failed to execute _atob() : The string to be decoded is not correctly encoded.");s+="==".slice(2-(3&s.length));let c,u="",o,l,f=0;for(;f<s.length;)c=i.indexOf(s.charAt(f++))<<18|i.indexOf(s.charAt(f++))<<12|(o=i.indexOf(s.charAt(f++)))<<6|(l=i.indexOf(s.charAt(f++))),u+=o===64?String.fromCharCode(c>>16&255):l===64?String.fromCharCode(c>>16&255,c>>8&255):String.fromCharCode(c>>16&255,c>>8&255,255&c);return u}(t=String(t));var a=r.length;let n=new Uint8Array(new ArrayBuffer(a));for(let s=0;s<a;s++)n[s]=r.charCodeAt(s);return e.Uint8(n)},Uint8:function(n){let r={data:null,pointer:0,movePointer:function(o){return this.pointer+=o,this.pointer},readInt:function(o){if((o=Math.min(o,this.data.byteLength-this.pointer))<1)return-1;let l=0;if(1<o)for(let f=1;f<=o-1;f++)l+=this.data.getUint8(this.pointer)*Math.pow(256,o-f),this.pointer++;return l+=this.data.getUint8(this.pointer),this.pointer++,l},readStr:function(o){let l="";for(let f=1;f<=o;f++)l+=String.fromCharCode(this.readInt(1));return l},backOne:function(){this.pointer--},readIntVLV:function(){let o=0;if(this.pointer>=this.data.byteLength)return-1;if(this.data.getUint8(this.pointer)<128)o=this.readInt(1);else{let f=[];for(;128<=this.data.getUint8(this.pointer);)f.push(this.readInt(1)-128);var l=this.readInt(1);for(let d=1;d<=f.length;d++)o+=f[f.length-d]*Math.pow(128,d);o+=l}return o}};if(r.data=new DataView(n.buffer,n.byteOffset,n.byteLength),r.readInt(4)!==1297377380)return console.warn("Header validation failed (not MIDI standard or file corrupt.)"),!1;r.readInt(4);let a={};a.formatType=r.readInt(2),a.tracks=r.readInt(2),a.track=[];var n=r.readInt(1),s=r.readInt(1);128<=n?(a.timeDivision=[],a.timeDivision[0]=n-128,a.timeDivision[1]=s):a.timeDivision=256*n+s;for(let o=1;o<=a.tracks;o++){a.track[o-1]={event:[]};var i,c=r.readInt(4);if(c===-1)break;if(c!==1297379947)return!1;r.readInt(4);let l=0,f=!1,d,h;for(;!f&&(l++,a.track[o-1].event[l-1]={},a.track[o-1].event[l-1].deltaTime=r.readIntVLV(),(d=r.readInt(1))!==-1);)if(128<=d?h=d:(d=h,r.movePointer(-1)),d===255){a.track[o-1].event[l-1].type=255,a.track[o-1].event[l-1].metaType=r.readInt(1);var u=r.readIntVLV();switch(a.track[o-1].event[l-1].metaType){case 47:case-1:f=!0;break;case 1:case 2:case 3:case 4:case 5:case 7:case 6:a.track[o-1].event[l-1].data=r.readStr(u);break;case 33:case 89:case 81:a.track[o-1].event[l-1].data=r.readInt(u);break;case 84:a.track[o-1].event[l-1].data=[],a.track[o-1].event[l-1].data[0]=r.readInt(1),a.track[o-1].event[l-1].data[1]=r.readInt(1),a.track[o-1].event[l-1].data[2]=r.readInt(1),a.track[o-1].event[l-1].data[3]=r.readInt(1),a.track[o-1].event[l-1].data[4]=r.readInt(1);break;case 88:a.track[o-1].event[l-1].data=[],a.track[o-1].event[l-1].data[0]=r.readInt(1),a.track[o-1].event[l-1].data[1]=r.readInt(1),a.track[o-1].event[l-1].data[2]=r.readInt(1),a.track[o-1].event[l-1].data[3]=r.readInt(1);break;default:this.customInterpreter!==null&&(a.track[o-1].event[l-1].data=this.customInterpreter(a.track[o-1].event[l-1].metaType,r,u)),this.customInterpreter!==null&&a.track[o-1].event[l-1].data!==!1||(r.readInt(u),a.track[o-1].event[l-1].data=r.readInt(u),this.debug&&console.info("Unimplemented 0xFF meta event! data block readed as Integer"))}}else switch((d=d.toString(16).split(""))[1]||d.unshift("0"),a.track[o-1].event[l-1].type=parseInt(d[0],16),a.track[o-1].event[l-1].channel=parseInt(d[1],16),a.track[o-1].event[l-1].type){case 15:this.customInterpreter!==null&&(a.track[o-1].event[l-1].data=this.customInterpreter(a.track[o-1].event[l-1].type,r,!1)),this.customInterpreter!==null&&a.track[o-1].event[l-1].data!==!1||(i=r.readIntVLV(),a.track[o-1].event[l-1].data=r.readInt(i),this.debug&&console.info("Unimplemented 0xF exclusive events! data block readed as Integer"));break;case 10:case 11:case 14:case 8:case 9:a.track[o-1].event[l-1].data=[],a.track[o-1].event[l-1].data[0]=r.readInt(1),a.track[o-1].event[l-1].data[1]=r.readInt(1);break;case 12:case 13:a.track[o-1].event[l-1].data=r.readInt(1);break;case-1:f=!0;break;default:if(this.customInterpreter!==null&&(a.track[o-1].event[l-1].data=this.customInterpreter(a.track[o-1].event[l-1].metaType,r,!1)),this.customInterpreter===null||a.track[o-1].event[l-1].data===!1)return console.log("Unknown EVENT detected... reading cancelled!"),!1}}return a},customInterpreter:null};if(typeof A<"u")A.exports=e;else{let t=typeof window=="object"&&window.self===window&&window||typeof self=="object"&&self.self===self&&self||typeof global=="object"&&global.global===global&&global;t.MidiParser=e}})()});DOMTokenList.prototype.on=function(e){!this.contains(e)&&this.toggle(e)};DOMTokenList.prototype.off=function(e){this.contains(e)&&this.toggle(e)};var y=function(e,t=document){return t?.querySelector(e)},U=function(e,t=document){return Array.from(t?.querySelectorAll(e))};var D=class{#e={};addEventListener(e,t){this.#e[e]||(this.#e[e]=[]),this.#e[e].unshift(t)}removeEventListener(e,t){if(this.#e[e]){let r=this.#e[e].indexOf(t);r>-1&&this.#e[e].splice(r,1),this.#e[e].length<1&&delete this.#e[e]}}dispatchEvent(e){let t=new Event(e),r=this;this.#e[e]?.length>0&&this.#e[e].forEach(function(a){a?.call(r,t)}),this[`on${e}`]&&this[`on${e}`](t)}};var E=["?","gm","gs","xg","mt32","ns5r","ag10","x5d","05rw"],le={};E.forEach(function(e,t){le[e]=t});var v=function(e,t,r){r[t]=0},C=class{#e=0;#r=new Array(64);#n=new Uint8ClampedArray(8192);#i=new Uint8ClampedArray(64);#a=new Uint8ClampedArray(8192);#t=new Uint16Array(512);#s=new Int16Array(64);#o=0;#l=0;#c={8:function(e){let t=e.part*128+e.data[0],r=this.#t.indexOf(t);r>-1&&(this.#t[r]=0,this.#a[t]=0)},9:function(e){this.#r[e.part]=!0;let t=e.part*128+e.data[0];if(e.data[1]>0){let r=0;for(;this.#t[r]>0;)r++;r<512?(this.#t[r]=t,this.#a[t]=e.data[1]):console.error("Polyphony exceeded.")}else{let r=this.#t.indexOf(t);r>-1&&(this.#t[r]=0,this.#a[t]=0)}},10:function(e){let t=e.part*128+e.data[0];this.#t.indexOf(t)>-1&&(this.#a[t]=data[1])},11:function(e){this.#r[e.part]=!0,this.#n[e.part*128+e.data[0]]=e.data[1]},12:function(e){this.#r[e.part]=!0,this.#i[e.part]=e.data},13:function(e){let t=this;this.#t.forEach(function(r){let a=r>>7;e.part==a&&(this.#a[r]=e.data)}),console.info(e)},14:function(e){this.#s[e.part]=e.data[1]*128+e.data[0]},15:function(e){console.warn(e)},255:function(e){console.warn(e)}};getActive(){return this.#r.slice()}getCc(e){let t=e*128;return Array.from(this.#n).slice(t,t+128)}getPitch(){return Array.from(this.#s)}getProgram(){return Array.from(this.#i)}getVel(e){let t=new Map,r=this;return this.#t.forEach(function(a){let n=a>>7,s=a&127;e==n&&r.#a[a]>0&&t.set(s,r.#a[a])}),t}getMode(){return E[this.#e]}init(){this.#e=0,this.#o=0,this.#l=0,this.#r.forEach(v),this.#n.forEach(v),this.#i.forEach(v),this.#a.forEach(v),this.#t.forEach(v)}switchMode(e,t=!1){let r=E.indexOf(e);if(r>-1)(this.#e==0||t)&&(this.#e=r);else throw new Error(`Unknown mode ${e}`)}runJson(e){this.#c[e.type].call(this,e)}runRaw(e){}};var P=oe(F(),1);var R=class{#e=!1;constructor(e,t,r,a){this.#e=e,this.start=t,this.end=r,this.data=a}get duration(){return this.ranged?this.end-this.start:0}get ranged(){return this.#e}},x=class extends R{constructor(e,t,r){super(!0,e,t,r)}},V=class extends R{constructor(e,t){super(!1,e,e,t)}},T=class extends Array{#e=-1;constructor(){super(...arguments)}resetIndex(e){this.#e=-1}fresh(){this.sort(function(e,t){return e.start==t.start?0:(+(e.start>t.start)<<1)-1}),this.forEach(function(e,t){e.index=t})}step(e,t=!1){let r=[];if(t)for(let a=0;a<this.length&&!(this[a].start>e);a++){if(this[a].end<e)continue;r.push(this[a])}else{let a=this.getRange(e-1,e),n=this;a.forEach(function(s){s.index>n.#e&&(r.push(s),n.#e=s.index)})}return r}getRange(e,t){e>t&&([e,t]=[t,e]);let r=[],a=-1,n=Math.ceil(Math.sqrt(this.length)),s=!0;for(let i=0;i<this.length;i+=n)this[i+n]?a<0&&this[i+n].start>=e&&(a=i):a=a<0?i:a;for(;s;)this[a]?.end<t?this[a].start>=e&&r.push(this[a]):s=!1,a++;return r}};var ce=0xffffffffffff,$=function(e){let t=new T,r=this,a=e.timeDivision,n=120,s=new T,i=0,c=0;s.push(new x(0,ce,[120,0])),e.track.forEach(function(f){i=0,f.event.forEach(function(d){i+=d.deltaTime,d.type==255&&d?.metaType==81&&(n=6e7/d.data,s[s.length-1]&&s.push(new x(i,0xffffffffffff,[n,0])))})}),s.fresh(),s.forEach(function(f,d,h){d>0&&(h[d-1].end=f.start)});let u=120;s.forEach(function(f,d,h){f.end==f.start?h.splice(h.indexOf(f),1):u==f.data[0]&&(h[d-1].end=f.end,h.splice(h.indexOf(f),1)),u=f.data[0]});let o=0,l=120;return s.forEach(function(f){let d=f.start,h=d/l/a*60+o;l=f.data[0],o=h-d/l/a*60,f.data[1]=o}),console.debug("All tempo changes: ",s),n=120,i=0,c=0,e.track.forEach(function(f,d){i=0,c=0,f.event.forEach(function(h,Pe){i+=h.deltaTime;let I=s.step(i,!0)[0];I&&(n=I.data[0],c=I.data[1]);let b={type:h.type,data:h.data,track:d,part:0};h.type>14?b.meta=h.metaType:b.part=h.channel,t.push(new V(i/n/a*60+c,b))})}),t.fresh(),t};var de=["MSB","PRG","LSB"];var N=class{#e=[];get(e=0,t=0,r=0){let a,n=Array.from(arguments);n[0]==127&&n[2]==0&&n[1]>111&&(n[1]=0),n[0]==0&&n[2]>111&&n[2]<120&&(n[2]=0);let s=" ";for(;!(a?.length>0);)a=this.#e[n[1]||0][(n[0]<<7)+n[2]],a||(n[2]=0,s="^",this.#e[n[1]||0][n[0]<<7]||(n[0]=0,s="*"));s!=" "&&self.debugMode&&(a="");let i="??";switch(n[0]){case 0:{n[2]==0?i="GM":n[2]<120?i="XG":n[2]==127&&(i="MT");break}case 56:{i="AG";break}case 61:case 83:{i="AI";break}case 62:case 82:{i="XD";break}case 81:{i="RW";break}case 64:case 121:case 126:case 127:{i="XG";break}case 120:i="GS";default:n[0]<40&&(i="GS")}return{name:a||(e||0).toString().padStart(3,"0")+" "+(t||0).toString().padStart(3,"0")+" "+(r||0).toString().padStart(3,"0"),ending:s,standard:i}}load(e){let t=this,r=[];e.split(`
`).forEach(function(a,n){let s=a.split("	"),i=[];n==0?(s.forEach(function(c,u){r[de.indexOf(c)]=u}),console.info(`Bank map significance: ${r}`)):s.forEach(function(c,u){u>2?(t.#e[i[r[1]]]=t.#e[i[r[1]]]||[],t.#e[i[r[1]]][(i[r[0]]<<7)+i[r[2]]]=s[3]):i.push(parseInt(s[u]))})})}async loadFiles(...e){this.#e=[];let t=this;for(let r=0;r<e.length;r++)await fetch(`./data/bank/${e[r]}.tsv`).then(function(a){return console.info(`Parsing voice map: ${e[r]}`),a.text()}).then(function(a){t.load.call(t,a)})}constructor(...e){this.loadFiles(...e)}};var fe=["C~","C#","D~","Eb","E~","F~","F#","G~","Ab","A~","Bb","B~"],ue="!0123456789";P.default.customInterpreter=function(e,t,r){let a=[],n=r==!1?t.readIntVLV():r;e==127&&(n=1);for(let s=0;s<n;s++){let i=t.readInt(1);if(a.push(i),i==247)return a;if(i>127)return console.debug(`Early termination: ${a}`),t.backOne(),t.backOne(),a}return a};var he=class extends D{#e=new C;#r;voices=new N("xg","gs","ns5r");reset(){this.dispatchEvent("reset"),this.#r?.resetIndex(),this.#e.init()}async loadFile(e){this.#r=$(P.default.parse(new Uint8Array(await e.arrayBuffer())))}switchMode(e,t=!1){this.#e.switchMode(e,t)}getMode(){return this.#e.mode}render(e){let t=this.#r.step(e),r=0,a=new Set,n=this;t.forEach(function(f){let d=f.data;d.type==9&&(d.data[1]>0?a.add(d.part*128+d.data[0]):a.has(d.part*128+d.data[0])&&r++),f.data.type==8&&a.has(d.part*128+d.data[0])&&r++,n.#e.runJson(d)});let s=this.#e.getActive(),i=[],c=n.#e.getPitch(),u=[],o=n.#e.getProgram(),l=0;return s.forEach(function(f,d){f&&(i[d]=n.#e.getVel(d),u[d]=n.#e.getCc(d),l+=i[d].size)}),{extraPoly:r,curPoly:l,chInUse:s,chKeyPr:i,chPitch:c,chProgr:o,chContr:u,mode:this.getMode()}}},B=class extends he{constructor(){super()}render(e){let t=new Array(30),r=super.render(e),a=this;t[0]=`Poly:${(r.curPoly+r.extraPoly).toString().padStart(3,"0")}/512`,t[2]="Ch:VoiceNme#St Note";let n=3;return r.chInUse.forEach(function(s,i){if(s){let c=a.voices.get(r.chContr[i][0],r.chProgr[i],r.chContr[i][32]);t[n]=`${(i+1).toString().padStart(2,"0")}:${c.name.padEnd(8," ")}${c.ending}${c.standard}`,r.chKeyPr[i].forEach(function(u,o){u>0&&(t[n]+=` <span style="opacity:${Math.round(u/1.27)/100}">${fe[o%12]}${ue[Math.floor(o/12)]}</span>`)}),n++}}),t.join("<br/>")}};var pe=Object.defineProperty,p=(e,t)=>()=>(e&&(t=e(e=0)),t),m=(e,t)=>{for(var r in t)pe(e,r,{get:t[r],enumerable:!0})},G={};m(G,{default:()=>q});var q,me=p(()=>{q=async(e=[{}])=>(Array.isArray(e)||(e=[e]),new Promise((t,r)=>{let a=document.createElement("input");a.type="file";let n=[...e.map(u=>u.mimeTypes||[]).join(),e.map(u=>u.extensions||[]).join()].join();a.multiple=e[0].multiple||!1,a.accept=n||"";let s=()=>c(r),i=u=>{typeof c=="function"&&c(),t(u)},c=e[0].legacySetup&&e[0].legacySetup(i,s,a);a.addEventListener("change",()=>{i(a.multiple?Array.from(a.files):a.files[0])}),a.click()}))}),z={};m(z,{default:()=>H});var j,H,ye=p(()=>{j=async e=>{let t=await e.getFile();return t.handle=e,t},H=async(e=[{}])=>{Array.isArray(e)||(e=[e]);let t=[];e.forEach((n,s)=>{t[s]={description:n.description||"",accept:{}},n.mimeTypes?n.mimeTypes.map(i=>{t[s].accept[i]=n.extensions||[]}):t[s].accept["*/*"]=n.extensions||[]});let r=await window.showOpenFilePicker({id:e[0].id,startIn:e[0].startIn,types:t,multiple:e[0].multiple||!1,excludeAcceptAllOption:e[0].excludeAcceptAllOption||!1}),a=await Promise.all(r.map(j));return e[0].multiple?a:a[0]}}),X={};m(X,{default:()=>K});var K,ve=p(()=>{K=async(e=[{}])=>(Array.isArray(e)||(e=[e]),e[0].recursive=e[0].recursive||!1,new Promise((t,r)=>{let a=document.createElement("input");a.type="file",a.webkitdirectory=!0;let n=()=>i(r),s=c=>{typeof i=="function"&&i(),t(c)},i=e[0].legacySetup&&e[0].legacySetup(s,n,a);a.addEventListener("change",()=>{let c=Array.from(a.files);e[0].recursive?e[0].recursive&&e[0].skipDirectory&&(c=c.filter(u=>u.webkitRelativePath.split("/").every(o=>!e[0].skipDirectory({name:o,kind:"directory"})))):c=c.filter(u=>u.webkitRelativePath.split("/").length===2),s(c)}),a.click()}))}),W={};m(W,{default:()=>Z});var M,Z,ge=p(()=>{M=async(e,t,r=e.name,a)=>{let n=[],s=[];for await(let i of e.values()){let c=`${r}/${i.name}`;i.kind==="file"?s.push(i.getFile().then(u=>(u.directoryHandle=e,u.handle=i,Object.defineProperty(u,"webkitRelativePath",{configurable:!0,enumerable:!0,get:()=>c})))):i.kind==="directory"&&t&&(!a||!a(i))&&n.push(M(i,t,c,a))}return[...(await Promise.all(n)).flat(),...await Promise.all(s)]},Z=async(e={})=>{e.recursive=e.recursive||!1;let t=await window.showDirectoryPicker({id:e.id,startIn:e.startIn});return M(t,e.recursive,void 0,e.skipDirectory)}}),J={};m(J,{default:()=>_});async function we(e,t){let r=e.getReader(),a=new ReadableStream({start(s){return i();async function i(){return r.read().then(({done:c,value:u})=>{if(c){s.close();return}return s.enqueue(u),i()})}}}),n=new Response(a);return r.releaseLock(),new Blob([await n.blob()],{type:t})}var _,ke=p(()=>{_=async(e,t={})=>{Array.isArray(t)&&(t=t[0]);let r=document.createElement("a"),a=e;"body"in e&&(a=await we(e.body,e.headers.get("content-type"))),r.download=t.fileName||"Untitled",r.href=URL.createObjectURL(a);let n=()=>i(reject),s=()=>{typeof i=="function"&&i()},i=t.legacySetup&&t.legacySetup(s,n,r);return r.addEventListener("click",()=>{setTimeout(()=>URL.revokeObjectURL(r.href),30*1e3),s(null)}),r.click(),null}}),Q={};m(Q,{default:()=>Y});var Y,Ie=p(()=>{Y=async(e,t=[{}],r=null,a=!1)=>{Array.isArray(t)||(t=[t]),t[0].fileName=t[0].fileName||"Untitled";let n=[];if(t.forEach((c,u)=>{n[u]={description:c.description||"",accept:{}},c.mimeTypes?(u===0&&(e.type?c.mimeTypes.push(e.type):e.headers&&e.headers.get("content-type")&&c.mimeTypes.push(e.headers.get("content-type"))),c.mimeTypes.map(o=>{n[u].accept[o]=c.extensions||[]})):e.type&&(n[u].accept[e.type]=c.extensions||[])}),r)try{await r.getFile()}catch(c){if(r=null,a)throw c}let s=r||await window.showSaveFilePicker({suggestedName:t[0].fileName,id:t[0].id,startIn:t[0].startIn,types:n,excludeAcceptAllOption:t[0].excludeAcceptAllOption||!1}),i=await s.createWritable();return"stream"in e?(await e.stream().pipeTo(i),s):"body"in e?(await e.body.pipeTo(i),s):(await i.write(blob),await i.close(),s)}}),be=(()=>{if(typeof self>"u")return!1;if("top"in self&&self!==top)try{top.location+""}catch{return!1}else if("showOpenFilePicker"in self)return"showOpenFilePicker";return!1})(),L=be,Ee=L?Promise.resolve().then(()=>(ye(),z)):Promise.resolve().then(()=>(me(),G));async function O(...e){return(await Ee).default(...e)}var et=L?Promise.resolve().then(()=>(ge(),W)):Promise.resolve().then(()=>(ve(),X));var tt=L?Promise.resolve().then(()=>(Ie(),Q)):Promise.resolve().then(()=>(ke(),J));var g=U("[id^=mode]");g.to=function(e){g.forEach(function(t){t.classList.off("active")}),g[e].classList.on("active")};g.forEach(function(e,t,r){e.addEventListener("click",function(){tuiVis.switchMode(e.title),g.to(t)})});self.tuiVis=new B;tuiVis.addEventListener("reset",function(e){});var k,Ae=JSON.parse('{"extensions":[".mid",".MID"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}'),xe=JSON.parse('{"mimeTypes":["audio/*"],"startIn":"music","id":"audioOpener","description":"Open an audio file"}');y("#openMidi").addEventListener("click",async function(){tuiVis.reset(),tuiVis.loadFile(await O(Ae))});y("#openAudio").addEventListener("click",async function(){k&&URL.revokeObjectURL(k),k=await O(xe),w.src=URL.createObjectURL(k)});var w=y("#audioPlayer"),Te=y("#display");w.onended=function(){tuiVis.reset()};w.src="./demo/KANDI8.opus";(async function(){tuiVis.reset(),tuiVis.loadFile(await(await fetch("./demo/KANDI8.MID")).blob())})();var ot=setInterval(function(){w.paused||(Te.innerHTML=tuiVis.render(w.currentTime-(self.audioDelay||0)))},40);})();
