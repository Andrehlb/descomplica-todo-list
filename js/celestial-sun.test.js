const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CELESTIAL_SUN_MODULE_PATH = path.join(__dirname, 'celestial-sun.js');
const CELESTIAL_SUN_SOURCE = fs.readFileSync(CELESTIAL_SUN_MODULE_PATH, 'utf8');
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const GLOW_INTENSITY_PROPERTY = '--celestial-sun-glow-intensity';
const INVALID_VALUES = [
  NaN,
  Infinity,
  null,
  undefined,
  '0.5',
  {},
  [],
  -0.1,
  1.1,
];
const EXPECTED_LAYER_CLASSES = [
  undefined,
  'celestial-sun__glow',
  'celestial-sun__rays',
  'celestial-sun__body',
];

function loadCelestialSun(fakeWindow = {}) {
  new Function('window', CELESTIAL_SUN_SOURCE)(fakeWindow);

  return fakeWindow.CelestialSun;
}

function createFakeSvgElement(namespace, tagName) {
  const styleProperties = {};
  const attributes = {};

  const fakeSvgElement = {
    namespace,
    tagName,
    children: [],
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
  const { renderCelestialSun, updateBalanceLevel } =
    loadCelestialSun(fakeWindow);
  const sunContainer = createFakeSvgElement(null, 'div');

  return { renderCelestialSun, updateBalanceLevel, sunContainer };
}

function getRenderedSunSvg(sunContainer) {
  const [sunSvg] = sunContainer.children;

  return sunSvg;
}

function getRenderedLayer(sunContainer, layerClass) {
  return getRenderedSunSvg(sunContainer).children.find(
    (layer) => layer.attributes.class === layerClass
  );
}

function assertCloseTo(actualValue, expectedValue) {
  assert.ok(
    Math.abs(actualValue - expectedValue) < 0.0001,
    `esperado ${expectedValue}, recebido ${actualValue}`
  );
}

const {
  calculateSunRadius,
  calculateGlowIntensity,
  calculateRayCount,
  calculateRayLength,
  calculateRayAngles,
  buildRayPath,
  getSunAccessibleName,
} = loadCelestialSun();

describe('calculateSunRadius', () => {
  it('aumenta o raio do Sol conforme o equilíbrio', () => {
    assert.equal(calculateSunRadius(0), 44);
    assert.equal(calculateSunRadius(0.5), 50);
    assert.equal(calculateSunRadius(1), 56);
  });

  it('devolve null para equilíbrio inválido ou fora de 0 a 1', () => {
    INVALID_VALUES.forEach((invalidBalanceLevel) => {
      assert.equal(calculateSunRadius(invalidBalanceLevel), null);
    });
  });
});

describe('calculateGlowIntensity', () => {
  it('aumenta o brilho conforme o equilíbrio', () => {
    assertCloseTo(calculateGlowIntensity(0), 0.2);
    assertCloseTo(calculateGlowIntensity(0.5), 0.55);
    assertCloseTo(calculateGlowIntensity(1), 0.9);
  });

  it('devolve null para equilíbrio inválido', () => {
    INVALID_VALUES.forEach((invalidBalanceLevel) => {
      assert.equal(calculateGlowIntensity(invalidBalanceLevel), null);
    });
  });
});

describe('calculateRayCount', () => {
  it('aumenta a quantidade de raios conforme o equilíbrio', () => {
    assert.equal(calculateRayCount(0), 7);
    assert.equal(calculateRayCount(0.5), 10);
    assert.equal(calculateRayCount(1), 13);
  });

  it('sempre devolve um número inteiro de raios', () => {
    assert.ok(Number.isInteger(calculateRayCount(0.33)));
  });

  it('devolve null para equilíbrio inválido', () => {
    INVALID_VALUES.forEach((invalidBalanceLevel) => {
      assert.equal(calculateRayCount(invalidBalanceLevel), null);
    });
  });
});

describe('calculateRayLength', () => {
  it('aumenta o comprimento dos raios conforme o equilíbrio', () => {
    assert.equal(calculateRayLength(0), 12);
    assert.equal(calculateRayLength(0.5), 23);
    assert.equal(calculateRayLength(1), 34);
  });

  it('devolve null para equilíbrio inválido', () => {
    INVALID_VALUES.forEach((invalidBalanceLevel) => {
      assert.equal(calculateRayLength(invalidBalanceLevel), null);
    });
  });
});

describe('calculateRayAngles', () => {
  it('aponta um único raio para a esquerda', () => {
    assert.deepEqual(calculateRayAngles(1), [180]);
  });

  it('distribui os raios igualmente pela metade esquerda do Sol', () => {
    assert.deepEqual(calculateRayAngles(3), [135, 180, 225]);
  });

  it('mantém todos os raios antes da linha central', () => {
    calculateRayAngles(13).forEach((rayAngle) => {
      assert.ok(rayAngle > 90 && rayAngle < 270);
    });
  });

  it('devolve lista vazia para quantidade inválida', () => {
    [0, -1, 2.5, NaN, null, '3'].forEach((invalidRayCount) => {
      assert.deepEqual(calculateRayAngles(invalidRayCount), []);
    });
  });
});

describe('buildRayPath', () => {
  it('coloca a ponta do raio de 180 graus à esquerda do centro', () => {
    const rayPath = buildRayPath(180, 50, 20);

    assert.match(rayPath, /^M[\d.]+ [\d.]+ L80 110 L[\d.]+ [\d.]+ Z$/);
  });

  it('coloca a ponta do raio de 90 graus acima do centro', () => {
    assert.match(buildRayPath(90, 50, 20), / L150 40 /);
  });

  it('devolve null para ângulo, raio ou comprimento inválidos', () => {
    assert.equal(buildRayPath(NaN, 50, 20), null);
    assert.equal(buildRayPath(180, 0, 20), null);
    assert.equal(buildRayPath(180, 50, -5), null);
    assert.equal(buildRayPath(180, '50', 20), null);
  });
});

describe('getSunAccessibleName', () => {
  it('descreve a força do Sol em porcentagem', () => {
    assert.equal(
      getSunAccessibleName(0.6),
      'Parte Solar do equilíbrio: 60% de força.'
    );
  });

  it('devolve texto vazio para equilíbrio inválido', () => {
    assert.equal(getSunAccessibleName('alto'), '');
  });
});

describe('renderCelestialSun', () => {
  it('cria um SVG acessível com brilho, raios e meio disco', () => {
    const { renderCelestialSun, sunContainer } = createRenderEnvironment();

    renderCelestialSun(sunContainer, 1);
    const sunSvg = getRenderedSunSvg(sunContainer);

    assert.equal(sunContainer.children.length, 1);
    assert.equal(sunSvg.namespace, SVG_NAMESPACE);
    assert.equal(sunSvg.tagName, 'svg');
    assert.equal(sunSvg.attributes.class, 'celestial-sun');
    assert.equal(sunSvg.attributes.role, 'img');
    assert.equal(sunSvg.attributes.viewBox, '0 0 150 220');
    assert.equal(sunSvg.attributes.preserveAspectRatio, 'xMaxYMid meet');
    assert.deepEqual(
      sunSvg.children.map((layer) => layer.attributes.class),
      EXPECTED_LAYER_CLASSES
    );
  });

  it('encosta o meio disco na borda direita, que é a linha central', () => {
    const { renderCelestialSun, sunContainer } = createRenderEnvironment();

    renderCelestialSun(sunContainer, 1);
    const body = getRenderedLayer(sunContainer, 'celestial-sun__body');

    assert.equal(body.attributes.d, 'M150 54 A56 56 0 0 0 150 166 Z');
  });

  it('alterna raios longos e curtos de acordo com o equilíbrio', () => {
    const { renderCelestialSun, sunContainer } = createRenderEnvironment();

    renderCelestialSun(sunContainer, 1);
    const rays = getRenderedLayer(sunContainer, 'celestial-sun__rays');

    assert.equal(rays.children.length, 13);
    assert.deepEqual(
      rays.children.slice(0, 3).map((ray) => ray.attributes.class),
      [
        'celestial-sun__ray',
        'celestial-sun__ray celestial-sun__ray--short',
        'celestial-sun__ray',
      ]
    );
  });

  it('aplica o brilho e a descrição acessível do equilíbrio', () => {
    const { renderCelestialSun, sunContainer } = createRenderEnvironment();

    const appliedBalanceLevel = renderCelestialSun(sunContainer, 1);
    const sunSvg = getRenderedSunSvg(sunContainer);

    assert.equal(appliedBalanceLevel, 1);
    assert.equal(sunSvg.styleProperties[GLOW_INTENSITY_PROPERTY], '0.9');
    assert.equal(
      sunSvg.attributes['aria-label'],
      'Parte Solar do equilíbrio: 100% de força.'
    );
  });

  it('usa o equilíbrio 0.5 quando o valor recebido é inválido', () => {
    const { renderCelestialSun, sunContainer } = createRenderEnvironment();

    const appliedBalanceLevel = renderCelestialSun(sunContainer, 'alto');
    const rays = getRenderedLayer(sunContainer, 'celestial-sun__rays');

    assert.equal(appliedBalanceLevel, 0.5);
    assert.equal(rays.children.length, 10);
  });

  it('cria degradês com ids próprios para cada Sol', () => {
    const { renderCelestialSun } = createRenderEnvironment();
    const firstContainer = createFakeSvgElement(null, 'div');
    const secondContainer = createFakeSvgElement(null, 'div');

    renderCelestialSun(firstContainer, 0);
    renderCelestialSun(secondContainer, 0);
    const getGlowFill = (sunContainer) =>
      getRenderedLayer(sunContainer, 'celestial-sun__glow').attributes.fill;

    assert.notEqual(getGlowFill(firstContainer), getGlowFill(secondContainer));
  });

  it('devolve null e não falha quando o contêiner é inválido', () => {
    const { renderCelestialSun } = createRenderEnvironment();

    assert.equal(renderCelestialSun(null, 0.5), null);
    assert.equal(renderCelestialSun({}, 0.5), null);
    assert.equal(renderCelestialSun('sol', 0.5), null);
  });
});

describe('updateBalanceLevel', () => {
  it('atualiza raios, tamanho e brilho sem recriar o SVG', () => {
    const { renderCelestialSun, updateBalanceLevel, sunContainer } =
      createRenderEnvironment();
    renderCelestialSun(sunContainer, 0);
    const sunSvgBeforeUpdate = getRenderedSunSvg(sunContainer);

    const appliedBalanceLevel = updateBalanceLevel(sunContainer, 1);
    const sunSvg = getRenderedSunSvg(sunContainer);
    const rays = getRenderedLayer(sunContainer, 'celestial-sun__rays');

    assert.equal(appliedBalanceLevel, 1);
    assert.equal(sunSvg, sunSvgBeforeUpdate);
    assert.equal(rays.children.length, 13);
    assert.equal(sunSvg.styleProperties[GLOW_INTENSITY_PROPERTY], '0.9');
  });

  it('mantém o estado anterior quando o novo equilíbrio é inválido', () => {
    const { renderCelestialSun, updateBalanceLevel, sunContainer } =
      createRenderEnvironment();
    renderCelestialSun(sunContainer, 0);

    const appliedBalanceLevel = updateBalanceLevel(sunContainer, 2);
    const rays = getRenderedLayer(sunContainer, 'celestial-sun__rays');

    assert.equal(appliedBalanceLevel, null);
    assert.equal(rays.children.length, 7);
  });

  it('devolve null para contêiner que ainda não tem o Sol', () => {
    const { updateBalanceLevel, sunContainer } = createRenderEnvironment();

    assert.equal(updateBalanceLevel(sunContainer, 0.5), null);
    assert.equal(updateBalanceLevel(null, 0.5), null);
  });
});
