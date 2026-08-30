# Araru Design System application audit

The web client consumes semantic CSS variables through Tailwind aliases (`bg-background`, `bg-surface`, `text-primary`, `text-secondary`, `text-muted`, `border-subtle`, `bg-accent`, `text-accent-foreground`, `text-link`, and `ring-focus`).

The canonical source for these values is the sibling `araru-design` repository. Keep token changes there first, then update this client mapping.

The central primitives are the source of truth for buttons, inputs, dialogs, sheets, menus, switches, tabs, skeletons and tooltips. Product surfaces remain neutral so covers provide the strongest color signal. Reading progress uses the accent token; status colors use semantic success, warning, danger and info roles.

## Theme Transition

The official theme-switch pattern uses `ThemeToggleButton` with a direct persisted theme update and an immediate Sun/Moon icon swap. The button uses semantic foreground tokens and preserves keyboard focus and ARIA labels. No theme animation, full-screen overlay, Lottie, View Transitions, cloned DOM or secondary React root is used.

## Validation matrix

| Area | Light | Dark | Responsive | Notes |
| --- | --- | --- | --- | --- |
| App shell / navigation | Build | Build | 320px+ | Semantic header and mobile navigation |
| Home / library / history | Build | Build | 320px+ | Neutral surfaces and content-first cards |
| Search / dialogs | Build | Build | 320px+ | Focus and overlay tokens centralized |
| Reader | Build | Build | 320px+ | Immersive chrome remains intentionally separate |
| Admin | Build | Build | 320px+ | Legacy utility classes remain under migration |

Automated build and lint do not replace manual contrast, keyboard, screen-reader and screenshot review. A residual scan currently reports legacy utility classes in Reader/Admin and older content screens; these are the next migration scope and are intentionally not marked as complete.
