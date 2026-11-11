const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ORBIT_PLANETS_MODULE_PATH = path.join(__dirname, 'orbit-planets.js');
const ORBIT_PLANETS_SOURCE = fs.readFileSync(ORBIT_PLANETS_MODULE_PATH, 'utf8');
const MIN_RADIUS = 20;
const MAX_RADIUS = 50;
const EXPECTED_ORBIT_COUNT = 6;
const INVALID_NUMBERS = [NaN, Infinity, null, undefined, '0.5', {}, []];
const PERCENT_VALUE_PATTERN = /^-?\d+(\.\d+)?%$/;
const SOLID_ORBIT_CLASS = 'orbit-ring';
const DASHED_ORBIT_CLASS = 'orbit-ring orbit-ring--dashed';

const URGENT_PLANET = Object.freeze({
  id: 1,
  title: 'Projeto do site',
  urgency: 1,
});

const ATTENTION_PLANET = Object.freeze({
  id: 2,
  title: 'Estudar JS',
  urgency: 0.5,
});

const DISTANT_PLANET = Object.freeze({
  id: 3,
  title: 'Ler livro',
  urgency: 0,
});

function loadOrbitPlanets(fakeWindow = {}) {
  new Function('window', ORBIT_PLANETS_SOURCE)(fakeWindow);

  return fakeWindow.OrbitPlanets;
}

function createFakeElement(tagName) {
  const styleProperties = {};
  const attributes = {};

  const fakeElement = {
    tagName: tagName.toUpperCase(),
    children: [],
    dataset: {},
    className: '',
    textContent: '',
    tabIndex: -1,
    styleProperties,
    attributes,
    style: {
      setProperty: (name, value) => {
        styleProperties[name] = value;
      },
    },
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
    append: (...childElements) => fakeElement.children.push(...childElements),
    replaceChildren: (...childElements) => {
      fakeElement.children = childElements;
    },
  };

  return fakeElement;
}

function createRenderEnvironment() {
  const fakeWindow = { document: { createElement: createFakeElement } };
  const { renderOrbitPlanets } = loadOrbitPlanets(fakeWindow);
  const orbitSystemContainer = createFakeElement('div');

  return { renderOrbitPlanets, orbitSystemContainer };
}

function getRenderedPlanetsList(orbitSystemContainer) {
  const [, planetsList] = orbitSystemContainer.children;

  return planetsList;
}

function assertCloseTo(actualValue, expectedValue) {
  assert.ok(
    Math.abs(actualValue - expectedValue) < 0.01,
    `esperado ${expectedValue}, recebido ${actualValue}`
  );
}

const {
  getUrgencyLevel,
  calculateOrbitRadius,
  calculateOrbitRadii,
  getOrbitIndex,
  distributeAngles,
  calculatePlanetPosition,
  buildPlanetLayout,
} = loadOrbitPlanets();

describe('getUrgencyLevel', () => {
  it('classifica a urgência alta como urgente', () => {
    assert.equal(getUrgencyLevel(1), 'urgent');
    assert.equal(getUrgencyLevel(0.75), 'urgent');
  });

  it('classifica a urgência intermediária como atenção', () => {
    assert.equal(getUrgencyLevel(0.74), 'attention');
    assert.equal(getUrgencyLevel(0.01), 'attention');
  });

  it('classifica a urgência zero como prazo distante', () => {
    assert.equal(getUrgencyLevel(0), 'distant');
  });

  it('devolve null para urgência inválida ou fora de 0 a 1', () => {
    [...INVALID_NUMBERS, -0.1, 1.1].forEach((invalidUrgency) => {
      assert.equal(getUrgencyLevel(invalidUrgency), null);
    });
  });
});

describe('calculateOrbitRadius', () => {
  it('devolve o raio mínimo para a urgência máxima', () => {
    assert.equal(calculateOrbitRadius(1, MIN_RADIUS, MAX_RADIUS), MIN_RADIUS);
  });

  it('devolve o raio máximo para a urgência zero', () => {
    assert.equal(calculateOrbitRadius(0, MIN_RADIUS, MAX_RADIUS), MAX_RADIUS);
  });

  it('devolve o raio do meio para a urgência 0.5', () => {
    assert.equal(calculateOrbitRadius(0.5, MIN_RADIUS, MAX_RADIUS), 35);
  });

  it('devolve null para urgência inválida', () => {
    [...INVALID_NUMBERS, -1, 2].forEach((invalidUrgency) => {
      assert.equal(
        calculateOrbitRadius(invalidUrgency, MIN_RADIUS, MAX_RADIUS),
        null
      );
    });
  });

  it('devolve null para raios invertidos, iguais ou negativos', () => {
    assert.equal(calculateOrbitRadius(0.5, MAX_RADIUS, MIN_RADIUS), null);
    assert.equal(calculateOrbitRadius(0.5, MIN_RADIUS, MIN_RADIUS), null);
    assert.equal(calculateOrbitRadius(0.5, -10, MAX_RADIUS), null);
  });

  it('devolve null para raios que não são números', () => {
    assert.equal(calculateOrbitRadius(0.5, NaN, MAX_RADIUS), null);
    assert.equal(calculateOrbitRadius(0.5, MIN_RADIUS, '50'), null);
  });
});

