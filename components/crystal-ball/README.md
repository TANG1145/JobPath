# CrystalizedBall

Source: React Bits component supplied in the user's attached integration text. Preserved component implementation; isolated React/ogl bundle leaves the existing vanilla v0.7 application in place.

Local adaptations: amber palette, 600 particles, 12 FPS frame cadence, no intro; IntersectionObserver mounts only visible category balls and disposes off-screen instances. Reduced-motion and unavailable WebGL use a static clickable fallback. Category buttons retain keyboard access independently of the decoration. No remote runtime script or image requests.

Build: `npm run build` generates ignored `public/visuals/crystal-ball.js` and CSS, also copied into dist. Run the build before browser tests from a fresh checkout.

Second tjj iteration: plasma preset with alternating amber/green cassette palette, fill 0.5, crackle 0.85, hover strength 0.7 from the user's latest reference. Independent pointer parallax moves category bubbles and rotates their visuals; labels remain readable. Runtime reduced-motion changes stop rendering. Landing descriptions are moved into category details.
