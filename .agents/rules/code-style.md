---
trigger: always_on
description: "Styling standards, modularity, reusability, and error handling rules."
---

# Code Style & Modularity Standards

- **Naming Conventions**: Components `PascalCase.jsx`, hooks `useCamelCase.js`, utils `camelCase.js`.
- **Styling Standard**: Standard TailwindCSS utility classes combined with CSS theme variables (`var(--theme-primary)`).
- **Modularity & Component Reusability**:
  - Prefer common design system components in `src/components/common/` instead of writing raw HTML elements (`<button>`, `<input>`, `<select>`, etc.) directly in feature components.
  - Single-Responsibility Files: Create isolated, single-purpose files for each new element (e.g., modals, slide-overs, feature dialogs) rather than polluting a single file.
- **Hook & State Hygiene**:
  - Minimize raw `useState`, `useEffect`, and `useRef`.
  - Prefer TanStack Query, Redux Toolkit reducers, `useMemo`, and dedicated specialized custom hooks for state and side effects.
- **Logging Hygiene**: Zero `console.log` statements in committed code. Remove all debug logs prior to task completion.
- **Error Handling**: Use `PopMessage.error(message)` for user-facing UI notifications. Wrap async calls in `try/catch` and rely on `apiService.js` interceptors for 401/403 status handling.
