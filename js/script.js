//полифил для IE на includes
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        'use strict';
        if (typeof start !== 'number') {
            start = 0;
        }

        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

var APPID = "5d2d6947";
var APPKEY = "c0c6382f945944d5c49ad43431e78994";
var airportCode = "JFK"; // John F Kennedy NY USA
var now = new Date();

var currentFlights = [];
var currentType;
// api data & functions
var apiLink = 'https://holysale.ru/api.php';

var arrivalLink = "https://api.flightstats.com/flex/flightstatus/rest/v2/json/airport/status/" +
    airportCode +
    "/arr/" +
    now.getFullYear() +
    "/" + (now.getMonth() + 1) +
    "/" + now.getDate() +
    "/" + now.getHours() +
    "?appId=" + APPID +
    "&appKey=" + APPKEY +
    "&numHours=6";

var departureLink = "https://api.flightstats.com/flex/flightstatus/rest/v2/json/airport/status/" +
    airportCode +
    "/dep/" +
    now.getFullYear() +
    "/" + (now.getMonth() + 1) +
    "/" + now.getDate() +
    "/" + now.getHours() +
    "?appId=" + APPID +
    "&appKey=" + APPKEY +
    "&numHours=6";

var apiCall = function (link) {
    return new Promise(function (resolve, reject) {
        var formData = new FormData();
        formData.append("url", encodeURIComponent(link));

        var xhr = new XMLHttpRequest();
        xhr.open("POST", apiLink, true);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };

        xhr.send(formData);
    })

};
var getArrivals = function () {
    return apiCall(arrivalLink);
};
var getDepartures = function () {
    return apiCall(departureLink);
};

var statuses = {
    "A": "В полете",
    "C": "Отменен",
    "D": "Смена пункта назначения",
    "DN":"Нет информации",
    "L": "Совершил посадку",
    "NO":"Не функционирует",
    "R": "Регистрация",
    "S": "Запланирован",
    "U": "Неизвестный"
};

var compareByDepartureTime = function(a, b) {
    return a.departureTime - b.departureTime;
};

var compareByArrivalTime = function(a, b) {
    return a.arrivalTime - b.arrivalTime;
};

var parseFlights = function(flights) {
    var parsedFlights = [];
    var mappedAirports = {};
    for(var i = 0; i < flights.appendix.airports.length; i++) {
        var airport = flights.appendix.airports[i];
        // вставить в объект mappedAirports i-ый аеропорт с ключем, равным его полю fs
        mappedAirports[airport.fs]= airport;
    }
    for(var i=0; i<flights.flightStatuses.length; i++) {
        var currentRace = flights.flightStatuses[i];
        if (!currentRace.airportResources) {
            currentRace.airportResources = {};
        }
        var flight = {
            departureTime: new Date(currentRace.departureDate.dateLocal),
            arrivalTime: new Date(currentRace.arrivalDate.dateLocal),
            delays: currentRace.delays,
            arrivalCity: mappedAirports[currentRace.arrivalAirportFsCode].city,
            departureCity: mappedAirports[currentRace.departureAirportFsCode].city,
            race: currentRace.carrierFsCode +" " + currentRace.flightNumber,
            terminal: currentRace.airportResources.arrivalTerminal || '1',
            status: statuses[currentRace.status]
        };
        parsedFlights.push(flight);
    }
    return parsedFlights;
};

var addMinutes = function(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
};

