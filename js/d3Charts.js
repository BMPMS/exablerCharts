

const scatterChart = ()  => {

    let props = {};
    let title = "";
    let chartWidth = 0;
    let chartHeight = 0;
    let svg = undefined;

    const chart = (svg) => {

        const margin = { left: 100, right: 30, top: 70, bottom: 60 };
        const { data, dotAttributes, fontSize, format, labels, scales, xVar, yVar } = props;

        const xExtent = d3.extent(data, (d) => +d[xVar]);

        const xScale = d3[scales.x]()
            .domain(xExtent)
            .range([0, chartWidth - margin.left - margin.right]).nice();

        const yExtent = d3.extent(data, (d) => +d[yVar]);

        const yScale = d3[scales.y]()
            .domain(yExtent)
            .range([chartHeight - margin.top - margin.bottom, 0]).nice();

        let titleLabel = svg.select(".titleLabel");
        let xAxisLabel = svg.select(".xAxisLabel");
        let yAxisLabel = svg.select(".yAxisLabel");
        let xAxis = svg.select(".xAxis");
        let yAxis = svg.select(".yAxis");

        if(xAxis.node() === null){
            // append if initial draw
            titleLabel = svg.append("text").attr("class","titleLabel");
            xAxisLabel = svg.append("text").attr("class","xAxisLabel");
            yAxisLabel = svg.append("text").attr("class","yAxisLabel");
            xAxis = svg.append("g").attr("class","xAxis");
            yAxis = svg.append("g").attr("class","yAxis");
        }

        titleLabel
            .attr("x", chartWidth / 2)
            .attr("y", fontSize * 2)
            .attr("text-anchor", "middle")
            .attr("font-size", fontSize * 1.2)
            .attr("fill", "#484848")
            .html(title);

        xAxisLabel
            .attr("x", margin.left + (chartWidth - margin.left - margin.right) / 2)
            .attr("y", chartHeight - fontSize)
            .attr("text-anchor", "middle")
            .attr("font-size", fontSize)
            .attr("fill", "grey")
            .html(labels.xAxis);

        yAxisLabel
            .attr(
                "transform",
                `translate(25,${
                    margin.top + (chartHeight - margin.top - margin.bottom) / 2
                }) rotate(-90)`
            )
            .attr("text-anchor", "middle")
            .attr("font-size", fontSize)
            .attr("fill", "grey")
            .html(labels.yAxis);

        xAxis
            .call(d3.axisBottom(xScale).ticks(5).tickFormat((d) => d3.format(format.x)(d)).tickSizeOuter(0))
            .attr("transform", `translate(${margin.left},${chartHeight - margin.bottom})`);

        xAxis.selectAll("path").style("stroke", "#A0A0A0");

        xAxis.selectAll("line").attr("display", "none");

        xAxis
            .selectAll("text")
            .attr("pointer-events", "none")
            .attr("font-weight", 300)
            .attr("fill", "grey")
            .attr("y", 5)
            .attr("font-size", fontSize);

        yAxis
            .call(d3.axisLeft(yScale).ticks(5).tickSizeOuter(0))
            .attr("transform", `translate(${margin.left},${margin.top})`);

        yAxis.selectAll("path").style("stroke", "#A0A0A0");

        yAxis.selectAll("line").attr("display", "none");

        yAxis
            .selectAll("text")
            .attr("pointer-events", "none")
            .attr("font-weight", 300)
            .attr("x", -5)
            .attr("fill", "grey")
            .attr("font-size", fontSize)
            .text((d) => (d === 0 ? "" : d3.format(format.y)(d)));

        const { defaultFill, opacity, radius, strokeWidth } = dotAttributes;

        const dotGroup = svg
            .selectAll(".dotGroup")
            .data(data)
            .join((group) => {
                const enter = group.append("g").attr("class", "dotGroup");
                enter.append("circle").attr("class", "dotCircle");
                return enter;
            });

        dotGroup.attr("transform", `translate(${margin.left},${margin.top})`);

        dotGroup
            .select(".dotCircle")
            .attr("r", radius)
            .attr("cx", (d) => xScale(+d[xVar]))
            .attr("cy", (d) => yScale(+d[yVar]))
            .attr("fill-opacity", opacity)
            .attr("stroke", defaultFill)
            .attr("stroke-width", strokeWidth)
            .attr("fill", defaultFill);




    }

    chart.title =  (value) => {
        if (!value) return title;
        title = value;
        return chart;
    };

    chart.chartWidth =  (value) => {
        if (!value) return chartWidth;
        chartWidth = value;
        return chart;
    };

    chart.chartHeight =  (value) => {
        if (!value) return chartHeight;
        chartHeight = value;
        return chart;
    };

    chart.props =  (value) => {
        if (!value) return props;
        props = value;
        return chart;
    };

    return chart;
}
