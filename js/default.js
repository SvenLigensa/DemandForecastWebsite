// --- --- Initialization --- ---

// Sources:
// Calculate Moving Average: https://observablehq.com/@d3/moving-average
// Format numbers: http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e

// Dimensions of the coordinate system graphic
var width = 500;
var height = 500;
var margin = ({ top: 15, right: 15, bottom: 25, left: 30 });

// Variables storing the toggle values
// false: y axis starts at min(input_data)
// true: y axis starts at 0 (unless negative y values exist)
var y_start_0 = false;
// false: value of forecast includes value of the current period
// true: value of forecast does not include value of the current period
var forecast_offset = true;

// Variables storing color information
var input_data_color = "#00B003";
var moving_average_color = "#E74C3C";
var single_exponential_smoothing_color = "#3EA0FC";
var double_exponential_smoothing_color = "#D6B900";

// Stores the entered values
var input_data = [];

// Moving Average
// Number of periods
var N = 3;
// Forecast values
var moving_average = [];

// Single Exponential Smoothing
// Smoothing factor
var ses_alpha = 0.2;
// Forecast values
var single_exponential_smoothing = [];

// Double Exponential Smoothing
// Data smoothing factor
var des_alpha = 0.2;
var des_a_values = [];
// Trend smoothing factor
var des_beta = 0.2;
var des_b_values = [];
// Forecast values
var double_exponential_smoothing = [];


// --- --- Functions --- ---

document.getElementById("input-data").addEventListener("keyup", function (e) { if (e.key === "Enter") { addInputData(); } }, false);
document.getElementById("set-n").addEventListener("keyup", function (e) { if (e.key === "Enter") { movingAverage(); } }, false);
document.getElementById("set-ses-alpha").addEventListener("keyup", function (e) { if (e.key === "Enter") { singleExponentialSmoothing(); } }, false);
document.getElementById("set-des-alpha").addEventListener("keyup", function (e) { if (e.key === "Enter") { doubleExponentialSmoothing(); } }, false);
document.getElementById("set-des-beta").addEventListener("keyup", function (e) { if (e.key === "Enter") { doubleExponentialSmoothing(); } }, false);

// #---# General functions #---#

function initialize() {
    // Initialize the plot
    updatePlot();
    document.getElementById("start").click();
}

function removeCalculations() {
    removeMovingAverage();
    removeSingleExponentialSmoothing();
    removeDoubleExponentialSmoothing();
}

// --- Adds new value to input_data, displays it in the table, removes all calculations and updates the plot ---
function addInputData() {
    // Get value of number field
    var newValue = $("#input-data").val();
    // Only continue, if a value is entered
    if (newValue.length > 0) {
        // Add the value to the array
        input_data.push(Number(newValue));

        // Show the new data in the input-data-table
        addRow(input_data[input_data.length - 1], input_data.length - 1, "input-data-table");

        // Clear all calculations as they are not up to date anymore
        // TODO: Alternative: continue calculations when already started
        removeCalculations();
        updatePlot();
    }
    // Clear the input field
    $("#input-data").val("");
}

// --- Delete last input_data entry ---
function deleteInputData() {
    deleteRow((input_data.length - 1), "input-data-table");
    input_data.pop();
    removeCalculations();
    updatePlot();
}

// --- Toggles the offset of the moving average ---
// TODO: Toggle the offset of all calculations
function toggleOffset() {
    if (forecast_offset === true) {
        $("#offset-description").append("<div id='offset-false'>Moving average in period i includes value of period i</div>")
        document.getElementById("offset-true").remove();
        // Remove the first NaN value of moving_average
        moving_average.shift();
        forecast_offset = false;
    }
    else {
        $("#offset-description").append("<div id='offset-true'>Moving average in period i does not include value of period i (forecast)</div>")
        document.getElementById("offset-false").remove();
        // Insert NaN value at the start of moving_average
        moving_average.unshift(Number(NaN));
        forecast_offset = true;
    }
    // Update the moving-average-table
    deleteTableBodyById("moving-average-table");
    displayData(moving_average, "moving-average-table");
    // Update the plot to show the shifted graph
    updatePlot();
}

// --- Manage what tab to show (TODO: make function prettier) ---
function showTab(evt, id) {

    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
        tablinks[i].innerText = tablinks[i].getAttribute("short");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(id + "-content").style.display = "block";
    evt.currentTarget.className += " active";
    evt.currentTarget.innerText = evt.currentTarget.getAttribute("long");
}

// TODO: Create better example data (maybe randomized?)
function useExampleData(type) {
    if (type.length > 0) {
        removeCalculations();
        updatePlot();
        switch (type) {
            case "constant":
                input_data = createConstantExample();
                break;
            case "rising":
                input_data = createRisingExample();
                break;
            case "falling":
                input_data = createFallingExample();
                break;
            case "highvariation":
                input_data = createHighVariationExample();
        }
        displayData(input_data, "input-data-table");
        updatePlot();
    }
}

