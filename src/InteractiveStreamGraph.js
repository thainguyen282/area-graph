import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
  componentDidUpdate(){
    const chartData = this.props.csvData;
    console.log("Rendering chart with data:", chartData);
    // Don't render if data is empty
    if (!chartData || chartData.length === 0) {
        return;
    }
    
    // Define the LLM model names to visualize
    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];

    // Write the D3.js code to create the interactive streamgraph visualization here

    chartData.forEach(d => {
      d.Date = new Date(d.Date); 
    });

    const margin = { top: 100, right: 30, bottom: 40, left: 40 };
    const width = 500;
    const height = 600;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(".svg_parent").attr("width", width).attr("height", height)
      .selectAll(".chart-group").data([null]).join("g").attr("class", "chart-group")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const stack = d3.stack().keys(llmModels).order(d3.stackOrderNone).offset(d3.stackOffsetWiggle);
    const stackedData = stack(chartData);
    let yMin = Infinity;
    let yMax = -Infinity;
    
    stackedData.forEach(layer => {
      layer.forEach(d => {
        yMin = Math.min(yMin, d[0], d[1]);
        yMax = Math.max(yMax, d[0], d[1]);
      });
    });
    const colorScale = d3.scaleOrdinal().domain(llmModels).range("orange,blue,red,green,purple".split(","));
    const xScale = d3.scaleTime().domain(d3.extent(chartData, d => d.Date)).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([yMin-100, yMax]).range([innerHeight, 0]);

    svg.selectAll(".xaxis").data([null]).join("g").attr("class", "xaxis").attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(12).tickFormat(d3.timeFormat("%b")));

    const areaGenerator = d3.area().x(d => xScale(d.data["Date"])).y0(d => yScale(d[0])).y1(d => yScale(d[1])).curve(d3.curveCardinal);
    svg.selectAll('path.stream-path').data(stackedData).join('path').attr('class', 'stream-path').style('fill', d => colorScale(d.key)).attr('d', areaGenerator);
    const legend = svg.append("g").attr("class", "legend").attr("transform", `translate(${width - 50}, 50)`);
    llmModels.reverse().forEach((key, i) => {
      const legendRow = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      legendRow.append("rect").attr("width", 15).attr("height", 15).attr("fill", colorScale(key)).attr("opacity", 0.7);
      legendRow.append("text").attr("x", 20).attr("y", 12).text(key).style("font-size", "12px");
    });
    const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("position", "absolute")
    .style("background", "#f5efe8").style("color", "black").style("padding", "18px").style("border-radius", "4px").style("font-size", "12px").style("display", "none");

    tooltip.html(`<div class="chart-container"></div>`);
    const tooltipWidth = 320;
    const tooltipHeight = 160;
    const bar_margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const bar_innerWidth = tooltipWidth - bar_margin.left - bar_margin.right;
    const bar_innerHeight = tooltipHeight - bar_margin.top - bar_margin.bottom;

    const container = tooltip.select(".chart-container");
    const svgtooltip = container.append("svg").attr("width", tooltipWidth).attr("height", tooltipHeight);
    const innerChart = svgtooltip.append("g").attr("transform", `translate(${bar_margin.left}, ${bar_margin.top})`);
    svg.selectAll("path.stream-path")
    .on("mouseover", function(event, d) {
      tooltip.style("display", "block").style("left", `${event.pageX}px`).style("top", `${event.pageY - 50}px`)
        .select("strong").text(d.key);

      const barData = chartData.map(row => ({
        month: d3.timeFormat("%b")(row.Date),
        count: row[d.key],
        key: d.key
      }));

      const xScale = d3.scaleBand()
        .domain(barData.map(d => d.month)).range([0, bar_innerWidth]).padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.count)]).range([bar_innerHeight, 0]);

      // Update axes
      innerChart.selectAll(".x-axis").data([null]).join("g").attr("class", "x-axis")
      .attr("transform", `translate(0, ${bar_innerHeight})`).call(d3.axisBottom(xScale)).selectAll("text")
      .style("font-size", "10px").style("text-anchor", "center");

      innerChart.selectAll(".y-axis").data([null]).join("g").attr("class", "y-axis")
      .call(d3.axisLeft(yScale).ticks(4)).selectAll("text").style("font-size", "10px");

      const bars = innerChart.selectAll("rect").data(barData, d => d.month);
      bars.join(
        enter => enter.append("rect")
          .attr("x", d => xScale(d.month)).attr("width", xScale.bandwidth()).attr("y", d => yScale(d.count))
          .attr("height", d => bar_innerHeight - yScale(d.count)).attr("fill", d => colorScale(d.key)),
        update => update
          .attr("x", d => xScale(d.month)).attr("y", d => yScale(d.count))
          .attr("width", xScale.bandwidth()).attr("height", d => bar_innerHeight - yScale(d.count))
          .transition().delay(300).duration(500).attr("fill", d => colorScale(d.key)),
        exit => exit.transition().duration(500).style("opacity", 0).remove()
      );
    })
    .on("mousemove", function(event) {
      tooltip.style("left", `${event.pageX - 50}px`)
            .style("top", `${event.pageY + 25}px`);
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    });
  }
  render() {
    return (
      <div>
        <svg style={{ width: 700, height: 800 }} className="svg_parent">
        </svg>
      </div>
    );
  }
}

export default InteractiveStreamGraph;
