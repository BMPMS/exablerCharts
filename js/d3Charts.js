
const measureWidth = (text, fontSize) => {
    const context = document.createElement("canvas").getContext("2d");
    context.font = `${fontSize}px Arial`;
    return context.measureText(text).width;
}

const drawLegend = (svg, legendData, fontSize, width, format) => {

    let accumulativeX = 0;
    const legendHeight = 18;

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

    menuGroup.attr("transform", `translate(${(width - accumulativeX)/2},30)`)

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
        .attr("y",-4 + legendHeight/2)
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
        .text((d) => d3.format(format)(d.total));
}

const scatterChart = ()  => {

    let props = {};
    let title = "";
    let chartWidth = 0;
    let chartHeight = 0;
    let brushResultsCallback = "";

    const chart = (svg) => {

        const margin = { left: 100, right: 30, top: 70, bottom: 60 };
        const { data, dotAttributes, fontSize, format, labels, scales, tooltipVars, xVar, yVar } = props;

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
                    acc.push({entry})
                }
                return acc;
            },[]);
            brushResultsCallback(filteredData);

        }
        const brushExtent = [
            [0,0],
            [chartWidth - margin.left - margin.right, chartHeight - margin.top - margin.bottom]
        ];

        // brush
        const brush = d3.brush()
            .extent(brushExtent)
            .on("brush", brushed);

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


const verticalBarChart = ()  => {

    let props = {};
    let title = "";
    let chartWidth = 0;
    let chartHeight = 0;
    let baseSvg = undefined;

    const chart = (baseSvg) => {

        const margin = { left: 100, right: 30, top: 70, bottom: 60 };
        const brushBarCurve = 2;

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

        const { data, barAttributes,  format, greaterThan,labels,  topX, xVar, ySort,yVar } = props;

        let barData =
            Array.from(d3.group(data, (g) => g[yVar]))
                .reduce((acc, entry) => {
                    acc.push({
                        yVar: entry[0],
                        total: d3.sum(entry[1],(s) => s[xVar])
                    })
                    return acc;
                },[])
                .sort((a,b) => d3[ySort](a.total,b.total))

        if(topX && topX !== null){
            barData = barData.slice(0,topX);
        }
        if(greaterThan && greaterThan !== null){
            barData = barData.filter((f) => f.total > greaterThan);
        }

        const yBands = barData.map((m) => m.yVar);

        const maxLabelWidth = d3.max(yBands, (d) => measureWidth(d));
        margin.left = maxLabelWidth + 80;

        const xExtent = d3.extent(barData, (d) => d.total);

        const xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([0, chartWidth - margin.left - margin.right]).nice();


        const yScale = d3.scaleBand()
            .domain(yBands)
            .range([0,chartHeight - margin.top - margin.bottom]);

        const fontSize = Math.min(yScale.bandwidth() * 0.75, 14);

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

        const barHeight = yScale.bandwidth();

        const barGroup = svg
            .selectAll(".barGroup")
            .data(barData)
            .join((group) => {
                const enter = group.append("g").attr("class", "barGroup");
                enter.append("rect").attr("class", "barRect");
                enter.append("text").attr("class", "barLabel");
                enter.append("clipPath").attr("class", "barClipPath")
                     .append("rect").attr("class", "clipRect");
                return enter;
            });

        barGroup.attr("transform", `translate(${margin.left},${margin.top})`)
            .on("mousemove", (event,d) => {
                const currentGroup = d3.select(event.currentTarget);
                currentGroup.raise();
                svg.selectAll(".barRect").attr("fill-opacity",0.2);
                currentGroup.select(".barRect").attr("fill-opacity",1);
                let tooltipText = "";
                tooltipText += `<strong>${yVar}:</strong> ${d.yVar}<br>`
                tooltipText += `<strong>${xVar}:</strong> ${d3.format(format.x)(d.total)}<br>`
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

        barGroup
            .select(".barClipPath")
            .attr("id", (d, i) => `clipRect${chartClass}${i}`);

        barGroup
            .select(".clipRect")
            .attr("x", 0)
            .attr("y", (d) => yScale(d.yVar))
            .attr("width", (d) => xScale(d.total))
            .attr("height", barHeight);

        barGroup
            .select(".barRect")
            .attr("clip-path", (d, i) => `url(#clipRect${chartClass}${i})`)
            .attr("rx", cornerRadius)
            .attr("ry", cornerRadius)
            .attr("x", -cornerRadius)
            .attr("y", (d) => yScale(d.yVar))
            .attr("width", (d) => xScale(d.total) + cornerRadius)
            .attr("height", barHeight - 2)
            .attr("fill",  fill);

        barGroup
            .select(".barLabel")
            .attr("pointer-events", "none")
            .attr("x", (d) => xScale(d.total))
            .attr("dx", (d) => measureWidth(d3.format(format.x)(d.total),fontSize) + 10 < xScale(d.total) ? -3 : 3)
            .attr("y", (d) => yScale(d.yVar)  + barHeight/2)
            .attr("text-anchor", (d) => measureWidth(d3.format(format.x)(d.total),fontSize) + 10 < xScale(d.total) ? "end" : "start")
            .style("dominant-baseline","middle")
            .attr("font-weight", 300)
            .attr("fill", (d) => measureWidth(d3.format(format.x)(d.total),fontSize) + 10 < xScale(d.total) ? "white" : "grey")
            .attr("font-size", fontSize)
            .text((d) => d3.format(format.x)(d.total));


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

        drawLegend(svg,pieData,fontSize, chartWidth,format);

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
            });;


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
