if(!self.define){let s,e={};const l=(l,i)=>(l=new URL(l+".js",i).href,e[l]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()})).then((()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s})));self.define=(i,n)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let u={};const a=s=>l(s,r),o={module:{uri:r},exports:u,require:a};e[r]=Promise.all(i.map((s=>o[s]||a(s)))).then((s=>(n(...s),u)))}}define(["./workbox-3625d7b0"],(function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"apple-touch-icon.png",revision:"e712dec7ee380888b4877867edf1d30c"},{url:"assets/A0.f62d50bd.mp3",revision:null},{url:"assets/A1.17fa1e36.mp3",revision:null},{url:"assets/A1.842cb406.mp3",revision:null},{url:"assets/A2.20601d89.mp3",revision:null},{url:"assets/A2.e8eb77d9.mp3",revision:null},{url:"assets/A3.8e108fe2.mp3",revision:null},{url:"assets/A4.a62df24a.mp3",revision:null},{url:"assets/A5.9e5cee1f.mp3",revision:null},{url:"assets/A6.b6064a65.mp3",revision:null},{url:"assets/A7.751c0a0a.mp3",revision:null},{url:"assets/As1.9b8141e9.mp3",revision:null},{url:"assets/B1.7f340ba0.mp3",revision:null},{url:"assets/C1.caba05f0.mp3",revision:null},{url:"assets/C2.489ba5dc.mp3",revision:null},{url:"assets/C2.7029a9e8.mp3",revision:null},{url:"assets/C3.bb70dd92.mp3",revision:null},{url:"assets/C4.689eaa4c.mp3",revision:null},{url:"assets/C5.2f5b0f74.mp3",revision:null},{url:"assets/C6.0d3232ed.mp3",revision:null},{url:"assets/C7.694b512f.mp3",revision:null},{url:"assets/C8.b4b5f321.mp3",revision:null},{url:"assets/Cs2.51d48ace.mp3",revision:null},{url:"assets/D2.37723401.mp3",revision:null},{url:"assets/Ds1.1c02b816.mp3",revision:null},{url:"assets/Ds2.8d5cd22d.mp3",revision:null},{url:"assets/Ds2.a106cdec.mp3",revision:null},{url:"assets/Ds3.4fe73ea3.mp3",revision:null},{url:"assets/Ds4.663e8bb3.mp3",revision:null},{url:"assets/Ds5.bf71096e.mp3",revision:null},{url:"assets/Ds6.eb643014.mp3",revision:null},{url:"assets/Ds7.d51f4c51.mp3",revision:null},{url:"assets/E2.c94367ef.mp3",revision:null},{url:"assets/F2.690455b2.mp3",revision:null},{url:"assets/Fs1.5cbb51d2.mp3",revision:null},{url:"assets/Fs2.0418a94c.mp3",revision:null},{url:"assets/Fs2.dd34c708.mp3",revision:null},{url:"assets/Fs3.960fefd9.mp3",revision:null},{url:"assets/Fs4.613652f5.mp3",revision:null},{url:"assets/Fs5.ed2fdf54.mp3",revision:null},{url:"assets/Fs6.c584d2b4.mp3",revision:null},{url:"assets/Fs7.e9ce71e0.mp3",revision:null},{url:"assets/G2.7630d775.mp3",revision:null},{url:"assets/Gs1.4b47822f.mp3",revision:null},{url:"assets/index.8e8cae16.js",revision:null},{url:"assets/index.e1944e8c.css",revision:null},{url:"favicon.ico",revision:"4e27666c758b408ca4a4023d34a756d3"},{url:"icon-192-maskable.png",revision:"ccbc9a06829113db7ab0b7b0234a5f21"},{url:"icon-192.png",revision:"e4ed76a5bd049ee607d8f83c5d61907a"},{url:"icon-512-maskable.png",revision:"a0579d5084c6acbf6b63b3477336d101"},{url:"icon-512.png",revision:"807925e9403c02b7fc125051daa33722"},{url:"index.html",revision:"633f833cd905ec2d6fd8be3015aa7404"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"favicon.ico",revision:"4e27666c758b408ca4a4023d34a756d3"},{url:"icon-192.png",revision:"e4ed76a5bd049ee607d8f83c5d61907a"},{url:"icon-512.png",revision:"807925e9403c02b7fc125051daa33722"},{url:"icon-192-maskable.png",revision:"ccbc9a06829113db7ab0b7b0234a5f21"},{url:"icon-512-maskable.png",revision:"a0579d5084c6acbf6b63b3477336d101"},{url:"manifest.webmanifest",revision:"aaffa9924528098a4193d54c500c7bda"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
