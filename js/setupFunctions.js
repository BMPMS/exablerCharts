const getChartData = async (dataUrl, sankeyUrl) => {
    const data = await d3.csv(dataUrl);
    const sankeyData = await d3.json(sankeyUrl);
    return {data, sankeyData};

}

const brushResultsCallback = (brushedData,tableDivId) => {
    drawTable(brushedData,tableDivId);
}

const drawChart = (type,divId,props, title) => {
    const div = d3.select(`#${divId}`);
    const {clientWidth, clientHeight} = div.node();

    let svg = div.select("svg");
    if (svg.node() === null) {
        svg = div
            .append("svg")
            .style("background-color","white")
            .attr("class","noselect")
            .attr("width", clientWidth)
            .attr("height",clientHeight);
    }
    if(type === "scatter"){
        // load charts
        const newScatterChart = scatterChart()
            .chartWidth(clientWidth)
            .chartHeight(clientHeight)
            .title(title)
            .brushResultsCallback(brushResultsCallback)
            .props(props);

        newScatterChart(svg);
    }
    if(type === "hBar"){
        // load charts
        const newHorizontalBarChart = horizontalBarChart()
            .chartWidth(clientWidth)
            .chartHeight(clientHeight)
            .chartClass(divId)
            .title(title)
            .props(props);

        newHorizontalBarChart(svg);
    }

    if(type === "pie"){
        const newPieChart = pieChart()
            .chartWidth(clientWidth)
            .chartHeight(clientHeight)
            .title(title)
            .props(props);

        newPieChart(svg);
    }
    if(type === "timeSeries"){
        const newTimeSeriesChart = timeSeriesChart()
            .chartWidth(clientWidth)
            .chartHeight(clientHeight)
            .title(title)
            .props(props);

        newTimeSeriesChart(svg);
    }
    if(type === "sankey"){
        const newSankeyChart = sankeyChart()
            .chartWidth(clientWidth)
            .chartHeight(clientHeight)
            .title(title)
            .props(props);

        newSankeyChart(svg);
    }
    if(type === "treemap"){
        const newTreemapChart = treemapChart()
            .chartWidth(clientWidth)
            .chartHeight(clientHeight)
            .title(title)
            .props(props);

        newTreemapChart(svg);
    }
}
