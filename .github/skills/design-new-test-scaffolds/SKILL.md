---
name: design-new-test-scaffolds
description: Analyzes implementation code (where no tests exist yet) to design a standardized test scaffold, recommend best practices, and provide a test case guide. Use this skill when the user asks to design or generate new tests from scratch based on implementation files.
---

# Zero-to-One Test Scaffold Design Guide

When the user provides implementation files and requests to design a test scaffold for a specific test type, you must act autonomously to analyze the source code, apply industry best practices, and generate a structured English guide. 

## Summarization Principles: Keep it Concise & Essential
Before generating the output, apply this strict filtering rule: **"Would removing this cause the developer or AI to make mistakes?"** If not, explicitly cut it out.

**✅ MUST INCLUDE (High-Value Context):**
- Highly recommended test runners or mock strategies specifically suited for the analyzed implementation code.
- Specific edge cases, boundary conditions, or error handling paths found directly in the provided source code.
- Essential setup/teardown steps required by the implementation's dependencies.

**❌ MUST EXCLUDE (Bloat to Avoid):**
- Standard programming language conventions that AI already inherently knows.
- Detailed API documentation (provide a brief link to docs instead).
- Self-evident, generic practices (e.g., "write clean tests", "use arrange-act-assert").

---

## Workflow Phases
You MUST follow these 4 phases and adhere to the Summarization Principles above.

### Phase 1: Purpose Analysis
Analyze the provided implementation files and the target test type. Clearly and concisely summarize the core purpose of this test type for this specific code (e.g., what critical business logic or integration points it must verify).

### Phase 2: Scaffold Generation (Project-Specific Injection)
Design a standardized test boilerplate based on industry best practices for the identified stack.
**CRITICAL INSTRUCTION to prevent matching generic public code:** 
Since there are no existing tests, you MUST deeply inject the specific context from the provided implementation files to make the code highly unique:
- Extract actual class names, function names, and domain terminology from the source code.
- Infer and write realistic mock structures based on the actual dependencies imported in the source code.
- Do NOT use placeholder names like `ExampleComponent`, `mockData`, `foo`, or `test`. 

### Phase 3: Conventions & Practices
Since this project lacks existing tests, recommend 3 to 5 strict, high-value testing conventions based on industry best practices for this stack. Focus on naming rules, mock isolation strategies, and directory structures.

### Phase 4: Test Cases Guide
Analyze the logic branches (if/else, try/catch) in the provided implementation files. Provide a precise checklist of the exact test cases that developers MUST write to achieve high coverage for this specific code.

---

### Output Format Requirement
Your response MUST strictly use the following Markdown structure in English:

# 1. Purpose of this Test Type
[Concise summary tailored to the provided source code]

# 2. Standardized Boilerplate
[A single code block containing the project-specific scaffold, injected with actual implementation names]

# 3. Recommended Conventions
[Bulleted list of high-value testing conventions, strictly filtered]

# 4. Test Case Writing Guide
[Checklist of exact test cases derived from the implementation's logic branches]
