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

    // Create the table header with "Number", "Area (m²)", and "Solar Power (W)" columns
    var headerRow = document.createElement("tr");
    headerRow.insertAdjacentHTML("beforeend", "<th>Number</th><th>Area (m²)</th><th>Solar Power (W)</th>");
    table.appendChild(headerRow);

    // Loop to add a new row for each location, area, and calculated power
    for (var i = 0; i < locations.length; i++) {
        var area = areas[i].toFixed(2);  // Area for solar power calculation
        var drawNumberText = drawNumbers[i];  // Draw number

        // Calculate solar power for the given area
        var efficiency = 0.20;  // Example: 20% efficiency
        var solar_irradiance = 1000;  // Example: Solar irradiance in W/m²
        var power = calculate_power(areas[i], efficiency, solar_irradiance);  // Calculate the power in watts

        // Add a new row with the draw number, area, and calculated solar power
        var add_row_html = "<tr><td>" + drawNumberText + "</td><td>" + area + "</td><td>" + power.toFixed(2) + "</td></tr>";
        table.insertAdjacentHTML('beforeend', add_row_html);
    }

    // Append the solar energy table below the original table
    var div = document.getElementById("solarpowertable");
    div.innerHTML = ""; // Clear the div before adding a new table
    div.appendChild(table);
}

// Calculate solar potential 
function calculate_power(area, efficiency, solar_irradiance) {
    let power = area * efficiency * solar_irradiance
    return power;
}         

// Function to get the area from the table and calculate solar power
function calculate_solar_power_from_table() {
    var table = document.querySelector("#areatable table"); // Get the table
    var rows = table.querySelectorAll("tr"); // Get all rows of the table

    // Loop through the rows and calculate solar power for each area
    for (var i = 1; i < rows.length; i++) {  // Start from 1 to skip the header row
        var cells = rows[i].getElementsByTagName("td"); // Get the cells in the row
        var area = parseFloat(cells[2].innerText);  // Get the area from the 3rd column (index 2)
        
        // Example: You can define efficiency and solar irradiance based on your needs
        var efficiency = 0.20;  // 20% efficiency 
        var solar_irradiance = 1000;  // Solar irradiance in W/m² 

        var power = calculate_power(area, efficiency, solar_irradiance);  // Call the power calculation function
        console.log("Solar power for draw " + cells[0].innerText + ": " + power + " W");
    }
}
///////////////////////////////////////////////////
///////////////////////////////////////////////////
////////////////////////////////////////////////////
// //instead of a constant Solar irradiance need to get kilowatts per year but also break down by month to print out table
// // Function to fetch solar irradiance data from NASA's POWER API
// async function fetch_solar_data(latitude, longitude, startDate, endDate) {
//     const apiUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=SOLARRAD&community=RE&longitude=${longitude}&latitude=${latitude}&start=${startDate}&end=${endDate}&format=JSON`;

//     try {
//         let response = await fetch(apiUrl);
//         let data = await response.json();

//         // Check if data was returned successfully
//         if (data && data.properties && data.properties.parameter && data.properties.parameter.SOLARRAD) {
//             return data.properties.parameter.SOLARRAD;
//         } else {
//             console.error("Data not found or error fetching data.");
//             return [];
//         }
//     } catch (error) {
//         console.error("Error fetching solar data: ", error);
//         return [];
//     }
// }

// // Function to calculate monthly solar energy using the irradiance data
// function calculate_monthly_energy(area, efficiency, dailyIrradiance) {
//     const monthlyEnergy = Array(12).fill(0); // Array to store monthly energy values

//     for (let i = 0; i < 365; i++) { // Loop through daily data
//         const dayOfYear = i; // Day number (0 to 364)

//         // Determine the month (0-based, so January = 0, December = 11)
//         const month = new Date(2024, 0, 1 + dayOfYear).getMonth(); // Adjust year to 2024

//         // Calculate energy for the day (in kWh) for the given area and efficiency
//         const dailyEnergy = area * efficiency * dailyIrradiance[dayOfYear] * 1 / 1000; // Convert from W/m²/day to kWh

//         // Add energy for the specific month
//         monthlyEnergy[month] += dailyEnergy;
//     }

//     return monthlyEnergy;
// }

// // Example usage of the functions
// async function calculate_solar_power() {
//     const latitude = 44.0; // Example latitude for Oregon
//     const longitude = -120.5; // Example longitude for Oregon
//     const startDate = "20240101"; // Start of 2024
//     const endDate = "20241231"; // End of 2024

//     // Fetch solar irradiance data from NASA POWER API for 2024
//     const dailyIrradiance = await fetch_solar_data(latitude, longitude, startDate, endDate);

//     if (dailyIrradiance.length === 0) {
//         console.error("Failed to fetch irradiance data.");
//         return;
//     }

//     // Example area (in square meters) and efficiency (20%)
//     const area = 100; // m² (example: 100 m² of solar panels)
//     const efficiency = 0.20; // 20% efficiency

//     // Calculate the monthly energy produced based on solar irradiance
//     const monthlyEnergy = calculate_monthly_energy(area, efficiency, dailyIrradiance);

//     // Display results in the table
//     create_solar_table(monthlyEnergy);
// }

// // Function to display the results in a table
// function create_solar_table(monthlyEnergy) {
//     const div = document.getElementById("solarpowertable");

//     if (!div) {
//         console.error("Error: div with id 'solarpowertable' not found.");
//         return; // Exit the function if the div doesn't exist
//     }

//     let table = document.createElement("table");
//     table.style.width = "100%";
//     table.setAttribute("border", "1");

//     // Create the table header with monthly energy and total energy
//     let headerRow = document.createElement("tr");
//     headerRow.insertAdjacentHTML("beforeend", "<th>Month</th><th>Monthly Solar Energy (kWh)</th>");
//     table.appendChild(headerRow);

//     // Loop through the months and add them to the table
//     let totalEnergy = 0;
//     for (let i = 0; i < 12; i++) {
//         let monthName = new Date(2024, i, 1).toLocaleString('default', { month: 'long' });
//         let energy = monthlyEnergy[i].toFixed(2);
//         totalEnergy += monthlyEnergy[i];

//         let rowHtml = `<tr><td>${monthName}</td><td>${energy}</td></tr>`;
//         table.insertAdjacentHTML('beforeend', rowHtml);
//     }

//     // Add total energy row
//     table.insertAdjacentHTML('beforeend', `<tr><td><strong>Total</strong></td><td><strong>${totalEnergy.toFixed(2)}</strong></td></tr>`);

//     // Append the table to the div
//     div.innerHTML = ""; // Clear the div before adding a new table
//     div.appendChild(table);
// }

// // Call the function to calculate and display solar power data
// calculate_solar_power();
