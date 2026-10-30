import Matter from 'matter-js';
const {Engine,Bodies,Composite,Body}=Matter;
export function createBallWorld(width,height,radius,count){
 const engine=Engine.create({enableSleeping:true});engine.gravity.y=1;engine.gravity.scale=.001;
 const cols=Math.max(1,Math.floor(width/(radius*2+8)));
 const balls=Array.from({length:count},(_,i)=>Bodies.circle(Math.min(width-radius-3,radius+6+(i%cols)*(radius*2+8)+(Math.floor(i/cols)%2)*radius*.35),radius+8+Math.floor(i/cols)*(radius*2+6),radius,{restitution:.46,friction:.14,frictionStatic:.3,frictionAir:.018,sleepThreshold:45},48));
 const walls=[Bodies.rectangle(width/2,height+30,width+120,60,{isStatic:true}),Bodies.rectangle(-30,height/2,60,height+120,{isStatic:true}),Bodies.rectangle(width+30,height/2,60,height+120,{isStatic:true}),Bodies.rectangle(width/2,-40,width+120,80,{isStatic:true})];Composite.add(engine.world,[...balls,...walls]);
 return {engine,balls,step:()=>Engine.update(engine,1000/60),clear:()=>{Composite.clear(engine.world,false);Engine.clear(engine)}};
}
export function nudgeBall(body,point,velocity){const dx=body.position.x-point.x,dy=body.position.y-point.y,d=Math.hypot(dx,dy)||1;if(d>body.circleRadius+24)return false;Matter.Sleeping.set(body,false);const speed=Math.min(12,Math.hypot(velocity.x,velocity.y));const magnitude=body.mass*Math.min(.012,speed*.001);Body.applyForce(body,point,{x:(dx/d*.65+Math.max(-1,Math.min(1,velocity.x/10))*.35)*magnitude,y:(dy/d*.65+Math.max(-1,Math.min(1,velocity.y/10))*.35)*magnitude});return true}
