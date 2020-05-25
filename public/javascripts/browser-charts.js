import * as ss from "https://unpkg.com/simple-statistics@7.1.0/index.js?module"

async function loadAndProcessData()
{
    const airStatsArray = await fetch("/stations")
    .then((response) => {
        return response.json();
    })
    .then(stations =>
    {
        let stationsArray = [];
        stations.map(value => stationsArray.push(value.stations));
        stationsArray = stationsArray.flat();

        let aqi_number = { aqi0_50: [], aqi51_100: [], aqi101_150: [], aqi151_200: [], aqi201_300: [], aqi_300: [] };
        let pm2_5_number = { aqi0_50: [], aqi51_100: [], aqi101_150: [], aqi151_200: [], aqi201_300: [], aqi_300: [] };
        let pm10_number = { aqi0_50: [], aqi51_100: [], aqi101_150: [], aqi151_200: [], aqi201_300: [], aqi_300: [] };

        let airStatsArray = { AQI: [], PM2_5: [], PM10: [], temperature: [], humidity: [], pressure: [], 
            aqi_number: aqi_number, pm2_5_number: pm2_5_number, pm10_number: pm10_number}
        for(let i = 0; i < stationsArray.length; i++)
        {
            let station = stationsArray[i];
            airStatsArray.AQI.push(station.AQI);
            airStatsArray.PM2_5.push(station.PM2_5);
            airStatsArray.PM10.push(station.PM10);
            airStatsArray.temperature.push(station.temperature);
            airStatsArray.humidity.push(station.humidity);
            airStatsArray.pressure.push(station.pressure);

            if(station.AQI >= 0 && station.AQI <= 50)
                airStatsArray.aqi_number.aqi0_50.push(station);
            else if(station.AQI >= 51 && stationsArray[i].AQI <= 100)
                airStatsArray.aqi_number.aqi51_100.push(station);
            else if(station.AQI >= 101 && station.AQI <= 150)
                airStatsArray.aqi_number.aqi101_150.push(station);
            else if(station.AQI >= 151 && station.AQI <= 200)
                airStatsArray.aqi_number.aqi151_200.push(station);
            else if(station.AQI >= 201 && station.AQI <= 300)
                airStatsArray.aqi_number.aqi201_300.push(station);
            else if(station.AQI >= 301)
                airStatsArray.aqi_number.aqi_300.push(station);

            if(station.PM2_5 >= 0 && station.PM2_5 <= 50)
                airStatsArray.pm2_5_number.aqi0_50.push(station);
            else if(station.PM2_5 >= 51 && stationsArray[i].PM2_5 <= 100)
                airStatsArray.pm2_5_number.aqi51_100.push(station);
            else if(station.PM2_5 >= 101 && station.PM2_5 <= 150)
                airStatsArray.pm2_5_number.aqi101_150.push(station);
            else if(station.PM2_5 >= 151 && station.PM2_5 <= 200)
                airStatsArray.pm2_5_number.aqi151_200.push(station);
            else if(station.PM2_5 >= 201 && station.PM2_5 <= 300)
                airStatsArray.pm2_5_number.aqi201_300.push(station);
            else if(station.PM2_5 >= 301)
                airStatsArray.pm2_5_number.aqi_300.push(station);

            if(station.PM10 >= 0 && station.PM10 <= 50)
                airStatsArray.pm10_number.aqi0_50.push(station);
            else if(station.PM10 >= 51 && station.PM10 <= 100)
                airStatsArray.pm10_number.aqi51_100.push(station);
            else if(station.PM10 >= 101 && station.PM10 <= 150)
                airStatsArray.pm10_number.aqi101_150.push(station);
            else if(station.PM10 >= 151 && station.PM10 <= 200)
                airStatsArray.pm10_number.aqi151_200.push(station);
            else if(station.PM10 >= 201 && station.PM10 <= 300)
                airStatsArray.pm10_number.aqi201_300.push(station);
            else if(station.PM10 >= 301)
                airStatsArray.pm10_number.aqi_300.push(station);
        }

        return airStatsArray;
    });

    return airStatsArray;
}

