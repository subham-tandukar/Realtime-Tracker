const socket = io();

// Initialize the userId variable
let userId;
let userLatitude, userLongitude;

socket.on("user-id", (id) => {
  // Set the userId when the server sends it
  userId = id;
});

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      // Emit location data with the userId
      socket.emit("send-location", { id: userId, latitude, longitude });

      // Update user's latitude and longitude
      userLatitude = latitude;
      userLongitude = longitude;

      // Recenter map to user's current position (you can adjust zoom level)
      map.setView([latitude, longitude], 16);
    },
    (error) => {
      console.error(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

const map = L.map("map").setView([0, 0], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Realtime Tracker",
}).addTo(map);

const markers = {};

socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;
  map.setView([latitude, longitude]);

  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    const popupContent = id === userId ? "You" : `User: ${id}`;
    markers[id] = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(popupContent)
      .openPopup();
  }
});

socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});

// Handle recenter button click
document.getElementById("recenterButton").addEventListener("click", () => {
  if (userLatitude && userLongitude) {
    map.setView([userLatitude, userLongitude], 16); // Recenter the map to user's location
  } else {
    console.error("Unable to get current location.");
  }
});
