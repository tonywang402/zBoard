---
name: "Testing Architecture"
description: "Full testing architecture for zBoard: layers, tooling, setup, boilerplate, conventions, and test case guide."
applyTo: "**/tests/**"
---

# Testing Architecture

The codebase splits naturally into three testable layers, each with a different tool profile and scope.

## Layer Overview

| Layer | Scope | Tools | Location |
|---|---|---|---|
| **Unit** | API route business logic, data transformation, config-gate branching | Jest + ts-jest + jest-fetch-mock | `src/pages/api/__tests__/` |
| **Component** | UI state transitions, conditional rendering, date-based logic | React Testing Library + jest-dom | `src/components/__tests__/` |
| **Middleware** | Auth gate branches, redirect/401 logic, cookie validation | Jest + Web API polyfills | `src/__tests__/` |

---

## Installation

```bash
npm install --save-dev \
  jest ts-jest @types/jest jest-fetch-mock \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jest-environment-jsdom
```

## `jest.config.ts` (project root)

```ts
export default {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/pages/api/**/__tests__/**/*.test.ts',
                  '<rootDir>/src/lib/**/__tests__/**/*.test.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      setupFiles: ['./jest.setup.ts'],
    },
    {
      displayName: 'component',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/components/**/__tests__/**/*.test.tsx',
                  '<rootDir>/src/__tests__/middleware.test.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      setupFilesAfterFramework: ['@testing-library/jest-dom'],
    },
  ],
};
```

## `jest.setup.ts` (project root)

```ts
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
```

## `package.json` scripts

```json
"scripts": {
  "test": "jest",
  "test:unit": "jest --selectProjects unit",
  "test:component": "jest --selectProjects component"
}
```

---

## Layer Details

For boilerplate, conventions, and test case guides, see the individual layer files:

- [UnitTests.instructions.md](UnitTests.instructions.md) — API route logic, config-gate branching, data transforms, HTTP error handling
- [ComponentTests.instructions.md](ComponentTests.instructions.md) — UI state machines, conditional rendering, date-based logic
- [MiddlewareTests.instructions.md](MiddlewareTests.instructions.md) — Auth gate branches, redirect/401 logic, cookie validation


---
