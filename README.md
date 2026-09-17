# Viral Cat

A responsive website for Viral Cat, a chapter of Mindstory. The design uses the supplied purple-and-orange logo artwork with a scroll-driven parallax hero.

## Included

- Three-scene hero driven by GSAP ScrollTrigger and native scroll, with slide buttons, previous/next controls, touch swipe, reduced-motion support and direct service hotspots. The sticky stage falls back to an ordinary layout when the viewport cannot fit the content.
- Original logo mascot, cropped with an SVG image viewport and repeated in CSS depth layers. The front artwork is untouched: exact silhouette, goggles, ears, proportions and colours. GSAP pointer tracking, pounce and peek timelines preserve the original design. No generated or procedural model is shown.
- Interactive service directory with six selectable detail panels, plus business-category tabs.
- A redesigned “Different Point of View” workspace with three business tabs, a draggable before/after reveal, keyboard slider controls and a clear explanation of the local story.
- Six expanded service pages with unique titles, descriptions, canonicals, social metadata, service/breadcrumb structured data, FAQs and service-specific enquiry forms.
- Sitemap and robots routes; the existing private audience remains unchanged. Search indexing requires a public, crawlable deployment.
- Desktop mega menus and an accordion-based mobile menu covering every service, business category and tool.
- Cat Street puzzle play is free practice: scores stay in the page for the session and are never sent to the server.
- Contact links verified from https://viralcatmeow.com/contact/: +91 77364 02151, 0487 2961410 and hello@viralcatmeow.com. Only contact details were taken from that site.
- GSAP page parallax and reveal effects with route cleanup and reduced-motion support.
- Six business-category pages and six clearly labelled illustrative creative concepts.
- Service finder, six-question presence self-assessment, curated idea lab, territory planning and printable results.
- Four local-business guides with search.
- Three-step brief builder that carries selected services, ideas and assessment answers into a saved enquiry.
- Guided Ask Cat FAQs, mobile navigation, reduced-motion controls, responsive layouts and page metadata.

## Persistence and access

This website has no login, no user accounts and no personal workspace. Every page is public and anonymous.

Submitted briefs and local-growth enquiries both post to `POST /api/briefs`, which writes one JSON file per submission through `findBrief`/`saveBrief` in `lib/server.ts`. The directory defaults to `.data/briefs/` and can be moved with `BRIEF_DATA_DIR`. Mutations check request origin, and the submission id makes a retry idempotent rather than creating a duplicate record.

Those two functions are the only storage code in the project. Replace them with a database client, an email send or a form service if you deploy somewhere with a read-only filesystem.

## Validation

- `npm run build` (Next.js production build).
- `npx tsc --noEmit` and `npm run lint`.
- `npm test`: puzzle solvability, hints and scoring; all six service enquiry payloads against the real route handler; and the movement/camera checks.
- Static internal-link and asset checks.

The WebMCP service-finder tool uses the same state as the visible finder, validates category/goal values, and unregisters on unmount. Supported-browser WebMCP execution validation was unavailable in this environment. Browser QA was not run under the selected execution profile.

## Connections required for a wider operating rollout

CRM/email notifications, real client approval assignments, publishing integrations, live platform reporting, confirmed scheduling and a shared agency administration interface are not configured. Submitted briefs are stored on the site; automatic email delivery is not implied. Public creative work is labelled illustrative. The presence tool is a self-assessment, not a live account audit. Service availability is confirmed through an actual business conversation.
