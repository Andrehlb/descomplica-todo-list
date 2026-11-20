const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ISLAND_SCENE_MODULE_PATH = path.join(__dirname, 'island-scene.js');
const ISLAND_SCENE_SOURCE = fs.readFileSync(ISLAND_SCENE_MODULE_PATH, 'utf8');
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const SCENE_HEIGHT = 200;
const WATER_TOP_PROPERTY = '--island-water-top';
const INVALID_VALUES = [NaN, Infinity, null, undefined, '0.5', {}, []];
const EXPECTED_LAYER_CLASSES = [
  undefined,
  'island-scene__landscape',
  'island-scene__island',
  'island-scene__water',
];

function loadIslandScene(fakeWindow = {}) {
  new Function('window', ISLAND_SCENE_SOURCE)(fakeWindow);

  return fakeWindow.IslandScene;
}

function createFakeSvgElement(namespace, tagName) {
  const styleProperties = {};
  const attributes = {};

  const fakeSvgElement = {
    namespace,
    tagName,
    children: [],
    dataset: {},
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
    append: (...childElements) =>
      fakeSvgElement.children.push(...childElements),
    replaceChildren: (...childElements) => {
      fakeSvgElement.children = childElements;
    },
  };

  return fakeSvgElement;
}

function createRenderEnvironment() {
  const fakeWindow = {
    document: { createElementNS: createFakeSvgElement },
  };
  const { renderIslandScene, updateWaterLevel } = loadIslandScene(fakeWindow);
  const sceneContainer = createFakeSvgElement(null, 'div');

  return { renderIslandScene, updateWaterLevel, sceneContainer };
}

function getRenderedSceneSvg(sceneContainer) {
  const [sceneSvg] = sceneContainer.children;

  return sceneSvg;
}

function findDescendantsByClass(element, className) {
  return element.children.flatMap((childElement) => [
    ...(childElement.attributes.class === className ? [childElement] : []),
    ...findDescendantsByClass(childElement, className),
  ]);
}

function assertCloseTo(actualValue, expectedValue) {
  assert.ok(
    Math.abs(actualValue - expectedValue) < 0.0001,
    `esperado ${expectedValue}, recebido ${actualValue}`
  );
}

const {
  getTideState,
  getTideStateLabel,
  calculateWaterOffset,
  calculateWaterTop,
} = loadIslandScene();

describe('getTideState', () => {
  it('classifica de 0 a 0.3 como maré baixa', () => {
    assert.equal(getTideState(0), 'low');
    assert.equal(getTideState(0.3), 'low');
  });

  it('classifica acima de 0.3 até 0.7 como maré média', () => {
    assert.equal(getTideState(0.31), 'medium');
    assert.equal(getTideState(0.5), 'medium');
    assert.equal(getTideState(0.7), 'medium');
  });

  it('classifica acima de 0.7 até 1 como maré alta', () => {
    assert.equal(getTideState(0.71), 'high');
    assert.equal(getTideState(1), 'high');
  });

  it('devolve null para nível inválido ou fora de 0 a 1', () => {
    [...INVALID_VALUES, -0.1, 1.1].forEach((invalidWaterLevel) => {
      assert.equal(getTideState(invalidWaterLevel), null);
    });
  });
});

describe('getTideStateLabel', () => {
  it('descreve cada estado da maré em português', () => {
    assert.equal(getTideStateLabel('low'), 'Maré baixa: a ilha está segura.');
    assert.equal(
      getTideStateLabel('medium'),
      'Maré média: a água já cobre parte da praia.'
    );
    assert.equal(
      getTideStateLabel('high'),
      'Maré alta: a ilha está quase submersa.'
    );
  });

  it('devolve texto vazio para estado desconhecido', () => {
    assert.equal(getTideStateLabel('flood'), '');
    assert.equal(getTideStateLabel(undefined), '');
    assert.equal(getTideStateLabel('toString'), '');
  });
});

describe('calculateWaterOffset', () => {
  it('deixa a praia descoberta no nível 0', () => {
    assertCloseTo(calculateWaterOffset(0, SCENE_HEIGHT), 44);
  });

  it('cobre metade do caminho no nível 0.5', () => {
    assertCloseTo(calculateWaterOffset(0.5, SCENE_HEIGHT), 69);
  });

  it('chega ao ponto mais alto no nível 1', () => {
    assertCloseTo(calculateWaterOffset(1, SCENE_HEIGHT), 94);
  });

  it('acompanha a altura da cena', () => {
    assertCloseTo(calculateWaterOffset(1, 100), 47);
  });

  it('devolve null para nível inválido', () => {
    [...INVALID_VALUES, -1, 2].forEach((invalidWaterLevel) => {
      assert.equal(calculateWaterOffset(invalidWaterLevel, SCENE_HEIGHT), null);
    });
  });

  it('devolve null para altura zero, negativa ou inválida', () => {
    [0, -100, ...INVALID_VALUES].forEach((invalidSceneHeight) => {
      assert.equal(calculateWaterOffset(0.5, invalidSceneHeight), null);
    });
  });
});

describe('calculateWaterTop', () => {
  it('mede a superfície da água a partir do topo da cena', () => {
    assertCloseTo(calculateWaterTop(0, SCENE_HEIGHT), 156);
    assertCloseTo(calculateWaterTop(1, SCENE_HEIGHT), 106);
  });

  it('sobe a superfície da água quando o nível aumenta', () => {
    const highWaterTop = calculateWaterTop(0.8, SCENE_HEIGHT);
    const lowWaterTop = calculateWaterTop(0.2, SCENE_HEIGHT);

    assert.ok(highWaterTop < lowWaterTop);
  });

  it('devolve null para entrada inválida', () => {
    assert.equal(calculateWaterTop(NaN, SCENE_HEIGHT), null);
    assert.equal(calculateWaterTop(0.5, 0), null);
  });
});

