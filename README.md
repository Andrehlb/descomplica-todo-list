# To-Do List | Descomplica & Venturus

<p>
<a href="README.md" aria-current="page"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/navigation/project-pt-active.svg"><source media="(prefers-color-scheme: light)" srcset="docs/assets/navigation/project-pt-active-light.svg"><img src="docs/assets/navigation/project-pt-active-light.svg" width="180" height="42" align="top" alt="🇧🇷 Projeto To Do List — página atual"></picture></a><a href="README.en.md"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/navigation/project-en.svg"><source media="(prefers-color-scheme: light)" srcset="docs/assets/navigation/project-en-light.svg"><img src="docs/assets/navigation/project-en-light.svg" width="180" height="42" align="top" alt="🇺🇸 To Do List Project"></picture></a><br>
<a href="docs/RESPONSABILIDADES.md"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/navigation/team-pt.svg"><source media="(prefers-color-scheme: light)" srcset="docs/assets/navigation/team-pt-light.svg"><img src="docs/assets/navigation/team-pt-light.svg" width="180" height="42" align="top" alt="🇧🇷 Responsabilidades"></picture></a><a href="docs/RESPONSIBILITIES.en.md"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/navigation/team-en.svg"><source media="(prefers-color-scheme: light)" srcset="docs/assets/navigation/team-en-light.svg"><img src="docs/assets/navigation/team-en-light.svg" width="180" height="42" align="top" alt="🇺🇸 Responsibilities"></picture></a>
</p>

O **To Do List** é um projeto de aplicação web para organizar tarefas do dia a dia, definir o que precisa de atenção e acompanhar o progresso. A proposta reúne cadastro, edição, exclusão e conclusão de tarefas em uma interface com três temas visuais.

Desenvolvido por **André e Paula** como projeto final da trilha de **Fundamentos de Desenvolvimento Web / Lógica de Programação Web**, da **Descomplica & Venturus**, o trabalho busca aplicar HTML, CSS e JavaScript puro na construção de uma aplicação, com manipulação do DOM, armazenamento no navegador, responsividade e acessibilidade.

> **Situação do projeto:** em planejamento e desenvolvimento. As funcionalidades e interações descritas abaixo são planejadas; as imagens representam conceitos visuais, não telas já implementadas.

## Funcionalidades planejadas

- **Gerenciamento de tarefas:** cadastro com formulário, listagem, edição, exclusão e marcação de conclusão.
- **Organização:** prioridades, prazos, regras de urgência, pesquisa e filtros.
- **Acompanhamento:** estatísticas das tarefas e indicadores de progresso.
- **Persistência local:** armazenamento das tarefas no navegador usando `localStorage`.
- **Personalização:** três temas visuais e modos de aparência claro, escuro e automático.
- **Idiomas e acessibilidade:** suporte a português do Brasil e inglês, layout responsivo e interações acessíveis.

## Como será utilizado

O fluxo de uso previsto é:

1. Cadastrar tarefas e definir prioridades e prazos quando necessário.
2. Consultar a lista, pesquisar e aplicar filtros para localizar tarefas e organizar o trabalho.
3. Editar, concluir ou excluir tarefas e acompanhar os indicadores de progresso.
4. Escolher um tema visual, o modo de aparência e o idioma da interface.

A persistência com `localStorage` deverá permitir retomar as tarefas no mesmo navegador.

## Temas visuais

Os três temas propõem formas diferentes de acompanhar as mesmas tarefas. Os comportamentos descritos ainda serão implementados.

**Prévias conceituais:** cada tema tem uma versão clara e uma escura. Clique em uma miniatura para abrir a imagem original em tamanho completo.

### Orbit & Gravity

As tarefas serão representadas por elementos de um sistema planetário. A organização e a urgência das tarefas deverão orientar sua apresentação na experiência orbital, usando informações de prazo para tornar visual a necessidade de atenção.

<table>
  <tr><th>Modo claro</th><th>Modo escuro</th></tr>
  <tr>
    <td><a href="assets/themes/orbit-gravity-light.png"><img src="assets/themes/orbit-gravity-light.png" width="320" alt="Orbit &amp; Gravity — modo claro"></a></td>
    <td><a href="assets/themes/orbit-gravity-dark.png"><img src="assets/themes/orbit-gravity-dark.png" width="320" alt="Orbit &amp; Gravity — modo escuro"></a></td>
  </tr>
</table>

### Sinking Island / Clean Sweep

A proposta apresenta uma ilha ameaçada pela água. Concluir tarefas deverá reduzir o nível da água e representar visualmente o progresso; a relação entre tarefas, maré e recuperação da ilha seguirá as regras a implementar.

<table>
  <tr><th>Modo claro</th><th>Modo escuro</th></tr>
  <tr>
    <td><a href="assets/themes/sinking-island-light.png"><img src="assets/themes/sinking-island-light.png" width="320" alt="Sinking Island — modo claro"></a></td>
    <td><a href="assets/themes/sinking-island-dark.png"><img src="assets/themes/sinking-island-dark.png" width="320" alt="Sinking Island — modo escuro"></a></td>
  </tr>
</table>

### Celestial Balance

O conceito combina experiências visuais **Solar** e **Lunar**, associadas aos modos de aparência claro e escuro. A proposta é oferecer duas composições para acompanhar as tarefas, integradas à seleção de aparência da aplicação.

<table>
  <tr><th>Modo claro</th><th>Modo escuro</th></tr>
  <tr>
    <td><a href="assets/themes/celestial-balance-light.png"><img src="assets/themes/celestial-balance-light.png" width="320" alt="Celestial Balance — modo claro"></a></td>
    <td><a href="assets/themes/celestial-balance-dark.png"><img src="assets/themes/celestial-balance-dark.png" width="320" alt="Celestial Balance — modo escuro"></a></td>
  </tr>
</table>

## Tecnologias

- **HTML5:** estrutura da página e marcação semântica.
- **CSS3:** layout responsivo, temas visuais e modos de aparência.
- **JavaScript puro:** manipulação do DOM, interações e lógica das tarefas.
- **`localStorage`:** persistência das tarefas no navegador, prevista no escopo.
- **Git e GitHub:** versionamento, colaboração e documentação.

O núcleo planejado não exige framework, API externa ou backend. A estrutura atual é estática, sem instalação de pacotes ou etapa de build.

## Apresentação acadêmica

O projeto será preparado para uma **apresentação de aproximadamente 10 minutos**, destacando a aplicação a ser desenvolvida, as operações com tarefas, os três temas, a organização do código e as contribuições dos dois integrantes. O objetivo educacional inclui praticar integração, testes, acessibilidade e documentação, além das tecnologias web.

## Equipe

André e Paula atuam no desenvolvimento, na interface e na documentação, compartilhando as decisões técnicas e a responsabilidade pelo resultado final.

| Integrante | GitHub | LinkedIn |
| --- | --- | --- |
| André | [@Andrehlb](https://github.com/Andrehlb) | [André](https://www.linkedin.com/in/andrehlb) |
| Paula | [@Paula-Thamyres](https://github.com/Paula-Thamyres) | [Paula](https://www.linkedin.com/in/paula-femina/) |

A divisão acordada e as orientações de integração estão no [documento detalhado de responsabilidades](docs/RESPONSABILIDADES.md) *(rascunho para revisão conjunta)*.
