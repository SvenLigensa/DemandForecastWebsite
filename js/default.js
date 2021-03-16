// Sources:
// Calculate Moving Average: https://observablehq.com/@d3/moving-average
// Format numbers: http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e
// Tabs: https://www.w3schools.com/howto/howto_js_tabs.asp

// #---# #---# Initialization #---# #---#

// Dimensions of the coordinate system graphic
var width = 500;
var height = 500;
var margin = ({ top: 15, right: 15, bottom: 25, left: 30 });

// Variables storing the toggle values
// false: y axis starts at min(input_data) -- true: y axis starts at 0 (unless negative y values exist)
var y_start_0 = false;
// false: value of forecast includes value of the current period -- true: value of forecast does not include value of the current period
var forecast_offset = true;
// false: error values are not displayed -- true: error values are displayed
var show_errors = false;

// Variables storing color information
var input_data_color = "#00B003";
var moving_average_color = "#E74C3C";
var single_exponential_smoothing_color = "#3EA0FC";
var double_exponential_smoothing_color = "#D6B900";

// Stores the entered values
var input_data = [];
var input_time = [];

// Moving Average
// Number of periods
var N = 3;
// Forecast values
var moving_average = [];
var moving_average_time = [];
// Error values
var moving_average_error = [];
var moving_average_squared_error = [];
var moving_average_mse;

// Single Exponential Smoothing
// Smoothing factor
var ses_alpha = 0.2;
// Forecast values
var single_exponential_smoothing = [];
var single_exponential_smoothing_time = [];
// Error values
var single_exponential_smoothing_error = [];
var single_exponential_smoothing_squared_error = [];
var single_exponential_smoothing_mse;

// Double Exponential Smoothing
// Data smoothing factor
var des_alpha = 0.2;
var des_a_values = [];
// Trend smoothing factor
var des_beta = 0.2;
var des_b_values = [];
// Forecast values
var double_exponential_smoothing = [];
var double_exponential_smoothing_time = [];
// Error values
var double_exponential_smoothing_error = [];
var double_exponential_smoothing_squared_error = [];
var double_exponential_smoothing_mse;

// #---# #---# Functions #---# #---#

// #---# EventListeners for "Enter" #---#
document.getElementById("input-data").addEventListener("keyup", function (e) { if (e.key === "Enter") { addInputData(); } }, false);
document.getElementById("set-n").addEventListener("keyup", function (e) { if (e.key === "Enter") { movingAverage(); } }, false);
document.getElementById("set-ses-alpha").addEventListener("keyup", function (e) { if (e.key === "Enter") { singleExponentialSmoothing(); } }, false);
document.getElementById("set-des-alpha").addEventListener("keyup", function (e) { if (e.key === "Enter") { doubleExponentialSmoothing(); } }, false);
document.getElementById("set-des-beta").addEventListener("keyup", function (e) { if (e.key === "Enter") { doubleExponentialSmoothing(); } }, false);

// #---# General functions #---#

// --- Initialization (called when html body is loaded) ---
function initialize() {
    updatePlot();
    document.getElementById("start").click();
}

// --- Adds new value to input_data, displays it in the table, removes all calculations and updates the plot ---
function addInputData() {
    // Get value of number field
    var newValue = $("#input-data").val();
    // Only continue, if a value is entered
    if (newValue.length > 0) {
        // Add the value to the array
        input_data.push(Number(newValue));
        input_time.push(input_time.length + 1);
        // If it is the first entry, create the table from scratch
        if (input_data.length === 1) {
            addColumn("Time", input_time, true, "input-data-table");
            addColumn("Demand", input_data, false, "input-data-table");
        }
        // Show the new data in the input-data-table
        else {
            addRowTwoValues(input_time[input_time.length - 1], input_data[input_data.length - 1], "input-data-table");
        }
        // Clear all calculations as they are not up to date anymore
        removeAllCalculations();
        updatePlot();
    }
    // Clear the input field
    $("#input-data").val("");
}

