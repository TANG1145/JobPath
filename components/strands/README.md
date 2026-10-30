# Strands + rigid-body navigation

Strands.jsx and Strands.css are from the user's supplied React Bits Strands JavaScript/CSS reference. The previous CrystalizedBall implementation has been removed.

Matter.js 0.20.0 (MIT) drives circle gravity, contact friction, restitution, rotation, hover impulses and spring dragging. Primary references:
- https://github.com/liabru/matter-js/blob/master/examples/ballPool.js
- https://brm.io/matter-js/docs/classes/Bodies.html
- https://brm.io/matter-js/docs/classes/Body.html

DOM buttons follow physical bodies; the Strands visual rotates while in-ball text stays upright. A drag suppresses the subsequent click; keyboard focus pins a ball for stable activation. Search rebuilds bodies, resize recreates bounds, hidden tabs/offscreen fields pause, and disposal clears physics and WebGL resources. Reduced-motion and fields narrower than 420px use a static layout. One shared WebGL renderer feeds all 18 sphere canvases. Offscreen spheres retain the same rendered appearance; reduced motion and unavailable WebGL use a captured frame of the same Strands effect. This avoids browser context limits and eliminates the former mismatched green fallback.

Palette remains cream/amber/green. The field has no visible outer frame. Build with `npm run build`; generated bundle is `public/visuals/strands.js`.
