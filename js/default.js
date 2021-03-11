// --- --- Initialization --- ---

// https://drive.google.com/drive/folders/1DDzK-aQ8csvOZT9Un-Vp22syeYbHDcBT
// Test values: 106.8 129.2 153.0 149.1 158.3 132.9 149.8 140.3 138.3 152.2 128.1

// Sources:
// Calculate Moving Average: https://observablehq.com/@d3/moving-average
// Format numbers: http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e
//

// Dimensions of the coordinate system graphic
var width = 500;
var height = 500;
var margin = ({ top: 15, right: 15, bottom: 25, left: 25 });

// Variables storing the toggle values
// false: y axis starts at min(input_data)
// true: y axis starts at 0
var y_start_0 = false;
// false: value of forecast includes value of the current period
// true: value of forecast does not include value of the current period
var forecast_offset = false;

// Variables storing color information
var input_data_color = "#58D68D";
var moving_average_color = "#E74C3C";

// Stores the entered values
var input_data = [];  // Renamed from data!

// Number of periods (Moving Average)
var N = 3;
// Prediction of moving average
var moving_average = [];

// Stores the id of the currently active tab
var current_id = "start";

// Initialize the plot
updatePlots();

// --- --- Functions --- ---

document.getElementById("set-input-data").addEventListener("click", addInputData, false);
document.getElementById("input-data").addEventListener("keyup", function (e) { if (e.key == "Enter") { addInputData(); } }, false);
document.getElementById("calculate-moving-average").addEventListener("click", movingAverage, false);
document.getElementById("set-n").addEventListener("keyup", function (e) { if (e.key == "Enter") { movingAverage(); } }, false);
document.getElementById("delete-data").addEventListener("click", deleteInputData, false);


// --- Add element ---
function addInputData() {
    // Get value of number field
    var newValue = $("#input-data").val();
    // Only continue, if a value is entered
    if (newValue.length > 0) {
        // Add the value to the array
        input_data.push(Number(newValue));
        addRow(input_data[input_data.length - 1], input_data.length - 1, "input_data_table");
        // Clear the data and table of the moving average
        eraseData(moving_average, "moving_average_table");
        // Delete the moving_average data
        moving_average = [];

        updatePlots();
    }
    // Clear the input field
    $("#input-data").val("");
}

// --- Updates the Plot with all graphs ---
// Deletes the old plot and creates a new one
// Should be called, when input_data is updated
// Necessary to update the axes dynamically
function updatePlots() {
    reloadAxes();
    updatePlot(input_data, input_data_color);
    updatePlot(moving_average, moving_average_color);
}

// --- Updates one graph ---
function updatePlot(vector, color) {
    drawPoints(vector, color);
    drawLines(vector, color);
}

function reloadAxes() {
    deleteOldPlot();
    createNewPlot();
}

function deleteOldPlot() {
    var to_be_deleted = $("#svg");
    if (to_be_deleted != null) {
        to_be_deleted.remove();
    }
}

function createNewPlot() {

    var biggest_x = d3.max([input_data.length, moving_average.length]);

    x = d3.scaleLinear().domain([1, biggest_x]).range([margin.left, width - margin.right]);
    y = d3.scaleLinear().domain([y_start_0 ? 0 : d3.min(input_data), d3.max(input_data)]).range([height - margin.bottom, margin.top]);
    xAxis = g => g
        .attr("transform", 'translate(0,' + (height - margin.bottom) + ')')
        .call(d3.axisBottom(x).tickFormat(function (e) {
            if (Math.floor(e) != e) { return; } return e;
        }));
    yAxis = g => g
        .attr("transform", 'translate(' + (margin.left) + ',  0)')
        .call(d3.axisLeft(y));

    const svg = d3.select("#svgcontainer").append("svg").attr("viewBox", [0, 0, width, height]).attr("id", "svg");
    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);
}

function drawPoints(vector, color) {
    vector.forEach(function (item, index) {
        if (!isNaN(vector[index])) {
            $(document.createElementNS('http://www.w3.org/2000/svg', 'circle')).attr({
                id: "point" + index,
                cx: x(index + 1),
                cy: y(vector[index]),
                r: 2,
                fill: color,
                stroke: color,
            }).appendTo("#svg");
        }
    });
}

function drawLines(vector, color) {
    vector.forEach(function (item, index) {
        if (index > 0) {
            if (!isNaN(vector[index - 1])) {
                $(document.createElementNS('http://www.w3.org/2000/svg', 'line')).attr({
                    id: "line" + index,
                    x1: x(index),
                    y1: y(vector[index - 1]),
                    x2: x(index + 1),
                    y2: y(vector[index]),
                    stroke: color,
                }).appendTo("#svg");
            }
        }
    });
}

