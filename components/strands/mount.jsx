import React from 'react';import {createRoot} from 'react-dom/client';import Strands from './Strands.jsx';
export {bindBubbleField} from '../../src/bubble-field.js';
const fallback='<div class="static-orb"></div>';
class Boundary extends React.Component{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="static-orb"/>:this.props.children}}
export function mount(host){
 const media=matchMedia('(prefers-reduced-motion: reduce)');if(media.matches){host.dataset.visualState='static';host.innerHTML=fallback;return ()=>{}}const probe=document.createElement('canvas');let gl;try{gl=probe.getContext('webgl2')}catch{}if(!gl){host.dataset.visualState='unavailable';host.innerHTML=fallback;return ()=>{}}gl.getExtension('WEBGL_lose_context')?.loseContext();
 if(!document.querySelector('[data-strands-css]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/public/visuals/strands.css';link.dataset.strandsCss='true';document.head.append(link)}
 const root=createRoot(host);host.dataset.visualState='mounted';root.render(<Boundary><Strands colors={['#b6793e','#FFB23E','#eee5bc','#74FF9A','#315640']} glass glassSize={1.12} count={3} energy={0.5} intensity={0.65} glow={0.18} dispersion={0.12} speed={0.5} interactive clickPulse={false} intro={false} maxDevicePixelRatio={1}/></Boundary>);
 let stopped=false;const stop=()=>{if(!stopped){stopped=true;root.unmount()}host.innerHTML=fallback;host.dataset.visualState='static'};const change=()=>{if(media.matches)stop()};media.addEventListener('change',change);return ()=>{media.removeEventListener('change',change);stop()};
}
