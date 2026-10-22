# Responsabilidades | To-Do List

<p>
<a href="../README.md"><img src="assets/navigation/project-pt.svg" width="180" height="42" align="top" alt="🇧🇷 Projeto To Do List"></a><a href="../README.en.md"><img src="assets/navigation/project-en.svg" width="180" height="42" align="top" alt="🇺🇸 To Do List Project"></a><br>
<a href="RESPONSABILIDADES.md" aria-current="page"><img src="assets/navigation/team-pt-active.svg" width="180" height="42" align="top" alt="🇧🇷 Responsabilidades — página atual"></a><a href="RESPONSIBILITIES.en.md"><img src="assets/navigation/team-en.svg" width="180" height="42" align="top" alt="🇺🇸 Responsibilities"></a>
</p>

**Projeto:** Descomplica & Venturus — Fundamentos de Desenvolvimento Web  
**Integrantes:** André e Paula  
**Situação:** divisão acordada nas conversas de 21/10/2026; documento em revisão conjunta.  
**Objetivo:** registrar *quem implementa cada parte* e como serão coordenadas as integrações. O histórico de mudanças efetivamente realizadas ficará nos commits, nas Issues e nos Pull Requests, não neste documento.

## 1. Princípios

- Ambos desenvolvem partes relevantes da aplicação e dos temas visuais.
- A responsabilidade indica quem implementa uma funcionalidade, não autoridade sobre o outro integrante.
- Os contratos de dados e as integrações compartilhadas são revisados pelos dois antes da incorporação do código.
- Sempre que viável, separar arquivos ou áreas bem definidas; combinar alterações nas interfaces compartilhadas antes de implementá-las.
- Usar GitHub Issues para descrever o escopo e os critérios de aceite, e Pull Requests para revisão de código.

## 2. Fase 1 — Núcleo da aplicação

| Responsabilidade | André | Paula |
| --- | --- | --- |
| Formato dos dados da tarefa | Analisa e aprova o modelo proposto | Propõe o modelo em uma Issue; aprova o formato com André |
| Modelo de tarefa | Implementa `task-model.js` para criar e validar objetos de tarefa | Integra o armazenamento ao modelo aprovado |
| Avisos de alteração | Implementa `eventos.js` e o contrato de eventos acordado | Utiliza o contrato para notificar alterações nos dados |
| Armazenamento e operações de dados | Consome a API compartilhada | Implementa `storage.js`, camada única para criar, consultar, atualizar e remover tarefas |
| Cadastro | Formulário, comportamento da interface e integração com o armazenamento | Disponibiliza as operações de armazenamento previstas no contrato |
| Listagem | Utiliza o contrato da lista para edição e exclusão | Renderiza a lista e os cards das tarefas |
| Edição | Formulário de edição, ações e integração com o armazenamento | Disponibiliza as ações combinadas nos cards |
| Conclusão | Integra os avisos de atualização da lista, quando necessário | Implementa a conclusão e atualiza o estado na interface |
| Exclusão | Confirmação, remoção e integração com armazenamento | Disponibiliza a ação de exclusão no card |

**Limite entre módulos:** `storage.js` concentra as operações de dados. Formulários, lista, ações e temas utilizam suas funções acordadas, evitando implementar persistência em duplicidade. Os avisos de alterações permitem atualizar os componentes afetados.

**Detalhes a aprovar em Issue:** assinaturas das funções, campos da tarefa, geração de identificadores, retornos, nome do evento, tratamento de erros e atributos dos botões nos cards. `data-id` e `data-acao` foram sugestões discutidas, **não uma API definitiva** sem aprovação dos dois.

## 3. Fase 2 — Funcionalidades adicionais

| André | Paula |
| --- | --- |
| **Estatísticas:** cálculos e indicadores de progresso | **Prioridades:** campo de prioridade, regras e indicadores relacionados |
| **Prazos:** datas-limite e regras de urgência | **Filtros e pesquisa:** filtros das tarefas e interações de busca |
| **Estrutura e navegação:** layout, cabeçalho e navegação responsiva | **Seletor de temas:** interface e lógica para escolher o tema visual |
| **Modos de aparência:** claro, escuro e automático | **Mecanismo de idiomas:** alternância entre PT-BR e EN |

