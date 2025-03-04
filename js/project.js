//sources:
//drawitems turorial: https://leafletjs.com/2013/02/20/guest-post-draw.html

//creating map that centers on Oregon    
var map = L.map('map1').setView([44.0, -120.5], 7); // Oregon coordinates

/// ArcGIS Imagery Tile Layer
var arcgisLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.esri.com/en-us/legal/terms/data-attributions">ESRI Satellite Imagery</a> contributors'
  });

  // OpenStreetMap Tile Layer
  var osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // Add the OpenStreetMap layer by default
  osmLayer.addTo(map);

  // Add Layer Control to switch between the two tile layers
  var baseMaps = {
    "OpenStreetMap": osmLayer,
    "ArcGIS Imagery": arcgisLayer
  };

  L.control.layers(baseMaps).addTo(map);
// Add a geocoder (search bar) to the map
L.Control.geocoder().addTo(map);

// Initialize the feature group to store drawn items 
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialize the draw control and pass it the FeatureGroup of editable layers
var drawControl = new L.Control.Draw({
    edit: {
      featureGroup: drawnItems
    },
    draw: {
      // Only allow Polygons and Rectangles
      polygon: true, // Enable Polygon drawing
      rectangle: true, // Enable Rectangle drawing
      circle: false, // Disable Circle drawing (if you want to remove it)
      marker: false, // Disable Marker drawing (if you want to remove it)
      polyline: false, // Disable Polyline drawing (if you want to remove it)
      circlemarker: false // Disable CircleMarker drawing (if you want to remove it)
    }
  });
  map.addControl(drawControl);

// Initialize a counter to keep track of the order of shapes
var drawCounter = 1;

// Arrays to store locations, areas, draw numbers, and markers
var locations = [];
var areas = [];
var drawNumbers = [];
var markers = [];  // Array to store the markers

// Event listener for when a shape is drawn
map.on('draw:created', function (e) {
  var type = e.layerType,
    layer = e.layer;

  // If the drawn layer is a polygon, calculate its area using Turf.js
  if (layer instanceof L.Polygon || layer instanceof L.MultiPolygon) {
    var area = turf.area(layer.toGeoJSON()); // Calculate area using Turf.js
    var centroid = turf.centroid(layer.toGeoJSON()); // Get the centroid of the polygon
    var location = centroid.geometry.coordinates; // Extract the coordinates of the centroid
    
    // Store the location, area, and draw number
    locations.push(location);
    areas.push(area);
    drawNumbers.push(drawCounter);  // Add the draw number to the array

    // Add a numbered marker at the centroid of the drawn shape
    var marker = L.marker([location[1], location[0]]).addTo(map);
    marker.bindPopup("Shape " + drawCounter);  // Popup with the shape number

    // Store the marker in the markers array
    markers.push(marker);

    // Increment the draw counter for the next shape
    drawCounter++;

    // Display the results
    alert('Area of the drawn shape: ' + area.toFixed(2) + ' square meters.' + ' Let\'s add it to the table!');
  }

  // Add the drawn layer to the map
  drawnItems.addLayer(layer);

  // Update the table with the new location, area, and draw number
  create_table(locations, areas, drawNumbers);
});

// Event listener for when a shape is deleted
map.on('draw:deleted', function (e) {
  // After deletion, update the locations, areas, and markers arrays
  var deletedLayers = e.layers;

  // For each deleted layer, find its index and remove it from the arrays
  deletedLayers.eachLayer(function (layer) {
    var indexToDelete = locations.findIndex(function (loc) {
      // Compare the layer's centroid with the stored locations to find the index
      var layerCentroid = turf.centroid(layer.toGeoJSON()).geometry.coordinates;
      return (
        layerCentroid[0] === loc[0] &&
        layerCentroid[1] === loc[1]
      );
    });

    // If the shape is found in the locations array, delete the corresponding entries
    if (indexToDelete !== -1) {
      locations.splice(indexToDelete, 1);
      areas.splice(indexToDelete, 1);
      drawNumbers.splice(indexToDelete, 1);  // Remove the corresponding draw number
      // Remove the marker for the deleted shape
      map.removeLayer(markers[indexToDelete]);  // Remove the marker from the map
      markers.splice(indexToDelete, 1);  // Remove the marker from the markers array
    }
  });

  // Reassign draw numbers starting from 1 after deletion
  drawCounter = 1;
  for (var i = 0; i < drawNumbers.length; i++) {
    drawNumbers[i] = drawCounter++;  // Reassign draw number
    // Update the markers with the new draw number
    markers[i].setPopupContent("Shape " + drawNumbers[i]);
  }

  // After updating the arrays, recreate the table without the deleted shapes
  create_table(locations, areas, drawNumbers);
});

// Function to create and update the table
function create_table(locations, areas, drawNumbers) {
  var table = document.createElement("table");
  table.style.width = "100%";
  table.setAttribute("border", "1");
  
  // Create the table header with an additional "Number" column
  var headerRow = document.createElement("tr");
  headerRow.insertAdjacentHTML("beforeend", "<th>Number</th><th>Location</th><th>Area (m²)</th>");
  table.appendChild(headerRow);

  // Loop to add a new row for each location, area, and draw number
  for (var i = 0; i < locations.length; i++) {
    var locationText = "Lat: " + locations[i][1].toFixed(4) + ", Lng: " + locations[i][0].toFixed(4);
    var areaText = areas[i].toFixed(2);
    var drawNumberText = drawNumbers[i];  // Add the draw number

    // Add a new row with the draw number, location, and area
    var add_row_html = "<tr><td>" + drawNumberText + "</td><td>" + locationText + "</td><td>" + areaText + "</td></tr>";
    table.insertAdjacentHTML('beforeend', add_row_html);
  }

  // Append the table to the div
  var div = document.getElementById("areatable");
  div.innerHTML = ""; // Clear the div before adding a new table
  div.appendChild(table);
}
