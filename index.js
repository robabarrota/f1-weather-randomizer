// Wet race probability for each track
const trackWetProbabilities = [
    { name: "Abu Dhabi", wetChance: 0.02 / 3},
    { name: "Austria", wetChance: 0.2 / 3},
    { name: "Australia", wetChance: 0.1 / 3},
    { name: "Azerbaijan", wetChance: 0.1 / 3},
    { name: "Bahrain", wetChance: 0.02 / 3},
    { name: "Belgium", wetChance: 0.3 / 3},
    { name: "Brazil", wetChance: 0.2 / 3},
    { name: "Canada", wetChance: 0.3 / 3},
    { name: "China", wetChance: 0.2 / 3},
    { name: "France", wetChance: 0.3 / 3},
    { name: "Great Britain", wetChance: 0.4 / 3},
    { name: "Hungary", wetChance: 0.25 / 3},
    { name: "Imola", wetChance: 0.15 / 3},
    { name: "Italy", wetChance: 0.15 / 3},
    { name: "Japan", wetChance: 0.2 / 3},
    { name: "Mexico", wetChance: 0.15 / 3},
    { name: "Miami", wetChance: 0.15 / 3},
    { name: "Monaco", wetChance: 0.2 / 3},
    { name: "Netherlands", wetChance: 0.3 / 3},
    { name: "Portugal", wetChance: 0.2 / 3},
    { name: "Saudi Arabia", wetChance: 0.02 / 3},
    { name: "Singapore", wetChance: 0.25 / 3},
    { name: "Spain", wetChance: 0.2 / 3},
    { name: "USA", wetChance: 0.15 / 3},
];

const multiplierWeight = 10;

const maxWetChance = Math.max(...trackWetProbabilities.map(({wetChance}) => wetChance));
const minWetChance = Math.min(...trackWetProbabilities.map(({wetChance}) => wetChance));

const getNormalizedWetChance = wetChance => ((wetChance - minWetChance) / (maxWetChance - minWetChance));

const getWeightedWeatherTypeMultipliers = wetChance => {
    const normalizedWetChance = getNormalizedWetChance(wetChance);
    const weightedWeatherTypeChances = weatherTypes.map((_, index) => 1 - Math.abs((index + 1) / (weatherTypes.length + 1) - normalizedWetChance));
    const totalChances = weightedWeatherTypeChances.reduce((partialSum, a) => partialSum + a, 0);
    const weightedWeatherProportions = weightedWeatherTypeChances.map(chance => chance / totalChances);

    const dryWeightedWeatherProportions = weightedWeatherProportions.filter((_, index) => index <= 2);
    const wetWeightedWeatherProportions = weightedWeatherProportions.filter((_, index) => index > 2);

    const getWeightedWeatherMultipliers = (proportions) => {
        const maxProportion = Math.max(...proportions);
        const minProportion = Math.min(...proportions);
    
        const avgProportion = (maxProportion + minProportion) / 2;

        return proportions.map(proportion => (proportion - avgProportion) * multiplierWeight + 1);
    }

    return [...getWeightedWeatherMultipliers(dryWeightedWeatherProportions), ...getWeightedWeatherMultipliers(wetWeightedWeatherProportions)]
};

// List of weather types
const weatherTypes = [
    "clear",
    "lightCloud",
    "overcast",
    "wet",
    "veryWet",
];

const wetWeatherTypes = [
    "wet",
    "veryWet",
];

