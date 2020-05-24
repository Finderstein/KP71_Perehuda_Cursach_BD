const City = require("./models/city.js");
const Sstation = require("./models/sstation");
const fetch = require("node-fetch");
const sstatistics = require("simple-statistics");

let stationsInserted = 0;
let citiesInserted = 0;

function setPollutantsInfo(stationStats, pollutant, value)
{
    switch (pollutant)
    {
        case "PM2.5":
            if(value < 0 || value > 500)
            {
                console.log("Invalid value of PM2.5 in station: " + stationStats.stationName);
                break;
            }
            stationStats.PM2_5 = value;
            break;

        case "Temperature":
            if(value < -60 || value > 60)
            {
                console.log("Invalid value of Temperature in station: " + stationStats.stationName);
                break;
            }
            stationStats.temperature = value;
            break;

        case "Humidity":
            if(value < 0 || value > 100)
            {
                console.log("Invalid value of Humidity in station: " + stationStats.stationName);
                break;
            }
            stationStats.humidity = value;
            break;

        case "Pressure":
            if(value < 600 || value > 1500)
            {
                console.log("Invalid value of Pressure in station: " + stationStats.stationName);
                break;
            }
            stationStats.pressure = value;
            break;

        case "PM10":
            if(value < 0 || value > 500)
            {
                console.log("Invalid value of PM10 in station: " + stationStats.stationName);
                break;
            }
            stationStats.PM10 = value;
            break;
        
        case "Air Quality Index":
            if(value < 0 || value > 500)
            {
                console.log("Invalid value of PM2.5 in station: " + stationStats.stationName);
                break;
            }
            stationStats.AQI = value;
            break;

        default:
            break;
    }
}

function getAirStats(stationsArray)
{
    let cityStats = { date: undefined, AQI: [], PM2_5: [], PM10: [], temperature: [], humidity: [], pressure: [], stations: [], validInfo: false };
    for(let i = 0; i < stationsArray.length; i++)
    {
        let station = stationsArray[i];
        let stationStats = { stationName: station.stationName, date: undefined, AQI: undefined, PM2_5: undefined, PM10: undefined, temperature: undefined, humidity: undefined, pressure: undefined };
        let pollutants = station.pollutants;
        for(let j = 0; j < pollutants.length; j++)
        {
            let pollutant_info = pollutants[j];
            let value = pollutant_info.value;

            if(stationStats.date === undefined || stationStats.date < pollutant_info.time) stationStats.date = pollutant_info.time;
            
            if(value === null)
            {
                console.log("!Pollutant value \""  + pollutant_info.pol + "\" of station \"" + station.stationName + "\" is null: ");
                continue;
            }

            setPollutantsInfo(stationStats, pollutant_info.pol, value);
        }

        if(stationStats.date === undefined || stationStats.AQI === undefined || stationStats.PM2_5 === undefined || stationStats.PM10 === undefined || 
            stationStats.temperature === undefined || stationStats.humidity === undefined || stationStats.pressure === undefined) 
        {
            console.log("!!Invalid number of air variables in station: " + station.stationName);
            continue;
        }
        else
        {
            cityStats.validInfo = true;
            cityStats.date = stationStats.date;
            for (let key in stationStats) if (stationStats.hasOwnProperty(key))
            {
                if(key === "date") continue;
                if(key === "stationName") continue;
                cityStats[key].push(stationStats[key]);
            }

            cityStats.stations.push(new Sstation(station.cityName, station.stationName, new Date(stationStats.date).toUTCString(), stationStats.AQI, stationStats.PM2_5, 
                stationStats.PM10, stationStats.temperature, stationStats.pressure, stationStats.humidity));
            stationsInserted++;
        }
    }

    return cityStats;
}

var getCitiesInfo = function()
{   
    City.clearCities()
    .then(() =>
    {
        return fetch(`https://api.saveecobot.com/output.json`);
    })
    .then(json => json.text())
    .then(json =>
    {
        console.log("\n\nUpdate DATABASE!");
        json = JSON.parse(json);
        let cities_info = {}
        for(let i = 0; i < json.length; i++)
        {
            let station_info = json[i];
            let value = [];
            value.push(station_info)
            if(cities_info[station_info.cityName])
                cities_info[station_info.cityName].push(station_info);
            else
                cities_info[station_info.cityName] = value;
        }
        
        for (let key in cities_info) if (cities_info.hasOwnProperty(key))
        {
            let airStats = getAirStats(cities_info[key]);

            if(!airStats.validInfo) 
            {
                console.log("!!!Invalid number of air variables in city: " + key);
                continue;
            }

            City.insert(new City(key, new Date(airStats.date).toUTCString(), parseFloat((sstatistics.mean(airStats.AQI)).toFixed(3)), 
            parseFloat((sstatistics.mean(airStats.PM2_5)).toFixed(3)), parseFloat((sstatistics.mean(airStats.PM10)).toFixed(3)), 
            parseFloat((sstatistics.mean(airStats.temperature)).toFixed(3)), parseFloat((sstatistics.mean(airStats.pressure)).toFixed(3)),
            parseFloat((sstatistics.mean(airStats.humidity)).toFixed(3)), airStats.stations));

            citiesInserted++;
        }
        console.log("Stations inserted: " + stationsInserted);
        console.log("Cities inserted: " + citiesInserted);
        stationsInserted = 0;
        citiesInserted = 0;
    });
    
}

module.exports.getCitiesInfo = getCitiesInfo;