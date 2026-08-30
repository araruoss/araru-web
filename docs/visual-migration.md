# Araru Web visual migration

The visual layer follows this ownership chain:

`Base UI behavior → shadcn-compatible primitives → Araru UI → product components → pages`

## Visual inventory

| Component | Previous pattern | Araru pattern | Action |
| --- | --- | --- | --- |
| Header | Glass/pill toolbar | Product header with semantic tokens and responsive bottom navigation | Rewritten |
| LivroCard | Presentation-heavy legacy book card | `WorkCard` with cover-led states and accessible actions | Rewritten |
| ReadingHome | Independent shelves and legacy cards | `MediaRail` product pattern | Rewritten |
| VirtualBookGrid | Grid coupled to `LivroCard` | Virtualized grid coupled to `WorkCard` | Rewired |
| Dialogs | Ad-hoc overlays | `components/ui/dialog.tsx` backed by Base UI Dialog | Boundary added |
| Mobile filters | Desktop panel reused on mobile | `components/ui/sheet.tsx` boundary | Available for migration |
| Forms | Raw controls with repeated classes | `Button`, `Input`, `Select`, `Switch` primitives | Rewritten progressively |
| Admin settings | Legacy panel styling | Semantic token primitives and section layout | In migration |
| Reader chrome | Immersive reader-specific controls | Kept separate from AppShell; visual migration follows reader risk boundary | Preserved logic |

## Rules

- Features import from `components/ui`, `components/content`, or domain hooks; they do not import Base UI directly.
- API, query, authentication, reader engines, progress, favorites and storage behavior remain unchanged.
- New UI uses semantic Tailwind tokens (`background`, `surface`, `primary`, `muted`, `border`, `accent`, `success`, `danger`, `info`).
- Raw colors and visual aliases are confined to the token layer in `src/index.css`.
- Reader remains an immersive experience and does not inherit the authenticated AppShell.
- Legacy files may remain only while their logic is extracted; active library rendering no longer depends on `LivroCard`.

## Validation matrix

Validate Home, Library, Work Details, Search, Profiles, Reader and Admin in light/dark themes at 360, 390, 768, 1024, 1280 and 1440+ pixels. Keyboard focus, reduced motion and minimum 44px touch targets are part of the acceptance criteria.
