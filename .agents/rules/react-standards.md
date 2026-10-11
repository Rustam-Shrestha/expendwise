---
trigger: always_on
description: "React 19, State Architecture, Styling & Component Modularity Standards."
---

# React 19 & Core Architecture Rules

## 1. Core Principles & Component Paradigms
- **Functional Components Exclusively**: Functional components with hooks are mandatory. Class-based components are strictly banned.
- **Zero Spaghetti Code**: Ban raw, repetitive `useState`/`useEffect`/`useRef` boilerplate for data fetching, URL parameter sync, form state, or async state coordination.
- **Modularity & Reusability**:
  - Encapsulate UI elements by reusing components from `src/components/common/` instead of using raw HTML tags directly.
  - Separate concerns into isolated single-purpose files (e.g., dedicated files for each modal, slide-over, or sub-view) instead of polluting a single file.

## 2. Mandatory State Management & Hook Standards
- **Server State / Data Fetching & Caching**: Use **TanStack Query** (`useQuery`, `useMutation`). Never manually fetch inside `useEffect` or store server responses directly in Redux.
- **Global Client State**: Use **Redux Toolkit** (`slices`, `useSelector`, `useDispatch`) strictly when global application-wide scoping is mandatory (e.g., auth, permissions, UI theme state).
- **URL Search, Filter & Pagination State**: Use **nuqs** (`useQueryState`) instead of manual `useState` or `window.location` / `useEffect` syncing.
- **Form State, Server Actions & Submissions**: Use **`useActionState`** and **`useFormStatus`** for form handling, action dispatching, and submission statuses.
- **Instant Perceived Performance**: Use **`useOptimistic`** for immediate UI feedback during async mutations.
- **Deferred Low-Priority Rendering & Filtering**: Use **`useDeferredValue`** or **`useTransition`** to keep UI responsive during non-blocking re-renders.
- **Derived Computations & Custom Hooks**: Leverage **`useMemo`** for expensive derivations and encapsulate complex logic into specialized custom hooks.
- **External Subscriptions & Store Bindings**: Use **`useSyncExternalStore`** for subscribing to external data sources or browser APIs.
- **Resource & Promise Unwrapping**: Use the **`use`** API to unwrap Promises or React contexts dynamically within components.

## 3. Styling Standard
- **TailwindCSS & CSS Variables**: Use standard TailwindCSS utility classes paired with CSS theme variables (`var(--theme-primary)`).
