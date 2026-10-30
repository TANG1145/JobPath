import React from 'react';
import {createRoot} from 'react-dom/client';
import CrystalizedBall from './CrystalizedBall.jsx';
const fallback='<div class="static-orb"></div>';
class VisualBoundary extends React.Component{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="static-orb"/>:this.props.children}}
export function mount(host){
 if(!host.getBoundingClientRect().width||matchMedia('(prefers-reduced-motion: reduce)').matches){host.dataset.visualState='static';host.innerHTML=fallback;return ()=>{host.innerHTML=fallback}}
 const probe=document.createElement('canvas');let gl;try{gl=probe.getContext('webgl2')}catch{}if(!gl){host.dataset.visualState='unavailable';host.innerHTML=fallback;return ()=>{}}gl.getExtension('WEBGL_lose_context')?.loseContext();
 if(!document.querySelector('[data-crystal-css]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/public/visuals/crystal-ball.css';link.dataset.crystalCss='true';document.head.append(link)}
 host.dataset.visualState='mounted';const root=createRoot(host);root.render(<VisualBoundary><CrystalizedBall preset="plasma" color={getComputedStyle(host.closest("article")).getPropertyValue("--orb-color").trim()||"#175641"} size={0.66} particleCount={600} glow={0.22} haze={0} flares={0.12} crackle={0.85} fill={0.5} sparks={0.1} intro={false} speed={0.4} dustSpeed={0.3} interactive hoverStrength={0.7}/></VisualBoundary>);
 const media=matchMedia('(prefers-reduced-motion: reduce)');let unmounted=false;const stop=()=>{if(!unmounted){root.unmount();unmounted=true}host.innerHTML=fallback;host.dataset.visualState='static'};const onMotion=()=>{if(media.matches)stop()};media.addEventListener('change',onMotion);
 return ()=>{media.removeEventListener('change',onMotion);stop()};
}
