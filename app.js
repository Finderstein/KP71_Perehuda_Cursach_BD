const express = require('express');
const mustache = require('mustache-express');
const path = require('path');
const bodyParser = require('body-parser');
const busboyBodyParser = require('busboy-body-parser');
const mongoose = require('mongoose');
const fetch = require("node-fetch");
const sstatistics = require("simple-statistics")

const app = express();

const config = require('./config');

const cookieParser = require('cookie-parser');
const session = require('express-session');

const City = require("./models/city.js");
const Sstation = require("./models/sstation");

const viewsDir = path.join(__dirname, 'views');
app.engine("mst", mustache(path.join(viewsDir, "partials")));
app.set('views', viewsDir);
app.set('view engine', 'mst');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(busboyBodyParser({ limit: '5mb' }));

app.use(express.static('public'));

// new middleware
app.use(cookieParser());
app.use(session({
	secret: config.SecretString,
	resave: false,
	saveUninitialized: true
}));

const PORT = config.ServerPort;
const databaseUrl = config.DatabaseUrl;
const connectOptions = { useNewUrlParser: true};

mongoose.connect(databaseUrl, connectOptions)
    .then(() => console.log(`Database connected: ${databaseUrl}`))
    .then(() => app.listen(PORT, function() { console.log('Server is ready'); }))
    .catch(err => console.log(`Start error ${err}`));

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

let stationsInserted = 0;
let citiesInserted = 0;

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

setInterval(function getCitiesInfo ()
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
    
}, 60000);

// usage
app.get('/', function(req, res)
{
    res.render('index', {});
});

app.get('/cities', function(req, res)
{
    City.getSomething("-stations -temperature -pressure -humidity")
    .then(cities =>
    {
        cities.sort(function(a, b) {
            return ('' + a.name).localeCompare(b.name);
        });

        let idx = 1;
        res.render('cities', { cities, "index": function() {return idx++;} });
    })
    .catch(err => res.status(500).send(err.toString()));
});

app.get('/charts', function(req, res)
{
    City.getSomething("stations -_id")
    .then(stations => 
    {
        let stationsArray = [];
        stations.map(value => stationsArray.push(value.stations));
        stationsArray = [].concat.apply([], stationsArray);

        let airStatsArray = { AQI: [], PM2_5: [], PM10: [], temperature: [], humidity: [], pressure: [] };
        for(let i = 0; i < stationsArray.length; i++)
        {
            let station = stationsArray[i];
            airStatsArray.AQI.push(station.AQI);
            airStatsArray.PM2_5.push(station.PM2_5);
            airStatsArray.PM10.push(station.PM10);
            airStatsArray.temperature.push(station.temperature);
            airStatsArray.humidity.push(station.humidity);
            airStatsArray.pressure.push(station.pressure);
        }

        let mode = { temperature: sstatistics.mode(airStatsArray.temperature).toFixed(3), humidity: sstatistics.mode(airStatsArray.humidity).toFixed(3), 
            pressure: sstatistics.mode(airStatsArray.pressure).toFixed(3), AQI: sstatistics.mode(airStatsArray.AQI).toFixed(3), 
            PM2_5: sstatistics.mode(airStatsArray.PM2_5).toFixed(3), PM10: sstatistics.mode(airStatsArray.PM10).toFixed(3) };
        let median = { temperature: sstatistics.median(airStatsArray.temperature).toFixed(3), humidity: sstatistics.median(airStatsArray.humidity).toFixed(3), 
            pressure: sstatistics.median(airStatsArray.pressure).toFixed(3), AQI: sstatistics.median(airStatsArray.AQI).toFixed(3), 
            PM2_5: sstatistics.median(airStatsArray.PM2_5).toFixed(3), PM10: sstatistics.median(airStatsArray.PM10).toFixed(3) };
        let idx = 1;
        res.render('charts', {mode, median, "index": function() {return idx++;}});
    });

});

app.get('/clear', function(req, res)
{
    City.clearCities().then(() =>{res.redirect('/');});
});

app.get('/aqi', function(req, res)
{
    City.getSomething("AQI name -_id").then(aqi =>{aqi.map(value => {console.log(value);}); console.log(aqi); res.redirect('/');});
});

app.get('/stations', function(req, res)
{
    City.getSomething("stations -_id")
    .then(stations => 
    {
        res.send(stations);
    });
});

app.use(function(req, res)
{
    res.render('404', {});
});