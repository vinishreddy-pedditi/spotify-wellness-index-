function drawGenreDistribution(genreName) {
  d3.csv('static/viz.csv').then(function(data) {
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
    const svgHeight = 550;
    const svg = d3.select('#chart1').html('').append('svg')
                  .attr('width', svgWidth)
                  .attr('height', svgHeight);

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
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid 1px black")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("display", "none")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    d3.json('static/world.geojson').then(function(world) {
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
  });
}

drawGenreDistribution("pop, Dance/Electronic"); // Replace "Pop" with the desired genre
