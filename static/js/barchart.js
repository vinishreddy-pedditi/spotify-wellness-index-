function drawBarChartByYear(year1 = null, year2 = null, country = null) {
  // Setup chart dimensions and margins
  const svgWidth = 400, svgHeight = 300;
  const margin = { top: 50, right: 20, bottom: 80, left: 60 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  // Select the chart container and add an SVG element
  const svg = d3.select('#barchart').append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
    const tooltip = d3.select("body").append("div")
    .attr("class", "bartooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("padding", "10px")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px");
  // Load and process the CSV data
  d3.csv('static/data/viz.csv').then(data => {
    if (year1 && year2) {
      data = data.filter(d => d.year >= year1 && d.year <= year2);
    }
    if (country) {
      data = data.filter(d => d.Country === country);
    }

    // Aggregate data by artist and compute average positivity
    const artistScores = d3.rollups(data, v => {
      const avg = (d3.mean(v, d => +d.valence) + d3.mean(v, d => +d.speechiness) + 
                   d3.mean(v, d => +d.danceability) + d3.mean(v, d => +d.liveness) + 
                   d3.mean(v, d => +d.energy)) / 5;
      return avg;
    }, d => d.artist)
    .map(([artist, positivity]) => ({ artist, positivity }));

    // Sort by positivity and take top 5
    artistScores.sort((a, b) => d3.descending(a.positivity, b.positivity));
    const topArtists = artistScores.slice(0, 5);

    // Set up scales
    const xScale = d3.scaleBand()
      .domain(topArtists.map(d => d.artist))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(topArtists, d => d.positivity)])
      .range([height, 0]);

      const barWidth = xScale.bandwidth();
    const depth = 10; // Depth of the 3D effect



    // Draw bars with reduced width and steelblue color
    svg.selectAll(".bar")
    .data(topArtists)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.artist))
    .attr("y", d => yScale(d.positivity))
    .attr("width", xScale.bandwidth())
    .attr("height", d => height - yScale(d.positivity))
    .attr("fill", "#4f772d")
    .on("click", function(event, d) {
        if (artist === d.artist) {
          artist = null; // Deselect the artist if already selected
          d3.select(this).attr("fill", "#4f772d"); // Change color back to default
        } else {
          artist = d.artist; // Store the clicked artist in the global variable
          d3.selectAll(".bar").attr("fill", "#4f772d"); // Reset color of all bars
          d3.select(this).attr("fill", "#ecf39e"); // Change color of the clicked bar
        }
        console.log("Selected artist:", artist)
        document.getElementById("piechart").innerHTML="";
        drawPieChart(scatter_years.start.toString(),scatter_years.end.toString(),null);
        drawArtistDistribution(scatter_years.start,scatter_years.end,artist)
      })
    .on("mouseover", function(event, d) {
      tooltip.style("visibility", "visible")
             .html(`<strong>Artist:</strong> ${d.artist}<br><strong>WI:</strong> ${(d.positivity * 100).toFixed(2)}%`)
             .style("top", (event.pageY - 10) + "px")
             .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("visibility", "hidden");
    });


    // Add x-axis with reduced font size for tick labels
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "10px"); // Reduced font size

    // Add y-axis with percentage format
    svg.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".0%")))
      .selectAll("text")
      .style("font-size", "10px");

    // Chart title with reduced font size
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 0 - margin.top / 2)
      .attr("text-anchor", "middle")
      .style("fill", "white") // Title font size
      .style("font-size", "14px") // Title font size
      .text(`Top 5 Artists by Avg Index${year1 && year2 ? `: ${year1}-${year2}` : ''}${country ? ` in ${country}` : ''}`)
  });
}
function drawArtistDistribution(year1=null,year2=null,artistName) {
  d3.csv('static/data/viz.csv').then(function(data) {
    console.log("Loaded Data:", data); // Check what the data looks like

    // Filter data for the specified artist
    data = data.filter(item => item.artist === artistName);
    console.log("Filtered Data:", data); // Check the filtered data

    // Aggregate data to count songs by country
    const aggregatedData = d3.rollups(data, 
      group => ({ count: group.length }),
      d => d.Country // Make sure this field is correct and matches the CSV header
    );
    console.log("Aggregated Data:", aggregatedData); // Check the aggregation result

    const scores = Array.from(aggregatedData, ([country, data]) => ({ country, score: data.count }));
    const scoreExtent = d3.extent(scores, d => d.score);
    console.log("Scores and Extent:", scores, scoreExtent); // Check scores and their extent

    const colorScale = d3.scaleSequential(d3.interpolateGreens)
                         .domain([0, scoreExtent[1]]);

    const svgWidth = 860;
    const svgHeight = 490;
    document.getElementById("geomap").innerHTML="";
    const svg = d3.select('#geomap').html('').append('svg') // Clear and append new SVG
                  .attr('width', svgWidth)
                  .attr('height', svgHeight);

    svg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 100)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text(`${artist} Region${year1 && year2 ? `: ${year1}-${year2}` : ''}`)
    .style("fill","white");

    const projection = d3.geoOrthographic()
      .scale(180)
      .translate([svgWidth / 2, svgHeight / 2 + 70])
      .clipAngle(90);
    const path = d3.geoPath().projection(projection);

    svg.call(d3.drag().on('drag', function(event) {
      const rotate = projection.rotate();
      const k = event.dy / svgHeight * 360; // Sensitivity factor
      const newRotate = [rotate[0] + event.dx * 0.5, rotate[1] - k];
      projection.rotate(newRotate);
      svg.selectAll("path").attr("d", path);
    }));

    const tooltip = d3.select("body").append("div")
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
          const countryData = scores.find(s => s.country === d.properties.name);
          return countryData ? colorScale(countryData.score) : "#ccc";
        })
        .on("mouseover", function(event, d) {
          const countryData = scores.find(item => item.country === d.properties.name);
          const songCount = countryData ? countryData.score : "Unknown";
          const countryName = d.properties.name;
          d3.select(this).attr("stroke", "black");
        tooltip.html(`<strong>Artist:</strong> ${artistName}<br><strong>Country:</strong> ${countryName}<br><strong>Songs:</strong> ${songCount}`)

            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px")
            .style("display", "block");
        })
        .on("mouseout", function() {
          d3.select(this).attr("stroke", "white");
          tooltip.style("display", "none");
        });
    });
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

// drawArtistDistribution("Jessie J"); // Replace "Drake" with the actual artist name you want to visualize





// Example call to the function for a specific range of years and country
drawBarChartByYear();






