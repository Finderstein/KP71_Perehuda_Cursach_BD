const mongoose = require('mongoose');

const StationShema = new mongoose.Schema({
    cityName: { type: String, required: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    AQI: { type: String, required: true },
    PM2_5: { type: String, required: true },
    PM10: { type: String, required: true },
    temperature: { type: String, required: true },
    pressure: { type: String, required: true },
    humidity: { type: String, required: true },
});


//const CityModel = mongoose.model('cursach_bd', CityShema, 'cursach_bd');
const StationModel = mongoose.model('mlab_cursach_bd_station', StationShema);

class Station
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

    static getById(id)
    {
        return StationModel.findById({ _id: id});
    }

    static getByName(name)
    {
        return StationModel.findOne({ name: name});
    }
    
    static getAll()
    {
        return StationModel.find();
    }

    static insert(station)
    {
        return new StationModel(station).save();
    }

    static findByDate(date)
    {
        return StationModel.find({ date: date });
    }

    static findByAQI(aqi)
    {
        return StationModel.find({ AQI: { $gt: aqi } });
    }

    static clearStations()
    {
        return StationModel.deleteMany({});
    }
}

module.exports = Station;