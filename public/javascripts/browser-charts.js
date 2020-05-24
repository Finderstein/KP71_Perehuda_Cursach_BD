//import * as ss from "https://unpkg.com/simple-statistics@7.1.0/index.js?module"

const City = require("../models/city");

window.addEventListener('load', async (le) => {
    City.getAll()
    .then(cities =>
    {
        let pm2_5, pm10 = [];
        for(let i = 0; i < cities.length; i++)
        {
            pm2_5.push(cities[i].PM2_5);
            pm10.push(cities[i].PM10);
        }

        var ctx1 = document.getElementById('myChart1').getContext('2d');
        var ctx2 = document.getElementById('myChart2').getContext('2d');
        
        let data = {
            labels: ['0-50', '51-100', '101-150', '151-200', '201-300', '>300'],
            datasets: [{
                label: 'PM2',
                data: pm2_5,
                backgroundColor: 'rgb(0, 204, 0)',
                borderColor: 'rgb(0, 153, 0)',
                borderWidth: 1
            },
            {
                label: 'PM10',
                data: pm10,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };
        let options = {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        };
        var myChart1 = new Chart(ctx1, {
            type: 'bar',
            data: data,
            options, options
        });
        var myChart2 = new Chart(ctx2, {
            type: 'bar',
            data: data,
            options, options
        });
    });
});