**Traduções:** cada integrante traduz e testa as funcionalidades que implementar, usando um formato de localização revisado pelos dois.

**Dependência entre prazos e Orbit:** André implementa as regras de prazo e urgência; Paula utiliza essas informações para posicionar e animar os planetas em Orbit & Gravity. Antes do desenvolvimento independente, ambos definirão o contrato da função compartilhada: entradas, retorno, tratamento de tarefas atrasadas ou sem prazo e momento de atualização dos cálculos. **O nome da função ainda não foi definido.**

**Integração entre temas e aparência:** o seletor de temas e os modos de aparência precisam coexistir. As paletas de cada tema podem ter fundos e cores de texto diferentes nos modos claro e escuro. Os nomes das variáveis CSS e os atributos do DOM devem ser acordados antes da implementação.

## 4. Responsabilidades nos temas

Ambos participam de todos os temas. *Coordenar* um tema não significa ser responsável exclusivo por todo o código.

| Tema | André | Paula |
| --- | --- | --- |
| **Orbit & Gravity** | Cenário espacial, estrelas, sol e controles do cenário | **Coordena o tema;** planetas, órbitas, posicionamento e interações relacionadas à urgência |
| **Sinking Island** | **Coordena o tema;** cálculo da maré e do progresso das tarefas | Ilha, água, paisagem e transições visuais |
| **Celestial Balance** | Parte Lunar | Parte Solar |

Os arquivos, interações e testes específicos de cada tema devem ser detalhados em Issues antes do desenvolvimento. Os componentes utilizarão os mesmos dados das tarefas e os eventos acordados para a aplicação.

## 5. Atividades compartilhadas

- Revisão e aprovação do formato dos dados e dos contratos entre módulos.
- Testes de integração, acessibilidade e comportamento responsivo.
- Revisão dos Pull Requests e das alterações em código compartilhado.
- Revisão da documentação e preparação da apresentação do projeto.
- Apresentação final do projeto (aproximadamente 10 minutos, com participação dos dois).

## 6. GitHub Issues e Pull Requests

1. **Cada integrante cria as Issues das próprias responsabilidades**, incluindo comportamento esperado, dependências e critérios de aceite.
2. **Issues compartilhadas** são elaboradas ou revisadas pelos dois antes da implementação.
3. Manter alterações focadas e evitar editar simultaneamente o mesmo arquivo quando possível. Novos módulos e arquivos CSS podem ser separados por responsabilidade após combinar importações e pontos de integração.
4. Fazer commits pequenos e por assunto; abrir Pull Request para revisão do outro integrante antes do merge na `main`.
5. Registrar mudanças de responsabilidades neste documento **somente após o acordo de ambos**. O histórico técnico de alterações e autoria permanece no GitHub.

**Sugestão de campos para uma Issue:** objetivo, responsável, arquivos/módulos afetados, dependências, critérios de aceite, evidências de testes e PR relacionado. É um modelo sugerido, não significa que as Issues já tenham sido criadas.

## 7. Responsabilidades de documentação

- **André:** prepara inicialmente o `README.md` e este documento de responsabilidades.
- **André e Paula:** revisam e aprovam o conteúdo, inclusive mudanças posteriores na divisão.
- **Cada integrante:** documenta suas implementações nas Issues e nos PRs correspondentes.
- **Referência oficial:** arquivos Markdown aprovados no GitHub. Uma cópia editável em DOCX no Google Drive pode apoiar a revisão, mas não deve contradizer a versão aprovada no repositório.

## 8. Escopo e situação

Este documento descreve **responsabilidades planejadas**, e não funcionalidades já concluídas. O projeto utilizará HTML, CSS e JavaScript puro, com `localStorage` no navegador, sem exigência de API externa ou backend. Estão planejados três temas: Orbit & Gravity, Sinking Island e Celestial Balance. Nenhum quarto tema integra o escopo acordado para a entrega.

**Antes de implementar:** confirmar pelas Issues o modelo da tarefa, a API de armazenamento, os eventos de atualização, os contratos de prazos/urgência para o Orbit e os padrões de CSS/temas. Este documento não cria responsabilidades adicionais nem atribui pontuações de esforço.
