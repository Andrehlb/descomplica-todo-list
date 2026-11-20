(function () {
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const SCENE_WIDTH = 300;
  const SCENE_HEIGHT = 200;
  const SCENE_VIEW_BOX = `0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`;
  const DEFAULT_WATER_LEVEL = 0;
  const MIN_WATER_HEIGHT_RATIO = 0.22;
  const MAX_WATER_HEIGHT_RATIO = 0.47;
  const LOW_TIDE_MAX_LEVEL = 0.3;
  const MEDIUM_TIDE_MAX_LEVEL = 0.7;
  const WAVE_SEGMENT_WIDTH = 30;
  const WAVE_CREST_HEIGHT = 6;
  const WAVE_PERIOD_WIDTH = WAVE_SEGMENT_WIDTH * 2;
  const HORIZON_Y = 132;
  const WATER_TOP_PROPERTY = '--island-water-top';

  const TIDE_STATES = Object.freeze({
    low: 'low',
    medium: 'medium',
    high: 'high',
  });

  const TIDE_STATE_LABELS = Object.freeze({
    low: 'Maré baixa: a ilha está segura.',
    medium: 'Maré média: a água já cobre parte da praia.',
    high: 'Maré alta: a ilha está quase submersa.',
  });

  const DISTANT_ISLANDS_PATH = [
    'M10 140 q 20 -14 40 0 Z',
    'M240 132 q 24 -18 48 0 Z',
  ].join(' ');
  const SAND_PATH = 'M55 160 Q150 60 245 160 Z';
  const VEGETATION_PATH = 'M95 132 Q150 70 205 132 Z';
  const PALM_TRUNK_PATH = 'M0 0 q -4 -22 2 -40';
  const PALM_LEAVES_PATH = [
    'M2 -40 q -16 -6 -24 6',
    'M2 -40 q 16 -6 24 6',
    'M2 -40 q -4 -14 -16 -14',
    'M2 -40 q 6 -14 18 -12',
  ].join(' ');
  const HUT_ROOF_PATH = 'M-4 -14 L11 -26 L26 -14 Z';

  const ROCKS = Object.freeze([
    { cx: 120, cy: 150, rx: 12, ry: 7 },
    { cx: 190, cy: 152, rx: 10, ry: 6 },
  ]);

  const PALM_TREES = Object.freeze([
    { x: 112, y: 112, scale: 1 },
    { x: 188, y: 114, scale: 0.9 },
  ]);

  const HUT_POSITION = Object.freeze({ x: 140, y: 100 });

  const renderedScenes = new WeakMap();
  let renderedSceneCount = 0;

  function isValidWaterLevel(waterLevel) {
    return Number.isFinite(waterLevel) && waterLevel >= 0 && waterLevel <= 1;
  }

  function isValidSceneHeight(sceneHeight) {
    return Number.isFinite(sceneHeight) && sceneHeight > 0;
  }

  function isValidContainer(sceneContainer) {
    return (
      typeof sceneContainer === 'object' &&
      sceneContainer !== null &&
      typeof sceneContainer.replaceChildren === 'function'
    );
  }

  function getTideState(waterLevel) {
    if (!isValidWaterLevel(waterLevel)) {
      return null;
    }

    if (waterLevel <= LOW_TIDE_MAX_LEVEL) {
      return TIDE_STATES.low;
    }

    return waterLevel <= MEDIUM_TIDE_MAX_LEVEL
      ? TIDE_STATES.medium
      : TIDE_STATES.high;
  }

  function getTideStateLabel(tideState) {
    return Object.hasOwn(TIDE_STATE_LABELS, tideState)
      ? TIDE_STATE_LABELS[tideState]
      : '';
  }

  function calculateWaterOffset(waterLevel, sceneHeight) {
    if (!isValidWaterLevel(waterLevel) || !isValidSceneHeight(sceneHeight)) {
      return null;
    }

    const waterHeightRatio =
      MIN_WATER_HEIGHT_RATIO +
      waterLevel * (MAX_WATER_HEIGHT_RATIO - MIN_WATER_HEIGHT_RATIO);

    return sceneHeight * waterHeightRatio;
  }

  function calculateWaterTop(waterLevel, sceneHeight) {
    const waterOffset = calculateWaterOffset(waterLevel, sceneHeight);

    return waterOffset === null ? null : sceneHeight - waterOffset;
  }

  function buildWaveLinePath() {
    const waveSegmentCount =
      Math.ceil((SCENE_WIDTH + WAVE_PERIOD_WIDTH) / WAVE_SEGMENT_WIDTH);
    const waveSegments = Array.from(
      { length: waveSegmentCount },
      (_, segmentIndex) => {
        const crestDirection = segmentIndex % 2 === 0 ? -1 : 1;
        const controlPointX = WAVE_SEGMENT_WIDTH / 2;
        const controlPointY = crestDirection * WAVE_CREST_HEIGHT;

        return `q ${controlPointX} ${controlPointY} ${WAVE_SEGMENT_WIDTH} 0`;
      }
    );

    return `M0 0 ${waveSegments.join(' ')}`;
  }

  function buildWaterBodyPath() {
    return `${buildWaveLinePath()} V${SCENE_HEIGHT} H0 Z`;
  }

  function createSvgElement(tagName, attributes = {}) {
    const svgElement = window.document.createElementNS(SVG_NAMESPACE, tagName);

    Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
      svgElement.setAttribute(attributeName, String(attributeValue));
    });

    return svgElement;
  }

  function createSkyGradient(skyGradientId) {
    const definitions = createSvgElement('defs');
    const skyGradient = createSvgElement('linearGradient', {
      id: skyGradientId,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1,
    });

    skyGradient.append(
      createSvgElement('stop', { offset: 0, class: 'island-scene__sky-top' }),
      createSvgElement('stop', { offset: 1, class: 'island-scene__sky-bottom' })
    );
    definitions.append(skyGradient);

    return definitions;
  }

  function createLandscape(skyGradientId) {
    const landscape = createSvgElement('g', {
      class: 'island-scene__landscape',
    });

    landscape.append(
      createSvgElement('rect', {
        class: 'island-scene__sky',
        width: SCENE_WIDTH,
        height: SCENE_HEIGHT,
        fill: `url(#${skyGradientId})`,
      }),
      createSvgElement('path', {
        class: 'island-scene__distant-islands',
        d: DISTANT_ISLANDS_PATH,
      }),
      createSvgElement('rect', {
        class: 'island-scene__deep-water',
        y: HORIZON_Y,
        width: SCENE_WIDTH,
        height: SCENE_HEIGHT - HORIZON_Y,
      })
    );

    return landscape;
  }

  function createPalmTree({ x, y, scale }) {
    const palmTree = createSvgElement('g', {
      class: 'island-scene__palm-tree',
      transform: `translate(${x} ${y}) scale(${scale})`,
    });

    palmTree.append(
      createSvgElement('path', {
        class: 'island-scene__palm-trunk',
        d: PALM_TRUNK_PATH,
      }),
      createSvgElement('path', {
        class: 'island-scene__palm-leaves',
        d: PALM_LEAVES_PATH,
      })
    );

    return palmTree;
  }

  function createHut() {
    const hut = createSvgElement('g', {
      class: 'island-scene__hut',
      transform: `translate(${HUT_POSITION.x} ${HUT_POSITION.y})`,
    });

    hut.append(
      createSvgElement('rect', {
        class: 'island-scene__hut-wall',
        y: -14,
        width: 22,
        height: 14,
      }),
      createSvgElement('path', {
        class: 'island-scene__hut-roof',
        d: HUT_ROOF_PATH,
      }),
      createSvgElement('rect', {
        class: 'island-scene__hut-door',
        x: 8,
        y: -9,
        width: 6,
        height: 9,
      })
    );

    return hut;
  }

  function createIsland() {
    const island = createSvgElement('g', { class: 'island-scene__island' });
    const rocks = ROCKS.map((rock) =>
      createSvgElement('ellipse', { class: 'island-scene__rock', ...rock })
    );

    island.append(
      createSvgElement('path', { class: 'island-scene__sand', d: SAND_PATH }),
      createSvgElement('path', {
        class: 'island-scene__vegetation',
        d: VEGETATION_PATH,
      }),
      ...rocks,
      ...PALM_TREES.map(createPalmTree),
      createHut()
    );

    return island;
  }

  function createWater() {
    const water = createSvgElement('g', { class: 'island-scene__water' });
    const movingWave = createSvgElement('g', {
      class: 'island-scene__moving-wave',
    });

    movingWave.append(
      createSvgElement('path', {
        class: 'island-scene__water-body',
        d: buildWaterBodyPath(),
      }),
      createSvgElement('path', {
        class: 'island-scene__foam',
        d: buildWaveLinePath(),
      })
    );
    water.append(movingWave);

    return water;
  }

  function createSceneSvg() {
    renderedSceneCount += 1;

    const skyGradientId = `island-scene-sky-gradient-${renderedSceneCount}`;
    const sceneSvg = createSvgElement('svg', {
      class: 'island-scene',
      viewBox: SCENE_VIEW_BOX,
      role: 'img',
      preserveAspectRatio: 'xMidYMid slice',
    });

    sceneSvg.append(
      createSkyGradient(skyGradientId),
      createLandscape(skyGradientId),
      createIsland(),
      createWater()
    );

    return sceneSvg;
  }

  function updateWaterLevel(sceneContainer, waterLevel) {
    const sceneSvg = isValidContainer(sceneContainer)
      ? renderedScenes.get(sceneContainer)
      : undefined;

    if (!sceneSvg || !isValidWaterLevel(waterLevel)) {
      return null;
    }

    const tideState = getTideState(waterLevel);
    const waterTop = calculateWaterTop(waterLevel, SCENE_HEIGHT);

    sceneSvg.style.setProperty(WATER_TOP_PROPERTY, `${waterTop}px`);
    sceneSvg.dataset.tideState = tideState;
    sceneSvg.setAttribute('aria-label', getTideStateLabel(tideState));

    return tideState;
  }

  function renderIslandScene(sceneContainer, waterLevel) {
    if (!isValidContainer(sceneContainer)) {
      return null;
    }

    const sceneSvg = createSceneSvg();
    const initialWaterLevel = isValidWaterLevel(waterLevel)
      ? waterLevel
      : DEFAULT_WATER_LEVEL;

    sceneContainer.replaceChildren(sceneSvg);
    renderedScenes.set(sceneContainer, sceneSvg);

    return updateWaterLevel(sceneContainer, initialWaterLevel);
  }

  window.IslandScene = {
    TIDE_STATES,
    getTideState,
    getTideStateLabel,
    calculateWaterOffset,
    calculateWaterTop,
    renderIslandScene,
    updateWaterLevel,
  };
})();
