// --- --- Initialization --- ---

// Sources:
// Calculate Moving Average: https://observablehq.com/@d3/moving-average
// Format numbers: http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e

// Dimensions of the coordinate system graphic
var width = 500;
var height = 500;
var margin = ({ top: 15, right: 15, bottom: 25, left: 30 });

// Stores the id of the currently active tab
var current_id = "start";

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
document.getElementById("set-ses-alpha").addEventListener("keyup", function(e) { if (e.key === "Enter") { singleExponentialSmoothing(); } }, false);
document.getElementById("set-des-alpha").addEventListener("keyup", function(e) { if (e.key === "Enter") { doubleExponentialSmoothing(); } }, false);
document.getElementById("set-des-beta").addEventListener("keyup", function(e) { if (e.key === "Enter") { doubleExponentialSmoothing(); } }, false);

/*
// ### Possible option if multiple elements exist, where the Enter-functionality is needed ###
// --- Add data when "Enter" is pressed ---
// --- Create an EventListener for all elements with the class form-text ---
var inputs = $(".form-text");
// [... ] converts HTMLCollection to an array
[...inputs].forEach(function (item, index) {
    item.addEventListener("keyup", function (e) { if (e.key === "Enter") { pressEnter(item); } }, false);
});
// --- Execute the corresponding set- function of the element where Enter is pressed ---
function pressEnter(element) {
    $("#set-" + element.id + "").click();
}
*/

// #---# General functions #---#

function initialize() {
    // Initialize the plot
    updatePlot();
}

function removeCalculations() {
    removeMovingAverage();
    removeSingleExponentialSmoothing();
}

// --- Adds new value to input_data, displays it in the table, removes all calculations and updates the plot ---
function addInputData() {
    // Get value of number field
    var newValue = $("#input-data").val();
    // Only continue, if a value is entered
    if (newValue.length > 0) {
        // Add the value to the array
        input_data.push(Number(newValue));

        // Don't use example data -> remove button
        useExampleData(false);

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
function showTab(id) {
    var old_id = current_id;
    current_id = id;

    if (old_id === current_id) {
        current_id = "start";
    }

    var oldChild = document.getElementById(old_id + "-content-inner");
    var newChild = document.getElementById(current_id + "-content-inner");

    document.getElementById("page-content").replaceChild(newChild, oldChild);

    document.getElementById(old_id + "-content").appendChild(oldChild);

    var oldTab = document.getElementById(old_id);
    oldTab.classList.toggle('selected');
    oldTab.innerText = oldTab.getAttribute("short");

    var newTab = document.getElementById(current_id);
    newTab.classList.toggle('selected');
    newTab.innerText = newTab.getAttribute("long");

    if (current_id != "start") {
        document.getElementById(current_id).className = "selected";
    }
}

function useExampleData(bool) {
    if (bool === true) {
        // Fill input_data with example values
        //input_data = [106.8, 129.2, 153.0, 149.1, 158.3, 132.9, 149.8, 140.3, 138.3, 152.2, 128.1];
        //input_data = [134.5, 106.8, 129.2, 153.0, 149.1, 158.3, 132.9, 149.8, 140.3, 138.3, 152.2, 128.1];
        input_data = [670.00, 699.40, 700.30, 608.18, 600.55, 626.06, 655.80, 687.99, 718.28, 690.11, 700.00, 726.15, 711.85, 662.13, 762.64, 795.00, 780.90, 779.09, 818.00, 801.26, 812.44, 843.64, 855.12, 869.67, 845.00, 855.00, 877.02, 844.68, 814.29, 830.00];
        displayData(input_data, "input-data-table");
        updatePlot();
    }
    var exampleDataBtn = document.getElementById("use-example-data");
    if (exampleDataBtn !== null){
        exampleDataBtn.remove();
    }
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

    x = d3.scaleLinear().domain([1, input_data.length+1]).range([margin.left, width - margin.right]);
    y = d3.scaleLinear().domain([y_start_0 ? d3.min([0, d3.min(input_data)]) : d3.min(input_data), d3.max(input_data)]).range([height - margin.bottom, margin.top]);
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

    // TODO: Clean up the code

    var textWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textWrapper.setAttributeNS(null, "x", 20);
    textWrapper.setAttributeNS(null, "y", 10);
    textWrapper.setAttributeNS(null, "fill", input_data_color);
    textWrapper.setAttributeNS(null, "font-size", "10");

    var textNode = document.createTextNode("Input");
    textWrapper.appendChild(textNode);
    document.getElementById("svg").appendChild(textWrapper);

    var textWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textWrapper.setAttributeNS(null, "x", 60);
    textWrapper.setAttributeNS(null, "y", 10);
    textWrapper.setAttributeNS(null, "fill", moving_average_color);
    textWrapper.setAttributeNS(null, "font-size", "10");

    var textNode = document.createTextNode("MA");
    textWrapper.appendChild(textNode);
    document.getElementById("svg").appendChild(textWrapper);

    var textWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textWrapper.setAttributeNS(null, "x", 100);
    textWrapper.setAttributeNS(null, "y", 10);
    textWrapper.setAttributeNS(null, "fill", single_exponential_smoothing_color);
    textWrapper.setAttributeNS(null, "font-size", "10");

    var textNode = document.createTextNode("SES");
    textWrapper.appendChild(textNode);
    document.getElementById("svg").appendChild(textWrapper);

    var textWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textWrapper.setAttributeNS(null, "x", 140);
    textWrapper.setAttributeNS(null, "y", 10);
    textWrapper.setAttributeNS(null, "fill", double_exponential_smoothing_color);
    textWrapper.setAttributeNS(null, "font-size", "10");

    var textNode = document.createTextNode("DES");
    textWrapper.appendChild(textNode);
    document.getElementById("svg").appendChild(textWrapper);

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
        if (index > 0){
            single_exponential_smoothing.push(ses_alpha*item + (1-ses_alpha)*single_exponential_smoothing[index]);
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

    //console.log(des_alpha + ", " + des_beta);


    // Initialization
    double_exponential_smoothing.push(NaN);
    //double_exponential_smoothing.push(NaN);

    des_a_values.push(input_data[0]);

    // TODO: Null-Wert abfangen!
    des_b_values.push(input_data[1] - input_data[0]);

    // Computation
    input_data.forEach(function (item, index) {
        //console.log("a-values: " + des_a_values + ", b-values: " + des_b_values);
        if (index > 0){
            des_a_values.push((des_alpha*input_data[index])+(1-des_alpha)*(des_a_values[index-1]+des_b_values[index-1]));
            des_b_values.push(des_beta*(des_a_values[index]-des_a_values[index-1])+(1-des_beta)*des_b_values[index-1]);
            double_exponential_smoothing.push(des_a_values[index-1]+des_b_values[index-1]);
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
