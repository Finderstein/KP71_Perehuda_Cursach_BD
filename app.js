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

const City = require("./models/city");

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

// usage
app.get('/', function(req, res)
{
    res.render('index', {});
});

app.get('/about', function(req, res)
{
    res.render('about', {});
});

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
        
        let mst_cities = [];
        for (let key in cities_info) if (cities_info.hasOwnProperty(key))
        {
            let AQI = 0;
            let AQI_number = 0;
            let PM2_5 = 0;
            let PM2_5_number = 0;
            let PM10 = 0;
            let PM10_number = 0;
            let date;
            let temperature = 0;
            let temperature_number = 0;
            let humidity = 0;
            let humidity_number = 0;
            let pressure = 0;
            let pressure_number = 0;

            let validInfo = false;

            let citiesArray = cities_info[key];
            for(let i = 0; i < citiesArray.length; i++)
            {

                let city = citiesArray[i];
                let pollutants = city.pollutants;
                let validNumberOfPollutants = 0;
                for(let j = 0; j < pollutants.length; j++)
                {
                    let pollutant_info = pollutants[j];
                    
                    let pollutant_date = pollutant_info.time;
                    if(date === undefined || date < pollutant_date) date = pollutant_date;
                    
                    let value = pollutant_info.value;
                    if(value === null)
                    {
                        console.log("!!!Pollutant value \""  + pollutant_info.pol + "\" of station \"" + city.stationName + "\" is null: ");
                        continue;
                    }

                    switch (pollutant_info.pol)
                    {
                        case "PM2.5":
                            PM2_5 += value;
                            ++PM2_5_number;
                            ++validNumberOfPollutants;
                            break;

                        case "Temperature":
                            temperature += value;
                            ++temperature_number;
                            ++validNumberOfPollutants;
                            break;

                        case "Humidity":
                            humidity += value;
                            ++humidity_number;
                            ++validNumberOfPollutants;
                            break;

                        case "Pressure":
                            pressure += value;
                            ++pressure_number;
                            ++validNumberOfPollutants;
                            break;

                        case "PM10":
                            PM10 += value;
                            ++PM10_number;
                            ++validNumberOfPollutants;
                            break;
                        
                        case "Air Quality Index":
                            AQI += value;
                            ++AQI_number;
                            ++validNumberOfPollutants;
                            break;

                        default:
                            break;
                    }
                }

                if(validNumberOfPollutants != 6) 
                {
                    console.log("!!!Invalid number of air variables in station: " + city.stationName);
                    continue;
                }
                else
                    validInfo = true;
            }

            if(!validInfo) 
            {
                console.log("!!!Invalid number of air variables in city: " + key);
                continue;
            }

            const city = new City(key, new Date(date).toUTCString(), parseFloat((AQI/AQI_number).toFixed(3)), parseFloat((PM2_5/PM2_5_number).toFixed(3)),
                parseFloat((PM10/PM10_number).toFixed(3)), parseFloat((temperature/temperature_number).toFixed(3)), parseFloat((pressure/pressure_number).toFixed(3)),
                parseFloat((humidity/humidity_number).toFixed(3)))

            mst_cities.push(city);

            City.insert(city);
        }
    });
    
}, 15000);

app.get('/cities', function(req, res)
{
    City.getAll()
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

app.get('/clear', function(req, res)
{
    City.clearCities().then(() =>{res.redirect('/');});
});

app.use(function(req, res)
{
    res.render('404', {});
});