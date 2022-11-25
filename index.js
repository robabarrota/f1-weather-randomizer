// Wet race probability for each track
const trackWetProbabilities = [
    { name: "Abu Dhabi", wetChance: 0.02 },
    { name: "Austia", wetChance: 0.2 },
    { name: "Australia", wetChance: 0.1 },
    { name: "Azerbaijan", wetChance: 0.1 },
    { name: "Bahrain", wetChance: 0.02 },
    { name: "Belgium", wetChance: 0.3 },
    { name: "Brazil", wetChance: 0.2 },
    { name: "Canada", wetChance: 0.3 },
    { name: "China", wetChance: 0.2 },
    { name: "France", wetChance: 0.3 },
    { name: "Great Britain", wetChance: 0.4 },
    { name: "Hungary", wetChance: 0.25 },
    { name: "Imola", wetChance: 0.15 },
    { name: "Italy", wetChance: 0.15 },
    { name: "Japan", wetChance: 0.2 },
    { name: "Mexico", wetChance: 0.15 },
    { name: "Miami", wetChance: 0.15 },
    { name: "Monaco", wetChance: 0.2 },
    { name: "Netherlands", wetChance: 0.3 },
    { name: "Portugal", wetChance: 0.2 },
    { name: "Saudi Arabia", wetChance: 0.02 },
    { name: "Singapore", wetChance: 0.25 },
    { name: "Spain", wetChance: 0.2 },
    { name: "USA", wetChance: 0.15 },
];

// List of weather types
const weatherTypes = [
    "clear",
    "lightCloud",
    "overcast",
    "wet",
    "veryWet",
];

const weatherTypeLabelMap = {
    clear: "Clear",
    lightCloud: "Light Clouds",
    overcast: "Overcast",
    wet: "Wet",
    veryWet: "Very Wet",
}

const getNextStintWeatherProbabilities = (currentStintWeatherType, wetChance) => {
    const nextStintWeatherProbabilities = weatherTypes.map((weatherType, index) => {
        const currentStintWeatherIndex = weatherTypes.indexOf(currentStintWeatherType);
        const differenceToCurrentWeather = Math.abs(currentStintWeatherIndex - index);
        const weatherTypeProbability = (1 - ((differenceToCurrentWeather + 1) * 0.2)) * getWeatherTypeProbability(weatherType, wetChance);

        return { type: weatherType, probability: weatherTypeProbability };
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
    const weightedWeatherTypes = weatherTypes.map((weatherType) => {
        return {
            type: weatherType,
            probability: getWeatherTypeProbability(weatherType, wetChance),
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
    const firstStintWeather = getFirstStintWeatherType(wetChance);

    const secondStintWeather = getOtherStintWeatherType(firstStintWeather, wetChance);

    const thirdStintWeather = getOtherStintWeatherType(secondStintWeather, wetChance);


    return [
        firstStintWeather,
        secondStintWeather,
        thirdStintWeather
    ];
};

const handleRunOnce = () => {
    const track = document.getElementById('trackSelect').value;
    const raceWeather = selectWeather(track);
    document.getElementById('firstStint').innerHTML = weatherTypeLabelMap[raceWeather[0]];
    document.getElementById('secondStint').innerHTML = weatherTypeLabelMap[raceWeather[1]];
    document.getElementById('thirdStint').innerHTML = weatherTypeLabelMap[raceWeather[2]];

    if (raceWeather.some(stint => stint === 'wet' || stint === 'veryWet')) document.getElementById('rain-gif').style.display = 'block';
    else document.getElementById('rain-gif').style.display = 'none';
};

const handleRunMany = () => {
    const track = document.getElementById('trackSelect').value;
    const runCount = document.getElementById('runCount')?.value;

    const numberOfSelections = runCount || 50;
    const weatherSelections = [];
    for (let i = 0; i < numberOfSelections; i++) {
        const raceWeather = selectWeather(track);
        weatherSelections.push(raceWeather);
    }

    const wetWeatherTypes = [
        "wet",
        "veryWet",
    ];

    const wetRaceCount = weatherSelections.filter(raceWeather => raceWeather.some(stint => wetWeatherTypes.includes(stint))).length;

    const clearStintPercentage = Math.round(weatherSelections.reduce(
        (totalCount, raceWeather) => totalCount + raceWeather.filter(stint => stint === "clear").length
        , 0) / (numberOfSelections * 3) * 100);
    const lightCloudStintPercentage = Math.round(weatherSelections.reduce(
        (totalCount, raceWeather) => totalCount + raceWeather.filter(stint => stint === "lightCloud").length
        , 0) / (numberOfSelections * 3) * 100);
    const overcastStintPercentage = Math.round(weatherSelections.reduce(
        (totalCount, raceWeather) => totalCount + raceWeather.filter(stint => stint === "overcast").length
        , 0) / (numberOfSelections * 3) * 100);
    const wetStintPercentage = Math.round(weatherSelections.reduce(
        (totalCount, raceWeather) => totalCount + raceWeather.filter(stint => stint === "wet").length
        , 0) / (numberOfSelections * 3) * 100);
    const veryWetStintPercentage = Math.round(weatherSelections.reduce(
        (totalCount, raceWeather) => totalCount + raceWeather.filter(stint => stint === "veryWet").length
        , 0) / (numberOfSelections * 3) * 100);

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