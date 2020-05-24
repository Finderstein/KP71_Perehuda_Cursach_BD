const express = require('express');
const mustache = require('mustache-express');
const path = require('path');
const child_process = require('child_process');
const bodyParser = require('body-parser');
const busboyBodyParser = require('busboy-body-parser');
const mongoose = require('mongoose');
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

const dbUpdate = require('./update_db');

setInterval(dbUpdate.getCitiesInfo, 120000);

app.get('/backup', function(req, res)
{
    const pathToSave = path.join(__dirname, `./backup`);
    const command = `mongodump --host localhost --port 27017 --forceTableScan --db mydb --out ${pathToSave} `;
    child_process.exec(command);
    res.redirect('/?result=operation+successful');
});

app.get('/restore', function(req, res)
{
    const pathToRestore = path.join(__dirname, `./backup`);
    const command = `mongorestore ${pathToRestore} `;
    child_process.exec(command);
    res.redirect('/?result=operation+successful');
});

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