describe('calculateOrbitRadii', () => {
  it('cria seis órbitas igualmente espaçadas, da interna à externa', () => {
    assert.deepEqual(
      calculateOrbitRadii(MIN_RADIUS, MAX_RADIUS),
      [20, 26, 32, 38, 44, 50]
    );
  });

  it('devolve lista vazia para raios inválidos', () => {
    assert.deepEqual(calculateOrbitRadii(MAX_RADIUS, MIN_RADIUS), []);
  });
});

describe('getOrbitIndex', () => {
  it('usa duas órbitas por nível, alternando os planetas', () => {
    assert.equal(getOrbitIndex('urgent', 0), 0);
    assert.equal(getOrbitIndex('urgent', 1), 1);
    assert.equal(getOrbitIndex('urgent', 2), 0);
    assert.equal(getOrbitIndex('attention', 0), 2);
    assert.equal(getOrbitIndex('distant', 1), 5);
  });

  it('devolve null para nível desconhecido ou posição inválida', () => {
    assert.equal(getOrbitIndex('high', 0), null);
    assert.equal(getOrbitIndex('urgent', -1), null);
    assert.equal(getOrbitIndex('urgent', 1.5), null);
  });
});

describe('distributeAngles', () => {
  it('devolve lista vazia quando não há planetas', () => {
    assert.deepEqual(distributeAngles(0), []);
  });

  it('coloca um único planeta no ângulo de deslocamento', () => {
    assert.deepEqual(distributeAngles(1, 30), [30]);
  });

  it('distribui vários planetas igualmente pelo círculo', () => {
    assert.deepEqual(distributeAngles(4), [0, 90, 180, 270]);
  });

  it('mantém os ângulos entre 0 e 360 graus com deslocamento', () => {
    assert.deepEqual(distributeAngles(2, 300), [300, 120]);
  });

  it('devolve lista vazia para quantidade ou deslocamento inválidos', () => {
    [-1, 2.5, NaN, null, '3'].forEach((invalidCount) => {
      assert.deepEqual(distributeAngles(invalidCount), []);
    });
    assert.deepEqual(distributeAngles(3, NaN), []);
  });
});

describe('calculatePlanetPosition', () => {
  it('coloca o ângulo 0 no topo da órbita', () => {
    assert.deepEqual(calculatePlanetPosition(10, 0), { x: 0, y: -10 });
  });

  it('coloca o ângulo 90 à direita do sol', () => {
    assert.deepEqual(calculatePlanetPosition(10, 90), { x: 10, y: 0 });
  });

  it('coloca o ângulo 180 abaixo do sol', () => {
    assert.deepEqual(calculatePlanetPosition(10, 180), { x: 0, y: 10 });
  });

  it('calcula ângulos intermediários', () => {
    const planetPosition = calculatePlanetPosition(10, 45);

    assertCloseTo(planetPosition.x, 7.07);
    assertCloseTo(planetPosition.y, -7.07);
  });

  it('devolve null para raio ou ângulo inválidos', () => {
    assert.equal(calculatePlanetPosition(-1, 0), null);
    assert.equal(calculatePlanetPosition(NaN, 0), null);
    assert.equal(calculatePlanetPosition(10, undefined), null);
    assert.equal(calculatePlanetPosition('10', 0), null);
  });
});

describe('buildPlanetLayout', () => {
  it('posiciona cada nível nas próprias órbitas', () => {
    const planetLayout = buildPlanetLayout(
      [DISTANT_PLANET, URGENT_PLANET, ATTENTION_PLANET],
      MIN_RADIUS,
      MAX_RADIUS
    );

    assert.deepEqual(
      planetLayout.map(({ id, urgencyLevel, orbitIndex }) => [
        id,
        urgencyLevel,
        orbitIndex,
      ]),
      [
        [URGENT_PLANET.id, 'urgent', 0],
        [ATTENTION_PLANET.id, 'attention', 2],
        [DISTANT_PLANET.id, 'distant', 4],
      ]
    );
  });

  it('coloca o planeta urgente mais perto do sol que o distante', () => {
    const [urgentPlanet, , distantPlanet] = buildPlanetLayout(
      [URGENT_PLANET, ATTENTION_PLANET, DISTANT_PLANET],
      MIN_RADIUS,
      MAX_RADIUS
    );
    const calculateDistanceFromSun = ({ x, y }) => Math.hypot(x, y);

    assertCloseTo(calculateDistanceFromSun(urgentPlanet), MIN_RADIUS);
    assertCloseTo(calculateDistanceFromSun(distantPlanet), 44);
  });

  it('ignora itens sem id, sem urgência válida ou que não são objetos', () => {
    const planetLayout = buildPlanetLayout([
      URGENT_PLANET,
      null,
      'tarefa',
      { title: 'Sem id', urgency: 1 },
      { id: 9, title: 'Urgência fora da faixa', urgency: 2 },
      { id: 10, title: 'Urgência em texto', urgency: '1' },
    ]);

    assert.deepEqual(
      planetLayout.map(({ id }) => id),
      [URGENT_PLANET.id]
    );
  });

  it('usa título vazio quando o título não é texto', () => {
    const [positionedPlanet] = buildPlanetLayout([
      { id: 4, title: 42, urgency: 0 },
    ]);

    assert.equal(positionedPlanet.title, '');
  });

  it('devolve lista vazia para lista inválida ou raios invertidos', () => {
    [null, undefined, 'planetas', {}].forEach((invalidPlanets) => {
      assert.deepEqual(buildPlanetLayout(invalidPlanets), []);
    });
    assert.deepEqual(
      buildPlanetLayout([URGENT_PLANET], MAX_RADIUS, MIN_RADIUS),
      []
    );
  });
});

