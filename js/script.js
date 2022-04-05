"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

////////////////////////////////////////
/////////////////////////////////////
//////////////////////////////////
///////////////////////////////
////////////////////////////

class Workout {
  id = Math.floor(Math.random() * 10000) - 1;
  date = new Date();
  coords;
  distance;
  duration;
  constructor(coords, distance, duration) {
    this.coords = coords; // [latitude , lngitude]
    this.distance = distance; // KM
    this.duration = duration; // MIN
  }

  _getMonthDay() {
    // use this comment to ignore prettier to change this code here
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[this.date.getMonth()];
    const day = this.date.getDate();
    return [month, day];
  }

  _setDescription() {
    const [month, day] = this._getMonthDay();

    this.description = `${
      this.name[0].toUpperCase() + this.name.slice(1)
    } on ${month} ${day} `;
  }
}

class Running extends Workout {
  name = "running";
  cadence;

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._calcPace();
    this._setDescription();
  }

  _calcPace() {
    this.pace = (this.duration / this.distance).toFixed(1); // MIN/KM
    return this.pace;
  }
}

class Cycling extends Workout {
  name = "cycling";
  elevationGain;

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._calcSpeed();
    this._setDescription();
  }

  _calcSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(1); // KM/H
    return this.speed;
  }
}

////////////////////////////////////////
/////////////////////////////////////
//////////////////////////////////
///////////////////////////////
////////////////////////////

// Application Architecture Class
class App {
  workouts = [];
  #map;
  #mapEvent;

  constructor() {
    // console.log(" Welcome to Mapty App 😃 ");
    // Using Geolocation Api to get user Location  -- Load Map
    this._getPosition();
    // Restore Data from Local Storage Api
    this._getLocalStorage();
    // User Choose type of Workout
    inputType.addEventListener("change", this._toggleElevationField);
    // User submits new workout
    form.addEventListener("submit", this._newWorkout.bind(this));
    // User Clicks on any Workout Card  --Using Event delegation
    containerWorkouts.addEventListener("click", this._goToMarker.bind(this));
  }

  _getPosition() {
    const position = navigator.geolocation.getCurrentPosition(
      (position) => {
        // console.log(`get user Location Successfully ✅`);
        this._loadMap(position);
      },
      () => {
        alert(`Error❌, Can't get your Location `);
      }
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    // console.log(`User Location => ${latitude} : ${longitude}`);
    const userCoords = [latitude, longitude];

    // using leaflet library ( https://leafletjs.com/index.html)
    this.#map = L.map("map").setView(userCoords, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // console.log(`Map Loaded Successfully ✅`);

    // User clicks on the map  --Show Workout Form
    this.#map.on("click", this._showForm.bind(this));

    // render workouts markers from local storage
    this.workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(e) {
    this.#mapEvent = e; // save clicked location coords************
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    // console.log(this.#mapEvent);
    // Using (this.#mapEvent) to get user clicked coords
    const { lat, lng } = this.#mapEvent.latlng;

    // Store data from this form
    const workoutType = inputType.value;
    if (this._validForm(workoutType)) {
      // console.log("👌 Done form is Valid go next 👉");

      let newWorkout;

      if (workoutType === "running") {
        newWorkout = new Running(
          [lat, lng],
          inputDistance.value,
          inputDuration.value,
          inputCadence.value
        );
      }
      if (workoutType === "cycling") {
        newWorkout = new Cycling(
          [lat, lng],
          inputDistance.value,
          inputDuration.value,
          inputElevation.value
        );
      }

      // Add new workout-Object to Workouts-Array
      this.workouts.push(newWorkout);
      // console.log(this.workouts);

      // Render Workout Marker on the Map
      this._renderWorkoutMarker(newWorkout);

      // Render new Workout Card on the List
      this._renderWorkoutCard(newWorkout);

      // Clear Form Input Fields
      this._clearFormFields();

      // Store Workouts-Array to Local Storage Api of the browser
      this._setLocalStorage();
    }
  }

  _goToMarker(e) {
    if (e.target.closest(".workout")) {
      const card_Id = Number(e.target.closest(".workout").dataset.id);
      let cardCoords;
      this.workouts.forEach((workout) => {
        if (workout.id === card_Id) {
          cardCoords = workout;
          return;
        }
      });
      this.#map.setView(cardCoords.coords, 13, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }
  }

  _getLocalStorage() {
    const savedData = JSON.parse(window.localStorage.getItem("workouts"));
    // console.log(`Data Loaded from Local Storage 👇👇 `);
    // console.log(savedData);

    if (!savedData) return;

    this.workouts = savedData;

    this.workouts.forEach((workout) => {
      this._renderWorkoutCard(workout);
      //this._renderWorkoutMarker(workout);  // put it after loadMap Method
    });
  }

  reset() {
    window.localStorage.removeItem("workouts");
    window.location.reload();
  }

  /////////////////////////
  ////////////////
  // Helpful Methods for (newWorkout Method) when user Submit the workout form

  _validForm(workoutType) {
    const InputCadElev =
      workoutType === "running" ? inputCadence.value : inputElevation.value;
    if (inputDistance.value && inputDuration.value && InputCadElev) {
      return true;
    } else {
      alert(` Enter All fields 😐 `);
    }
  }

  _renderWorkoutMarker(newWorkout) {
    L.marker(newWorkout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 500,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${newWorkout.name}-popup`,
        })
      )
      .setPopupContent(
        `${newWorkout.name === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${
          newWorkout.description
        }`
      )
      .openPopup();
  }

  _renderWorkoutCard(newWorkout) {
    let workoutHTML;
    if (newWorkout.name === "running") {
      workoutHTML = `<li class="workout workout--${newWorkout.name}" data-id="${newWorkout.id}">
      <h2 class="workout__title">${newWorkout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">🏃‍♂️</span>
        <span class="workout__value">${newWorkout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${newWorkout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${newWorkout.pace}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${newWorkout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }
    if (newWorkout.name === "cycling") {
      workoutHTML = `<li class="workout workout--${newWorkout.name}" data-id="${newWorkout.id}">
     <h2 class="workout__title">${newWorkout.description}</h2>
     <div class="workout__details">
       <span class="workout__icon">🚴‍♀️</span>
       <span class="workout__value">${newWorkout.distance}</span>
       <span class="workout__unit">km</span>
     </div>
     <div class="workout__details">
       <span class="workout__icon">⏱</span>
       <span class="workout__value">${newWorkout.duration}</span>
       <span class="workout__unit">min</span>
     </div>
     <div class="workout__details">
       <span class="workout__icon">⚡️</span>
       <span class="workout__value">${newWorkout.speed}</span>
       <span class="workout__unit">km/h</span>
     </div>
     <div class="workout__details">
       <span class="workout__icon">⛰</span>
       <span class="workout__value">${newWorkout.elevationGain}</span>
       <span class="workout__unit">m</span>
     </div>
   </li>`;
    }
    form.insertAdjacentHTML("afterend", workoutHTML);
  }

  _clearFormFields() {
    inputDistance.value = "";
    inputDuration.value = "";
    inputCadence.value = "";
    inputElevation.value = "";
    form.style.display = "none"; // to prevent the animation
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000); // to display the animation back
  }

  _setLocalStorage() {
    window.localStorage.setItem("workouts", JSON.stringify(this.workouts));
  }

  /////////////////////////
  ////////////////
}

////////////////////////////////////////
/////////////////////////////////////
//////////////////////////////////
///////////////////////////////
////////////////////////////

const app = new App();
