function plotScatterplot(data) {
    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 20, bottom: 35, left: 20},
        width = 600 - margin.right - margin.left,
        height = 350 - margin.top - margin.bottom;

    var svg = d3.select("#scatterid")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("x", width / 2 - 20)
        .attr("y", 325)
        .attr("fill", "white")
        .attr("font-family", "sans-serif")
        .attr("font-size", "14px")
        .text("Time")

        svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -180)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-family", "sans-serif")
        .attr("font-size", "14px")
        .text("Valence");

    var x = d3.scaleLinear()
    .domain([1995,2025])
    .range([30,width ]);

    svg.append("g")
        .attr("class", "x-scatter")
        .call(d3.axisBottom(x).ticks(8))
        .attr("transform", "translate(0," + height + ")")
        .selectAll("text")
    .style("fill", "white"); // Change color of tick labels to white

    var y = d3.scaleLinear()
    .domain([0, 1])
    .range([height, 0])

    svg.append("g")
        .call(d3.axisLeft(y).ticks(6))
        .attr("class", "y-scatter")
        .attr("transform", "translate(30, 0)")
        .selectAll("text")
        .style("fill", "white") // Change color of tick labels to white
        
        
        svg.selectAll(".domain")
        .style("stroke", "white") // Change color of axis line to white
        svg.selectAll(".tick line")
        .style("fill", "white") // Change color of axis line to white
        


    svg.append("text")
        .attr("x", 210)
        .attr("y", 5)
        .attr("fill", "white")
        .attr("font-family", "Gill Sans")
        .attr("font-size", "14px")
        .text("Time vs Valence")

        svg.selectAll(".x-scatter .tick line")
        .style("stroke", "white"); // Change color of tick lines to white
    
    svg.selectAll(".y-scatter .tick line")
        .style("stroke", "white"); // Change color of tick lines to white
    var circles = svg.append("g")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", 3)
        .attr("cx", (d) => x(+d.x))
        .attr("cy", (d) => y(+d.y))
        .attr("class", "non_brushed")
        .attr("opacity","0.2");

    function highlightBrushedCircles(selection) {
    if (!selection) return;

    var brush_coords = d3.brushSelection(this);

    circles.attr("class", "non_brushed");

    circles.filter(function (d) {
        var cx = x(d.x), cy = y(d.y);
        return isBrushed(brush_coords, cx, cy);
    })
    .attr("class", "brushed");
}

function displayTable(selection) {
    if (!selection) return;

    // d3.select(this).call(brush.move, null);
    console.log("ENDED")
    var d_brushed = d3.selectAll(".brushed").data();
    console.log("brushed", d_brushed)
    scatterPlotListener(d_brushed);
}

var brush = d3.brush()
    .on("brush", highlightBrushedCircles)
    .on("end", displayTable);

svg.append("g")
    .call(brush);



function isBrushed(brush_coords, cx, cy) {

    var x0 = brush_coords[0][0], x1 = brush_coords[1][0],
        y0 = brush_coords[0][1], y1 = brush_coords[1][1];
    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

}


function scatterPlotListener(brushed_data)
{
    console.log(brushed_data)
    var xValues = brushed_data.map(function(d) { return d.x; });
    var minX = Math.min(...xValues);
    var maxX = Math.max(...xValues);
    scatter_years.start = minX
    scatter_years.end = maxX
    console.log("Min X:", minX);
    console.log("Max X:", maxX);
    document.getElementById("geomap").innerHTML="";
    document.getElementById("piechart").innerHTML="";
    document.getElementById("barchart").innerHTML="";
    document.getElementById("areachart").innerHTML="";
    document.getElementById("tp_year").innerHTML=minX.toString()+"-"+maxX.toString();
    createGeoMap(minX.toString(),maxX.toString()); 
    drawPieChart(minX.toString(),maxX.toString(),country[0]);
    drawBarChartByYear(minX.toString(),maxX.toString(),country[0]);
    drawAreaChart(minX.toString(),maxX.toString(),country[0]);
    get_unique_artists(minX.toString(),maxX.toString(),country[0]);
}