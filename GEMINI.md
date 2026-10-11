---
trigger: always_on
description: "Surgical guidelines and core architecture rules for YBC UI Frontend."
---

# GEMINI.md — Core Operating Rules

## 1. Tech & Architectural Hierarchy (React 19 Zero-Bloat Standard)
- **Component Model**: Modern functional components exclusively. Class-based components are strictly banned.
- **No `useState`/`useEffect`/`useRef` Spaghetti**: Minimize raw hooks. Prefer Redux reducers, TanStack Query, `useMemo`, and specialized custom hooks.
- **Server Data**: TanStack Query v5 (`useQuery`, `useMutation`). Never store server responses directly in Redux.
- **Global Client State**: Redux Toolkit slices (`auth`, `ui`, `account`, `permissions`) strictly when global scoping is mandatory.
- **URL Search/Filter/Pagination**: `nuqs` (`useQueryState`) for search/filter/pagination URL state.
- **Form Handling & Actions**: Modern React 19 form actions (`useActionState`, `useFormStatus`).
- **UI Responsiveness & Performance**: `useOptimistic` for immediate mutation feedback; `useDeferredValue`/`useTransition` for non-blocking rendering.
- **Subscriptions & Resources**: `useSyncExternalStore` for store/browser bindings; `use` API for resource/Promise unwrapping.
- **Modularity & Reusability**: Use `src/components/common/` for UI elements instead of raw HTML elements directly. Create isolated, single-purpose files for each component/modal.
- **Styling**: Standard TailwindCSS utility classes + CSS theme variables (`var(--theme-primary)`).
- **Detailed Rules**: See [.agents/rules/react-standards.md](file:///C:/HDD%20backups/Client%20Docs/Jyrasoft/ybc-ui/.agents/rules/react-standards.md) & [.agents/rules/code-style.md](file:///C:/HDD%20backups/Client%20Docs/Jyrasoft/ybc-ui/.agents/rules/code-style.md).

## 2. API & RBAC Rules
- **Endpoints**: Centralized in `src/services/endpoints/index.js`. Call via `src/services/apiService.js`. Never hardcode raw URLs.
- **RBAC**: Evaluate permissions using `useCan()`, `usePermission()`, or `PermissionGate`. Keys from `src/utils/permissionKeys.js`.

## 3. Token-Efficient Workflow
- **Search-First**: Always execute `rg` or `fd` before viewing code. Never read whole folders or full files unnecessarily.
- **Targeted I/O**: Use line ranges when reading files. Make surgical edits.
- **Subagents First**: Delegate isolated research or heavy search sub-tasks to subagents to preserve context window length.
- **Clean Code Hygiene**: Remove debugging logs before completing tasks.