describe('renderOrbitPlanets', () => {
  it('desenha seis órbitas, alternando contínuas e tracejadas', () => {
    const { renderOrbitPlanets, orbitSystemContainer } =
      createRenderEnvironment();

    renderOrbitPlanets(orbitSystemContainer, []);
    const [orbitsContainer] = orbitSystemContainer.children;

    assert.equal(orbitsContainer.attributes['aria-hidden'], 'true');
    assert.equal(orbitsContainer.children.length, EXPECTED_ORBIT_COUNT);
    assert.deepEqual(
      orbitsContainer.children.map((orbitRing) => orbitRing.className),
      [
        SOLID_ORBIT_CLASS,
        DASHED_ORBIT_CLASS,
        SOLID_ORBIT_CLASS,
        DASHED_ORBIT_CLASS,
        SOLID_ORBIT_CLASS,
        DASHED_ORBIT_CLASS,
      ]
    );
  });

  it('cria um planeta por tarefa, com nível, id e posição', () => {
    const { renderOrbitPlanets, orbitSystemContainer } =
      createRenderEnvironment();

    const renderedPlanetCount = renderOrbitPlanets(orbitSystemContainer, [
      URGENT_PLANET,
      DISTANT_PLANET,
    ]);
    const planetsList = getRenderedPlanetsList(orbitSystemContainer);
    const [urgentPlanetElement, distantPlanetElement] = planetsList.children;
    const { styleProperties } = urgentPlanetElement;

    assert.equal(renderedPlanetCount, 2);
    assert.equal(
      planetsList.attributes['aria-label'],
      'Planetas das tarefas'
    );
    assert.equal(
      urgentPlanetElement.className,
      'orbit-planet orbit-planet--urgent'
    );
    assert.equal(
      distantPlanetElement.className,
      'orbit-planet orbit-planet--distant'
    );
    assert.equal(urgentPlanetElement.dataset.taskId, URGENT_PLANET.id);
    assert.equal(urgentPlanetElement.tabIndex, 0);
    assert.match(styleProperties['--planet-x'], PERCENT_VALUE_PATTERN);
    assert.match(styleProperties['--planet-y'], PERCENT_VALUE_PATTERN);
  });

  it('coloca o título da tarefa apenas como texto', () => {
    const unsafeTitle = '<img src="x" onerror="alert(1)">';
    const { renderOrbitPlanets, orbitSystemContainer } =
      createRenderEnvironment();

    renderOrbitPlanets(orbitSystemContainer, [
      { id: 5, title: unsafeTitle, urgency: 1 },
    ]);
    const planetsList = getRenderedPlanetsList(orbitSystemContainer);
    const [planetTitleElement] = planetsList.children[0].children;

    assert.equal(planetTitleElement.className, 'orbit-planet__title');
    assert.equal(planetTitleElement.textContent, unsafeTitle);
    assert.equal(Object.hasOwn(planetTitleElement, 'innerHTML'), false);
  });

  it('substitui o conteúdo anterior a cada renderização', () => {
    const { renderOrbitPlanets, orbitSystemContainer } =
      createRenderEnvironment();

    renderOrbitPlanets(orbitSystemContainer, [URGENT_PLANET, DISTANT_PLANET]);
    renderOrbitPlanets(orbitSystemContainer, [URGENT_PLANET]);
    const planetsList = getRenderedPlanetsList(orbitSystemContainer);

    assert.equal(orbitSystemContainer.children.length, 2);
    assert.equal(planetsList.children.length, 1);
  });

  it('devolve 0 e não falha quando o contêiner é inválido', () => {
    const { renderOrbitPlanets } = createRenderEnvironment();

    assert.equal(renderOrbitPlanets(null, [URGENT_PLANET]), 0);
    assert.equal(renderOrbitPlanets({}, [URGENT_PLANET]), 0);
  });

  it('desenha só as órbitas quando a lista de tarefas é inválida', () => {
    const { renderOrbitPlanets, orbitSystemContainer } =
      createRenderEnvironment();

    const renderedPlanetCount = renderOrbitPlanets(orbitSystemContainer, null);
    const planetsList = getRenderedPlanetsList(orbitSystemContainer);

    assert.equal(renderedPlanetCount, 0);
    assert.equal(planetsList.children.length, 0);
  });
});
