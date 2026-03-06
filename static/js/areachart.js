function drawAreaChart(year1 = null, year2 = null, country = null) {
    const width = 630;
const height = 340;
    const container = d3.select("#areachart");
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const margin = {top: 20, right: 20, bottom: 30, left: 50};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().range([0, innerWidth]);
    const y = d3.scaleLinear().range([innerHeight, 0]);
    const color = ["#132a13","#ecf39e","#31572c", "#90a955", "#4f772d"];

    const area = d3.area()
        .x(d => x(d.data.valence))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const tooltip = d3.select("body").append("div")
    .attr("class", "areatooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("padding", "10px")
    .style("background", "rgba(255, 255, 255, 0.8)")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px");
    d3.csv("static/data/viz.csv", d => ({
        valence: +d.valence,
        danceability: +d.danceability,
        energy: +d.energy,
        speechiness: +d.speechiness,
        liveness: +d.liveness,
        year: +d.year,
        country: d.Country
    })).then(function(data) {
        let filteredData = data;
        if (year1 && year2) {
            filteredData = filteredData.filter(d => d.year >= year1 && d.year <= year2);
        }
        if (country) {
            filteredData = filteredData.filter(d => d.country === country);
            console.log(filteredData)
        }

        const groupedData = Array.from(d3.rollup(filteredData, v => ({
            speechiness: d3.mean(v, d => d.speechiness),
            danceability: d3.mean(v, d => d.danceability),
            liveness: d3.mean(v, d => d.liveness),
            energy: d3.mean(v, d => d.energy)
        }), d => d.valence), ([key, value]) => ({ valence: key, ...value }))
            .sort((a, b) => a.valence - b.valence);

        const keys = ['speechiness', 'danceability', 'liveness', 'energy'];
        const stack = d3.stack().keys(keys);
        const layers = stack(groupedData);

        x.domain(d3.extent(groupedData, d => d.valence));
        y.domain([0, d3.max(layers, layer => d3.max(layer, sequence => sequence[1]))]);

        g.selectAll(".layer").remove();
        g.selectAll(".layer")
        .data(layers)
        .enter().append("path")
        .attr("class", "layer")
        .attr("d", area)
        .style("fill", (d, i) => color[i])
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                   .html(() => `${keys[d.index]}`)
                   .style("top", (event.pageY - 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
          });

        

        g.select(".x-axis").remove();
        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));

        g.select(".y-axis").remove();
        g.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

            svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text(`Attributes contributing to Valence${year1 && year2 ? `: ${year1}-${year2}` : ''}${country ? ` in ${country}` : ''}`)
            .style("fill","white");

            svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom+60 / 2) // Adjust y position for the label
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "white")
            .text("Valence");






    });
}

// Example usage with custom width and height

drawAreaChart();
