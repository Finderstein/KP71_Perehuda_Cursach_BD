class SStation
{
    constructor(cityName, name, date, AQI, PM2_5, PM10, temperature, pressure, humidity)
    {
        this.cityName = cityName;
        this.name = name;
        this.date = date;
        this.AQI = AQI;
        this.PM2_5 = PM2_5;
        this.PM10 = PM10;
        this.temperature = temperature;
        this.pressure = pressure;
        this.humidity = humidity;
    }
}
module.exports = SStation;