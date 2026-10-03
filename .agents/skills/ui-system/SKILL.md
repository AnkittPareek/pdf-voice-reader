---
name: ui-system
description: Design tokens, spacing, typography, accessibility, screen conventions, reusable component rules
---

# UI System Skill

## Design Tokens
- All tokens defined in `src/theme/`
- Colors: `colors.ts` (light and dark themes)
- Typography: `typography.ts` (display, title, body, secondary, caption)
- Spacing: `spacing.ts` (xs through 5xl)
- Theme provider: `theme.ts` (ThemeProvider, useTheme)

## Rules
- **Never hard-code colors** — always use `theme.colors.*`
- **Never hard-code fonts** — always use `theme.typography.*`
- **Never hard-code spacing** — use `theme.spacing.*` or `theme.radii.*`
- **Minimum touch target**: 48dp (imported from `spacing.ts`)

## Visual Direction
- Calm / premium / editorial / audio-first
- Avoid: excessive gradients, glassmorphism, 3D elements, hero illustrations, random rounded cards, AI-generated clutter

## Accessibility
- TalkBack-compatible controls
- Meaningful `accessibilityLabel` on all interactive elements
- Adequate contrast (WCAG AA minimum)
- No color-only state indication
- Playback state announced clearly
- No clipping at large system font settings

## Screen Conventions
- 3 primary screens: Library, Reader/Listening, Settings
- No bottom tab navigation with empty tabs
- Header: title left, settings/actions right
- Content area with appropriate padding (20px horizontal)
- SafeAreaView on all screens