const weatherTypeDisplayMap = {
    clear: {label: "Clear", iconUrl: 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/day.svg'},
    lightCloud: {label: "Light Clouds", iconUrl: 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/cloudy-day-2.svg'},
    overcast: {label: "Overcast", iconUrl: 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/cloudy.svg'},
    wet: {label: "Wet", iconUrl: 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/rainy-4.svg'},
    veryWet: {label: "Very Wet", iconUrl: 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/rainy-6.svg'},
}

const getNextStintWeatherProbabilities = (currentStintWeatherType, wetChance) => {
    const weatherMultipliers = getWeightedWeatherTypeMultipliers(wetChance);

    const nextStintWeatherProbabilities = weatherTypes.map((weatherType, index) => {
        const currentStintWeatherIndex = weatherTypes.indexOf(currentStintWeatherType);
        const differenceToCurrentWeather = Math.abs(currentStintWeatherIndex - index);
        const weatherTypeProbability = (1 - ((differenceToCurrentWeather + 1) * 0.2)) * getWeatherTypeProbability(weatherType, wetChance);

        return { type: weatherType, probability: weatherTypeProbability * weatherMultipliers[index] };
    });

    return nextStintWeatherProbabilities;
};

// Returns probability of selecting each weather type based on wet chance given
const getWeatherTypeProbability = (weatherType, wetChance) => {
    switch (weatherType) {
        case "clear":
            return (1 - wetChance) / 3;
        case "lightCloud":
            return (1 - wetChance) / 3;
        case "overcast":
            return (1 - wetChance) / 3;
        case "wet":
            return wetChance / 2;
        case "veryWet":
            return wetChance / 2;
        default:
            return 1;
    }
};

// Gets probability of each weather type for a given wet chance
const getFirstStintWeatherTypeProbabilities = (wetChance) => {
    const weatherMultipliers = getWeightedWeatherTypeMultipliers(wetChance);
    const weightedWeatherTypes = weatherTypes.map((weatherType, index) => {
        return {
            type: weatherType,
            probability: getWeatherTypeProbability(weatherType, wetChance) * weatherMultipliers[index],
        };
    });

    return weightedWeatherTypes;
};

const getWeatherTypeFromProbabilities = (weatherTypeProbabilities) => {
    const probabilityRangeMax = weatherTypeProbabilities.reduce(
        (totalRange, weatherTypeProbability) => {
            const upperProbabilityRange =
                weatherTypeProbability.probability + totalRange;
            weatherTypeProbability.probability = upperProbabilityRange;
            return upperProbabilityRange;
        },
        0
    );

    const randomizedValue = Math.random() * probabilityRangeMax;

    const selectedWeatherType = weatherTypeProbabilities.find(
        (weatherTypeProbability) =>
            weatherTypeProbability.probability > randomizedValue
    )?.type;

    return selectedWeatherType;
};

const getFirstStintWeatherType = (wetChanceForTrack) => {
    const weatherTypeProbabilities =
        getFirstStintWeatherTypeProbabilities(wetChanceForTrack);

    const firstStintWeather = getWeatherTypeFromProbabilities(weatherTypeProbabilities);

    return firstStintWeather;
};

const getOtherStintWeatherType = (previousWeatherType, wetChance) => {
    const weatherTypeProbabilities = getNextStintWeatherProbabilities(previousWeatherType, wetChance);
    const nextStintWeather = getWeatherTypeFromProbabilities(weatherTypeProbabilities);
    return nextStintWeather;
}

// Selects weather type for a track
const selectWeather = (selectedTrack) => {
    const wetChance = trackWetProbabilities.find(
        (el) => el.name === selectedTrack
    )?.wetChance;

    const qualifyingFirstStintWeather = getFirstStintWeatherType(wetChance);
    const qualifyingSecondStintWeather = getOtherStintWeatherType(qualifyingFirstStintWeather, wetChance);

    const raceFirstStintWeather = getFirstStintWeatherType(wetChance);
    const raceSecondStintWeather = getOtherStintWeatherType(raceFirstStintWeather, wetChance);
    const raceThirdStintWeather = getOtherStintWeatherType(raceSecondStintWeather, wetChance);


    return {
        qualifying: [
            qualifyingFirstStintWeather,
            qualifyingSecondStintWeather
        ],
        race: [
            raceFirstStintWeather,
            raceSecondStintWeather,
            raceThirdStintWeather
        ]
    };
};

const setUpStintCell = (elementId, weatherType) => {
    const {label, iconUrl} = weatherTypeDisplayMap[weatherType];
    document.getElementById(elementId).innerHTML = label;
    document.getElementById(`${elementId}-weather-icon`).style.background = `url(${iconUrl})`;
    document.getElementById(`${elementId}-weather-icon`).style.backgroundSize = 'contain';

}

const handleRunOnce = () => {
    const track = document.getElementById('trackSelect').value;
    const {qualifying, race} = selectWeather(track);
    setUpStintCell('first-qualifying-stint', qualifying[0]);
    setUpStintCell('second-qualifying-stint', qualifying[1]);

    setUpStintCell('first-race-stint', race[0]);
    setUpStintCell('second-race-stint', race[1]);
    setUpStintCell('third-race-stint', race[2]);

    // if (race.some(stint => stint === 'wet' || stint === 'veryWet')) document.getElementById('race-rain-gif').style.display = 'block';
    // else document.getElementById('race-rain-gif').style.display = 'none';
    // if (qualifying.some(stint => stint === 'wet' || stint === 'veryWet')) document.getElementById('qualifying-rain-gif').style.display = 'block';
    // else document.getElementById('qualifying-rain-gif').style.display = 'none';
};

const handleRunMany = () => {
    const track = document.getElementById('trackSelect').value;
    const runCount = document.getElementById('runCount')?.value;

    const numberOfSelections = runCount || 50;
    const weatherSelections = [];
    for (let i = 0; i < numberOfSelections; i++) {
        const {qualifying, race} = selectWeather(track);
        weatherSelections.push([...qualifying, ...race]);
    }

    const wetRaceCount = weatherSelections.filter(raceWeather => raceWeather.some(stint => wetWeatherTypes.includes(stint))).length;

    const clearStintPercentage = Math.round(weatherSelections.reduce(
        (totalCount, raceWeather) => totalCount + raceWeather.filter(stint => stint === "clear").length
        , 0) / (numberOfSelections * 5) * 100);
    const lightCloudStintPercentage = Math.round(weatherSelections.reduce(
        (totalCount, raceWeather) => totalCount + raceWeather.filter(stint => stint === "lightCloud").length
        , 0) / (numberOfSelections * 5) * 100);
    const overcastStintPercentage = Math.round(weatherSelections.reduce(
        (totalCount, raceWeather) => totalCount + raceWeather.filter(stint => stint === "overcast").length
        , 0) / (numberOfSelections * 5) * 100);
    const wetStintPercentage = Math.round(weatherSelections.reduce(
        (totalCount, raceWeather) => totalCount + raceWeather.filter(stint => stint === "wet").length
        , 0) / (numberOfSelections * 5) * 100);
    const veryWetStintPercentage = Math.round(weatherSelections.reduce(
        (totalCount, raceWeather) => totalCount + raceWeather.filter(stint => stint === "veryWet").length
        , 0) / (numberOfSelections * 5) * 100);

    const wetRacePercentage = Math.round((wetRaceCount / numberOfSelections) * 100);
    const dryRacePercentage = 100 - wetRacePercentage;

    document.getElementById('clearStintPercentageInput').value = clearStintPercentage;
    document.getElementById('lightCloudStintPercentageInput').value = lightCloudStintPercentage;
    document.getElementById('overcastStintPercentageInput').value = overcastStintPercentage;
    document.getElementById('wetStintPercentageInput').value = wetStintPercentage;
    document.getElementById('veryWetStintPercentageInput').value = veryWetStintPercentage;

    document.getElementById('dryRacePercentageInput').value = dryRacePercentage;
    document.getElementById('wetRacePercentageInput').value = wetRacePercentage;
};

const handleToggleTesting = () => {
    const isSectionVisible = document.getElementById('testing-section').style.display === "block";
    if (isSectionVisible) document.getElementById('testing-section').style.display = 'none';
    else document.getElementById('testing-section').style.display = 'block';
};

window.onload = function () {
    document.getElementById('runOnce').onclick = handleRunOnce;
    document.getElementById('runMany').onclick = handleRunMany;
    document.getElementById('toggle-testing').onclick = handleToggleTesting;
};