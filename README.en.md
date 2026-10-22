# To-Do List | Descomplica & Venturus

<p>
<a href="README.md"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/navigation/project-pt.svg"><source media="(prefers-color-scheme: light)" srcset="docs/assets/navigation/project-pt-light.svg"><img src="docs/assets/navigation/project-pt-light.svg" width="180" height="42" align="top" alt="🇧🇷 Projeto To Do List"></picture></a><a href="README.en.md" aria-current="page"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/navigation/project-en-active.svg"><source media="(prefers-color-scheme: light)" srcset="docs/assets/navigation/project-en-active-light.svg"><img src="docs/assets/navigation/project-en-active-light.svg" width="180" height="42" align="top" alt="🇺🇸 To Do List Project — current page"></picture></a><br>
<a href="docs/RESPONSABILIDADES.md"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/navigation/team-pt.svg"><source media="(prefers-color-scheme: light)" srcset="docs/assets/navigation/team-pt-light.svg"><img src="docs/assets/navigation/team-pt-light.svg" width="180" height="42" align="top" alt="🇧🇷 Responsabilidades"></picture></a><a href="docs/RESPONSIBILITIES.en.md"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/navigation/team-en.svg"><source media="(prefers-color-scheme: light)" srcset="docs/assets/navigation/team-en-light.svg"><img src="docs/assets/navigation/team-en-light.svg" width="180" height="42" align="top" alt="🇺🇸 Responsibilities"></picture></a>
</p>

**To Do List** is a web application project for organizing everyday tasks, identifying what needs attention, and tracking progress. It aims to bring task creation, editing, deletion, and completion into an interface with three visual themes.

Developed by **André and Paula** as the final project for the **Web Development Fundamentals / Web Programming Logic** learning track at **Descomplica & Venturus**, the project applies HTML, CSS, and vanilla JavaScript to building an application, including DOM manipulation, browser storage, responsive layouts, and accessibility.

> **Project status:** in planning and development. The features and interactions described below are planned; the images represent visual concepts, not implemented screens.

## Planned features

- **Task management:** task creation through a form, listing, editing, deletion, and marking tasks as completed.
- **Organization:** priorities, deadlines, urgency rules, search, and filters.
- **Tracking:** task statistics and progress indicators.
- **Local persistence:** storing tasks in the browser using `localStorage`.
- **Customization:** three visual themes and light, dark, and automatic appearance modes.
- **Languages and accessibility:** Brazilian Portuguese and English support, responsive layouts, and accessible interactions.

## Intended usage

The planned workflow is:

1. Create tasks and set priorities and deadlines when needed.
2. Browse the list, search, and apply filters to find tasks and organize work.
3. Edit, complete, or delete tasks and follow the progress indicators.
4. Choose a visual theme, appearance mode, and interface language.

Persistence through `localStorage` is intended to let users return to their tasks in the same browser.

## Visual themes

The three themes propose different ways to follow the same tasks. The behaviors described here are yet to be implemented.

**Concept previews:** each theme has a light and a dark version. Click a thumbnail to open the original full-size image.

### Orbit & Gravity

Tasks will be represented by elements of a planetary system. Task organization and urgency are intended to guide their presentation in the orbital experience, using deadline information to make the need for attention visible.

<table>
  <tr><th>Light mode</th><th>Dark mode</th></tr>
  <tr>
    <td><a href="assets/themes/orbit-gravity-light.png"><img src="assets/themes/orbit-gravity-light.png" width="320" alt="Orbit &amp; Gravity — light mode"></a></td>
    <td><a href="assets/themes/orbit-gravity-dark.png"><img src="assets/themes/orbit-gravity-dark.png" width="320" alt="Orbit &amp; Gravity — dark mode"></a></td>
  </tr>
</table>

### Sinking Island / Clean Sweep

The concept presents an island threatened by water. Completing tasks is intended to lower the water level and visualize progress; the relationship between tasks, tides, and the island's recovery will follow rules that are yet to be implemented.

<table>
  <tr><th>Light mode</th><th>Dark mode</th></tr>
  <tr>
    <td><a href="assets/themes/sinking-island-light.png"><img src="assets/themes/sinking-island-light.png" width="320" alt="Sinking Island — light mode"></a></td>
    <td><a href="assets/themes/sinking-island-dark.png"><img src="assets/themes/sinking-island-dark.png" width="320" alt="Sinking Island — dark mode"></a></td>
  </tr>
</table>

### Celestial Balance

The concept combines **Solar** and **Lunar** visual experiences, associated with light and dark appearance modes. It aims to offer two compositions for following tasks, integrated with the application's appearance selection.

<table>
  <tr><th>Light mode</th><th>Dark mode</th></tr>
  <tr>
    <td><a href="assets/themes/celestial-balance-light.png"><img src="assets/themes/celestial-balance-light.png" width="320" alt="Celestial Balance — light mode"></a></td>
    <td><a href="assets/themes/celestial-balance-dark.png"><img src="assets/themes/celestial-balance-dark.png" width="320" alt="Celestial Balance — dark mode"></a></td>
  </tr>
</table>

## Technology stack

- **HTML5:** page structure and semantic markup.
- **CSS3:** responsive layouts, visual themes, and appearance modes.
- **Vanilla JavaScript:** DOM manipulation, interactions, and task logic.
- **`localStorage`:** planned browser persistence for tasks.
- **Git and GitHub:** version control, collaboration, and documentation.

The planned core does not require a framework, external API, or backend. The current structure is static, with no package installation or build step.

## Academic presentation

The project will be prepared for an **approximately 10-minute presentation**, highlighting the application to be developed, task operations, the three themes, code organization, and both contributors' work. The educational goal includes practicing integration, testing, accessibility, and documentation alongside web technologies.

## Team

André and Paula contribute to development, UI, and documentation, sharing technical decisions and responsibility for the final result.

| Contributor | GitHub | LinkedIn |
| --- | --- | --- |
| André | [@Andrehlb](https://github.com/Andrehlb) | [André](https://www.linkedin.com/in/andrehlb) |
| Paula | [@Paula-Thamyres](https://github.com/Paula-Thamyres) | [Paula](https://www.linkedin.com/in/paula-femina/) |

The agreed division of work and integration guidelines are in the [detailed responsibilities document](docs/RESPONSIBILITIES.en.md) *(draft for joint review)*.
