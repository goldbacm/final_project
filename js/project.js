//data from https://globalsolaratlas.info/download/world
//Sourced code from leaflet tutorials and old labs

// creating map that centers on Oregon    
var map = L.map('map1').setView([44.0, -120.5], 7); // Oregon coordinates

// ArcGIS Imagery Tile Layer
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
        featureGroup: drawnItems,
        edit: false,  // Disable the edit functionality
        remove: true  // Enable the delete (remove) functionality
    },
    draw: {
        // Enable drawing options as needed, for example, Polygon and Rectangle
        polygon: true,
        rectangle: true,
        circle: false, 
        marker: false,
        polyline: false,
        circlemarker: false
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

// Function to create and update the table for locations and areas
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

    // Call the function to create the solar power table
    create_solar_table(locations, areas, drawNumbers);
}

// Function to create a table for solar energy calculations
function create_solar_table(locations, areas, drawNumbers) {
    var table = document.createElement("table");
    table.style.width = "100%";
    table.setAttribute("border", "1");

    // Create the table header with "Number", "Area (m²)", "Average Daily Solar Irradiance", and "Solar Power (W)" columns
    var headerRow = document.createElement("tr");
    headerRow.insertAdjacentHTML("beforeend", "<th>Number</th><th>Area (m²)</th><th>Average Daily Solar Irradiance (W/m²)</th><th>Solar Power (W)</th>");
    table.appendChild(headerRow);

    // Loop to add a new row for each location, area, and calculated power
    for (var i = 0; i < locations.length; i++) {
        var area = areas[i].toFixed(2);  // Area for solar power calculation
        var drawNumberText = drawNumbers[i];  // Draw number

        // Default solar irradiance for illustration
        var solar_irradiance = 1000;  // Example: Solar irradiance in W/m²
        var power = calculate_power(areas[i], 0.20, solar_irradiance);  // Calculate the power in watts

        // Add a new row with the draw number, area, and calculated solar power
        var add_row_html = "<tr><td>" + drawNumberText + "</td><td>" + area + "</td><td>" + solar_irradiance + "</td><td>" + power.toFixed(2) + "</td></tr>";
        table.insertAdjacentHTML('beforeend', add_row_html);
    }

    // Append the solar energy table below the original table
    var div = document.getElementById("solarpowertable");
    div.innerHTML = ""; // Clear the div before adding a new table
    div.appendChild(table);
}

// Function to calculate solar power
function calculate_power(area, efficiency, solar_irradiance) {
    let power = area * efficiency * solar_irradiance;
    return power;
}

// Function to get solar irradiance for the given coordinates from the GeoJSON data
function get_solar_irradiance_from_geojson(geojsonData, latitude, longitude) {
    // Loop through the features in the GeoJSON data to find a match for the coordinates
    for (let feature of geojsonData.features) {
        const featureGeometry = feature.geometry;
        const featureLatitude = latitude;
        const featureLongitude = longitude;

        // For each feature, we have coordinates in a Polygon format
        const polygon = featureGeometry.coordinates[0];  // First ring of the polygon

        // Check if the point is inside the polygon using a simple ray-casting algorithm
        if (isPointInPolygon([featureLongitude, featureLatitude], polygon)) {
            return feature.properties.VALUE;  // Return the solar irradiance value
        }
    }
    return null;  // Return null if no matching coordinates are found
}

// Ray-casting algorithm to check if a point is inside a polygon
function isPointInPolygon(point, polygon) {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1];
        let xj = polygon[j][0], yj = polygon[j][1];

        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Function to get the area from the table and calculate solar power
function calculate_solar_power_from_table() {
    var table = document.querySelector("#areatable table"); // Get the table
    var rows = table.querySelectorAll("tr"); // Get all rows of the table

    // Load the GHI GeoJSON data using fetch
    fetch('data/GHI.geojson')  // Replace with the correct path to your GeoJSON file
        .then(response => response.json())  // Parse the JSON data from the response
        .then(geojsonData => {
            L.geoJSON(geojsonData).addTo(map1);  // Add the GeoJSON data to the map (optional)

            // Loop through the rows and calculate solar power for each area
            for (var i = 1; i < rows.length; i++) {  // Start from 1 to skip the header row
                var cells = rows[i].getElementsByTagName("td"); // Get the cells in the row
                var area = parseFloat(cells[2].innerText);  // Get the area from the 3rd column (index 2)
                
                // Extract coordinates (assuming they are in the first and second columns of the table)
                var latitude = parseFloat(cells[0].innerText);  // Latitude from the 1st column (index 0)
                var longitude = parseFloat(cells[1].innerText); // Longitude from the 2nd column (index 1)

                // Get the solar irradiance for the current coordinates from the GeoJSON data
                var solar_irradiance = get_solar_irradiance_from_geojson(geojsonData, latitude, longitude);

                // If we can't find the solar irradiance, log a warning and leave it empty or null
                if (solar_irradiance === null) {
                    console.warn(`No solar irradiance data found for coordinates: (${latitude}, ${longitude}).`);
                    solar_irradiance = 'N/A';  // You can set it to a placeholder value like 'N/A'
                }

                // Define efficiency
                var efficiency = 0.20;  // 20% efficiency 

                // If solar irradiance is not available, power calculation is skipped, or set to zero
                var power = solar_irradiance !== 'N/A' ? calculate_power(area, efficiency, solar_irradiance) : 0;  

                // Create new cells for solar irradiance and solar power
                var irradianceCell = document.createElement("td");
                irradianceCell.innerText = solar_irradiance === 'N/A' ? 'N/A' : solar_irradiance + " W/m²";  // Display the irradiance

                var powerCell = document.createElement("td");
                powerCell.innerText = power === 0 ? 'N/A' : power + " W";  // Display the power

                // Append the new cells to the row
                rows[i].appendChild(irradianceCell);
                rows[i].appendChild(powerCell);
            }
        })
        .catch(error => {
            console.error('Error loading GHI.geojson:', error);  // Handle any errors that occur during the fetch
        });
}
