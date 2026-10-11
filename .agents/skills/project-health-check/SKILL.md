---
name: project-health-check
description: "Surgical code quality and endpoint integrity health check workflow."
---

# Project Health Check Skill

1. **Endpoint Integrity**: Verify all API calls reference keys in `src/services/endpoints/index.js`.
2. **Imports & Syntax**: Check for missing component exports or broken JSX syntax in modified files.
3. **Console Cleanup**: Ensure no leftover `console.log` statements remain in `src/`.
4. **Build Verification**: Run `npm run build` or Vite build check to verify clean compilation without missing module errors.
