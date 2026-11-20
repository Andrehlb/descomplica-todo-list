(function () {
  const URGENCY_LEVELS = Object.freeze({
    urgent: 'urgent',
    attention: 'attention',
    distant: 'distant',
  });
  const URGENCY_LEVEL_ORDER = Object.freeze([
    URGENCY_LEVELS.urgent,
    URGENCY_LEVELS.attention,
    URGENCY_LEVELS.distant,
  ]);
  const LEVEL_ANGLE_OFFSETS_DEGREES = Object.freeze({
    urgent: 20,
    attention: 60,
    distant: 100,
  });
  const URGENT_LEVEL_THRESHOLD = 0.75;
  const ORBITS_PER_URGENCY_LEVEL = 2;
  const ORBIT_COUNT = URGENCY_LEVEL_ORDER.length * ORBITS_PER_URGENCY_LEVEL;
  const MIN_ORBIT_RADIUS_PERCENT = 18;
  const MAX_ORBIT_RADIUS_PERCENT = 47;
  const FULL_CIRCLE_DEGREES = 360;
  const COORDINATE_DECIMAL_FACTOR = 100;
  const ORBITS_CONTAINER_CLASS = 'orbit-system__orbits';
  const ORBIT_RING_CLASS = 'orbit-ring';
  const DASHED_ORBIT_RING_CLASS = 'orbit-ring--dashed';
  const PLANETS_LIST_CLASS = 'orbit-system__planets';
  const PLANET_CLASS = 'orbit-planet';
  const PLANET_LEVEL_CLASS_PREFIX = 'orbit-planet--';
  const PLANET_TITLE_CLASS = 'orbit-planet__title';
  const PLANETS_LIST_ACCESSIBLE_NAME = 'Planetas das tarefas';

  function isValidUrgency(urgency) {
    return Number.isFinite(urgency) && urgency >= 0 && urgency <= 1;
  }

  function isValidRadiusRange(minRadius, maxRadius) {
    return (
      Number.isFinite(minRadius) &&
      Number.isFinite(maxRadius) &&
      minRadius >= 0 &&
      minRadius < maxRadius
    );
  }

  function isValidPlanet(planet) {
    return (
      typeof planet === 'object' &&
      planet !== null &&
      planet.id !== undefined &&
      planet.id !== null &&
      isValidUrgency(planet.urgency)
    );
  }

  function roundCoordinate(coordinate) {
    const roundedCoordinate =
      Math.round(coordinate * COORDINATE_DECIMAL_FACTOR) /
      COORDINATE_DECIMAL_FACTOR;

    return roundedCoordinate + 0;
  }

  function getUrgencyLevel(urgency) {
    if (!isValidUrgency(urgency)) {
      return null;
    }

    if (urgency >= URGENT_LEVEL_THRESHOLD) {
      return URGENCY_LEVELS.urgent;
    }

    return urgency > 0 ? URGENCY_LEVELS.attention : URGENCY_LEVELS.distant;
  }

  function calculateOrbitRadius(urgency, minRadius, maxRadius) {
    if (!isValidUrgency(urgency) || !isValidRadiusRange(minRadius, maxRadius)) {
      return null;
    }

    return maxRadius - urgency * (maxRadius - minRadius);
  }

  function calculateOrbitRadii(minRadius, maxRadius) {
    if (!isValidRadiusRange(minRadius, maxRadius)) {
      return [];
    }

    return Array.from({ length: ORBIT_COUNT }, (_, orbitIndex) =>
      calculateOrbitRadius(
        1 - orbitIndex / (ORBIT_COUNT - 1),
        minRadius,
        maxRadius
      )
    );
  }

  function getOrbitIndex(urgencyLevel, positionInLevel) {
    const levelIndex = URGENCY_LEVEL_ORDER.indexOf(urgencyLevel);

    if (
      levelIndex === -1 ||
      !Number.isInteger(positionInLevel) ||
      positionInLevel < 0
    ) {
      return null;
    }

    return (
      levelIndex * ORBITS_PER_URGENCY_LEVEL +
      (positionInLevel % ORBITS_PER_URGENCY_LEVEL)
    );
  }

  function distributeAngles(planetCount, offsetDegrees = 0) {
    if (
      !Number.isInteger(planetCount) ||
      planetCount <= 0 ||
      !Number.isFinite(offsetDegrees)
    ) {
      return [];
    }

    const angleStepDegrees = FULL_CIRCLE_DEGREES / planetCount;

    return Array.from(
      { length: planetCount },
      (_, planetIndex) =>
        (offsetDegrees + angleStepDegrees * planetIndex) % FULL_CIRCLE_DEGREES
    );
  }

  function calculatePlanetPosition(radius, angleDegrees) {
    if (
      !Number.isFinite(radius) ||
      radius < 0 ||
      !Number.isFinite(angleDegrees)
    ) {
      return null;
    }

    const angleRadians = (angleDegrees * Math.PI) / 180;

    return {
      x: roundCoordinate(radius * Math.sin(angleRadians)),
      y: roundCoordinate(-radius * Math.cos(angleRadians)),
    };
  }

  function groupPlanetsByUrgencyLevel(planets) {
    const planetsByLevel = { urgent: [], attention: [], distant: [] };

    planets.filter(isValidPlanet).forEach((planet) => {
      planetsByLevel[getUrgencyLevel(planet.urgency)].push(planet);
    });

    return planetsByLevel;
  }

  function positionPlanetsOfLevel(urgencyLevel, levelPlanets, orbitRadii) {
    const planetAngles = distributeAngles(
      levelPlanets.length,
      LEVEL_ANGLE_OFFSETS_DEGREES[urgencyLevel]
    );

    return levelPlanets.map((planet, positionInLevel) => {
      const orbitIndex = getOrbitIndex(urgencyLevel, positionInLevel);
      const planetPosition = calculatePlanetPosition(
        orbitRadii[orbitIndex],
        planetAngles[positionInLevel]
      );

      return {
        id: planet.id,
        title: typeof planet.title === 'string' ? planet.title : '',
        urgencyLevel,
        orbitIndex,
        x: planetPosition.x,
        y: planetPosition.y,
      };
    });
  }

  function buildPlanetLayout(
    planets,
    minRadius = MIN_ORBIT_RADIUS_PERCENT,
    maxRadius = MAX_ORBIT_RADIUS_PERCENT
  ) {
    if (!Array.isArray(planets) || !isValidRadiusRange(minRadius, maxRadius)) {
      return [];
    }

    const orbitRadii = calculateOrbitRadii(minRadius, maxRadius);
    const planetsByLevel = groupPlanetsByUrgencyLevel(planets);

    return URGENCY_LEVEL_ORDER.flatMap((urgencyLevel) =>
      positionPlanetsOfLevel(
        urgencyLevel,
        planetsByLevel[urgencyLevel],
        orbitRadii
      )
    );
  }

  function createOrbitRingElement(orbitRadius, orbitIndex) {
    const orbitRingElement = window.document.createElement('div');
    const isDashedOrbit = orbitIndex % 2 === 1;

    orbitRingElement.className = isDashedOrbit
      ? `${ORBIT_RING_CLASS} ${DASHED_ORBIT_RING_CLASS}`
      : ORBIT_RING_CLASS;
    orbitRingElement.style.setProperty(
      '--orbit-diameter',
      `${orbitRadius * 2}%`
    );

    return orbitRingElement;
  }

  function createOrbitsContainer() {
    const orbitsContainer = window.document.createElement('div');
    const orbitRadii = calculateOrbitRadii(
      MIN_ORBIT_RADIUS_PERCENT,
      MAX_ORBIT_RADIUS_PERCENT
    );

    orbitsContainer.className = ORBITS_CONTAINER_CLASS;
    orbitsContainer.setAttribute('aria-hidden', 'true');
    orbitsContainer.append(...orbitRadii.map(createOrbitRingElement));

    return orbitsContainer;
  }

  function getPlanetLevelClass(urgencyLevel) {
    return `${PLANET_LEVEL_CLASS_PREFIX}${urgencyLevel}`;
  }

  function createPlanetElement(positionedPlanet) {
    const planetElement = window.document.createElement('li');
    const planetTitleElement = window.document.createElement('span');
    const planetLevelClass = getPlanetLevelClass(positionedPlanet.urgencyLevel);

    planetElement.className = `${PLANET_CLASS} ${planetLevelClass}`;
    planetElement.dataset.taskId = positionedPlanet.id;
    planetElement.tabIndex = 0;
    planetElement.style.setProperty('--planet-x', `${positionedPlanet.x}%`);
    planetElement.style.setProperty('--planet-y', `${positionedPlanet.y}%`);

    planetTitleElement.className = PLANET_TITLE_CLASS;
    planetTitleElement.textContent = positionedPlanet.title;
    planetElement.append(planetTitleElement);

    return planetElement;
  }

  function createPlanetsList(planetLayout) {
    const planetsList = window.document.createElement('ul');

    planetsList.className = PLANETS_LIST_CLASS;
    planetsList.setAttribute('aria-label', PLANETS_LIST_ACCESSIBLE_NAME);
    planetsList.append(...planetLayout.map(createPlanetElement));

    return planetsList;
  }

  function renderOrbitPlanets(orbitSystemContainer, planets) {
    if (
      !orbitSystemContainer ||
      typeof orbitSystemContainer.replaceChildren !== 'function'
    ) {
      return 0;
    }

    const planetLayout = buildPlanetLayout(planets);

    orbitSystemContainer.replaceChildren(
      createOrbitsContainer(),
      createPlanetsList(planetLayout)
    );

    return planetLayout.length;
  }

  window.OrbitPlanets = {
    URGENCY_LEVELS,
    getUrgencyLevel,
    calculateOrbitRadius,
    calculateOrbitRadii,
    getOrbitIndex,
    distributeAngles,
    calculatePlanetPosition,
    buildPlanetLayout,
    renderOrbitPlanets,
  };
})();