function loadFirstRow()
{
    loadAndProcessData()
    .then(airStatsArray =>
    {
        var ctx1 = document.getElementById('myChart1').getContext('2d');
        
        let data = {
            labels: ['0-50', '51-100', '101-150', '151-200', '201-300', '>300'],
            datasets: [
            {
                label: 'AQI',
                data: [airStatsArray.aqi_number.aqi0_50.length, airStatsArray.aqi_number.aqi51_100.length, airStatsArray.aqi_number.aqi101_150.length, 
                    airStatsArray.aqi_number.aqi151_200.length, airStatsArray.aqi_number.aqi201_300.length, airStatsArray.aqi_number.aqi_300.length ],
                backgroundColor: 'rgb(204, 0, 0)',
                borderColor: 'rgb(153, 0, 0)',
                borderWidth: 1
            },
            {
                label: 'PM2.5',
                data: [airStatsArray.pm2_5_number.aqi0_50.length, airStatsArray.pm2_5_number.aqi51_100.length, airStatsArray.pm2_5_number.aqi101_150.length, 
                    airStatsArray.pm2_5_number.aqi151_200.length, airStatsArray.pm2_5_number.aqi201_300.length, airStatsArray.pm2_5_number.aqi_300.length ],
                backgroundColor: 'rgb(0, 204, 0)',
                borderColor: 'rgb(0, 153, 0)',
                borderWidth: 1
            },
            {
                label: 'PM10',
                data: [airStatsArray.pm10_number.aqi0_50.length, airStatsArray.pm10_number.aqi51_100.length, airStatsArray.pm10_number.aqi101_150.length, 
                    airStatsArray.pm10_number.aqi151_200.length, airStatsArray.pm10_number.aqi201_300.length, airStatsArray.pm10_number.aqi_300.length ],
                backgroundColor: 'rgb(0, 102, 204)',
                borderColor: 'rgb(0, 76, 153)',
                borderWidth: 1
            }]
        };
        let options = {
            responsive: true,
            title: {
                display: true,
                text: 'Air Quality Index count'
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'AQI ranges'
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        };

        new Chart(ctx1, {
            type: 'bar',
            data: data,
            options, options
        });

        var circle1 = document.getElementById('circle1');
        circle1.innerHTML = "Corelation<br>AQI : PM2.5<br>" + (ss.sampleCorrelation(airStatsArray.AQI, airStatsArray.PM2_5)*100).toFixed(1)
        var circle2 = document.getElementById('circle2');
        circle2.innerHTML = "Corelation<br>AQI : PM10<br>" + (ss.sampleCorrelation(airStatsArray.AQI, airStatsArray.PM10)*100).toFixed(1)
    });
}

function loadSecondChart()
{
    loadAndProcessData()
    .then(airStatsArray =>
    {
        let temperatureArray = { aqi0_50: [], aqi51_100: [], aqi101_150: [], aqi151_200: [], aqi201_300: [], aqi_300: [] };
        let humidityArray = { aqi0_50: [], aqi51_100: [], aqi101_150: [], aqi151_200: [], aqi201_300: [], aqi_300: [] };

        for (let key in airStatsArray.aqi_number) if (airStatsArray.aqi_number.hasOwnProperty(key))
        {
            airStatsArray.aqi_number[key].map(value => 
            {
                temperatureArray[key].push(value.temperature);
                humidityArray[key].push(value.humidity);
            });
        }

        for (let key in temperatureArray) if (temperatureArray.hasOwnProperty(key))
        {
            if(temperatureArray[key].length === 0) temperatureArray[key].push(0);
        }

        for (let key in humidityArray) if (humidityArray.hasOwnProperty(key))
        {
            if(humidityArray[key].length === 0) humidityArray[key].push(0);
        }

		var chartData = {
            labels: ['0-50', '51-100', '101-150', '151-200', '201-300', '>300'],
			datasets: [
            {
				type: 'line',
				fill: false,
                label: 'AQI count',
                data: [airStatsArray.aqi_number.aqi0_50.length, airStatsArray.aqi_number.aqi51_100.length, airStatsArray.aqi_number.aqi101_150.length, 
                    airStatsArray.aqi_number.aqi151_200.length, airStatsArray.aqi_number.aqi201_300.length, airStatsArray.aqi_number.aqi_300.length ],
                backgroundColor: 'rgb(128, 255, 0)',
                borderColor: 'rgb(102, 204, 0)',
                borderWidth: 1
            },
            {
				type: 'bar',
                label: 'Temperature',
                data: [ss.mean(temperatureArray.aqi0_50),ss.mean(temperatureArray.aqi51_100), ss.mean(temperatureArray.aqi101_150), 
                    ss.mean(temperatureArray.aqi151_200), ss.mean(temperatureArray.aqi201_300), ss.mean(temperatureArray.aqi_300)],
                backgroundColor: 'rgb(255, 153, 153)',
                borderColor: 'rgb(255, 102, 102)',
                borderWidth: 1
            },
            {
				type: 'bar',
                label: 'Humidity',
                data: [ss.mean(humidityArray.aqi0_50),ss.mean(humidityArray.aqi51_100), ss.mean(humidityArray.aqi101_150), 
                    ss.mean(humidityArray.aqi151_200), ss.mean(humidityArray.aqi201_300), ss.mean(humidityArray.aqi_300)],
                backgroundColor: 'rgb(51, 153, 255)',
                borderColor: 'rgb(0, 128, 153)',
                borderWidth: 1
			}]

        };
        
        var ctx = document.getElementById('myChart2').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Humidity and Temperature with different AQI'
                },
                tooltips: {
                    mode: 'index',
                    intersect: true
                },
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'AQI ranges'
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
    });
}