// --- Deletes last input_data entry ---
function deleteInputData() {
    input_data.pop();
    input_time.pop();
    removeLastRow("input-data-table");
    removeAllCalculations();
    updatePlot();
}

// --- Removes all calculated values and their representation in the tables ---
function removeAllCalculations() {
    removeMovingAverage();
    removeSingleExponentialSmoothing();
    removeDoubleExponentialSmoothing();
    hideMSEs();
}

// --- Manage what tab to show ---
function showTab(evt, id) {
    // Get all elements with class="tabcontent" and hide them
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    // Get all elements with class="tablinks", remove the class "active" and set their description text to "short"
    var tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
        tablinks[i].innerText = tablinks[i].getAttribute("short");
    }
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(id + "-content").style.display = "block";
    evt.currentTarget.className += " active";
    // Set the description text of the new "active" class 
    evt.currentTarget.innerText = evt.currentTarget.getAttribute("long");
}

// Creates example data of the given type
function useExampleData(type) {
    if (type.length > 0) {
        removeTable("input-data-table");
        removeAllCalculations();
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
                break;
            case "deepfallconstant":
                input_data = [];
                input_data.push(100);
                for (var i = 1; i < 50; i++) {
                    input_data.push(1);
                }
                break;
        }
        input_time = Array.from({ length: input_data.length }, (_, i) => i + 1);
        addColumn("Time", input_time, true, "input-data-table");
        addColumn("Demand", input_data, true, "input-data-table");
        updatePlot();
    }
}

function createConstantExample() {
    var base_number = Math.floor(Math.random() * 100000) / 100;
    var offset_number = Math.floor(base_number * 0.05);
    var constant_data = [base_number];
    for (var i = 1; i < 50; i++) {
        constant_data[i] = Math.round((base_number + Math.random() * offset_number * (1 - 2 * Math.round(Math.random()))) * 100) / 100;
    }
    return constant_data;
}

function createRisingExample() {
    var base_number = Math.floor(Math.random() * 100000) / 100;
    var offset_number = Math.floor(Math.random() * base_number * 0.5) + 5;
    var rising_data = [base_number];
    for (var i = 1; i < 50; i++) {
        rising_data[i] = Math.round((rising_data[i - 1] + Math.random() * offset_number) * 100) / 100;
    }
    return rising_data;
}

function createFallingExample() {
    var base_number = Math.floor(Math.random() * 100000) / 100;
    var offset_number = Math.floor(Math.random() * base_number * 0.1) + 5;
    var falling_data = [base_number];
    for (var i = 1; i < 50; i++) {
        falling_data[i] = Math.round((falling_data[i - 1] - Math.random() * offset_number) * 100) / 100;
    }
    return falling_data;
}

function createHighVariationExample() {
    var base_number = Math.floor(Math.random() * 100000) / 100;
    var offset_number = Math.floor(base_number * 0.5);
    var high_variation_data = [base_number];
    for (var i = 1; i < 50; i++) {
        high_variation_data[i] = Math.round((base_number + Math.random() * offset_number * (1 - 2 * Math.round(Math.random()))) * 100) / 100;
    }
    return high_variation_data;
}

// #---# Plot functions #---#

// --- Updates the whole plot with all graphs ---
function updatePlot() {
    deleteOldPlot();
    createNewPlot();
    showLegend();
    drawGraph(input_time, input_data, input_data_color);
    drawGraph(moving_average_time, moving_average, moving_average_color);
    drawGraph(single_exponential_smoothing_time, single_exponential_smoothing, single_exponential_smoothing_color);
    drawGraph(double_exponential_smoothing_time, double_exponential_smoothing, double_exponential_smoothing_color);
}

// --- Deletes the old plot, if it exists ---
function deleteOldPlot() {
    var to_be_deleted = $("#svg");
    if (to_be_deleted != null) {
        to_be_deleted.remove();
    }
}

