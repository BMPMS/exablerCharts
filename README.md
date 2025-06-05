# exablerCharts

Folder structure


index.html - includes all the code you’ll need to generate the charts
css - tooltip and font, the rest is built into the properties
js - you must include a reference to both these files but you don’t need to worry about the contents - they are your custom d3 components
data - flat files of the 1st sheet of the spreadsheet and the sankey data, instructions on how to change the path (and hook to a url) are in index.html


CDNs you will need

<script src="https://d3js.org/d3.v6.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js"></script>
<script src="js/setupFunctions.js"></script>
<script src="js/d3Charts.js"></script>

You could copy the css you need to a central file

<link rel="stylesheet" href="css/d3Charts.css"/>


Divs

As well as the div’s you want the charts to appear in you’ll also need to include this div somewhere on the page for the tooltip (when needed)

<div class="chartTooltip"></div>

