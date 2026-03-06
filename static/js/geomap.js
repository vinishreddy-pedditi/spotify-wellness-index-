function createGeoMap(year1,year2) {
  d3.csv('static/data/viz.csv').then(function(data) {
    
    let filteredData = data;
    if (year1 && year2) {
      filteredData = data.filter(item => item.year >= year1 && item.year <= year2);
      console.log("Filtered data:", filteredData);
    }

    // Calculate average of specified attributes for each country
    const aggregatedData = d3.rollups(filteredData, 
      group => {
        let avgValence = d3.mean(group, g => +g.valence);
        let avgSpeechiness = d3.mean(group, g => +g.speechiness);
        let avgDanceability = d3.mean(group, g => +g.danceability);
        let avgLiveness = d3.mean(group, g => +g.liveness);
        let avgEnergy = d3.mean(group, g => +g.energy);
        return {
          score: (avgValence + avgSpeechiness + avgDanceability + avgLiveness + avgEnergy) / 5,
          count: group.length
        };
      },
      d => d.Country
    );

    const scores = Array.from(aggregatedData, ([Country, data]) => ({ Country, score: data.score }));
    const scoreExtent = d3.extent(scores, d => d.score);
    const colorScale = d3.scaleSequential(d3.interpolateGreens)
                         .domain(scoreExtent);

    const svgWidth = 860;
const svgHeight = 490;
const svg = d3.select('#geomap').append('svg')
  .attr('width', svgWidth)
  .attr('height', svgHeight);

// Add text and map as before
svg.append("text")
  .attr("x", svgWidth / 2)
  .attr("y", 100)
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .text(`World Avg Indexes${year1 && year2 ? `: ${year1}-${year2}` : ''}`)
  .style("fill","white");

const projection = d3.geoOrthographic()
  .scale(170)
  .translate([svgWidth / 2, svgHeight / 2 + 70])
  .clipAngle(90);
const path = d3.geoPath().projection(projection);

svg.call(d3.drag().on('drag', function(event) {
  let rotation = projection.rotate();
  projection.rotate([rotation[0] + event.dx / 2, rotation[1] - event.dy / 2]);
  svg.selectAll("path").attr("d", path);
}));

const geotooltip = d3.select("body").append("div")
  .attr("class", "geotooltip")
  .style("position", "absolute")
  .style("background-color", "white")
  .style("border", "solid 1px black")
  .style("padding", "5px")
  .style("border-radius", "5px")
  .style("display", "none")
  .style("pointer-events", "none")
  .style("z-index", "1000");
    d3.json('static/data/world.geojson').then(function(world) {
      svg.selectAll(".country")
        .data(world.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", function(d) {
          const countryScore = scores.find(s => s.Country === d.properties.name);
          return countryScore ? colorScale(countryScore.score) : "#ccc";
        })
        .attr("stroke", "white")
        .on("mouseover", function(event, d) {
        const countryData = scores.find(item => item.Country === d.properties.name);
          const positivity = countryData ? `${(countryData.score * 100).toFixed(2)}%` : "Unknown";
          const countryName = d.properties.name;
          d3.select(this).attr("stroke", "black");
          geotooltip.html(`<strong>Country:</strong> ${countryName}<br><strong>WI:</strong> ${positivity}`)


            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px")
            .style("display", "block");
        })
        .on("mouseout", function() {
          d3.select(this).attr("stroke", "white");
          geotooltip.style("display", "none");
        })
        .on("click", function(event, d) {
          const countryName = d.properties.name;
          country = [countryName]; 
          // console.log('Selected country:', countryName);
          console.log('Selected country:', country);

          document.getElementById("piechart").innerHTML="";
          document.getElementById("barchart").innerHTML="";
          document.getElementById("areachart").innerHTML="";
          document.getElementById("tp_country").innerHTML=countryName;
          drawPieChart( scatter_years.start.toString(), scatter_years.end.toString(),country[0]);
          drawBarChartByYear( scatter_years.start.toString(), scatter_years.end.toString(),country[0]);
          drawAreaChart( scatter_years.start.toString(), scatter_years.end.toString(),country[0]);
          get_unique_artists(scatter_years.start.toString(), scatter_years.end.toString(),country[0]);
        });
    });
const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "linear-gradient");

    linearGradient.selectAll("stop")
      .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    const legendWidth = 20;
    const legendHeight = 200;

    svg.append("rect")
      .attr("x",60)
      .attr("y", 100)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#linear-gradient)");

    const legendScale = d3.scaleLinear()
      .domain(scoreExtent)
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
  .tickFormat(d3.format(".0%")); // Format ticks as percentages without decimal places

svg.append("g")
  .attr("transform", `translate(${80}, 100)`)
  .call(legendAxis);
  console.log()
  const zoomSlider = d3.select("#zoom-slider");
document.getElementById("zoom-slider").value=3;
  zoomSlider.on("input", function () {
    const zoomValue = +this.value;
    projection.scale(50 * zoomValue);
    svg.selectAll("path").attr("d", path);
  });
  const rotationSpeed = 0.2; // Adjust the speed of rotation as needed

function rotateMap() {
    // Get the current rotation
    let rotation = projection.rotate();

    // Update the rotation
    projection.rotate([rotation[0] + rotationSpeed, rotation[1]]);

    // Update the paths
    svg.selectAll("path").attr("d", path);
}

// Call the rotateMap function periodically to create rotation effect
setInterval(rotateMap, 10); // Adjust the interval for smoother or faster rotation
  });
}

createGeoMap(null,null);  // Call the function without a specific year to see all data