// --- Creates a new plot in form of an svg ---
function createNewPlot() {
    // Get the coordinates of the boundary points
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

// TODO --- Draws the legend for the graphs ---
function showLegend() { }

// --- Draws a graph including points and their connection lines
function drawGraph(x_vec, y_vec, color) {
    drawPoints(x_vec, y_vec, color);
    drawLines(x_vec, y_vec, color);
}

// --- Draws points (first point is (x_vec[0], y_vec[0])) in the given color ---
function drawPoints(x_vec, y_vec, color) {
    if (x_vec.length === y_vec.length) {
        for (var i = 0; i < x_vec.length; i++) {
            if (!isNaN(x_vec[i]) && !isNaN(y_vec[i])) {
                $(document.createElementNS('http://www.w3.org/2000/svg', 'circle')).attr({
                    cx: x(x_vec[i]),
                    cy: y(y_vec[i]),
                    r: 2,
                    fill: color,
                    stroke: color,
                }).appendTo("#svg");
            }
        }
    }
}

// --- Draws lines between two consecutive points (first point is (x_vec[0], y_vec[0])) in the given color ---
function drawLines(x_vec, y_vec, color) {
    if (x_vec.length === y_vec.length) {
        for (var i = 1; i < x_vec.length; i++) {
            if (!isNaN(x_vec[i]) && !isNaN(y_vec[i]) && !isNaN(x_vec[i - 1]) && !isNaN(y_vec[i - 1])) {
                $(document.createElementNS('http://www.w3.org/2000/svg', 'line')).attr({
                    x1: x(x_vec[i - 1]),
                    y1: y(y_vec[i - 1]),
                    x2: x(x_vec[i]),
                    y2: y(y_vec[i]),
                    stroke: color,
                }).appendTo("#svg");
            }
        }
    }
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

// #---# Table operations #---#

// --- Returns a new row-element ---
function createNewRow() {
    var new_row = document.createElement("tr");
    return new_row;
}

// --- Removes the last row of the given table ---
function removeLastRow(table_id) {
    var table = document.getElementById(table_id);
    if (table.childElementCount > 0) {
        table.lastChild.remove();
    }
}

// --- Removes the given table (head and body) ---
function removeTable(table_id) {
    var table = document.getElementById(table_id);
    var table_head = document.getElementById(table_id + "-header");
    var table_headers = Array.from(table_head.children);
    table_headers.forEach(function (item, index) {
        item.remove();
    });
    var table_rows = Array.from(table.children);
    table_rows.forEach(function (item, index) {
        item.remove();
    });
}

// --- Adds a column to an existing table (vector should have the same length as the count of the table rows) ---
// if time === true, the value is formatted to integer
function addColumn(title, vector, time, table_id) {
    var table_header = document.getElementById(table_id + "-header");
    table_header.appendChild(createHeaderCell(title));
    var table = document.getElementById(table_id);
    var table_rows = Array.from(table.children);
    // If columns already exist, append the new column
    if (table_rows.length > 0) {
        table_rows.forEach(function (item, index) {
            item.appendChild(createCell(vector[index]), time);
        });
    }
    // Otherwise also create new rows
    else {
        vector.forEach(function (item, index) {
            addRowOneValue(item, time, table_id);
        })
    }
}

// --- Returns a table-head-element containing the given text ---
function createHeaderCell(text) {
    var text_node = document.createTextNode(text);
    var value_element = document.createElement("th");
    value_element.appendChild(text_node);
    return value_element;
}

// --- Returns a table-data-element containing the given value ---
// if time === true, the value is formatted to integer
function createCell(value, time) {
    // Don't show NaN values in the table
    if (isNaN(Number(value))) {
        var text_node = document.createTextNode("");
    }
    // Display time-data as integer
    else if (time === true) {
        var text_node = document.createTextNode(d3.format(".0f")(value));
    }
    // Otherwise display the value rounded to two decimal places
    else {
        var text_node = document.createTextNode(d3.format(".2f")(value));
    }
    var value_element = document.createElement("td");
    value_element.appendChild(text_node);
    return value_element;
}

// --- Adds a row with two values to the given table ---
// value1 is assumed to be a time value
function addRowTwoValues(value1, value2, table_id) {
    var table_node = document.getElementById(table_id);
    var new_row = createNewRow();
    var cell1 = createCell(value1, true);
    var cell2 = createCell(value2, false);
    new_row.append(cell1);
    new_row.append(cell2);
    table_node.append(new_row);
}

// --- Adds a row with one value to the given table ---
// if time === true, the value is formatted to integer
function addRowOneValue(value, time, table_id) {
    var table_node = document.getElementById(table_id);
    var new_row = createNewRow();
    var cell = createCell(value, time);
    new_row.append(cell);
    table_node.append(new_row);
}

// #---# Moving Average #---#

// TODO: Combine setter functions?
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
// --- calculate and display the new values and update the plot accordingly ---
function movingAverage() {
    removeMovingAverage();
    setN();
    calculateMovingAverage();
    addColumn("Time", moving_average_time, true, "moving-average-table");
    addColumn("Moving Average", moving_average, false, "moving-average-table");
    updatePlot();
    // Calculate and show the Errors
    [moving_average_error, moving_average_squared_error, moving_average_mse] = calculateErrors(moving_average_time, moving_average);
    showErrors(moving_average_error, moving_average_squared_error, moving_average_mse, "moving-average");
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
    var starting_period = means.filter(entry => isNaN(entry)).length;
    moving_average = means.filter(entry => !isNaN(entry));
    // The moving average predicts the demand from the period N (or N+1 if it is considered a forecast)
    // up to one period more than the historical data is given
    moving_average_time = Array.from({ length: moving_average.length }, (_, i) => i + starting_period + forecast_offset + 1);
}

// --- Toggles the offset of the moving average ---
function toggleOffset() {
    if (forecast_offset === true) {
        $("#offset-description").append("<div id='offset-false'>Moving average in period i includes value of period i</div>")
        document.getElementById("offset-true").remove();
        forecast_offset = false;
        moving_average_time.map(element => element - 1);
    }
    else {
        $("#offset-description").append("<div id='offset-true'>Moving average in period i does not include value of period i (forecast)</div>")
        document.getElementById("offset-false").remove();
        forecast_offset = true;
        moving_average_time.map(element => element + 1);
    }
    // Update the moving average
    movingAverage();
    // Update the plot to show the shifted graph
    updatePlot();
}

// --- Deletes everything regarding the moving average ---
function removeMovingAverage() {
    moving_average = [];
    drawGraph(moving_average, moving_average_color);
    removeTable("moving-average-table");
}

// #---# Single Exponential Smoothing #---#

// --- Set alpha for Single Exponential Smoothing (only for 0 <= alpha <= 1) ---
function setSesAlpha() {
    var newAlpha = $("#set-ses-alpha").val();
    if (newAlpha !== "" && newAlpha >= 0 && newAlpha <= 1) {
        ses_alpha = newAlpha;
        $("#ses-alpha-value").text(ses_alpha);
        $("#set-ses-alpha").val("");
    }
}

// --- Delete previous calculations if they exist, set alpha, calculate and ---
// --- display the new values and update the plot accordingly ---
function singleExponentialSmoothing() {
    removeSingleExponentialSmoothing();
    setSesAlpha();
    calculateSingleExponentialSmoothing();
    addColumn("Time", single_exponential_smoothing_time, true, "single-exponential-smoothing-table");
    addColumn("Single Exponential Smoothing", single_exponential_smoothing, false, "single-exponential-smoothing-table");
    updatePlot();
    // Calculate and show the Errors
    [single_exponential_smoothing_error, single_exponential_smoothing_squared_error, single_exponential_smoothing_mse] = calculateErrors(single_exponential_smoothing_time, single_exponential_smoothing);
    showErrors(single_exponential_smoothing_error, single_exponential_smoothing_squared_error, single_exponential_smoothing_mse, "single-exponential-smoothing");
}

// --- Calculates the values of the Single Exponential Smoothing ---
function calculateSingleExponentialSmoothing() {
    single_exponential_smoothing = new Float64Array(input_data.length).fill(NaN);
    // Initialization (forecast for the second period is demand of the first period)
    single_exponential_smoothing[0] = (input_data[0]);
    // Computation
    for (var i = 1; i < input_data.length; i++) {
        single_exponential_smoothing[i] = ses_alpha * input_data[i] + (1 - ses_alpha) * single_exponential_smoothing[i - 1];
    }
    // The Single Exponential Smoothing predicts the demand from period 2 up to
    // one period more than the historical data is given
    single_exponential_smoothing_time = Array.from({ length: single_exponential_smoothing.length }, (_, i) => i + 2);
}

// --- Deletes everything regarding the Single Exponential Smoothing ---
function removeSingleExponentialSmoothing() {
    single_exponential_smoothing = [];
    drawGraph(single_exponential_smoothing, single_exponential_smoothing_color);
    removeTable("single-exponential-smoothing-table");
}

// #---# Double Exponential Smoothing #---#

// --- Set alpha for Double Exponential Smoothing (only for 0 <= alpha <= 1) ---
function setDesAlpha() {
    var newAlpha = $("#set-des-alpha").val();
    if (newAlpha !== "" && newAlpha >= 0 && newAlpha <= 1) {
        des_alpha = newAlpha;
        $("#des-alpha-value").text(des_alpha);
        $("#set-des-alpha").val("");
    }
}

// --- Set beta for Double Exponential Smoothing (only for 0 <= alpha <= 1) ---
function setDesBeta() {
    var newBeta = $("#set-des-beta").val();
    if (newBeta !== "" && newBeta >= 0 && newBeta <= 1) {
        des_beta = newBeta;
        $("#des-beta-value").text(des_beta);
        $("#set-des-beta").val("");
    }
}

// --- Delete previous calculations if they exist, set alpha and beta, calculate and ---
// --- display the new values and update the plot accordingly ---
function doubleExponentialSmoothing() {
    removeDoubleExponentialSmoothing();
    setDesAlpha();
    setDesBeta();
    calculateDoubleExponentialSmoothing();
    addColumn("Time", double_exponential_smoothing_time, true, "double-exponential-smoothing-table");
    addColumn("Level", des_a_values, false, "double-exponential-smoothing-table");
    addColumn("Trend", des_b_values, false, "double-exponential-smoothing-table");
    addColumn("Double Exponential Smoothing", double_exponential_smoothing, false, "double-exponential-smoothing-table");
    updatePlot();
    // Calculate and show the Errors
    [double_exponential_smoothing_error, double_exponential_smoothing_squared_error, double_exponential_smoothing_mse] = calculateErrors(double_exponential_smoothing_time, double_exponential_smoothing);
    showErrors(double_exponential_smoothing_error, double_exponential_smoothing_squared_error, double_exponential_smoothing_mse, "double-exponential-smoothing");
}

// --- Calculates the values of the Double Exponential Smoothing ---
function calculateDoubleExponentialSmoothing() {
    double_exponential_smoothing = new Float64Array(input_data.length + 1).fill(NaN);
    des_a_values = new Float64Array(input_data.length + 1).fill(NaN);
    des_b_values = new Float64Array(input_data.length + 1).fill(NaN);
    // Initialize the a-value
    des_a_values[0] = input_data[0];
    // Initialize the b-value
    des_b_values[0] = input_data[1] - input_data[0];
    // Computation
    for (var i = 1; i < input_data.length + 1; i++) {
        des_a_values[i] = des_alpha * input_data[i] + (1 - des_alpha) * (des_a_values[i - 1] + des_b_values[i - 1]);
        des_b_values[i] = des_beta * (des_a_values[i] - des_a_values[i - 1]) + (1 - des_beta) * des_b_values[i - 1];
        double_exponential_smoothing[i] = des_a_values[i - 1] + des_b_values[i - 1];
    }
    double_exponential_smoothing_time = Array.from({ length: double_exponential_smoothing.length }, (_, i) => i + 1);
}

// --- Deletes everything regarding the single exponential smoothing ---
function removeDoubleExponentialSmoothing() {
    double_exponential_smoothing = [];
    des_a_values = [];
    des_b_values = [];
    drawGraph(double_exponential_smoothing, double_exponential_smoothing_color);
    removeTable("double-exponential-smoothing-table");
}

// #---# Errors #---#

// --- Returns the deviation of the forecast from the demand and the squared deviation for each period and the MSE ---
function calculateErrors(x_vec, y_vec) {
    var error = new Float64Array(x_vec.length).fill(NaN);
    var squared_error = new Float64Array(x_vec.length).fill(NaN);
    var mse, sum_squared_error;
    x_vec.forEach(function (item, index) {
        error[index] = y_vec[index] - input_data[item - 1];
        squared_error[index] = error[index] ** 2;
    })
    var squared_error_no_nans = squared_error.filter(e => !isNaN(e));
    sum_squared_error = squared_error_no_nans.reduce((total, value) => total + value);
    mse = (sum_squared_error / squared_error.length);
    return [error, squared_error, mse];
}

// --- Toggles the visibility of the Errors ---
function toggleErrors() {
    if (show_errors === false) {
        show_errors = true;
        $("#toggle-errors").attr("value", "Hide Errors");
        $("#error-description").append("<div id='show-errors-true'>Errors shown.</div>");
        document.getElementById("show-errors-false").remove();
    }
    else {
        show_errors = false;
        hideMSEs();
        $("#toggle-errors").attr("value", "Show Errors");
        $("#error-description").append("<div id='show-errors-false'>Errors hidden.</div>");
        document.getElementById("show-errors-true").remove();
    }
    reloadTables();
}

// --- Shows the MSE of the given method ---
function showMSE(method, value) {
    document.getElementById(method + "-mse").innerHTML = "<div>&nbsp;&nbsp;-&nbsp;&nbsp;MSE =&nbsp;</div><div class='stressed-text'>" + d3.format(".6f")(value) + "</div>";
}

// --- Hide the MSE ---
function hideMSEs() {
    document.getElementById("moving-average-mse").innerHTML = "";
    document.getElementById("single-exponential-smoothing-mse").innerHTML = "";
    document.getElementById("double-exponential-smoothing-mse").innerHTML = "";
}

// --- Reloads the tables to show/hide the error calculations ---
function reloadTables() {
    if (moving_average.length > 0) {
        movingAverage();
        if (show_errors) { showMSE("moving-average", moving_average_mse); }
    }
    if (single_exponential_smoothing.length > 0) {
        singleExponentialSmoothing();
        if (show_errors) { showMSE("single-exponential-smoothing", single_exponential_smoothing_mse); }
    }
    if (double_exponential_smoothing.length > 0) {
        doubleExponentialSmoothing();
        if (show_errors) { showMSE("double-exponential-smoothing", double_exponential_smoothing_mse); }
    }
}

// --- Shows the errors, if show_errors is true ---
function showErrors(error_vec, squared_error_vec, mse, method) {
    if (show_errors) {
        addColumn("Error", error_vec, false, method + "-table");
        addColumn("Squared Error", squared_error_vec, false, method + "-table");
        showMSE(method, mse);
    }
}