describe('renderIslandScene', () => {
  it('cria um SVG acessível com céu, paisagem, ilha e água', () => {
    const { renderIslandScene, sceneContainer } = createRenderEnvironment();

    renderIslandScene(sceneContainer, 0);
    const sceneSvg = getRenderedSceneSvg(sceneContainer);

    assert.equal(sceneContainer.children.length, 1);
    assert.equal(sceneSvg.namespace, SVG_NAMESPACE);
    assert.equal(sceneSvg.tagName, 'svg');
    assert.equal(sceneSvg.attributes.class, 'island-scene');
    assert.equal(sceneSvg.attributes.role, 'img');
    assert.equal(sceneSvg.attributes.viewBox, '0 0 300 200');
    assert.deepEqual(
      sceneSvg.children.map((layer) => layer.attributes.class),
      EXPECTED_LAYER_CLASSES
    );
  });

  it('desenha areia, vegetação, pedras, palmeiras e cabana na ilha', () => {
    const { renderIslandScene, sceneContainer } = createRenderEnvironment();

    renderIslandScene(sceneContainer, 0);
    const sceneSvg = getRenderedSceneSvg(sceneContainer);
    const countByClass = (className) =>
      findDescendantsByClass(sceneSvg, className).length;

    assert.equal(countByClass('island-scene__sand'), 1);
    assert.equal(countByClass('island-scene__vegetation'), 1);
    assert.equal(countByClass('island-scene__rock'), 2);
    assert.equal(countByClass('island-scene__palm-tree'), 2);
    assert.equal(countByClass('island-scene__hut'), 1);
  });

  it('aplica o nível recebido e devolve o estado da maré', () => {
    const { renderIslandScene, sceneContainer } = createRenderEnvironment();

    const tideState = renderIslandScene(sceneContainer, 0.5);
    const sceneSvg = getRenderedSceneSvg(sceneContainer);

    assert.equal(tideState, 'medium');
    assert.equal(sceneSvg.dataset.tideState, 'medium');
    assert.equal(sceneSvg.styleProperties[WATER_TOP_PROPERTY], '131px');
    assert.equal(
      sceneSvg.attributes['aria-label'],
      'Maré média: a água já cobre parte da praia.'
    );
  });

  it('usa o nível 0 quando o nível recebido é inválido', () => {
    const { renderIslandScene, sceneContainer } = createRenderEnvironment();

    const tideState = renderIslandScene(sceneContainer, 'cheia');
    const sceneSvg = getRenderedSceneSvg(sceneContainer);

    assert.equal(tideState, 'low');
    assert.equal(sceneSvg.styleProperties[WATER_TOP_PROPERTY], '156px');
  });

  it('cria um degradê de céu com id próprio para cada cena', () => {
    const { renderIslandScene } = createRenderEnvironment();
    const firstContainer = createFakeSvgElement(null, 'div');
    const secondContainer = createFakeSvgElement(null, 'div');

    renderIslandScene(firstContainer, 0);
    renderIslandScene(secondContainer, 0);
    const getSkyGradientId = (sceneContainer) =>
      getRenderedSceneSvg(sceneContainer).children[0].children[0].attributes
        .id;

    assert.notEqual(
      getSkyGradientId(firstContainer),
      getSkyGradientId(secondContainer)
    );
  });

  it('devolve null e não falha quando o contêiner é inválido', () => {
    const { renderIslandScene } = createRenderEnvironment();

    assert.equal(renderIslandScene(null, 0.5), null);
    assert.equal(renderIslandScene({}, 0.5), null);
    assert.equal(renderIslandScene('cena', 0.5), null);
  });
});

describe('updateWaterLevel', () => {
  it('move a água sem recriar a cena, para a transição funcionar', () => {
    const { renderIslandScene, updateWaterLevel, sceneContainer } =
      createRenderEnvironment();
    renderIslandScene(sceneContainer, 0);
    const sceneSvgBeforeUpdate = getRenderedSceneSvg(sceneContainer);

    const tideState = updateWaterLevel(sceneContainer, 1);
    const sceneSvg = getRenderedSceneSvg(sceneContainer);

    assert.equal(tideState, 'high');
    assert.equal(sceneSvg, sceneSvgBeforeUpdate);
    assert.equal(sceneSvg.styleProperties[WATER_TOP_PROPERTY], '106px');
    assert.equal(sceneSvg.dataset.tideState, 'high');
  });

  it('mantém o nível anterior quando o novo nível é inválido', () => {
    const { renderIslandScene, updateWaterLevel, sceneContainer } =
      createRenderEnvironment();
    renderIslandScene(sceneContainer, 0.5);

    const tideState = updateWaterLevel(sceneContainer, 1.5);
    const sceneSvg = getRenderedSceneSvg(sceneContainer);

    assert.equal(tideState, null);
    assert.equal(sceneSvg.dataset.tideState, 'medium');
    assert.equal(sceneSvg.styleProperties[WATER_TOP_PROPERTY], '131px');
  });

  it('devolve null para contêiner que ainda não tem a cena', () => {
    const { updateWaterLevel, sceneContainer } = createRenderEnvironment();

    assert.equal(updateWaterLevel(sceneContainer, 0.5), null);
    assert.equal(updateWaterLevel(null, 0.5), null);
  });
});
