var departureButton = document.querySelector('.main__departures');
var arrivalButton = document.querySelector('.main__arrivals');
var searchField = document.querySelector('.main__search');
var delayCheckbox = document.querySelector('.main__filter-input');
var form = document.querySelector('.main__form');

form.addEventListener('submit', function(evt){
    evt.preventDefault();
    return false;
});

arrivalButton.addEventListener('click', function(){
    if(departureButton.classList.contains("main__button--active")) {
        searchField.value = '';
        delayCheckbox.checked = false;
        departureButton.classList.remove('main__button--active');
        arrivalButton.classList.add('main__button--active');
        // получить arrivals
        getAndDrawArrivals();
    }
});

departureButton.addEventListener('click', function(){
    if(arrivalButton.classList.contains("main__button--active")) {
        searchField.value = '';
        delayCheckbox.checked = false;
        arrivalButton.classList.remove('main__button--active');
        departureButton.classList.add('main__button--active');
        // получить departures
        getAndDrawDepartures();

    }
});

searchField.addEventListener('input', function(evt){

    var  tableBody = document.querySelector('.main__body');
    tableBody.innerHTML = '';
    var foundFlights = searchByRace(evt.target.value);
    var tableHtml = '';
    if (foundFlights.length) {
        for (var i = 0; i < foundFlights.length; i++) {
            tableHtml+= drawLine(foundFlights[i], currentType);
        }
    }  else {
        tableHtml = '<tr><td>Ничего не найдено</td></tr>';
    }
    // вставить в таблицу
    tableBody.innerHTML = tableHtml;

});

delayCheckbox.addEventListener('change', function (evt) {
    searchField.value = '';
    var tableBody = document.querySelector('.main__body');
    tableBody.innerHTML = '';
    var tableHtml = '';
    var foundFlights;
    if (evt.target.checked) {
        foundFlights = searchOnlyDelayed();
    } else {
        foundFlights = currentFlights;
    }
    if (foundFlights.length) {
        for (var i = 0; i < foundFlights.length; i++) {
            tableHtml += drawLine(foundFlights[i], currentType);
        }
    } else {
        tableHtml = '<tr><td>Ничего не найдено</td></tr>';
    }
    // вставить в таблицу
    tableBody.innerHTML = tableHtml;
});