function createConstantExample() {
    var base_number = Math.floor(Math.random() * 100000) / 100;
    var offset_number = Math.floor(base_number*0.05);
    var constant_data = [base_number];
    for (var i = 1; i < 50; i++){
        constant_data[i] = Math.round((base_number + Math.random() * offset_number * (1 - 2 * Math.round(Math.random())))*100)/100;
    }
    console.log(constant_data);
    return constant_data;
}

function createRisingExample() {
    var base_number = Math.floor(Math.random() * 100000) / 100;
    var offset_number = Math.floor(base_number / Math.random(Math.floor(base_number)));
    var rising_data = [base_number];
    for (var i = 1; i < 50; i++) {
        rising_data[i] = Math.round((rising_data[i - 1] + Math.random(offset_number))*100)/100;
    }
    return rising_data;
}

function createFallingExample() {
    var base_number = Math.floor(Math.random() * 100000) / 100;
    var offset_number = Math.floor(base_number / Math.random(Math.floor(base_number)));
    var falling_data = [base_number];
    for (var i = 1; i < 50; i++) {
        falling_data[i] = Math.round((falling_data[i - 1] - Math.random(offset_number))*100)/100;
    }
    return falling_data;
}

function createHighVariationExample() {
    var base_number = Math.floor(Math.random() * 100000) / 100;
    var offset_number = Math.floor(base_number*0.5);
    var high_variation_data = [base_number];
    for (var i = 1; i < 50; i++){
        high_variation_data[i] = Math.round((base_number + Math.random() * offset_number * (1 - 2 * Math.round(Math.random())))*100)/100;
    }
    return high_variation_data;
}

// #---# Plot functions #---#

// --- Updates the whole plot with all graphs ---
// Deletes the old plot and creates a new one
// Necessary to update dynamically
function updatePlot() {
    reloadAxes();
    updateGraph(input_data, input_data_color);
    updateGraph(moving_average, moving_average_color);
    updateGraph(single_exponential_smoothing, single_exponential_smoothing_color);
    updateGraph(double_exponential_smoothing, double_exponential_smoothing_color);
}

// --- Updates one graph by ---
function updateGraph(vector, color) {
    drawPoints(vector, color);
    drawLines(vector, color);
}

function reloadAxes() {
    deleteOldPlot();
    createNewPlot();
    showLegend();
}

function deleteOldPlot() {
    var to_be_deleted = $("#svg");
    if (to_be_deleted != null) {
        to_be_deleted.remove();
    }
}

function createNewPlot() {

    var max_y = d3.max([d3.max(input_data), d3.max(moving_average), d3.max(single_exponential_smoothing), d3.max(double_exponential_smoothing)]);
    var min_y = d3.min([d3.min(input_data), d3.min(moving_average), d3.min(single_exponential_smoothing), d3.min(double_exponential_smoothing)])

    x = d3.scaleLinear().domain([1, input_data.length + 1]).range([margin.left, width - margin.right]);
    y = d3.scaleLinear().domain([y_start_0 ? d3.min([0, min_y]) : min_y, max_y]).range([height - margin.bottom, margin.top]);
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

function showLegend() {

    // TODO: Create a good looking legend
    /*
    var textWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textWrapper.setAttributeNS(null, "x", 20);
    textWrapper.setAttributeNS(null, "y", 10);
    textWrapper.setAttributeNS(null, "fill", input_data_color);
    textWrapper.setAttributeNS(null, "font-size", "10");

    var textNode = document.createTextNode("Input");
    textWrapper.appendChild(textNode);
    document.getElementById("svg").appendChild(textWrapper);
    */
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

// --- Toggles the y axis starting point (min(input_data) or 0) ---
function toggleYScale() {
    if (y_start_0 === true) {
        $("#y-axis-description").append("<div id='y-axis-description-min-max'>Y axis scaling from min to max</div>");
        document.getElementById("y-axis-description-0-max").remove();
        y_start_0 = false;
    }
    else {
        $("#y-axis-description").append("<div id='y-axis-description-0-max'>Y axis scaling from 0 to max (unless negative y values exist)</div>");
        document.getElementById("y-axis-description-min-max").remove();
        y_start_0 = true;
    }
    updatePlot();
}

// #---# Table functions #---#

// --- Displays the given vector in the given table ---
function displayData(vector, table) {
    vector.forEach(function (item, index) {
        addRow(item, index, table);
    });
}

// --- Adds one row to an existing table (id's starting with 1) ---
function addRow(value, index, table) {
    if (!isNaN(value)) {
        $("#" + table).append("<div class='row' id= '" + table + "-row-" + (index + 1) + "'> <div class='cell'>" + (index + 1) + "</div> <div class='cell'>" + d3.format(".2f")(value) + "</div> </div>");
    }
}

// --- Deletes all children of the element with the id ---
function deleteTableBodyById(id) {
    const myNode = document.getElementById(id);
    // Only continue, when myNode exists
    if (myNode !== null) {
        while (myNode.lastElementChild) {
            myNode.removeChild(myNode.lastElementChild);
        }
    }
}

// --- Deletes row with specific index (id's starting with 1) ---
function deleteRow(index, table) {
    var del_row = document.getElementById(table + "-row-" + (index + 1));
    if (del_row != null) {
        del_row.remove();
    }
}

// #---# Moving Average #---#

// --- Set N for moving average (only for positive N) ---
function setN() {
    var newN = $("#set-n").val();
    if (newN > 0) {
        N = newN;
        $("#n-value").text(N);
        $("#set-n").val("");
    }
}

// --- Delete previous calculations if they exist, set the number of periods, ---
// --- calculate and display the new moving average and update the plot accordingly ---
function movingAverage() {
    removeMovingAverage();
    setN();
    calculateMovingAverage();
    displayData(moving_average, "moving-average-table");
    updatePlot();
}

// --- Deletes everything regarding the moving average ---
function removeMovingAverage() {
    moving_average = [];
    if (forecast_offset === true) {
        moving_average.push(NaN);
    }
    deleteTableBodyById("moving-average-table");
    updateGraph(moving_average, moving_average_color);
}

// --- Calculates the moving average of input_data for N periods ---
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
        // If forecast_offset is true the index is incremented by 1
        moving_average[index + forecast_offset] = Number(means[index]);
    });
}

