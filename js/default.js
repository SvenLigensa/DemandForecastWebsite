// Important takeaways: Dont reference an array, copy it (functions may not work)
//
//

// --- --- Initialization --- ---

// https://drive.google.com/drive/folders/1DDzK-aQ8csvOZT9Un-Vp22syeYbHDcBT
// Test values: 106.8 129.2 153.0 149.1 158.3 132.9 149.8 140.3 138.3 152.2 128.1

// Dimensions of the coordinate system graphic
var width = 500;
var height = 500;
var margin = ({top: 15, right: 15, bottom: 25, left: 25});

// Variable storing, if the y axis of the diagram starts at zero
var y_start_0 = false;
var forecast_offset = false;

var input_data_color = "#58D68D";
var moving_average_color = "#E74C3C";

// Stores the entered values
var data = [];

// Number of periods (Moving Average)
var N = 3;
// Prediction of moving average
var moving_average = [];

// Initialize the plot
updatePlots();

// --- --- Functions --- ---

// --- Delete the old plot and create a new one ---
// --- Should be called, when data is updated ---
// --- Necessary to update the axes dynamically ---

function updatePlots(){
    updatePlot(data, input_data_color);
    updatePlot(moving_average, moving_average_color);
}

function updatePlot(vector, color){
    if (vector == data){
        reloadAxes();
    }
    drawPoints(vector, color);
    drawLines(vector, color);
}

// Reload axes only, when the data is changed
function reloadAxes(){
    deleteOldPlot();
    createNewPlot();
}

function deleteOldPlot(){
    var to_be_deleted = document.getElementById("svg");
    if (to_be_deleted != null) {
        to_be_deleted.remove();
    }
}

function createNewPlot(){
    x = d3.scaleLinear().domain([1, data.length]).range([margin.left, width - margin.right]);
    y = d3.scaleLinear().domain([y_start_0 ? 0 : d3.min(data), d3.max(data)]).range([height - margin.bottom, margin.top]);
    xAxis = g => g
    .attr("transform", 'translate(0,'+(height - margin.bottom)+')')
    .call(d3.axisBottom(x).tickFormat(function(e){
        if (Math.floor(e)!=e){return;}return e;
    }));
    yAxis = g => g
    .attr("transform", 'translate('+(margin.left)+',  0)')
    .call(d3.axisLeft(y));

    const svg = d3.select("#svgcontainer").append("svg").attr("viewBox", [0, 0, width, height]).attr("id", "svg");
    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);
}

function drawPoints(vector, color){
    vector.forEach(function(item, index){
        if(!isNaN(vector[index])){
            $(document.createElementNS('http://www.w3.org/2000/svg','circle')).attr({
            id: "point" + index,
            cx: x(index+1),
            cy: y(vector[index]),
            r: 2,
            fill: color,
            stroke: color,
            }).appendTo("#svg");
        }
    });
}

function drawLines(vector, color){
    vector.forEach(function(item, index){
        if(index > 0){
            if(!isNaN(vector[index-1])){
                $(document.createElementNS('http://www.w3.org/2000/svg','line')).attr({
                    id: "line" + index,
                    x1: x(index),
                    y1: y(vector[index-1]),
                    x2: x(index+1),
                    y2: y(vector[index]),
                    stroke: color,
                    }).appendTo("#svg");
            }
        }
    });
}

// --- Add element ---
$("#add-data").on('click', function(){
    // Get value of number field
    var newValue = $("#demand").val();
    // Only continue, if a value is entered
    if(newValue.length > 0){
        // Add the value to the array
        data.push(Number(newValue));
        addRow(data[data.length-1], data.length, "input_data_table");
        updatePlot(data, input_data_color);
    }
    // Clear the input field
    $("#demand").val("");
});

// --- Delete element ---
$("#delete-data").on('click', function(){
    deleteRow(data.length, "input_data_table");
    data.pop();
    // Clear the data and table of the moving average
    eraseData(moving_average, "moving_average_table");
    moving_average = [];
    
    updatePlots();
});

// --- Add data when "Enter" is pressed ---
// Get the input field   ---- POSSIBLE FOR ALL INPUT FIELDS?? MULTIPLE ELEMENTS BY ID
var input = document.getElementById("demand");
input.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        $("#add-data").click();
    }
}); 

// --- Set N for moving average (only for positive N) ---
$("#set-n").on('click', function(){
    var newN = $("#n").val();
    if(newN > 0){
        N = newN;
        $("#n-value").text(N);
    }
});

// --- Calculate and display the moving average ---
$("#calculate-moving-average").on('click', function(){
    calcMovingAverage();
    displayData(moving_average, "moving_average_table");
    updatePlot(moving_average, moving_average_color);
});

// Displays the data in the corresponding table
function displayData(vector, table){
    vector.forEach(function(item, index){
        addRow(vector[index], index, table);
    });
}

// Adds one row to an existing table
function addRow(value, index, table){
    if (!isNaN(value)){
        $("#"+table+"").append("<div class='row' id= '"+table+"_row"+ index +"'> <div class='cell'>"+ index +"</div> <div class='cell'>"+ value +"</div> </div>");
    }
}

function eraseData(vector, table){
    vector.forEach(function(item, index){
        deleteRow(index+1, table);
    });
}

function deleteRow(index, table){
    var del_row = document.getElementById(table+"_row"+ index);
    if (del_row != null) {
        del_row.remove();
    }
}

// --- Calculates the moving average of data for N periods
// Source: https://observablehq.com/@d3/moving-average
function calcMovingAverage(){
    var i = 0;
    var sum = 0;
    var means = new Float64Array(data.length).fill(NaN);
    
    for (var n = Math.min(N-1, data.length); i<n; ++i){
        sum += data[i];
    }
    
    for (var n = data.length; i<n; ++i){
        sum += data[i];
        means[i] = sum/N;
        sum -= data[i-N+1];
    }
    
    means.forEach(function(item, index){
        moving_average[index] = Number(means[index]);
    });
    
}

// --- Toggles the visibility of the Moving Average section ---
$("#toggle-visibility").on('click', function(){
    var m_a = document.getElementById("moving-average");
    toggleVisibility(m_a);
});

function toggleVisibility(element){
    if (element != null){
        element.classList.toggle("visible");
        element.classList.toggle("hidden");
    }
}






// --- Toggles the y axis start
$("#toggle-y-scale").on('click', function(){
    
    if (y_start_0 == true){
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
$("#toggle-offset").on('click', function(){
    if (moving_average.length > 0){
        if (forecast_offset === true){
            forecast_offset = false;
            
            $("#offset-description").append("<div id='offset-false'>Moving average in period i includes value of period i</div>")
            var old_description = document.getElementById("offset-true");
            old_description.remove();
            
            moving_average.shift();
        }
        else{
            forecast_offset = true;
            
            $("#offset-description").append("<div id='offset-true'>Moving average in period i does not include value of period i (forecast)</div>")
            var old_description = document.getElementById("offset-false");
            old_description.remove();
            
            moving_average.unshift(Number(NaN));
        }
        updatePlots();
    }
});


// TODO
// function removeElement(id){}
// function createElement(element){}