function loadThirdChart()
{
    loadAndProcessData()
    .then(airStatsArray =>
    {
        let dots = [];

        for (let i = 0; i < airStatsArray.pressure.length && i < airStatsArray.temperature.length; i++)
        {
            dots.push({ x: airStatsArray.temperature[i], y: airStatsArray.humidity[i] });
        }

        var scatterChartData = {
			datasets: [{
				label: 'x: temperature, y: humidity',
                backgroundColor: 'rgb(255, 153, 153)',
                borderColor: 'rgb(255, 102, 102)',
                borderWidth: 1,
				data: dots
			}]
		};

        var ctx = document.getElementById('myChart3').getContext('2d');
        Chart.Scatter(ctx, {
            data: scatterChartData,
            options: {
                title: {
                    display: true,
                    text: 'Temperature - Humidity'
                },
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Temperature'
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Humidity'
                        }
                    }]
                }
            }
        });
    });
}

function loadFourthChart()
{
    loadAndProcessData()
    .then(airStatsArray =>
    {
        let dots = [];

        let linearRegression = ss.linearRegression([airStatsArray.humidity, airStatsArray.temperature]);

        for (let x = 0; x <= 50; x += 5)
        {
            dots.push( linearRegression.m * x + linearRegression.b );
        }

        var scatterChartData = {
            labels: ['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50'],
			datasets: [{
				label: 'Linear regression',
                backgroundColor: 'rgb(255, 153, 153)',
                borderColor: 'rgb(255, 102, 102)',
                borderWidth: 1,
				data: dots
			}]
		};

        var ctx = document.getElementById('myChart4').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: scatterChartData,
            options: {
                title: {
                    display: true,
                    text: 'Temperature - Humidity'
                },
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Temperature'
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Humidity'
                        }
                    }]
                }
            }
        });
    });
}

function loadSecondRow()
{
    loadSecondChart();
    loadThirdChart();
}

function loadThirdRow()
{
    loadFourthChart();
}

function loadCharts()
{
    loadFirstRow();
    loadSecondRow();
    loadThirdRow();
}

window.addEventListener('load', async (le) => loadCharts());