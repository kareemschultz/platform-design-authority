---
"@meridian/ui-web": patch
"web": patch
---

Raise Button's default size from `h-8` (32px) to `h-10` (40px), the platform's registered "Preferred product target" per `DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md`, and bump `lg` (`h-9`->`h-11`) and the plain `icon`/`icon-lg` sizes (`size-8`/`size-9`->`size-10`/`size-11`) to keep the size ladder paired and visually distinct above the new default. Remove 34 now-redundant `min-h-10`/`size-10` className overrides across 16 files that existed only to work around the previous sub-40px defaults.
