// Wet race probability for each track
const trackWetProbabilities = [
    // wetChance formula is wet days in a year / 365 (days in a year) / 3 (divider for stints)
    { name: "Abu Dhabi", wetChance: 9 / 365 / 3},
    { name: "Austria", wetChance: 146 / 365 / 3},
    { name: "Australia", wetChance: 36 / 365 / 3},
    { name: "Azerbaijan", wetChance: 39 / 365 / 3},
    { name: "Bahrain", wetChance: 13 / 365 / 3},
    { name: "Belgium", wetChance: 160 / 365 / 3},
    { name: "Brazil", wetChance: 110 / 365 / 3},
    { name: "Canada", wetChance: 163 / 365 / 3},
    { name: "China", wetChance: 123 / 365 / 3},
    { name: "France", wetChance: 55 / 365 / 3},
    { name: "Great Britain", wetChance: 137 / 365 / 3},
    { name: "Hungary", wetChance: 86 / 365 / 3},
    { name: "Imola", wetChance: 76 / 365 / 3},
    { name: "Italy", wetChance: 121 / 365 / 3},
    { name: "Japan", wetChance: 126 / 365 / 3},
    { name: "Mexico", wetChance: 125 / 365 / 3},
    { name: "Miami", wetChance: 116 / 365 / 3},
    { name: "Monaco", wetChance: 86 / 365 / 3},
    { name: "Netherlands", wetChance: 130 / 365 / 3},
    { name: "Portugal", wetChance: 49 / 365 / 3},
    { name: "Saudi Arabia", wetChance: 19 / 365 / 3},
    { name: "Singapore", wetChance: 167 / 365 / 3},
    { name: "Spain", wetChance: 80 / 365 / 3},
    { name: "USA", wetChance: 80 / 365 / 3},
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
    clear: {label: "Clear", iconUrl: 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/day.svg', discordEmoji: ':sunny:'},
    lightCloud: {label: "Light Clouds", iconUrl: 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/cloudy-day-2.svg', discordEmoji: ':white_sun_cloud:'},
    overcast: {label: "Overcast", iconUrl: 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/cloudy.svg', discordEmoji: ':cloud:'},
    wet: {label: "Wet", iconUrl: 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/rainy-4.svg', discordEmoji: ':cloud_rain:'},
    veryWet: {label: "Very Wet", iconUrl: 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/rainy-6.svg', discordEmoji: ':thunder_cloud_rain:'},
}

const stickyWeight = 1;

const getNextStintWeatherProbabilities = (currentStintWeatherType, wetChance) => {
    const weatherMultipliers = getWeightedWeatherTypeMultipliers(wetChance);

    const nextStintWeatherProbabilities = weatherTypes.map((weatherType, index) => {
        const currentStintWeatherIndex = weatherTypes.indexOf(currentStintWeatherType);
        const differenceToCurrentWeather = Math.abs(currentStintWeatherIndex - index);
        const weatherTypeProbability = (1 / ((differenceToCurrentWeather + 1) * stickyWeight)) * getWeatherTypeProbability(weatherType, wetChance);

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
};

const clearStintCells = () => {
    document.getElementById('first-qualifying-stint').innerHTML = "";
    document.getElementById('first-qualifying-stint-weather-icon').style.background = "";
    document.getElementById('second-qualifying-stint').innerHTML = "";
    document.getElementById('second-qualifying-stint-weather-icon').style.background = "";
    document.getElementById('first-race-stint').innerHTML = "";
    document.getElementById('first-race-stint-weather-icon').style.background = "";
    document.getElementById('second-race-stint').innerHTML = "";
    document.getElementById('second-race-stint-weather-icon').style.background = "";
    document.getElementById('third-race-stint').innerHTML = "";
    document.getElementById('third-race-stint-weather-icon').style.background = "";
};

const handleRunOnce = () => {
    clearStintCells();
    const track = document.getElementById('trackSelect').value;
    const {qualifying, race} = selectWeather(track);
    setUpStintCell('first-qualifying-stint', qualifying[0]);
    setUpStintCell('second-qualifying-stint', qualifying[1]);

    setUpStintCell('first-race-stint', race[0]);
    setUpStintCell('second-race-stint', race[1]);
    setUpStintCell('third-race-stint', race[2]);

    const discordMessage = 
        `_ _
        ***WEATHER REPORT:*** ${track}

        **QUALIFYING**
        Stint 1 - *${weatherTypeDisplayMap[qualifying[0]].label}* ${weatherTypeDisplayMap[qualifying[0]].discordEmoji}
        Stint 2 - *${weatherTypeDisplayMap[qualifying[1]].label}* ${weatherTypeDisplayMap[qualifying[1]].discordEmoji}
        
        **RACE**
        Stint 1 - *${weatherTypeDisplayMap[race[0]].label}* ${weatherTypeDisplayMap[race[0]].discordEmoji}
        Stint 2 - *${weatherTypeDisplayMap[race[1]].label}* ${weatherTypeDisplayMap[race[1]].discordEmoji}
        Stint 3 - *${weatherTypeDisplayMap[race[2]].label}* ${weatherTypeDisplayMap[race[2]].discordEmoji}
        _ _`;

    navigator.clipboard.writeText(discordMessage);
    document.getElementById('copied-message').style.opacity = 1;
    setTimeout(() => document.getElementById('copied-message').style.opacity = 0, 3000);
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