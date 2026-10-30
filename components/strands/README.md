# Strands + rigid-body navigation

Strands.jsx and Strands.css are from the user's supplied React Bits Strands JavaScript/CSS reference. The previous CrystalizedBall implementation has been removed.

Matter.js 0.20.0 (MIT) drives circle gravity, contact friction, restitution, rotation, hover impulses and spring dragging. Primary references:
- https://github.com/liabru/matter-js/blob/master/examples/ballPool.js
- https://brm.io/matter-js/docs/classes/Bodies.html
- https://brm.io/matter-js/docs/classes/Body.html

DOM buttons follow physical bodies; the Strands visual rotates while in-ball text stays upright. A drag suppresses the subsequent click; keyboard focus pins a ball for stable activation. Search rebuilds bodies, resize recreates bounds, hidden tabs/offscreen fields pause, and disposal clears physics and WebGL resources. Reduced-motion and fields narrower than 420px use a static layout. Visible WebGL instances are capped at 12; other circles remain clickable with a static visual.

Palette remains cream/amber/green. The field has no visible outer frame. Build with `npm run build`; generated bundle is `public/visuals/strands.js`.
