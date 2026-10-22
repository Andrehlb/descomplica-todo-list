# Responsibilities | To-Do List

<p>
<a href="../README.md"><img src="assets/navigation/project-pt.svg" width="180" height="42" align="top" alt="🇧🇷 Projeto To Do List"></a><a href="../README.en.md"><img src="assets/navigation/project-en.svg" width="180" height="42" align="top" alt="🇺🇸 To Do List Project"></a><br>
<a href="RESPONSABILIDADES.md"><img src="assets/navigation/team-pt.svg" width="180" height="42" align="top" alt="🇧🇷 Responsabilidades"></a><a href="RESPONSIBILITIES.en.md" aria-current="page"><img src="assets/navigation/team-en-active.svg" width="180" height="42" align="top" alt="🇺🇸 Responsibilities — current page"></a>
</p>

**Project:** Descomplica & Venturus — Fundamentos de Desenvolvimento Web (Web Development Fundamentals)  
**Contributors:** André and Paula  
**Status:** Division agreed in conversation on 21 October 2026; documentation draft pending joint review.  
**Purpose:** Record *who implements what* and how shared interfaces are coordinated. The history of actual changes belongs to Git commits, Issues, and Pull Requests—not this document.

## 1. Principles

- Both contributors implement meaningful parts of the application and the visual themes.
- Responsibilities identify an implementation owner, not authority over the other contributor.
- Both review data contracts and shared integrations before changes are merged.
- Separate files or clearly defined areas of shared files where practical; discuss changes to shared interfaces before implementing them.
- Use GitHub Issues for scope and acceptance criteria, and Pull Requests for code review.

## 2. Phase 1 — Application core

| Responsibility | André | Paula |
| --- | --- | --- |
| Task data format | Reviews and approves the proposed schema | Proposes the schema in a GitHub Issue; reviews and approves it with André |
| Task model | Implements `task-model.js` for creation and validation of task objects | Integrates with the approved task model |
| Data-change notifications | Implements `eventos.js` and the agreed event contract | Uses the event contract when storage changes |
| Storage / data operations | Uses the shared storage API | Implements `storage.js`, the single data layer for creating, reading, updating and deleting tasks |
| Create task | Form, UI behavior and integration with storage | Supports via the approved storage API |
| List tasks | Uses the list contract for editing/deleting | Renders the list and task cards |
| Edit task | Edit form, actions and integration with storage | Exposes agreed edit actions in task cards |
| Complete task | Integrates with list update notifications as required | Completion behavior and list-state update |
| Delete task | Confirmation, deletion behavior and storage integration | Exposes agreed delete action in task cards |

**Agreed boundary:** `storage.js` owns data operations; the forms, list, actions and theme interfaces call its agreed functions. This avoids duplicated persistence implementations. A data-change notification is used to refresh affected UI components.

**Implementation detail to agree in the Issue:** exact function signatures, task fields, ID generation, return values, event name, error handling and card action attributes. Names such as `data-id` / `data-acao` were discussed as suggestions and are **not** a fixed API until both approve them.

## 3. Phase 2 — Additional functionality

| André | Paula |
| --- | --- |
| **Statistics:** computations and progress indicators | **Priorities:** priority field and related rules/indicators |
| **Deadlines:** due dates and urgency behavior | **Filters and search:** task filtering and search interactions |
| **Page structure and navigation:** layout, header and responsive navigation | **Theme selector:** interface and logic for choosing a visual theme |
| **Appearance modes:** light, dark and automatic modes | **Internationalization engine:** language switching between PT-BR and EN |

**Translations:** each person translates and tests the features they implement, following one jointly reviewed localization format.

**Deadline/Orbit dependency:** André owns deadline and urgency rules, while Paula uses that information to position and animate planets in Orbit & Gravity. Before working independently, they must agree on a shared function contract (inputs, return format, overdue/no-deadline handling and when calculations refresh); no function name is approved yet.

**Interface dependency:** the theme selector and appearance modes must coexist. Theme-specific palettes may contain different backgrounds and text colors in each appearance mode; define the CSS tokens and DOM attributes together before implementing them.

## 4. Theme responsibilities

Both people contribute to each theme; *coordination* is not exclusive ownership of all its code.

| Theme | André | Paula |
| --- | --- | --- |
| **Orbit & Gravity** | Space scene, stars, sun, and scene controls | **Coordinates theme;** planets, orbits, position/urgency behavior and interactions |
| **Sinking Island** | **Coordinates theme;** tide and task-progress calculations | Island, water, scenery and visual transitions |
| **Celestial Balance** | Lunar side | Solar side |

The theme-specific file boundaries, interactions and tests should be described in individual Issues before work starts. Shared components use the same task data and agreed application events.

## 5. Shared activities

- Review and approval of the task data model and module interfaces.
- Integration testing, accessibility and responsive behavior.
- Review of each other's Pull Requests and shared-code changes.
- Documentation review and updates to the project presentation.
- Final project demonstration (approximately ten minutes, with both presenting their contributions).

## 6. GitHub Issues and Pull Requests

1. **Each contributor creates Issues for their own assignments**, including the expected behavior, dependencies and acceptance criteria.
2. **Shared Issues** are prepared or reviewed by both before implementation.
3. Keep changes focused and avoid simultaneous edits to the same file when possible. New modules and CSS files may be separated by responsibility after agreeing on imports and integration points.
4. Use short, topic-focused commits and a Pull Request reviewed by the other contributor before merging into `main`.
5. Record changes to responsibilities here **only after both agree**; GitHub retains the technical history of who changed what and when.

**Issue checklist suggestion:** goal, owner, files/modules affected, dependencies, acceptance criteria, test evidence and related PR. This is a template proposal, not a claim that Issues already exist.

## 7. Documentation responsibilities

- **André:** prepares the project `README.md` and this responsibilities document as initial drafts.
- **André and Paula:** review and approve the content, including any revisions to previously agreed ownership.
- **Each contributor:** documents their own implementation in the relevant Issues/PRs.
- **Official reference:** approved Markdown files in GitHub. A shared editable DOCX in Google Drive may help with review, but must not contradict the approved repository version.

## 8. Scope and status

This file records **assignments**, not finished functionality. The core stack is HTML, CSS and vanilla JavaScript with browser `localStorage`, without a required external API or backend. The planned themes are Orbit & Gravity, Sinking Island and Celestial Balance; no fourth theme is currently included in the agreed delivery scope.

**Before coding:** confirm the task schema, storage API, notification contract and CSS/theme contracts through the corresponding GitHub Issues. No additional responsibilities or effort scores are implied by this document.
