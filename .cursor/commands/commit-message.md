1. Create a git commit message for the current staged commits following the conventional commit message format.
2. Ask the user to review the commit message and make any necessary changes.
3. Do not commit the message until the user has reviewed and explicitly approved it.

```
<type>[optional scope]: <description (in title case following APA standards)>

[bullet list overview of changes (sentences ending with a period)]
```

The type must be one of the following:

- feat: A new feature (e.g. add a new component, add a new page, add a new functionality).
- fix: A bug fix (e.g. fix a bug, fix a typo, fix a bug in the code).
- refactor: A code refactoring (e.g. refactor the code, refactor the style, refactor the structure).
- style: A style change (e.g. change the style, change the color, change the font).
- test: A test change (e.g. add a new test, change a test, remove a test).
- docs: A documentation change (e.g. add a new documentation, change a documentation, remove a documentation).
- perf: A performance change (e.g. improve the performance, fix the performance issue).
- build: A build change (e.g. build the project, rebuild the project, rebuild the project).
- ci: A CI change (e.g. change the CI, fix the CI issue, remove the CI).
- chore: A chore (e.g. build, CI, etc.).

[**APA Standards**]:

- Capitalize the first word and all major words (nouns, verbs, adjectives, adverbs, pronouns).
- Do NOT capitalize minor words: and, but, for, or, nor, a, an, the, as, at, by, in, of, on, per, to, with, from, then.
- For hyphenated compounds, capitalize both parts if they are major words (e.g., "In-App").

[**Example Message**]: ```

feat: Initialize TanStack Start Application with Convex and WorkOS integration

- Set up TanStack Start project with React 19 and TanStack Router for file-based routing.
- Configure Convex backend with schema and generated API types.
- Integrate WorkOS AuthKit for authentication.
- Install comprehensive shadcn UI component library with 50+ components including forms, navigation, data display, and layout components.
- Add development styleguide page for component showcase.
- Configure development tooling including ESLint, Prettier, TypeScript, and Vitest.
- Set up Tailwind CSS v4 for styling.
- Add project documentation and Cursor rules for development workflow.
- Configure Vite build system with React plugin and TypeScript path aliases.

```

```
