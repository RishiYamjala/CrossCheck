# CrossCheck Campus — Design Brief

## Theme Name
Signal / Gap / Link

## Design movement
Editorial control-room dashboard: a calm, high-signal interface that turns fragmented campus activity into a legible evidence trail.

## Core principles
- Make invisible relationships visible without overwhelming the user.
- Use cyan for connective structure and reserve warm red/amber for risk.
- Treat each system as a distinct voice, then unify them on the timeline.
- Prioritize scanability: strong headings, compact metadata, and clear next actions.

## Color philosophy
The foundation is near-black navy (#07111f) with layered slate surfaces. Cyan (#5ce1e6) marks linking, focus, and primary actions. System colors are fixed: Attendance blue, ID Gate green, Campus Wi-Fi purple, Student Portal orange, Library yellow. Conflict severity uses amber for medium and red for high.

## Layout paradigm
Three-stage single-page story: landing establishes the gap, dashboard becomes the investigation workspace, results closes the loop. Use a wide responsive workspace with a left control rail, a central evidence timeline, and a right findings rail that collapses naturally on smaller screens.

## Signature elements
- A split-link “CC” mark as the product logo.
- Dashed connectors and small “signal” ticks that imply independent systems becoming one network.
- Compact monospace timestamps paired with large readable labels.
- Red glow around timeline events when corroborating evidence forms a conflict.

## Interaction philosophy
Every control responds immediately. Connecting systems is intentionally staged so the user sees the model assemble in real time. Changing a student or toggle updates the timeline and findings without page reloads. Buttons are explicit and action-oriented.

## Animation
Use subtle 180–260ms ease-out transitions for cards and controls. The Connect All action uses one 400ms step per system. Conflict cards fade and slide in, while flagged timeline events pulse gently rather than flashing.

## Typography system
Use Inter/system sans for UI, with a restrained mono stack for timestamps, IDs, labels, and rule names. Headlines are compact and bold; body text stays at comfortable reading sizes.

## Brand essence
CrossCheck Campus is the connective tissue between systems that were never designed to talk.

## Brand voice
Plain-English, precise, quietly urgent. Explain the contradiction first, then the recommended action.

## Wordmark/logo
A simple split-link “CC” monogram in cyan and white on a full-bleed navy square. The negative space between the two C shapes suggests two systems crossing into one check.

## Signature brand color
Signal cyan #5ce1e6.

## Delivery decisions
- Frontend-only static SPA with browser-rendered state-based screens.
- No API routes, authentication, or persistent storage.
- One browser route (`/`) and a root `public/manus-routes.json` manifest.
- Build output is `dist` and static assets are cacheable; HTML is served as the SPA shell.
