var l=function(e,c=0){let r=e[0]>>4,n=e[0]&15,t={track:(c&15)+240,type:r,data:e.slice(1)};if(r<15)return t.part=n,t;if(n==0)return t;console.warn(`Unknown special event channel ${n}.`)},a=function(){return new BroadcastChannel("cc.ltgc.octavia:MainBus")};export{a as getBridge,l as jsonConvert};
