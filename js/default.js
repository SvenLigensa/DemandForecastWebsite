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
var input_time = [];
var input_data = [];

// Moving Average
// Number of periods
var N = 3;
// Forecast values
var moving_average_time = []
var moving_average = [];

// Single Exponential Smoothing
// Smoothing factor
var ses_alpha = 0.2;
// Forecast values
var single_exponential_smoothing_time = []
var single_exponential_smoothing = [];

// Double Exponential Smoothing
// Data smoothing factor
var des_alpha = 0.2;
var des_a_values = [];
// Trend smoothing factor
var des_beta = 0.2;
var des_b_values = [];
// Forecast values
var double_exponential_smoothing_time = [];
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
        input_time.push(input_time.length + 1);

        // If it is the first entry, create the table from scratch
        if (input_data.length === 1){
            addColumn("Time", input_time, "input-data-table");
            addColumn("Demand", input_data, "input-data-table");
        }
        // Show the new data in the input-data-table
        else {
            addRowTwoValues(input_time[input_time.length - 1], input_data[input_data.length - 1], "input-data-table");
        }
        
        // Clear all calculations as they are not up to date anymore
        removeCalculations();
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
    removeTable("moving-average-table");
    addColumn("Moving Average", moving_average, "moving-average-table");
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
        removeTables();
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
        input_time = Array.from({ length: input_data.length }, (_, i) => i + 1);
        addColumn("Time", input_time, "input-data-table");
        addColumn("Demand", input_data, "input-data-table");
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
    var offset_number = Math.floor(base_number / Math.random(Math.floor(base_number)));
    var rising_data = [base_number];
    for (var i = 1; i < 50; i++) {
        rising_data[i] = Math.round((rising_data[i - 1] + Math.random(offset_number)) * 100) / 100;
    }
    return rising_data;
}

function createFallingExample() {
    var base_number = Math.floor(Math.random() * 100000) / 100;
    var offset_number = Math.floor(base_number / Math.random(Math.floor(base_number)));
    var falling_data = [base_number];
    for (var i = 1; i < 50; i++) {
        falling_data[i] = Math.round((falling_data[i - 1] - Math.random(offset_number)) * 100) / 100;
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

// #---# Table operations #---#

// Removes the last row of the given table
function removeLastRow(table_id) {
    var table = document.getElementById(table_id);
    if (table.childElementCount > 0) {
        table.lastChild.remove();
    }
}

// Removes the whole body of the given table
function removeTable(table_id) {
    var table = document.getElementById(table_id);
    var table_head = document.getElementById(table_id + "-header");
    var table_headers = Array.from(table_head.children);
    table_headers.forEach(function (item, index){
        item.remove();
    });
    var table_rows = Array.from(table.children);
    table_rows.forEach(function (item, index) {
        item.remove();
    });
}

// Adds a column to an existing table (vector has to have the same length!!!!)
function addColumn(title, vector, table_id) {
    var table_header = document.getElementById(table_id + "-header");
    table_header.appendChild(createHeaderCell(title));
    var table = document.getElementById(table_id);
    var table_rows = Array.from(table.children);
    // If columns already exist, append the new column
    if (table_rows.length > 0){
        table_rows.forEach(function (item, index) {
            item.appendChild(createCell(vector[index]));
        });
    }
    // Otherwise also create new rows
    else {
        vector.forEach(function (item, index) {
            addRowOneValue(item, table_id);
        })
    }
}

// Returns a new row-element
function createNewRow() {
    var new_row = document.createElement("tr");
    return new_row;
}

// Returns a table-head-element containing the given text
function createHeaderCell(text) {
    var text_node = document.createTextNode(text);
    var value_element = document.createElement("th");
    value_element.appendChild(text_node);
    return value_element;
}

// Returns a table-data-element containing the given value
function createCell(value) {
    var text_node = document.createTextNode(d3.format(".2f")(value));
    var value_element = document.createElement("td");
    value_element.appendChild(text_node);
    return value_element;
}

// Adds a row with two values to the given table
function addRowTwoValues(value1, value2, table_id) {
    var table_node = document.getElementById(table_id);
    var new_row = createNewRow();
    var cell1 = createCell(value1);
    var cell2 = createCell(value2);
    new_row.append(cell1);
    new_row.append(cell2);
    table_node.append(new_row);
}

// Adds a row with one value to the given table
function addRowOneValue(value, table_id) {
    var table_node = document.getElementById(table_id);
    var new_row = createNewRow();
    var cell = createCell(value);
    new_row.append(cell);
    table_node.append(new_row);
}

function removeTables(){
    removeTable("input-data-table");
    removeTable("moving-average-table")
    removeTable("single-exponential-smoothing-table");
    removeTable("double-exponential-smoothing-table");
}

function deleteLastColumn(table_id){
    return table_id;
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
    addColumn("Time", moving_average_time, "moving-average-table");
    addColumn("Moving Average", moving_average, "moving-average-table");
    updatePlot();
}

// --- Deletes everything regarding the moving average ---
function removeMovingAverage() {
    moving_average = [];
    if (forecast_offset === true) {
        moving_average.push(NaN);
    }
    removeTable("moving-average-table");
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

    moving_average_time = Array.from({ length: moving_average.length }, (_, i) => i + 1);
}

// #---# Single Exponential Smoothing #---#

function singleExponentialSmoothing() {
    removeSingleExponentialSmoothing();
    setSesAlpha();
    calculateSingleExponentialSmoothing();
    addColumn("Time", single_exponential_smoothing_time, "single-exponential-smoothing-table");
    addColumn("Single Exponential Smoothing", single_exponential_smoothing, "single-exponential-smoothing-table");
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

    single_exponential_smoothing_time = Array.from({ length: single_exponential_smoothing.length }, (_, i) => i + 1);
}

// --- Deletes everything regarding the single exponential smoothing ---
function removeSingleExponentialSmoothing() {
    single_exponential_smoothing = [];
    removeTable("single-exponential-smoothing-table");
    updateGraph(single_exponential_smoothing, single_exponential_smoothing_color);
}


// #---# Double Exponential Smoothing #---#

function doubleExponentialSmoothing() {
    removeDoubleExponentialSmoothing();
    setDesAlpha();
    setDesBeta();
    calculateDoubleExponentialSmoothing();
    addColumn("Time", double_exponential_smoothing_time, "double-exponential-smoothing-table");
    addColumn("a-Werte", des_a_values, "double-exponential-smoothing-table");
    addColumn("b-Werte", des_b_values, "double-exponential-smoothing-table");
    addColumn("Double Exponential Smoothing", double_exponential_smoothing, "double-exponential-smoothing-table");
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

    double_exponential_smoothing_time = Array.from({ length: double_exponential_smoothing.length }, (_, i) => i + 1);
}

// --- Deletes everything regarding the single exponential smoothing ---
function removeDoubleExponentialSmoothing() {
    double_exponential_smoothing = [];
    des_a_values = [];
    des_b_values = [];
    removeTable("double-exponential-smoothing-table");
    updateGraph(double_exponential_smoothing, double_exponential_smoothing_color);
}