// #---# Single Exponential Smoothing #---#

function singleExponentialSmoothing() {
    removeSingleExponentialSmoothing();
    setSesAlpha();
    calculateSingleExponentialSmoothing();
    displayData(single_exponential_smoothing, "single-exponential-smoothing-table");
    updatePlot();
}

// --- Set alpha for single exponential smoothing (only for 0 <= alpha <= 1) ---
function setSesAlpha() {
    var newAlpha = $("#set-ses-alpha").val();
    if (newAlpha !== "" && newAlpha >= 0 && newAlpha <= 1) {
        ses_alpha = newAlpha;
        $("#ses-alpha-value").text(ses_alpha);
        $("#set-ses-alpha").val("");
    }
}

// --- Calculates the values of the Siingle Exponential Smoothing
function calculateSingleExponentialSmoothing() {
    // Initialization
    single_exponential_smoothing.push(NaN);
    single_exponential_smoothing.push(input_data[0]);

    // Computation
    input_data.forEach(function (item, index) {
        if (index > 0) {
            single_exponential_smoothing.push(ses_alpha * item + (1 - ses_alpha) * single_exponential_smoothing[index]);
        }
    });
}

// --- Deletes everything regarding the single exponential smoothing ---
function removeSingleExponentialSmoothing() {
    single_exponential_smoothing = [];
    deleteTableBodyById("single-exponential-smoothing-table");
    updateGraph(single_exponential_smoothing, single_exponential_smoothing_color);
}


// #---# Double Exponential Smoothing #---#

function doubleExponentialSmoothing() {
    removeDoubleExponentialSmoothing();
    setDesAlpha();
    setDesBeta();
    calculateDoubleExponentialSmoothing();
    displayData(double_exponential_smoothing, "double-exponential-smoothing-table");
    updatePlot();
}

// --- Set alpha for single exponential smoothing (only for 0 <= alpha <= 1) ---
function setDesAlpha() {
    var newAlpha = $("#set-des-alpha").val();
    if (newAlpha !== "" && newAlpha >= 0 && newAlpha <= 1) {
        des_alpha = newAlpha;
        $("#des-alpha-value").text(des_alpha);
        $("#set-des-alpha").val("");
    }
}

function setDesBeta() {
    var newBeta = $("#set-des-beta").val();
    if (newBeta !== "" && newBeta >= 0 && newBeta <= 1) {
        des_beta = newBeta;
        $("#des-beta-value").text(des_beta);
        $("#set-des-beta").val("");
    }
}

// --- Calculates the values of the Siingle Exponential Smoothing
function calculateDoubleExponentialSmoothing() {

    // Initialization
    double_exponential_smoothing.push(NaN);

    des_a_values.push(input_data[0]);
    // null-value in input_data[1] is no problem
    des_b_values.push(input_data[1] - input_data[0]);

    // Computation
    input_data.forEach(function (item, index) {
        if (index > 0) {
            des_a_values.push((des_alpha * input_data[index]) + (1 - des_alpha) * (des_a_values[index - 1] + des_b_values[index - 1]));
            des_b_values.push(des_beta * (des_a_values[index] - des_a_values[index - 1]) + (1 - des_beta) * des_b_values[index - 1]);
            double_exponential_smoothing.push(des_a_values[index - 1] + des_b_values[index - 1]);
        }
    });
}

// --- Deletes everything regarding the single exponential smoothing ---
function removeDoubleExponentialSmoothing() {
    double_exponential_smoothing = [];
    des_a_values = [];
    des_b_values = [];
    deleteTableBodyById("double-exponential-smoothing-table");
    updateGraph(double_exponential_smoothing, double_exponential_smoothing_color);
}
