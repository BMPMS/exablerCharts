
const measureWidth = (text, fontSize) => {
    const context = document.createElement("canvas").getContext("2d");
    context.font = `${fontSize}px Arial`;
    return context.measureText(text).width;
}

const drawTable = (data,divId) => {
    if(data.length === 0) return;
    console.log(data);
    let tableStr = `<table><tr>`;
    Object.keys(data[0]).forEach((key) => {
        tableStr += `<th>${key}</th>`
    })
    tableStr += "</tr>";
    data.forEach((row) => {
        tableStr += "<tr>";
        Object.keys(data[0]).forEach((key) => {
            tableStr += `<td>${row[key]}</td>`
        })
        tableStr += "</tr>";
    })
    tableStr += "</table>"
    d3.select(`#${divId}`)
        .style("overflow","auto")
        .html(tableStr);

}
const drawLegend = (svg, legendData, fontSize, width, format, translateY) => {

    let accumulativeX = 0;
    const legendHeight = 12;

    legendData.forEach((d) => {
        d.xPos = accumulativeX;
        accumulativeX += measureWidth(d.group, fontSize + 2) + 35;
    })
    const menuGroup = svg.selectAll(".menuGroup")
        .data(legendData)
        .join((group) => {
            const enter = group.append("g").attr("class", "menuGroup");
            enter.append("rect").attr("class","menuRect");
            enter.append("text").attr("class","menuLabel");
            enter.append("text").attr("class","menuLabelResult");
            return enter;
        });

    menuGroup.attr("transform", `translate(${(width - accumulativeX)/2},${translateY})`)

    menuGroup.select(".menuRect")
        .attr("x",(d) => d.xPos)
        .attr("y",1)
        .attr("width",20)
        .attr("height",legendHeight)
        .attr("fill",(d) => d.fill)
        .attr("rx",2)
        .attr("ry",2);

    menuGroup.select(".menuLabel")
        .attr("x",(d) => d.xPos + 25)
        .attr("y",(d) => d.total ? 0 : 3 + legendHeight/2)
        .style("dominant-baseline","middle")
        .attr("font-size",fontSize)
        .attr("fill","#484848")
        .text((d) => d.group);

    menuGroup.select(".menuLabelResult")
        .attr("x",(d) => d.xPos + 25)
        .attr("y",9 + legendHeight/2)
        .style("dominant-baseline","middle")
        .attr("font-size",fontSize-2)
        .attr("fill","#808080")
        .text((d) => d.total ? d3.format(format)(d.total) : "");
}

