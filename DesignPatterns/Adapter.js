/*

Exercise: Adapter — Weather Service

Your app is written against a clean Target interface. You need to plug in a legacy third-party SDK that has a totally different shape — and you can't modify either side.

Target (what your app expects):
WeatherService.getForecast(city) → { tempC, condition }
- getForecast(cityName) returns an object with tempC (temperature in Celsius, a number) and condition (a string like "sunny").
- Base class throws if not implemented.

A modern implementation (already matches the Target):
- ModernWeatherService extends WeatherService — its getForecast(city) just returns something like { tempC: 22, condition: "cloudy" }. (This exists so you can prove the adapter is interchangeable with a native impl.)

Adaptee (legacy SDK you CANNOT change):
class LegacyWeatherSDK {
  // different method name, needs a numeric city ID, returns Fahrenheit + different keys
  fetch_weather(cityId) {
    // pretend it looks up by id; return e.g.:
    return { temp_fahrenheit: 71.6, sky: "sunny" };
  }
}

Adapter — LegacyWeatherAdapter extends WeatherService:
Wrap a LegacyWeatherSDK instance and make it conform to the Target. It must translate all three:
1. Method name: getForecast → fetch_weather
2. Arguments: city name → city id (keep a small { "London": 1, "Tokyo": 2 } lookup; if the city isn't known, guard — throw or return null, your "censor board")
3. Return shape + units: { temp_fahrenheit, sky } → { tempC, condition }, converting F → C ((f - 32) * 5/9, round it)

Client (from the start):
- A printForecast(service, city) function that takes any WeatherService and prints the forecast — proving it can't tell modern from adapted.
- Call it with a ModernWeatherService and a LegacyWeatherAdapter(new LegacyWeatherSDK()) for the same city — identical-looking output.
- One call with an unknown city to prove your guard fires.

Grading focus:
- Adapter implements the Target (getForecast) and wraps the Adaptee via composition.
- All three translations present (name, args/city→id, return shape + F→C).
- Client depends only on the Target — printForecast never mentions LegacyWeatherSDK or fetch_weather.
- The guard handles the unknown city gracefully.


*/


city_data_fahrenite = {
    1 : {"temp_fahrenheit": 95,"sky":"windy"},
    2 : {"temp_fahrenheit": 104,"sky":"sunny"},
    3 : {"temp_fahrenheit": 77,"sky":"cloudy"},
}

city_data = {
    1 : {"tempC": 35,"condition":"windy"},
    2 : {"tempC": 40,"condition":"sunny"},
    3 : {"tempC": 25,"condition":"cloudy"},
};

cities_ids = {"ratlam":1,"indore":2,"banglore":3};

class WeatherService {
    getForecast(city){
        throw Error("method not implemented");
    }
}

class ModernWeatherService extends WeatherService {
    getForecast(city){
        return city_data[cities_ids[city]];
    }
}

class LegacyWeatherSDK {
    fetch_weather(cityId) {
        return city_data_fahrenite[cityId];
    }
}

class LegacyWeatherAdapter extends WeatherService {
    #weather_service = null;
    constructor(weather_service){
        super();
        this.#weather_service = weather_service;
    }
    _fahrenit_to_celsius(tempF){
        return (((tempF-32)*5)/9);
    }
    getForecast(city){
        if(!(city in cities_ids)){
            throw Error("unknown city")
        }
        const cityId = cities_ids[city];

        const weather_cond =  this.#weather_service.fetch_weather(cityId);
        const tempC = this._fahrenit_to_celsius(weather_cond.temp_fahrenheit);
        const condition = weather_cond.sky;
        return {"tempC": tempC,"condition":condition};
    }
}

//---------------client-------------------------

const new_weather_service = new ModernWeatherService();
const old_weather_service = new LegacyWeatherAdapter(new LegacyWeatherSDK());

console.log(`ratlam temp is ${new_weather_service.getForecast("ratlam").tempC}`);
console.log(`indore temp is ${new_weather_service.getForecast("indore").tempC}`);
console.log(`banglore temp is ${new_weather_service.getForecast("banglore").tempC}`);


console.log(`ratlam tempC is ${old_weather_service.getForecast("ratlam").tempC}`);
console.log(`indore tempC is ${old_weather_service.getForecast("indore").tempC}`);
console.log(`banglore tempC is ${old_weather_service.getForecast("banglore").tempC}`);


console.log(`ratlam condition is ${old_weather_service.getForecast("ratlam").condition}`);
console.log(`indore condition is ${old_weather_service.getForecast("indore").condition}`);
console.log(`banglore condition is ${old_weather_service.getForecast("banglore").condition}`);