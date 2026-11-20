(function () {
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const SCENE_WIDTH = 150;
  const SCENE_HEIGHT = 220;
  const SCENE_VIEW_BOX = `0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`;
  const SUN_CENTER_X = SCENE_WIDTH;
  const SUN_CENTER_Y = SCENE_HEIGHT / 2;
  const DEFAULT_BALANCE_LEVEL = 0.5;
  const MIN_SUN_RADIUS = 44;
  const MAX_SUN_RADIUS = 56;
  const MIN_GLOW_INTENSITY = 0.2;
  const MAX_GLOW_INTENSITY = 0.9;
  const MIN_RAY_COUNT = 7;
  const MAX_RAY_COUNT = 13;
  const MIN_LONG_RAY_LENGTH = 12;
  const MAX_LONG_RAY_LENGTH = 34;
  const SHORT_RAY_LENGTH_RATIO = 0.6;
  const RAY_BASE_HALF_ANGLE_DEGREES = 5;
  const RAY_BASE_INSET = 2;
  const GLOW_RADIUS_MARGIN = 40;
  const HALF_CIRCLE_START_DEGREES = 90;
  const HALF_CIRCLE_DEGREES = 180;
  const HUNDREDTHS_FACTOR = 100;
  const PERCENT_FACTOR = 100;
  const GLOW_INTENSITY_PROPERTY = '--celestial-sun-glow-intensity';
  const RAY_CLASS = 'celestial-sun__ray';
  const SHORT_RAY_CLASS = 'celestial-sun__ray--short';

  const renderedSuns = new WeakMap();
  let renderedSunCount = 0;

  function isValidBalanceLevel(balanceLevel) {
    return (
      Number.isFinite(balanceLevel) && balanceLevel >= 0 && balanceLevel <= 1
    );
  }

  function isValidContainer(sunContainer) {
    return (
      typeof sunContainer === 'object' &&
      sunContainer !== null &&
      typeof sunContainer.replaceChildren === 'function'
    );
  }

  function interpolate(minValue, maxValue, balanceLevel) {
    return minValue + balanceLevel * (maxValue - minValue);
  }

  function roundToHundredths(value) {
    const roundedValue =
      Math.round(value * HUNDREDTHS_FACTOR) / HUNDREDTHS_FACTOR;

    return roundedValue + 0;
  }

  function degreesToRadians(angleDegrees) {
    return (angleDegrees * Math.PI) / 180;
  }

  function calculateSunRadius(balanceLevel) {
    return isValidBalanceLevel(balanceLevel)
      ? interpolate(MIN_SUN_RADIUS, MAX_SUN_RADIUS, balanceLevel)
      : null;
  }

  function calculateGlowIntensity(balanceLevel) {
    return isValidBalanceLevel(balanceLevel)
      ? roundToHundredths(
          interpolate(MIN_GLOW_INTENSITY, MAX_GLOW_INTENSITY, balanceLevel)
        )
      : null;
  }

  function calculateRayCount(balanceLevel) {
    return isValidBalanceLevel(balanceLevel)
      ? Math.round(interpolate(MIN_RAY_COUNT, MAX_RAY_COUNT, balanceLevel))
      : null;
  }

  function calculateRayLength(balanceLevel) {
    return isValidBalanceLevel(balanceLevel)
      ? interpolate(MIN_LONG_RAY_LENGTH, MAX_LONG_RAY_LENGTH, balanceLevel)
      : null;
  }

  function calculateRayAngles(rayCount) {
    if (!Number.isInteger(rayCount) || rayCount <= 0) {
      return [];
    }

    const angleStepDegrees = HALF_CIRCLE_DEGREES / (rayCount + 1);

    return Array.from(
      { length: rayCount },
      (_, rayIndex) =>
        HALF_CIRCLE_START_DEGREES + angleStepDegrees * (rayIndex + 1)
    );
  }

  function calculatePointOnSun(angleDegrees, distanceFromCenter) {
    const angleRadians = degreesToRadians(angleDegrees);

    return {
      x: roundToHundredths(
        SUN_CENTER_X + Math.cos(angleRadians) * distanceFromCenter
      ),
      y: roundToHundredths(
        SUN_CENTER_Y - Math.sin(angleRadians) * distanceFromCenter
      ),
    };
  }

  function buildRayPath(angleDegrees, sunRadius, rayLength) {
    if (
      !Number.isFinite(angleDegrees) ||
      !Number.isFinite(sunRadius) ||
      !Number.isFinite(rayLength) ||
      sunRadius <= 0 ||
      rayLength <= 0
    ) {
      return null;
    }

    const baseDistance = sunRadius - RAY_BASE_INSET;
    const baseStart = calculatePointOnSun(
      angleDegrees - RAY_BASE_HALF_ANGLE_DEGREES,
      baseDistance
    );
    const rayTip = calculatePointOnSun(angleDegrees, sunRadius + rayLength);
    const baseEnd = calculatePointOnSun(
      angleDegrees + RAY_BASE_HALF_ANGLE_DEGREES,
      baseDistance
    );

    return [
      `M${baseStart.x} ${baseStart.y}`,
      `L${rayTip.x} ${rayTip.y}`,
      `L${baseEnd.x} ${baseEnd.y}`,
      'Z',
    ].join(' ');
  }

  function buildHalfDiscPath(sunRadius) {
    const topY = SUN_CENTER_Y - sunRadius;
    const bottomY = SUN_CENTER_Y + sunRadius;

    return [
      `M${SUN_CENTER_X} ${topY}`,
      `A${sunRadius} ${sunRadius} 0 0 0 ${SUN_CENTER_X} ${bottomY}`,
      'Z',
    ].join(' ');
  }

  function getSunAccessibleName(balanceLevel) {
    if (!isValidBalanceLevel(balanceLevel)) {
      return '';
    }

    const balancePercent = Math.round(balanceLevel * PERCENT_FACTOR);

    return `Parte Solar do equilíbrio: ${balancePercent}% de força.`;
  }

  function createSvgElement(tagName, attributes = {}) {
    const svgElement = window.document.createElementNS(SVG_NAMESPACE, tagName);

    Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
      svgElement.setAttribute(attributeName, String(attributeValue));
    });

    return svgElement;
  }

  function createRadialGradient(gradientId, stopClasses, center = {}) {
    const radialGradient = createSvgElement('radialGradient', {
      id: gradientId,
      ...center,
    });

    radialGradient.append(
      ...stopClasses.map((stopClass, stopIndex) =>
        createSvgElement('stop', { offset: stopIndex, class: stopClass })
      )
    );

    return radialGradient;
  }

  function createGradients(glowGradientId, bodyGradientId) {
    const definitions = createSvgElement('defs');

    definitions.append(
      createRadialGradient(glowGradientId, [
        'celestial-sun__glow-center',
        'celestial-sun__glow-edge',
      ]),
      createRadialGradient(
        bodyGradientId,
        ['celestial-sun__body-core', 'celestial-sun__body-edge'],
        { cx: 0.6, cy: 0.45 }
      )
    );

    return definitions;
  }

  function createRayElements(balanceLevel, sunRadius) {
    const longRayLength = calculateRayLength(balanceLevel);
    const rayAngles = calculateRayAngles(calculateRayCount(balanceLevel));

    return rayAngles.map((rayAngle, rayIndex) => {
      const isShortRay = rayIndex % 2 === 1;
      const rayLength = isShortRay
        ? longRayLength * SHORT_RAY_LENGTH_RATIO
        : longRayLength;

      return createSvgElement('path', {
        class: isShortRay ? `${RAY_CLASS} ${SHORT_RAY_CLASS}` : RAY_CLASS,
        d: buildRayPath(rayAngle, sunRadius, rayLength),
      });
    });
  }

  function createSunSvg() {
    renderedSunCount += 1;

    const glowGradientId = `celestial-sun-glow-gradient-${renderedSunCount}`;
    const bodyGradientId = `celestial-sun-body-gradient-${renderedSunCount}`;
    const sunSvg = createSvgElement('svg', {
      class: 'celestial-sun',
      viewBox: SCENE_VIEW_BOX,
      role: 'img',
      preserveAspectRatio: 'xMaxYMid meet',
    });
    const glow = createSvgElement('circle', {
      class: 'celestial-sun__glow',
      cx: SUN_CENTER_X,
      cy: SUN_CENTER_Y,
      fill: `url(#${glowGradientId})`,
    });
    const rays = createSvgElement('g', { class: 'celestial-sun__rays' });
    const body = createSvgElement('path', {
      class: 'celestial-sun__body',
      fill: `url(#${bodyGradientId})`,
    });

    sunSvg.append(
      createGradients(glowGradientId, bodyGradientId),
      glow,
      rays,
      body
    );

    return { sunSvg, glow, rays, body };
  }

  function updateBalanceLevel(sunContainer, balanceLevel) {
    const renderedSun = isValidContainer(sunContainer)
      ? renderedSuns.get(sunContainer)
      : undefined;

    if (!renderedSun || !isValidBalanceLevel(balanceLevel)) {
      return null;
    }

    const { sunSvg, glow, rays, body } = renderedSun;
    const sunRadius = calculateSunRadius(balanceLevel);
    const glowIntensity = calculateGlowIntensity(balanceLevel);

    glow.setAttribute('r', String(sunRadius + GLOW_RADIUS_MARGIN));
    rays.replaceChildren(...createRayElements(balanceLevel, sunRadius));
    body.setAttribute('d', buildHalfDiscPath(sunRadius));
    sunSvg.style.setProperty(GLOW_INTENSITY_PROPERTY, String(glowIntensity));
    sunSvg.setAttribute('aria-label', getSunAccessibleName(balanceLevel));

    return balanceLevel;
  }

  function renderCelestialSun(sunContainer, balanceLevel) {
    if (!isValidContainer(sunContainer)) {
      return null;
    }

    const renderedSun = createSunSvg();
    const initialBalanceLevel = isValidBalanceLevel(balanceLevel)
      ? balanceLevel
      : DEFAULT_BALANCE_LEVEL;

    sunContainer.replaceChildren(renderedSun.sunSvg);
    renderedSuns.set(sunContainer, renderedSun);

    return updateBalanceLevel(sunContainer, initialBalanceLevel);
  }

  window.CelestialSun = {
    calculateSunRadius,
    calculateGlowIntensity,
    calculateRayCount,
    calculateRayLength,
    calculateRayAngles,
    buildRayPath,
    getSunAccessibleName,
    renderCelestialSun,
    updateBalanceLevel,
  };
})();