const scatterChart = ()  => {

    let props = {};
    let title = "";
    let chartWidth = 0;
    let chartHeight = 0;
    let brushResultsCallback = "";

    const chart = (svg) => {

        const margin = { left: 100, right: 30, top: 70, bottom: 60 };
        const { data, dotAttributes, fontSize, format, labels, scales, tableDivId, tooltipVars, xVar, yVar } = props;

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
        let brushGroup = svg.select(".brushGroup");
        let dotGroup = svg.select(".dotGroup");

        if(xAxis.node() === null){
            // append if initial draw
            titleLabel = svg.append("text").attr("class","titleLabel");
            xAxisLabel = svg.append("text").attr("class","xAxisLabel");
            yAxisLabel = svg.append("text").attr("class","yAxisLabel");
            xAxis = svg.append("g").attr("class","xAxis");
            yAxis = svg.append("g").attr("class","yAxis");
            brushGroup = svg.append("g").attr("class","brushGroup");
            dotGroup = svg.append("g").attr("class","dotGroup");
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

        const { defaultFill, highlightFill, opacity, radius, strokeWidth } = dotAttributes;

        let currentBrushSelection = [[0,0],[0,0]];

        const dotsGroup = dotGroup
            .selectAll(".dotsGroup")
            .data(data)
            .join((group) => {
                const enter = group.append("g").attr("class", "dotsGroup");
                enter.append("circle").attr("class", "dotCircle");
                return enter;
            });

        dotsGroup.attr("transform", `translate(${margin.left},${margin.top})`);

        dotsGroup.on("mouseover", (event,d) => {
            const currentGroup = d3.select(event.currentTarget);
            currentGroup.raise();
            currentGroup.select(".dotCircle").attr("fill",highlightFill);
            let tooltipText = "";
            tooltipVars.forEach((t) =>  tooltipText += d[t] ? `<strong>${t}:</strong> ${d[t]}<br>` : "")
            d3.select(".chartTooltip")
                .style("visibility","visible")
                .style("left",`${event.x + 10}px`)
                .style("top",`${event.pageY}px`)
                .html(tooltipText)
        })
            .on("mouseout",() => {
                svg.selectAll(".dotCircle").attr("fill", (d) =>
                    isInRange(currentBrushSelection,d) ? highlightFill: defaultFill
                );
                d3.select(".chartTooltip")
                    .style("visibility","hidden");
            })

        dotsGroup
            .select(".dotCircle")
            .attr("r", radius)
            .attr("cx", (d) => xScale(+d[xVar]))
            .attr("cy", (d) => yScale(+d[yVar]))
            .attr("fill-opacity", opacity)
            .attr("stroke", defaultFill)
            .attr("stroke-width", strokeWidth)
            .attr("fill", defaultFill);

        const isInRange = (selection,d) => xScale(d[xVar]) >= selection[0][0] && xScale(d[xVar]) <= selection[1][0]
            && yScale(d[yVar]) >= selection[0][1] && yScale(d[yVar]) <= selection[1][1]
        const brushed = (event) => {
            if(!event.sourceEvent) return;
            const {selection} = event;
            currentBrushSelection = selection;
            svg.selectAll(".dotCircle")
                .attr("fill", (d) => isInRange(selection,d) ? highlightFill : defaultFill);

            const filteredData = data.reduce((acc, entry) => {
                if(isInRange(selection, entry)){
                    acc.push(entry)
                }
                return acc;
            },[]);
            brushResultsCallback(filteredData, tableDivId);

        }
        const brushExtent = [
            [0,0],
            [chartWidth - margin.left - margin.right, chartHeight - margin.top - margin.bottom]
        ];

        // brush
        const brush = d3.brush()
            .extent(brushExtent)
            .on("brush", brushed)
            .on("end",(event) => {
                if(event.selection === null){
                    currentBrushSelection = [[0,0],[0,0]]
                    svg.selectAll(".dotCircle").attr("fill", defaultFill);
                    brushResultsCallback([])
                }
            });

        // call brush and set to full
        brushGroup
            .attr(
                "transform",
                `translate(${margin.left},${margin.top})`
            )
            .call(brush)
            .call(brush.move, currentBrushSelection);

        // style overlay and selection
        brushGroup
            .select(".overlay")
            .style("fill", "transparent");

        brushGroup
            .select(".selection")
            .style("stroke-width",0)
            .style("fill","#A0A0A0");

    }

    chart.brushResultsCallback =  (value) => {
        if (!value) return brushResultsCallback;
        brushResultsCallback = value;
        return chart;
    };


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


const timeSeriesChart = ()  => {

    let props = {};
    let title = "";
    let chartWidth = 0;
    let chartHeight = 0;
    let baseSvg = undefined;

    const chart = (baseSvg) => {

        const margin = { left: 100, right: 30, top: 80, bottom: 60, brush: 30, middle: 40 };
        const {attributes, chartType,colors,data, fontSize, format, groupBy, labels,timeVar, timeBand} = props;
        const {brushBarCurve, barGap} = attributes;

        // x and y scales
        const xBandGroups = Array.from(d3.group(data, (d) => d3[timeBand](new Date(d[timeVar]))))
            .sort((a,b) => d3.ascending(a[0],b[0]));

        const groupBySet = groupBy ? [...new Set(data.map(d => d[groupBy]))] : [];

        if(groupBy){
            const legendData = groupBySet.reduce((acc, entry,index) => {
                acc.push({
                    group: entry,
                    fill: colors.groupBy[index]
                })
                return acc;
            },[]);

            drawLegend(baseSvg,legendData,14,chartWidth,"",45);
        }

        const xBands = xBandGroups.map((m) => m[0]);

        const xScale = d3
            .scaleBand()
            .domain(xBands)
            .range([0, chartWidth - margin.left - margin.right]);

        const xScaleBrush = d3.scaleBand()
            .domain(xBands)
            .range([0, chartWidth - margin.left - margin.right]);

        let xBandwidth = xScale.bandwidth();

        const yMax = d3.max(xBandGroups, (d) => d[1].length);

        const yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([chartHeight - margin.top-margin.middle-margin.bottom-margin.brush, 0]);

        const yScaleBrush = d3.scaleLinear()
            .domain([0, yMax])
            .range([margin.brush - brushBarCurve, 0]);

        let svg = baseSvg.select(".chartSvg");
        let brushGroup = baseSvg.select(".brushGroup");
        let titleLabel = svg.select(".titleLabel");
        let xAxis = svg.select(".yAxis");
        let yAxis = svg.select(".yAxis");
        let xAxisLabel = svg.select(".xAxisTitle");
        let yAxisLabel = svg.select(".yAxisTitle");
        let brushClipPathRect = svg.select(".brushClipPathRect");
        let mainClipPathRect = svg.select(".mainClipPathRect");
        let mainChartGroup = svg.select(".mainChartGroup");
        let brushChartGroup = svg.select(".brushChartGroup");
        let mainChartLine = svg.select(".mainChartLine");
        let brushChartLine = svg.select(".brushChartLine");

        if(svg.node() === null){
            // append if initial draw
            svg = baseSvg.append("g").attr("class","chartSvg");
            brushGroup = baseSvg.append("g").attr("class","brushGroup");
            xAxis = svg.append("g").attr("class","yAxis");
            yAxis = svg.append("g").attr("class","yAxis");
            titleLabel = svg.append("text").attr("class","titleLabel");
            xAxisLabel = svg.append("text").attr("class","xAxisLabel");
            yAxisLabel = svg.append("text").attr("class","yAxisLabel");
            brushClipPathRect = svg.append("clipPath").attr("id", "brushClipPath")
               .append("rect").attr("class","brushClipPathRect");
            mainClipPathRect = svg.append("clipPath").attr("id", "mainClipPath")
               .append("rect").attr("class","mainClipPathRect");
            mainChartGroup = svg.append("g").attr("class", "mainChartGroup");
            mainChartLine = mainChartGroup.append("path").attr("class","mainChartLine");
            brushChartGroup = svg.append("g").attr("class", "brushChartGroup");
            brushChartLine = brushChartGroup.append("path").attr("class","brushChartLine");
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
                `translate(30,${
                    margin.top + (chartHeight - margin.top - margin.bottom - margin.brush - margin.middle) / 2
                }) rotate(-90)`
            )
            .attr("text-anchor", "middle")
            .attr("font-size", fontSize)
            .attr("fill", "grey")
            .html(labels.yAxis);

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
            .attr("font-size", fontSize);

        brushClipPathRect
            .attr("width", chartWidth - margin.left - margin.right)
            .attr("height", margin.brush)
            .attr(
                "transform",
                `translate(${margin.left},${
                    chartHeight - margin.brush - margin.bottom - brushBarCurve
                })`
            );

        mainClipPathRect
            .attr("width", chartWidth - margin.left - margin.right)
            .attr("height", chartHeight - margin.bottom - margin.brush - margin.middle )
            .attr(
                "transform",
                `translate(${margin.left},0)`
            );;

        mainChartGroup.attr("clip-path", "url(#mainClipPath)");
        brushChartGroup.attr("clip-path", "url(#brushClipPath)");

        const line = d3.line()
            .x((d) => xScale(d[0]))
            .y((d) => yScale((d[1].length)));

        const brushLine = d3.line()
            .x((d) => xScale(d[0]))
            .y((d) => yScaleBrush((d[1].length)));

        brushChartLine
            .datum(chartType === "line/dot" ? xBandGroups : [])
            .attr("d", brushLine)
            .attr("fill", "none")
            .attr("stroke-width", 1)
            .attr("stroke", colors.line)
            .attr("transform", `translate(${margin.left + xBandwidth/2},${chartHeight - margin.bottom - margin.brush + brushBarCurve})`);


        const brushTickGroup = brushChartGroup
            .selectAll(".brushTickGroup")
            .data(xBandGroups)
            .join((group) => {
                const enter = group.append("g").attr("class", "brushTickGroup");
                enter.append("circle").attr("class", "tickDot");
                enter.append("rect").attr("class", "brushTickBar");
                return enter;
            });

        brushTickGroup.attr(
            "transform",
            `translate(${margin.left},${
                chartHeight - margin.brush - margin.bottom  + brushBarCurve
            })`
        );

        brushTickGroup.select(".tickDot")
            .attr("display", chartType === "line/dot" ? "block" : "none")
            .attr("cx",(d) => xScale(d[0]) + xBandwidth/2)
            .attr("cy",(d) => yScaleBrush(d[1].length))
            .attr("fill",colors.dot)
            .attr("r",brushBarCurve)

        brushTickGroup.select(".brushTickBar")
            .attr("display", chartType === "bar" ? "block" : "none")
            .attr("rx",brushBarCurve)
            .attr("ry",brushBarCurve)
            .attr("x", (d) => xScaleBrush(d[0]) + barGap)
            .attr("y",(d) => yScaleBrush(d[1].length) - brushBarCurve)
            .attr("width",xScaleBrush.bandwidth() - (barGap * 2))
            .attr("height",(d) => yScale(0) - yScaleBrush(d[1].length) + (brushBarCurve * 2))
            .attr("fill",colors.line)

        const updateCharts = () => {

            xBandwidth = xScale.bandwidth();
            const barWidth = xBandwidth - (barGap * 2);

            const xScaleExtent = d3.extent(xScale.domain());

            const chartData = xBandGroups.filter((f) => f[0] >= xScaleExtent[0] && f[0] <= xScaleExtent[1]);
            xAxis
                .call(d3.axisBottom(xScale).ticks(2).tickFormat((d) => d3.timeFormat(format.x)(d)).tickSizeOuter(0))
                .attr("transform", `translate(${margin.left},${chartHeight - margin.bottom - margin.brush - margin.middle + 0.5})`);

            xAxis.selectAll("path").style("stroke", "#A0A0A0");

            xAxis.selectAll("line").attr("display", "none");

            xAxis
                .selectAll("text")
                .attr("pointer-events", "none")
                .attr("font-weight", 300)
                .attr("fill", "grey")
                .attr("y", 5)
                .attr("font-size", fontSize);

            mainChartLine
                .datum(chartType === "line/dot" ? chartData : [])
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke-width", 1)
                .attr("stroke", colors.line)
                .attr("transform", `translate(${margin.left + xBandwidth/2},${margin.top})`);

            const mainTickGroup = mainChartGroup
                .selectAll(".mainTickGroup")
                .data(chartData)
                .join((group) => {
                    const enter = group.append("g").attr("class", "mainTickGroup");
                    enter.append("circle").attr("class", "mainTickDot");
                    enter.append("rect").attr("class", "mainTickBar");
                    enter.append("g").attr("class", "groupByGroup");
                    return enter;
                });

            mainTickGroup.attr("transform", `translate(${margin.left},${margin.top})`);

            mainTickGroup.select(".mainTickDot")
                .attr("display", chartType === "line/dot" ? "block" : "none")
                .attr("cx",(d) => xScale(d[0]) + xBandwidth/2)
                .attr("cy",(d) => yScale(d[1].length))
                .attr("fill",colors.dot)
                .attr("r",brushBarCurve)
                .on("mousemove", (event,d) => {
                    const tooltipText = d[1].length;
                    d3.select(".chartTooltip")
                        .style("visibility","visible")
                        .style("left",`${event.x + 10}px`)
                        .style("top",`${event.pageY}px`)
                        .html(tooltipText)
                })
                .on("mouseout",() => {
                    d3.select(".chartTooltip")
                        .style("visibility","hidden");
                });;

            mainTickGroup.select(".mainTickBar")
                .attr("display", chartType === "bar" ? "block" : "none")
                .attr("rx",brushBarCurve)
                .attr("ry",brushBarCurve)
                .attr("x",(d) => xScale(d[0]) + barGap)
                .attr("y",(d) => yScale(d[1].length) - brushBarCurve)
                .attr("width",barWidth)
                .attr("height",(d) => yScale(0) - yScale(d[1].length) + (brushBarCurve * 2))
                .attr("fill",colors.line)
                .on("mousemove", (event,d) => {
                    const tooltipText = `${groupBy ? 'Total: ' : ""}${d[1].length}`;
                    d3.select(".chartTooltip")
                        .style("visibility","visible")
                        .style("left",`${event.x + 10}px`)
                        .style("top",`${event.pageY}px`)
                        .html(tooltipText)
                })
                .on("mouseout",() => {
                    d3.select(".chartTooltip")
                        .style("visibility","hidden");
                });

            const groupByGap = 2;

            mainTickGroup.select(".groupByGroup")
                .attr("transform",(d) =>  `translate(${xScale(d[0]) + barGap + groupByGap},${brushBarCurve})`)



            const groupByBarWidth = groupBy ? (barWidth
                - ((groupBySet.length + 1) * groupByGap))/groupBySet.length: 0;

            const groupByGroup = mainTickGroup.select(".groupByGroup")
                .selectAll(".groupByBarGroup")
                .data((d) => {
                    if (chartType !== "bar" || !groupBy) return [];
                    const groupColorScale = d3.scaleOrdinal().domain(groupBySet).range(colors.groupBy);
                    return Array.from(d3.group(d[1], (g) => g[groupBy])).reduce((acc, entry,index) => {
                        acc.push({
                            value: entry[0],
                            length: entry[1].length,
                            xPos: index * (groupByBarWidth + groupByGap),
                            yPos: yScale(entry[1].length),
                            height: yScale(0) - yScale(entry[1].length),
                            fill: groupColorScale(entry[0])
                        })
                        return acc;
                    },[]);

                })
                .join((group) => {
                    const enter = group.append("g").attr("class", "groupByBarGroup");
                    enter.append("rect").attr("class", "groupByRect");
                    return enter;
                });

            groupByGroup.select(".groupByRect")
                .attr("rx",brushBarCurve)
                .attr("ry",brushBarCurve)
                .attr("x",(d) => d.xPos)
                .attr("y",(d) => d.yPos)
                .attr("width",groupByBarWidth)
                .attr("height",(d) => d.height)
                .attr("fill",(d) => d.fill)
                .on("mousemove", (event,d) => {
                    const tooltipText = `<span style="color:${d.fill};">${d.value}: ${d.length}</span>`;
                    d3.select(".chartTooltip")
                        .style("visibility","visible")
                        .style("left",`${event.x + 10}px`)
                        .style("top",`${event.pageY}px`)
                        .html(tooltipText)
                })
                .on("mouseout",() => {
                    d3.select(".chartTooltip")
                        .style("visibility","hidden");
                });
        }

        const brushed = (event) => {
            if (!event.sourceEvent) return;
            const { selection } = event;
            let bandsInRange = xBands.filter(
                (f) => xScaleBrush(f) >= selection[0] && xScaleBrush(f) <= selection[1]
            );
            if (bandsInRange.length < 2) {
                bandsInRange = xScale.domain();
            }
            const bandsInRangeExtent = d3.extent(bandsInRange);
            brushGroup.call(brush.move, [
                xScaleBrush(bandsInRangeExtent[0]),
                xScaleBrush(bandsInRangeExtent[1]) + xScaleBrush.bandwidth()
            ]);

            xScale.domain(bandsInRange);
            updateCharts();

        }

        // defined brush
        const brushExtent = [
            [0, 0],
            [chartWidth - margin.left - margin.right, margin.brush]
        ];

        const brush = d3.brushX()
            .extent(brushExtent)
            .on("brush", brushed);

        brushGroup.attr(
                "transform",
                `translate(${margin.left},${chartHeight - margin.brush - margin.bottom})`
            )
            .call(brush)
            .call(brush.move, [0, chartWidth - margin.left - margin.right]);

        brushGroup
            .select(".selection")
            .style("fill-opacity", 0.2)
            .style("fill", colors.brush);

        updateCharts();
        return chart;
    };


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


const horizontalBarChart = ()  => {

    let props = {};
    let title = "";
    let chartWidth = 0;
    let chartHeight = 0;
    let chartClass = "";

    const chart = (svg) => {

        const margin = { left: 80, right: 30, top: 70, bottom: 60 };

        const { data, barAttributes,  format, greaterThan,labels,  topX, xVars, ySort,yVar } = props;

        if(xVars.length > 1){
            const legendData = xVars.reduce((acc, entry,index) => {
                acc.push({
                    group: entry,
                    fill: barAttributes.fill[index]
                })
                return acc;
            },[]);

            drawLegend(svg,legendData,14,chartWidth,"",40);
        }

        let barData =
            Array.from(d3.group(data, (g) => g[yVar]))
                .reduce((acc, entry) => {
                    const totals = xVars.reduce((xAcc, xVar, index) => {
                        xAcc.push(
                            {xVar,
                            total:  d3.sum(entry[1],(s) => s[xVar]),
                            xVarIndex:index })
                        return xAcc;
                    },[])
                    acc.push({
                        yVar: entry[0],
                        totals,
                        maxTotal: d3.max(totals, (m) => m.total)
                    })
                    return acc;
                },[])
                .sort((a,b) => d3[ySort](a.maxTotal,b.maxTotal))

        if(topX && topX !== null){
            barData = barData.slice(0,topX);
        }
        if(greaterThan && greaterThan !== null){
            barData = barData.filter((f) => f.maxTotal > greaterThan);
        }

        const yBands = barData.map((m) => m.yVar);

        const maxLabelWidth = d3.max(yBands, (d) => measureWidth(d));
        margin.left = maxLabelWidth + 80;

        const xExtent = d3.extent(barData, (d) => d.maxTotal);

        const xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([0, chartWidth - margin.left - margin.right]).nice();


        const yScale = d3.scaleBand()
            .domain(yBands)
            .range([0,chartHeight - margin.top - margin.bottom]);

        const fontSize = Math.min((yScale.bandwidth() * 0.75)/xVars.length, 14);

        let titleLabel = svg.select(".titleLabel");
        let xAxisLabel = svg.select(".xAxisLabel");
        let yAxisLabel = svg.select(".yAxisLabel");
        let xAxis = svg.select(".xAxis");
        let yAxis = svg.select(".yAxis");

        let clipPath = svg.select(".barClipPath");
        let clipRect = svg.select(".clipRect");

        if(xAxis.node() === null){
            // append if initial draw
            titleLabel = svg.append("text").attr("class","titleLabel");
            xAxisLabel = svg.append("text").attr("class","xAxisLabel");
            yAxisLabel = svg.append("text").attr("class","yAxisLabel");
            xAxis = svg.append("g").attr("class","xAxis");
            yAxis = svg.append("g").attr("class","yAxis");
            clipPath = svg.append("clipPath").attr("class", "barClipPath");
            clipRect = clipPath.append("rect").attr("class", "clipRect");
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
                `translate(30,${
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
            .attr("font-size", fontSize);


        const { cornerRadius, fill} = barAttributes;

        clipPath.attr("id", `clipRect${chartClass}`);

        clipRect
          .attr("x", cornerRadius + 0.5)
            .attr("width", chartWidth - margin.left - margin.right)
            .attr("height", chartHeight - margin.top - margin.bottom);


        const barHeight = yScale.bandwidth()/xVars.length;

        const barGroup = svg
            .selectAll(".barGroup")
            .data(barData)
            .join((group) => {
                const enter = group.append("g").attr("class", "barGroup");
                enter.append("g").attr("class", "barsGroup");
                return enter;
            });

        barGroup.attr("transform", `translate(${margin.left},${margin.top})`)
            .on("mousemove", (event,d) => {
                const currentGroup = d3.select(event.currentTarget);
                currentGroup.raise();
                svg.selectAll(".barRect").attr("fill-opacity",0.2);
                currentGroup.selectAll(".barRect").attr("fill-opacity",1);
                let tooltipText = "";
                tooltipText += `<strong>${yVar}:</strong> ${d.yVar}<br>`
                xVars.forEach((xVar) => {
                    const xVarData = d.totals.find((f) => f.xVar === xVar);
                    tooltipText += `<strong>${xVar}:</strong> ${d3.format(format.x)(xVarData.total)}<br>`
                })
                d3.select(".chartTooltip")
                    .style("visibility","visible")
                    .style("left",`${event.x + 10}px`)
                    .style("top",`${event.pageY}px`)
                    .html(tooltipText)
            })
            .on("mouseout",() => {
                svg.selectAll(".barRect").attr("fill-opacity",1);
                d3.select(".chartTooltip")
                    .style("visibility","hidden");
            });


        barGroup.select(".barsGroup")
            .attr("clip-path", (d, i) => `url(#clipRect${chartClass})`)
            .attr("transform",(d) => `translate(${-cornerRadius},${yScale(d.yVar)})`)

        const barsGroup = barGroup.select(".barsGroup")
            .selectAll(".allBarsGroup")
            .data((d) => d.totals)
            .join((group) => {
                const enter = group.append("g").attr("class", "allBarsGroup");
                enter.append("rect").attr("class", "barRect");
                enter.append("text").attr("class", "barLabel");
                return enter;
            });

        barsGroup.attr("transform",(d) => `translate(0, ${(barHeight - xVars.length) * d.xVarIndex})`)

        barsGroup
            .select(".barRect")
            .attr("rx", cornerRadius)
            .attr("ry", cornerRadius)
            .attr("width", (d) => xScale(d.total) + cornerRadius)
            .attr("height", barHeight - (xVars.length + 1))
            .attr("fill",  (d) => fill[d.xVarIndex]);

        barsGroup
            .select(".barLabel")
            .attr("pointer-events", (d) => measureWidth(d3.format(format.x)(d.total),fontSize) + 10 < xScale(d.total) ? "none" : "all")
            .attr("x", (d) => xScale(d.total))
            .attr("dx", (d) => measureWidth(d3.format(format.x)(d.total),fontSize) + 10 < xScale(d.total) ? -3 : 3)
            .attr("y",  barHeight/2)
            .attr("text-anchor", (d) => measureWidth(d3.format(format.x)(d.total),fontSize) + 10 < xScale(d.total) ? "end" : "start")
            .style("dominant-baseline","middle")
            .attr("font-weight", 300)
            .attr("fill", (d) => measureWidth(d3.format(format.x)(d.total),fontSize) + 10 < xScale(d.total) ? "white" : "grey")
            .attr("font-size", fontSize)
            .text((d) =>  d.total === 0 ? "" :d3.format(format.x)(d.total));


        return chart;
    };

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

    chart.chartClass =  (value) => {
        if (!value) return chartClass;
        chartClass = value;
        return chart;
    };

    chart.props =  (value) => {
        if (!value) return props;
        props = value;
        return chart;
    };

    return chart;
}


const sankeyChart = ()  => {

    let props = {};
    let title = "";
    let chartWidth = 0;
    let chartHeight = 0;

    const chart = (svg) => {

        const margin = { left: 120, right: 120, top: 50, bottom: 20 };
        const { colors, data,fontSize} = props;
        const { nodes, links } = data;
        nodes.map((m,i) => m.index = i);
        const nodeWidth = 20;

        let titleLabel = svg.select(".titleLabel");

        if(titleLabel.node() === null) {
            // append if initial draw
            titleLabel = svg.append("text").attr("class", "titleLabel");
        };

        titleLabel
            .attr("x", chartWidth / 2)
            .attr("y", fontSize * 2)
            .attr("text-anchor", "middle")
            .attr("font-size", fontSize * 1.2)
            .attr("fill", "#484848")
            .html(title);

        const nodeScale = d3.scaleOrdinal().domain(Object.keys(colors)).range(Object.values(colors));

        const sankey = d3.sankey()
            .nodeId((d) => d.name)
            .nodeWidth(nodeWidth)
            .nodePadding(10)
            .extent([
                [0, 0],
                [chartWidth - margin.left - margin.right, chartHeight - margin.top - margin.bottom]
            ]);

        sankey({ nodes, links });

        const linkPath = d3.sankeyLinkHorizontal();

        const nodeGroup = svg
            .selectAll(".nodeGroup")
            .data(nodes)
            .join((group) => {
                const enter = group.append("g").attr("class", "nodeGroup");
                enter.append("rect").attr("class", "nodeRect");
                enter.append("text").attr("class", "nodeLabel");
                return enter;
            });

        nodeGroup.attr("transform", `translate(${margin.left},${margin.top})`);

        nodeGroup
            .select(".nodeRect")
            .attr("x", (d) => d.x0)
            .attr("y", (d) => d.y0)
            .attr("width", nodeWidth)
            .attr("height", (d) => d.y1 - d.y0)
            .attr("fill", (d) => nodeScale(d.category))
            .on("mousemove", (event, d) => {
                const tooltipText = `<strong>${d.name}</strong><br>${d.category}`;
                d3.select(".chartTooltip")
                    .style("visibility","visible")
                    .style("left",`${event.x + 10}px`)
                    .style("top",`${event.pageY}px`)
                    .html(tooltipText)
            })
            .on("mouseout", () => {
                d3.select(".chartTooltip")
                    .style("visibility","hidden");
            });

        nodeGroup
            .select(".nodeLabel")
            .attr("pointer-events","none")
            .attr("x", (d) => d.x0 + (d.depth === 0 ? -5 : 5 + nodeWidth))
            .attr("y", (d) => d.y0 + (d.y1 - d.y0) / 2)
            .attr("text-anchor", (d) => (d.depth === 0 ? "end" : "start"))
            .attr("font-size", fontSize)
            .attr("dy", 4)
            .text((d) => d.name.replace(/_/g, " "));

        const linkGroup = svg
            .selectAll(".linkGroup")
            .data(links)
            .join((group) => {
                const enter = group.append("g").attr("class", "linkGroup");
                enter.append("path").attr("class", "linkPath");
                enter.append("clipPath").attr("class", "sankeyLinkClipPath")
                    .append("rect").attr("class","sankeyLinkClipPathRect");
                return enter;
            });

        linkGroup.attr("transform", `translate(${margin.left},${margin.top})`);

        linkGroup.select(".sankeyLinkClipPath")
            .attr("id",(d) => `sankeyLinkClipPath${d.index}`);

        linkGroup.select(".sankeyLinkClipPathRect")
            .attr("transform",(d) => `translate(${d.source.x1},${d.source.y0})`)
            .attr("width", (d) => d.target.x0 - d.source.x1)
            .attr("height",(d) => d.target.y1 - d.source.y0);

        linkGroup
            .select(".linkPath")
            .attr("clip-path",(d) => `url(#sankeyLinkClipPath${d.index})`)
            .attr("stroke-opacity", 0.1)
            .attr("stroke", (d) => "black")
            .attr("stroke-width", (d) => d.width)
            .attr("fill", "transparent")
            .attr("d", (d) => linkPath(d))
            .on("mousemove", (event, d) => {
                const tooltipText = `<strong>${d.source.name} TO ${d.target.name}</strong><br>${d.value}`;
                d3.select(".chartTooltip")
                    .style("visibility","visible")
                    .style("left",`${event.x + 10}px`)
                    .style("top",`${event.pageY}px`)
                    .html(tooltipText)
            })
            .on("mouseout", () => {
                d3.select(".chartTooltip")
                    .style("visibility","hidden");
            });

        return chart;
    };

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

const treemapChart = ()  => {

    let props = {};
    let title = "";
    let chartWidth = 0;
    let chartHeight = 0;

    const chart = (svg) => {

        const margin = { left: 30, right: 30, top: 70, bottom: 20 };

        const {data,fontSize, colors, parentVar, childVar, topX} = props;

        let titleLabel = svg.select(".titleLabel");

        if(titleLabel.node() === null) {
            // append if initial draw
            titleLabel = svg.append("text").attr("class", "titleLabel");
        };

        titleLabel
            .attr("x", chartWidth / 2)
            .attr("y", fontSize * 2)
            .attr("text-anchor", "middle")
            .attr("font-size", fontSize * 1.2)
            .attr("fill", "#484848")
            .html(title);

        const treeChildren = Array.from(d3.group(data, (g) => g[parentVar]))
            .filter((f,i) => i < topX)
            .reduce((acc, entry) => {
                const children = Array.from(d3.group(entry[1], (g) => g[childVar]))
                    .map((m) => m = {name:m[0], value: m[1].length})
                acc.push({
                    name: entry[0],
                    children
                })
                return acc;
            },[]);

        const colorScaleDomain = treeChildren.map((m) => m.name);
        const colorScale = d3.scaleOrdinal().domain(colorScaleDomain).range(colors);

        const legendData = colorScaleDomain.reduce((acc, entry) => {
            acc.push({
                group: entry,
                fill: colorScale(entry)
            })
            return acc;
        },[]);

        drawLegend(svg,legendData,12,chartWidth,"",45);

        const treeHierarchy = d3.hierarchy({name: "root", children: treeChildren});

        const treemap = d3.treemap()
            .size([chartWidth - margin.left - margin.right, chartHeight - margin.top - margin.bottom])
            .paddingTop(14)
            .paddingInner(4)
            .paddingLeft(4)
            .paddingRight(4)
            .paddingBottom(4);

        treeHierarchy.count();

        const root = treemap(treeHierarchy);

        const treeData = root.descendants()
            .filter((f) => f.depth > 0)
         //   .sort((a,b) => d3.descending(a.depth, b.depth));

        const nodesGroup = svg
            .selectAll(".nodeGroup")
            .data(treeData)
            .join((group) => {
                const enter = group.append("g").attr("class", "nodeGroup");
                enter.append("rect").attr("class", "treeRect");
                enter.append("text").attr("class", "treeRectLabel");
                return enter;
            });

        nodesGroup.attr("transform", d => `translate(${margin.left + d.x0},${margin.top + d.y0})`)
            .on("mousemove", (event, d) => {
                let tooltipText = "";
                if(d.depth === 2){
                  tooltipText = `<strong>${parentVar}</strong>: ${d.parent.data.name}<br>`;
                  tooltipText += `${d.data.name} - ${d.data.value}`
                } else {
                  tooltipText = `<strong>${parentVar}</strong>: ${d.data.name}<br>`;
                  d.children.forEach((c) => {
                      tooltipText += `${c.data.name} - ${c.data.value}<br>`;
                  })
                }
                d3.select(".chartTooltip")
                    .style("visibility","visible")
                    .style("left",`${event.x + 10}px`)
                    .style("top",`${event.pageY}px`)
                    .html(tooltipText)
            })
            .on("mouseout", () => {
                d3.select(".chartTooltip")
                    .style("visibility","hidden");
            });;

        nodesGroup.select(".treeRectLabel")
            .attr("pointer-events","none")
            .attr("x",4)
            .attr("y",12)
            .attr("fill",(d) => d.depth === 1 ? "#808080" : "white")
            .attr("font-size",12)
            .text((d) => (d.x1 - d.x0) > measureWidth(d.data.name, 12) && d.y1 - d.y0 > 12 ? d.data.name : "")

        nodesGroup.select(".treeRect")
            .attr("width",(d) => d.x1 - d.x0)
            .attr("height", (d) => d.y1 - d.y0)
            .attr("stroke-width",(d) => d.depth === 2 ? 0 : 1)
            .attr("stroke",(d) => d.depth === 1 ? colorScale(d.data.name) : "white")
            .attr("fill",(d) => d.depth === 2 ? colorScale(d.parent.data.name) : "white")



        return chart;
    };

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
const pieChart = ()  => {

    let props = {};
    let title = "";
    let chartWidth = 0;
    let chartHeight = 0;

    const chart = (svg) => {

        const margin = {left: 50, right: 50, top: 80,bottom: 30};
        const circleRadius = Math.min(
            chartWidth - margin.left - margin.right,
            chartHeight - margin.top - margin.bottom)/2;

        const {data, donutWidthRatio,fontSize, format, pieVars, pieColors} = props;

        const pieData = pieVars.reduce((acc, entry,index) => {
            const valueTotal = d3.sum(data, (d) => d[entry]);
            acc.push({
                group: entry,
                total: valueTotal,
                fill: pieColors[index]
            })
            return acc;
        },[])

        drawLegend(svg,pieData,fontSize, chartWidth,format,30);

        const donutWidth = circleRadius * donutWidthRatio;

        const pie = d3
            .pie()
            .startAngle(0)
            .endAngle(Math.PI * 2)
            .value((d) => d.total);

        const arcData = pie(pieData);

        const arc = d3
            .arc()
            .innerRadius(circleRadius - donutWidth)
            .outerRadius(circleRadius);

        const pathGroup = svg
            .selectAll(".pathGroup")
            .data(arcData)
            .join((group) => {
                const enter = group.append("g").attr("class", "pathGroup");
                enter.append("path").attr("class", "arcPath");
                return enter;
            });

        pathGroup
            .select(".arcPath")
            .attr("d", arc)
            .attr("fill", (d) => d.data.fill)
            .attr("transform", `translate(${chartWidth/2},${margin.top + circleRadius})`)
            .on("mousemove", (event,d) => {
                svg.selectAll(".arcPath").attr("fill-opacity",0.2);
                d3.select(event.currentTarget).attr("fill-opacity",1);
                const tooltipText = `<strong>${d.data.group}:</strong> ${d3.format(format)(d.data.total)}<br>`
                d3.select(".chartTooltip")
                    .style("visibility","visible")
                    .style("left",`${event.x + 10}px`)
                    .style("top",`${event.pageY}px`)
                    .html(tooltipText)
            })
            .on("mouseout",() => {
                svg.selectAll(".arcPath").attr("fill-opacity",1);
                d3.select(".chartTooltip")
                    .style("visibility","hidden");
            });


        return chart;
    };

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