var drawLine = function(flight, type) {
    var html = "<tr class=\"main__row\">";

    html += "<td class=\"main__time\">";
        if( type == 'departure') {
            if(typeof flight.delays==="object" &&
                (flight.delays.hasOwnProperty('departureGateDelayMinutes') || flight.delays.hasOwnProperty('departureRunwayDelayMinutes') )) {
                html += "<span class='main__time--delayed'>" + ("0" + flight.departureTime.getHours()).slice(-2) + ":" +("0" + flight.departureTime.getMinutes()).slice(-2) + "</span>";
                var realDepartureTime = addMinutes(flight.departureTime, flight.delays.departureGateDelayMinutes || flight.delays.departureRunwayDelayMinutes );
                html += "<br>";
                html += ("0" + realDepartureTime.getHours()).slice(-2) + ":" +("0" + realDepartureTime.getMinutes()).slice(-2);
            } else {
                html += ("0" + flight.departureTime.getHours()).slice(-2) + ":" +("0" + flight.departureTime.getMinutes()).slice(-2);
            }
        } else {
            if(typeof flight.delays==="object" &&
                (flight.delays.hasOwnProperty('arrivalGateDelayMinutes') || flight.delays.hasOwnProperty('arrivalRunwayDelayMinutes'))) {
                html += "<span class='main__time--delayed'>" + ("0" + flight.arrivalTime.getHours()).slice(-2) + ":" +("0" + flight.arrivalTime.getMinutes()).slice(-2) + "</span>";
                var realArrivalTime = addMinutes(flight.arrivalTime, flight.delays.arrivalGateDelayMinutes || flight.delays.arrivalRunwayDelayMinutes);
                html += "<br>";
                html += ("0" + realArrivalTime.getHours()).slice(-2) + ":" +("0" + realArrivalTime.getMinutes()).slice(-2);
            } else {
                html += ("0" + flight.arrivalTime.getHours()).slice(-2) + ":" +("0" + flight.arrivalTime.getMinutes()).slice(-2);
            }
        }
    html += "</td>";

    html += "<td class=\"main__place\">";
    html += flight.departureCity+ "->" + flight.arrivalCity;
    html += "</td>";

    html += "<td class=\"main__flight\">";
    html += flight.race;
    html += "</td>";

    html += "<td class=\"main__terminal\">";
    html += flight.terminal;
    html += "</td>";

    html += "<td class=\"main__status\">";
    html += flight.status;
    html += "</td>";

    html += "</tr>";
    return html;
};

var getAndDrawDepartures = function() {
    var  tableBody = document.querySelector('.main__body');
    tableBody.innerHTML = '';
    document.querySelector('.main__preloader').style.display = "flex";
    getDepartures().then(
        function (departures) {
            // распарсить
            currentFlights = JSON.parse(departures);
            currentType = "departure";
            currentFlights = parseFlights(currentFlights);
            currentFlights.sort(compareByDepartureTime);
            // сгенерировать хтмл
            var tableHtml = '';
            if (currentFlights.length) {
                for (var i = 0; i < currentFlights.length; i++) {
                    tableHtml+= drawLine(currentFlights[i], currentType);
                }
            }  else {
                tableHtml = '<tr><td>Ничего не найдено</td></tr>';
            }
            // вставить в таблицу
            tableBody.innerHTML = tableHtml;
        }
    ).finally(function ()  {
        document.querySelector('.main__preloader').style.display = "none";
    });
};

var getAndDrawArrivals = function() {
    var  tableBody = document.querySelector('.main__body');
    tableBody.innerHTML = '';
    document.querySelector('.main__preloader').style.display = "flex";
    getArrivals().then(
        function (arrivals) {
            // распарсить
            currentFlights = JSON.parse(arrivals);
            currentType = "arrival";
            currentFlights = parseFlights(currentFlights);
            currentFlights.sort(compareByArrivalTime);
            console.log(currentFlights);
            // сгенерировать хтмл
            var tableHtml = '';
            if (currentFlights.length) {
                for (var i = 0; i < currentFlights.length; i++) {
                    tableHtml+= drawLine(currentFlights[i], currentType);
                }
            }  else {
                tableHtml = '<tr><td>Ничего не найдено</td></tr>';
            }
            // вставить в таблицу
            tableBody.innerHTML = tableHtml;
        }
    ).finally(function ()  {
        document.querySelector('.main__preloader').style.display = "none";
    });
};

var searchByRace = function(string) {
    var searchOnFlights;
    if(delayCheckbox.checked) {
        searchOnFlights = searchOnlyDelayed();
    } else {
        searchOnFlights = currentFlights;
    }
    var matchedFlights = [];
    string = string.toString().toLowerCase();
    for(var i=0; i<searchOnFlights.length; i++) {
        if(searchOnFlights[i].race.toLowerCase().includes(string)) {
            matchedFlights.push(searchOnFlights[i]);
        }
    }
    return matchedFlights;
};

var searchOnlyDelayed = function () {
    var delayedFlights = [];
    for(var i=0; i<currentFlights.length; i++) {
        var flight = currentFlights[i];
        if(currentType === 'departure') {
            if (typeof flight.delays === "object" && (flight.delays.hasOwnProperty('departureGateDelayMinutes') || flight.delays.hasOwnProperty('departureRunwayDelayMinutes'))) {
                delayedFlights.push(flight);
            }
        } else {
            if(typeof flight.delays==="object" &&
                (flight.delays.hasOwnProperty('arrivalGateDelayMinutes') || flight.delays.hasOwnProperty('arrivalRunwayDelayMinutes'))) {
                delayedFlights.push(flight);
            }
        }
    }
    return delayedFlights;
};

getAndDrawDepartures(); // initially draw departures
