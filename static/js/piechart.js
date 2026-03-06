function drawPieChart(year1 = null, year2 = null, country = null) {
    // Read the CSV file
    d3.csv('static/data/viz.csv').then(function(data) {
        // Filter data based on the selected year range and country, if specified
        if (year1 && year2) {
            data = data.filter(d => d.year >= year1.toString() && d.year <= year2.toString());
        }
        if (country) {
            data = data.filter(d => d.Country === country);
        }

        // Process and prepare data
        const genreAttributes = {};
        data.forEach(d => {
            if (!genreAttributes[d.genre]) {
                genreAttributes[d.genre] = { total: 0, count: 0 };
            }
            const average = (parseFloat(d.valence) + parseFloat(d.speechiness) + parseFloat(d.danceability) + parseFloat(d.liveness) + parseFloat(d.energy)) / 5;
            genreAttributes[d.genre].total += average;
            genreAttributes[d.genre].count++;
        });

        const genresWithPositivity = Object.keys(genreAttributes).map(genre => {
            const attrs = genreAttributes[genre];
            return { genre: genre, positivity: attrs.total / attrs.count };
        }).sort((a, b) => b.positivity - a.positivity).slice(0, 5);
        const width = 500, height = 500;
        const svg = d3.select("#piechart").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(250, 250)");
            svg.append("text")
            .attr("x",10)
            .attr("y", -130) // Positioning the title at y=20px from the top
            .attr("text-anchor", "middle") // Centering the text
            .style("font-size", "14px")
            .style("fill", "white")
            .style("font-weight", "bold")
            .text(`Top 5 Genres by Avg Index${year1 && year2 ? `: ${year1}-${year2}` : ''}${country ? ` in ${country}` : ''}`)
        // Define the color scale
        const color = d3.scaleOrdinal().range(["#31572c", "#4f772d", "#90a955", "#ecf39e", "#132a13"]);

        // Create a radius scale based on positivity values
        const radiusScale = d3.scaleSqrt()
                              .domain([0, d3.max(genresWithPositivity, d => d.positivity)])
                              .range([10, 120]); // Adjust range to control minimum and maximum sizes

        const pie = d3.pie().value(d => d.positivity);
        const arc = d3.arc().innerRadius(0)
                    .outerRadius(d => radiusScale(d.data.positivity));  // Use the dynamic radius for each slice

        // Add a drop shadow for a 3D effect
        const defs = svg.append("defs");
        const filter = defs.append("filter")
            .attr("id", "dropshadow")
            .attr("height", "130%");
        
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 3)
            .attr("result", "blur");
        filter.append("feOffset")
            .attr("dx", 2)
            .attr("dy", 2)
            .attr("result", "offsetBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur");
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");

        // Tooltip setup
        const tooltip = d3.select("body").append("div")
                .attr("class", "pie-tooltip")
                .style("position", "absolute")
    .style("visibility", "hidden")
    .style("padding", "10px")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")

        // Draw the arcs with the shadow for 3D effect
        const arcs = svg.selectAll(".arc")
            .data(pie(genresWithPositivity))
            .enter().append("g")
            .attr("class", "arc")
            .on("click", function(event, d) {
                if (genre === d.data.genre) {
                    genre = null; // Deselect the genre if already selected
                    d3.select(this).select("path").attr("fill", color(d.index)); // Change color back to default
                } else {
                    genre = d.data.genre; // Store the clicked genre in the global variable
                    d3.selectAll(".arc path").attr("fill", color); // Reset color of all arcs
                    d3.select(this).select("path").attr("fill", "#ffd449"); // Change color of the clicked arc
                }
                console.log("Selected genre:", genre);
                document.getElementById("barchart").innerHTML="";
                drawBarChartByYear(scatter_years.start.toString(),scatter_years.end.toString(),null);
                drawGenreDistribution(scatter_years.start,scatter_years.end,genre)
            });

        arcs.append("path")
            .attr("fill", (d, i) => color(i))
            .attr("d", arc)
            .style("filter", "url(#dropshadow)")
            .on("mouseover", function(event, d) {
                // tooltip.html(`Genre: ${d.data.genre}<br>WI: ${(d.data.positivity * 100).toFixed(2)}%`)
                tooltip.html(`<strong>Genre:</strong> ${d.data.genre}<br><strong>WI:</strong> ${(d.data.positivity* 100).toFixed(2)}%`)
                    .style("visibility", "visible");
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                       .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
            });

        // Add text labels inside arcs
        arcs.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .style("fill", "#353535")
            .attr("dy", "0.35em")
            .style("font-size", "10px")
            .style("text-anchor", "middle")
            .text(d => d.data.genre);

    });
}

// Example usage:
// Draw the chart for a specific year and country
drawPieChart();


function drawGenreDistribution(year1=null,year2=null,genreName) {
    d3.csv('static/data/viz.csv').then(function(data) {
      console.log("Loaded Data:", data); // Debugging: Check loaded data
  
      // Filter data for the specified genre
      data = data.filter(item => item.genre.includes(genreName)); // Assuming the genre field might contain multiple genres separated by some delimiter
      console.log("Filtered Data:", data); // Debugging: Check filtered data
  
      // Aggregate data to count genre occurrences by country
      const aggregatedData = d3.rollups(data, 
        group => ({ count: group.length }),
        d => d.Country // Ensure this matches the CSV header
      );
      console.log("Aggregated Data:", aggregatedData); // Debugging: Check aggregation
  
      const scores = Array.from(aggregatedData, ([country, data]) => ({ country, score: data.count }));
      const scoreExtent = d3.extent(scores, d => d.score);
      console.log("Scores and Extent:", scores, scoreExtent); // Debugging: Check scores and extent
  
      const colorScale = d3.scaleSequential(d3.interpolateGreens)
                           .domain([0, scoreExtent[1]]); // Color scale based on occurrence
  
                           const svgWidth = 860;
                           const svgHeight = 490;
      const svg = d3.select('#geomap').html('').append('svg')
                    .attr('width', svgWidth)
                    .attr('height', svgHeight);
  
    svg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 100)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text(`${genre} Region${year1 && year2 ? `: ${year1}-${year2}` : ''}`)
    .style("fill","white");



      const projection = d3.geoOrthographic()
        .scale(180)
        .translate([svgWidth / 2, svgHeight / 2 + 70])
        .clipAngle(90);
      const path = d3.geoPath().projection(projection);
  
      svg.call(d3.drag().on('drag', function(event) {
        const rotate = projection.rotate();
        const k = event.dy / svgHeight * 360; // Sensitivity factor for rotation
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
            const genreCount = countryData ? countryData.score : "Unknown";
            const countryName = d.properties.name;
            d3.select(this).attr("stroke", "black");
            tooltip.html(`<strong>Genre:</strong> ${genreName}<br><strong>Country:</strong> ${countryName}<br><strong>Occurrences:</strong> ${genreCount}`)
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
  const rotationSpeed = 0.4 // Adjust the speed of rotation as needed

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
  
//   drawGenreDistribution("pop, Dance/Electronic"); // Replace "Pop" with the desired genre
  