// --- Delete last input_data entry ---
function deleteInputData() {
    deleteRow(input_data.length, "input_data_table");
    input_data.pop();
    // Clear the data and table of the moving average
    eraseData(moving_average, "moving_average_table");
    moving_average = [];
    updatePlots();
}

// ### Possible option if multiple elements exist, where the Enter-functionality is needed ###
// --- Add data when "Enter" is pressed ---
// --- Create an EventListener for all elements with the class form-text ---
//var inputs = $(".form-text");
// [... ] converts HTMLCollection to an array
//[...inputs].forEach(function (item, index) {
//    item.addEventListener("keyup", function (e) { if (e.key === "Enter") { pressEnter(item); } }, false);
//});
// --- Execute the corresponding set- function of the element where Enter is pressed ---
//function pressEnter(element) {
//    $("#set-" + element.id + "").click();
//}

// --- Set N for moving average (only for positive N) ---
function setN() {
    var newN = $("#set-n").val();
    if (newN > 0) {
        N = newN;
        $("#n-value").text(N);
    }
}

// --- Calculate and display moving average ---
function movingAverage() {
    setN();
    calculateMovingAverage();
    displayData(moving_average, "moving_average_table");
    updatePlot(moving_average, moving_average_color);
}

// Displays the given vector in the given table
function displayData(vector, table) {
    console.log(vector);
    vector.forEach(function (item, index) {
        addRow(item, index, table);
    });
}

// Adds one row to an existing table
function addRow(value, index, table) {
    if (!isNaN(value)) {
        $("#" + table + "").append("<div class='row' id= '" + table + "_row" + (index + 1) + "'> <div class='cell'>" + (index + 1) + "</div> <div class='cell'>" + d3.format(".2f")(value) + "</div> </div>");
    }
}

function eraseData(vector, table) {
    vector.forEach(function (item, index) {
        deleteRow(index + 1, table);
    });
}

function deleteRow(index, table) {
    var del_row = document.getElementById(table + "_row" + index);
    if (del_row != null) {
        del_row.remove();
    }
}

// --- Calculates the moving average of input_data for N periods
// Source: https://observablehq.com/@d3/moving-average
function calculateMovingAverage() {
    var i = 0;
    var sum = 0;
    var means = new Float64Array(input_data.length).fill(NaN);

    for (var n = Math.min(N - 1, input_data.length); i < n; ++i) {
        sum += input_data[i];
    }

    for (var n = input_data.length; i < n; ++i) {
        sum += input_data[i];
        means[i] = sum / N;
        sum -= input_data[i - N + 1];
    }

    means.forEach(function (item, index) {
        moving_average[index] = Number(means[index]);
    });
    console.log(moving_average);
}

// --- Toggles the y axis start
$("#toggle-y-scale").on('click', function () {

    if (y_start_0 == true) {
        y_start_0 = false;
        $("#y-axis-description").append("<div id='y-axis-description-min-max'>Y axis scaling from min to max</div>");
        var old_description = document.getElementById("y-axis-description-0-max");
        old_description.remove();
    }
    else {
        y_start_0 = true;
        $("#y-axis-description").append("<div id='y-axis-description-0-max'>Y axis scaling from 0 to max</div>");
        var old_description = document.getElementById("y-axis-description-min-max");
        old_description.remove();
    }
    updatePlots();
});

// --- Toggles the offset of the moving average ---
// ERROR when pressed, before new moving average is calculated
$("#toggle-offset").on('click', function () {
    if (moving_average.length > 0) {
        if (forecast_offset === true) {
            forecast_offset = false;

            $("#offset-description").append("<div id='offset-false'>Moving average in period i includes value of period i</div>")
            var old_description = document.getElementById("offset-true");
            old_description.remove();

            moving_average.shift();

        }
        else {
            forecast_offset = true;

            $("#offset-description").append("<div id='offset-true'>Moving average in period i does not include value of period i (forecast)</div>")
            var old_description = document.getElementById("offset-false");
            old_description.remove();

            moving_average.unshift(Number(NaN));
        }
        updatePlots();
    }
});

// --- Manage what tab to show ---
$(".selectable").on('click', function () {
    var old_id = current_id;
    var id = this.id;
    current_id = id;

    if (old_id == current_id) {
        current_id = "start";
    }

    var oldChild = document.getElementById(old_id + "-content-inner");
    var newChild = document.getElementById(current_id + "-content-inner");

    document.getElementById("page-content").replaceChild(newChild, oldChild);

    document.getElementById(old_id + "-content").appendChild(oldChild);

    document.getElementById("input").className = "notselected";
    document.getElementById("ma").className = "notselected";
    document.getElementById("ses").className = "notselected";
    if (current_id != "start"){
        document.getElementById(current_id).className = "selected";
    }
});
