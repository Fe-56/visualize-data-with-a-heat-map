import React, { useEffect } from 'react';
import * as d3 from 'd3';

const Heatmap = (props) => {
    const height = 650;
    const width = 1200;
    const padding = 60;
    const dataset = [];
    let baseTemperature;

    useEffect(() => {
        fetch("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json")
        .then(res => res.json())
        .then((result) => {
            baseTemperature = result.baseTemperature;

            for (let i = 0; i < result.monthlyVariance.length; i++) {
                dataset.push({
                    year: result.monthlyVariance[i].year,
                    monthRaw: result.monthlyVariance[i].month - 1,
                    month: toMonthName(result.monthlyVariance[i].month),
                    temperature: Math.round((baseTemperature + result.monthlyVariance[i].variance) * 10)/10,
                    variance: result.monthlyVariance[i].variance
                })
            }

            const yearMin = d3.min(dataset, (item) => item.year);
            const yearMax = d3.max(dataset, (item) => item.year);
            document.getElementById("description").innerHTML = `${yearMin} - ${yearMax}<br />Base Temperature: ${baseTemperature} ℃`;            

            const yearMinDate = numberToYearDate(yearMin);
            const yearMaxDate = numberToYearDate(yearMax);

            const xScale = d3.scaleTime()
                            .domain([yearMinDate, yearMaxDate])
                            .range([0, width]);
            const xAxis = d3.axisBottom()
                            .scale(xScale)
                            .ticks(d3.timeYear.every(10));
            const yScale = d3.scaleBand()
                            .domain([
                                "January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"
                            ])
                            .range([0, height - padding])
            const yAxis = d3.axisLeft(yScale);

            d3.select("#holder")
                .append("svg")
                .attr("width", width + 100)
                .attr("height", height)
                .append("g")
                .call(xAxis)
                .attr('id', 'x-axis')
                .attr("transform", `translate(70, ${height - padding})`)
                .attr("color", "white");

            d3.select("svg")
                .append("g")
                .call(yAxis)
                .attr("id", "y-axis")
                .attr("transform", `translate(70, 0)`)
                .attr("color", "white");

            d3.select("svg")
                .append("text")
                .attr("x", width/2)
                .attr("y", height - 20)
                .style("font-size", "12px")
                .attr("fill", "white")
                .text("Year");

            d3.select("svg")
                .append("text")
                .attr("x", 10)
                .attr("y", height/2)
                .attr("transform", `rotate(-90, 10, ${height/2})`)
                .style("font-size", "12px")
                .attr("fill", "white")
                .text("Month")

            const temperatureMax = d3.max(dataset, (item) => item.temperature);
            const temperatureMin = d3.min(dataset, (item) => item.temperature);

            const colorScale = d3.scaleSequential()
                                .interpolator(d3.interpolateRdYlBu)
                                .domain([temperatureMax, temperatureMin]);

            d3.select("svg")
                .selectAll("rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("class", "cell")
                .attr("data-month", (item) => {
                    return item.monthRaw;
                })
                .attr("data-year", (item) => {
                    return item.year;
                })
                .attr("data-temp", (item) => {
                    return item.temperature;
                })
                .attr("x", (item) => {
                    return xScale(numberToYearDate(item.year)) + 70;
                })
                .attr("y", (item) => {
                    return yScale(item.month);
                })
                .attr("width", () => {
                    return width / (yearMax - yearMin + 1);
                })
                .attr("height", () => {
                    return (height - padding)/12;
                })
                .attr("fill", (item) => {
                    return colorScale(item.temperature);
                })
                .on("mouseover", (event, item) => {
                    let tooltipTextColor = colorScale(item.temperature);
                    let tooltipText = `${item.month} ${item.year}<br />${item.temperature}℃<br />Variance: ${item.variance}℃`;
                    d3.select(event.currentTarget)
                        .style("stroke", "black")
                        .style("opacity", 1);
                    const tooltip = document.getElementById("tooltip");
                    tooltip.style.visibility = "visible";
                    tooltip.style.color = tooltipTextColor;

                    if ((item.temperature < 3.0) || (item.temperature > 13.0)){
                        tooltip.style.backgroundColor = "white";
                    }

                    else{
                        tooltip.style.backgroundColor = "transparent";
                    }

                    tooltip.innerHTML = tooltipText;
                    tooltip.setAttribute("data-year", d3.select(event.currentTarget).attr("data-year"));
                })
                .on("mouseout", (event) => {
                    document.getElementById("tooltip").style.visibility = "hidden";
                    d3.select(event.currentTarget)
                        .style("stroke", "none");
                })

                const legendWidth = 600;
                const legendHeight = 100;

                const legendScale = d3.scaleLinear()
                                        .domain([temperatureMin, temperatureMax])
                                        .range([0, legendWidth]);
                const legendAxis = d3.axisBottom(legendScale);

                d3.select("#legend")
                    .append("svg")
                    .attr("id", "legend-svg")
                    .attr("height", legendHeight)
                    .attr("width", legendWidth)

                d3.select("#legend-svg")
                    .append("g")
                    .call(legendAxis)
                    .attr("transform", `translate(0, ${legendHeight - 40})`)
                    .attr("color", "white")

                const legendScaleValues = Array.from({length: 12}, (_, i) => i + 2);

                d3.select("#legend-svg")
                    .selectAll("rect")
                    .data(legendScaleValues)
                    .enter()
                    .append("rect")
                    .attr("x", (item) => {
                        return legendScale(item);
                    })
                    .attr("y", legendHeight - 40 - 30)
                    .attr("width", legendWidth/legendScaleValues.length)
                    .attr("height", 30)
                    .attr("fill", (item) => {
                        return colorScale(item);
                    })
        })
    }, []);

    return (
        <div id="holder"></div>
    )
}

// from https://bobbyhadz.com/blog/javascript-convert-month-number-to-name
function toMonthName(monthNumber) {
    const date = new Date();
    date.setMonth(monthNumber - 1);
  
    return date.toLocaleString('en-US', {
        month: 'long',
    });
}

function numberToYearDate(yearNumber){
    let date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setDate(1);
    date.setMonth(7);
    date.setFullYear(yearNumber);
    return date;
}

export default Heatmap;