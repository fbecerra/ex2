var marginScatter = {top: 80, right: 10, bottom: 10, left: 20};

var size = 140,
	padding = 10;


var color = d3.scale.linear()
	.range(colorbrewer.YlOrRd[9].slice(2, 8));

var x = {},
	y = {},
	xAxis = {},
	yAxis = {},
	brush = {};

var filter = "";

var svg = d3.select("#scatter-plot-area").append("svg");

var opts = {
	lines: 13, // The number of lines to draw
	length: 6, // The length of each line
	width: 4, // The line thickness
	radius: 13, // The radius of the inner circle
	corners: 1, // Corner roundness (0..1)
	color: '#000', // #rgb or #rrggbb or array of colors
	speed: 1.5, // Rounds per second
	trail: 75, // Afterglow percentage
	shadow: false, // Whether to render a shadow
	hwaccel: false, // Whether to use hardware acceleration
	className: 'spinner', // The CSS class to assign to the spinner
	zIndex: 2e9, // The z-index (defaults to 2000000000)
	top: '50%', // Top position relative to parent
	left: '50%' // Left position relative to parent
};

var target = document.getElementById('vis-div');
var spinner = new Spinner(opts).spin(target);

d3.csv("data/exoplanets.csv", function(error, data) {
	if (error) throw error;

	spinner.stop();

	d3.select("#title").html("<h1>Ex<sup>2</sup>: Exoplanets Explorer</h1>");
	d3.select("#subtitle").html('A visualization by <a href="https://www.cfa.harvard.edu/~fbecerra">Fernando Becerra</a>');
	d3.select("#text-area").html('</p>Exoplanets are planets orbiting a star beyond our Solar System. ' +
		'They have been discovered since 1988, but most of the first discoveries were huge gas giants orbiting close to their parent star. ' +
		'The launch of the <a href="http://kepler.nasa.gov">Kepler Space Telescope</a> opened a new window using a technique called the "transit" method, ' +
		'which allowed astronomers to confirm more than 1,000 exoplanets spanning a wide range of properties.</br></p>' +
		'This visualization tool is intended to explore different exoplanets characteristics. ' +
		'The histogram on the right shows the number of planets discovered by year. Each bar is clickable, ' +
		'which will select the objects discovered that year and highlight them on the scatter plots below. ' +
		'These plots are color-coded by planet mass and include a brush tool to select and explore the properties of a subset of exoplanets accross multiple panels.');
	d3.select("#notes").html('Notes:</br> ' +
		'&#8594; Only exoplanets discovered by the transit and radial velocity methods are shown.</br>' +
		'&#8594; Data source: <a href="http://exoplanets.org">Exoplanets.org</a></br>' +
		'&#8594; More information on <a href="https://en.wikipedia.org/wiki/Exoplanet">Wikipedia</a>' +
		', <a href="http://www.space.com/17738-exoplanets.html">Space.com</a>,' +
		' and <a href="http://www.scientificamerican.com/article/the-truth-about-exoplanets/">Scientific American</a></br>');

	data.forEach(function(d){
		d.A = (d.A == "") ? NaN : +d.A;
		d.BMV = (d.BMV == "") ? NaN : +d.BMV;
		d.DATE = (d.DATE == "") ? NaN : +d.DATE;
		d.DIST = (d.DIST == "") ? NaN : +d.DIST;
		d.ECC = (d.ECC == "") ? NaN : +d.ECC;
		d.MASS = (d.MASS == "") ? NaN : +d.MASS;
		d.MSTAR = (d.MSTAR == "") ? NaN : +d.MSTAR;
		d.NCOMP = (d.NCOMP == "") ? NaN : +d.NCOMP;
		d.PER = (d.PER == "") ? NaN : +d.PER;
		d.R = (d.R == "") ? NaN : +d.R;
		d.RSTAR = (d.RSTAR == "") ? NaN : +d.RSTAR;
		d.TEFF = (d.TEFF == "") ? NaN : +d.TEFF;

	});

	dateHistogram(data);


	var domainByTrait = {},
		traits = d3.keys(data[0]).filter(function(d) {
			return (d !== "DATE") && (d !== "NAME") && (d !== "NCOMP") && (d !== "PLANETDISCMETH") && (d !== "SIMBADNAME") && (d !== "SIMBADURL")
				&& (d !== "MASS") && (d!== "R");
		}),
		n = traits.length;

	traits.forEach(function(trait) {
		domainByTrait[trait] = d3.extent(data, function(d) { return d[trait]; });
	});


	var crossData = cross(traits, traits);

	var widthScatter = size * (n+1) - marginScatter.left - marginScatter.right,
		heightScatter = size * (n+1) - marginScatter.top - marginScatter.bottom;

	svg = svg.attr("width", widthScatter + marginScatter.left + marginScatter.right)
		.attr("height", heightScatter + marginScatter.top + marginScatter.bottom)
		.append("g")
		.attr("transform", "translate(" + marginScatter.left + "," + marginScatter.top + ")");

	//Legend
	var h = 100, w = 600, hpadding = 80, wpadding = 100;

	var key = d3.select("#legend-area").append("svg")
		.attr("width", w)
		.attr("height", h)
		.append("g")
		.attr("transform", "translate(" + wpadding/2 + ",0)");

	var legend = key.append("defs").append("svg:linearGradient")
		.attr("id", "gradient")
		.attr("x1", "0%")
		.attr("y1", "100%")
		.attr("x2", "100%")
		.attr("y2", "100%")
		.attr("spreadMethod", "pad");

	legend.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", colorbrewer.YlOrRd[9][2])
		.attr("stop-opacity", 1);

	legend.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", colorbrewer.YlOrRd[9][8])
		.attr("stop-opacity", 1);

	key.append("rect")
		.attr("width", w - wpadding)
		.attr("height", h - hpadding)
		.style("fill", "url(#gradient)")
		.attr("transform", "translate(0,10)");

	var xLegend = d3.scale.linear()
		.range([0, w - wpadding])
		.domain(d3.extent(data, function(d) { return d["MASS"]; }));

	var legendAxis = d3.svg.axis().scale(xLegend).orient("top");

	key.append("g").attr("class", "x axis")
		.attr("transform", "translate(0,10)")
		.call(legendAxis);

	key.append("text")
		.attr("transform", "translate(" + (w - wpadding)/2 + ",10)")
		.attr("y", 30)
		.attr("dy", ".71em")
		.style("text-anchor", "middle")
		.text("Planet mass (Jupiter masses)");

	// Define svg for axis
	var svgX = svg.selectAll(".x.axis")
		.data(traits)
		.enter().append("g")
		.attr("class", "x axis");

	var svgY = svg.selectAll(".y.axis")
		.data(traits)
		.enter().append("g")
		.attr("class", "y axis");

	crossData.forEach(function(d){
		x[d.i+""+d.j] = isLog(d.x) ? d3.scale.log() : d3.scale.linear();

		x[d.i+""+d.j].range([padding / 2, size - padding / 2]);

		y[d.i+""+d.j] = isLog(d.y) ? d3.scale.log() : d3.scale.linear();

		y[d.i+""+d.j].range([size - padding / 2, padding / 2]);

		xAxis[d.i+""+d.j] = d3.svg.axis()
			.scale(x[d.i+""+d.j])
			.orient("bottom")
			.ticks(4, "r")
			.tickSize(size * n);

		yAxis[d.i+""+d.j] = d3.svg.axis()
			.scale(y[d.i+""+d.j])
			.orient("left")
			.ticks(4, "r")
			.tickSize(size * n);

		brush[d.i+""+d.j] = d3.svg.brush()
			.x(x[d.i+""+d.j])
			.y(y[d.i+""+d.j])
			.on("brushstart", brushstart)
			.on("brush", brushmove)
			.on("brushend", brushend);

		var cell = svg.append("g")
			.datum(d)
			.attr("class", "cell")
			.attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; });

		cell.append("rect")
			.attr("class", "frame")
			.attr("x", padding / 2)
			.attr("y", padding / 2)
			.attr("width", size - padding)
			.attr("height", size - padding);

		cell.filter(function(d) { return d.i !== d.j; })
			.each(plot);

		// Titles for the diagonal.
		cell.filter(function(d) { return d.i === d.j; }).append("text")
			.attr("x", size/2)
			.attr("y", size/2 - 7)
			.attr("dy", ".71em")
			.attr("text-anchor", "middle")
			.text(function(d) { return getLabel(d.x); });

		cell.filter(function(d) { return d.i === d.j; }).append("text")
			.attr("x", size/2)
			.attr("y", size/2 + 7)
			.attr("dy", ".71em")
			.attr("text-anchor", "middle")
			.text(function(d) { return getUnits(d.x); });

		cell.filter(function(d) { return d.i !== d.j; })
			.call(brush[d.i+""+d.j]);
	});

	svgX.attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
		.each(function(d, i) { x[i+"0"].domain(domainByTrait[d]); d3.select(this).call(xAxis[i+"0"]); });

	svgY.attr("transform", function(d, i) { return "translate(" + (size * n) + "," + i * size + ")"; })
		.each(function(d, i) { y["0"+i].domain(domainByTrait[d]); d3.select(this).call(yAxis["0"+i]); });


	function plot(p) {
		var cell = d3.select(this);

		x[p.i+""+p.j].domain(domainByTrait[p.x]);
		y[p.i+""+p.j].domain(domainByTrait[p.y]);

		cell.selectAll("circle")
			.data(data.filter(function(value){
				return (!isNaN(value[p.x]) && !isNaN(value[p.y]));
			}))
			.enter().append("circle")
			.attr("cx", function(d) {
					return x[p.i+""+p.j](d[p.x]);
				})
			.attr("cy", function(d) {
					return y[p.i+""+p.j](d[p.y]);
				})
			.attr("r", 2)
			.attr("opacity", 1)
			//.style("fill", function(d) { return color(d.PLANETDISCMETH); });
			.attr("fill", function(d) { return color(d.MASS); });
	}

	var brushCell;

	// Clear the previously-active brush, if any.
	function brushstart(p) {
		// Clear histogram
		d3.selectAll(".bar").classed("hidden-bar", false);
		filter = "";
		// Clear brushes
		if (brushCell !== this) {
			d3.select(brushCell).call(brush[p.i+""+p.j].clear());
			x[p.i+""+p.j].domain(domainByTrait[p.x]);
			y[p.i+""+p.j].domain(domainByTrait[p.y]);
			brushCell = this;
		}
	}

	// Highlight the selected circles.
	function brushmove(p) {
		var e = brush[p.i+""+p.j].extent();
		svg.selectAll("circle").classed("hidden-circle", function(d) {
			return !(e[0][0] < d[p.x] && d[p.x] < e[1][0]
				&& e[0][1] < d[p.y] && d[p.y] < e[1][1]);
		});
	}

	// If the brush is empty, select all circles.
	function brushend(p) {
		if (brush[p.i+""+p.j].empty()) svg.selectAll(".hidden-circle").classed("hidden-circle", false);
	}

	d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");
});

function dateHistogram(data) {

	// Histogram
	var dateExtent = d3.extent(data, function(d){ return d["DATE"]});

	var dateData = [];

	for (year = dateExtent[0]; year <= dateExtent[1]; year++){
		dateData[year-dateExtent[0]] = {date: year,
			number: data.filter(function(d){ return d["DATE"] == year;}).length}
	}


	var marginDateChart = {top: 10, right: 20, bottom: 30, left: 20},
		widthDate = $('#timeline-chart-area').width() - marginDateChart.left - marginDateChart.right,
		heightDate = 300 - marginDateChart.top - marginDateChart.bottom;

	var svgDate = d3.select("#timeline-chart-area").append("svg")
		.attr("width", widthDate + marginDateChart.left + marginDateChart.right)
		.attr("height", heightDate + marginDateChart.top + marginDateChart.bottom)
		.append("g")
		.attr("transform", "translate(" + marginDateChart.left + "," + marginDateChart.top + ")");

	// Scales and axes

	var xDate = d3.scale.ordinal()
		.rangeRoundBands([widthDate, 0], .1)
		.domain(dateData.sort(function(a,b){ return b.date - a.date; }).map(function(d){ return d.date;}));

	var yDate = d3.scale.linear()
		.range([heightDate, 0])
		.domain(d3.extent(dateData, function(d){ return d.number; }));

	var xAxisDate = d3.svg.axis()
		.scale(xDate)
		.orient("bottom");

	var yAxisDate = d3.svg.axis()
		.scale(yDate)
		.orient("left")
		.tickSize(widthDate);

	svgDate.append("g")
		.attr("class", "x-axis axis");

	svgDate.append("g")
		.attr("class", "y-axis axis");

	svgDate.selectAll(".bar")
		.data(dateData)
		.enter().append("rect")
		.attr("class", "bar")
		.attr("x", function(d) { return xDate(d.date); })
		.attr("width", xDate.rangeBand())
		.attr("y", function(d) { return yDate(d.number); })
		.attr("height", function(d) { return heightDate - yDate(d.number); })
		.on("click", linkPlots);


	svgDate.select(".x-axis")
		.attr("transform", "translate(0," + heightDate + ")")
		.call(xAxisDate);

	svgDate.select(".y-axis")
		.attr("transform", "translate(" + widthDate + ",0)")
		.call(yAxisDate);


	function linkPlots(bar) {
		filter = (filter == bar.date) ? "" : bar.date;
		if (filter) {
			svgDate.selectAll(".bar").classed("hidden-bar", function (d) {
				return d.date !== bar.date;
			});
			d3.selectAll("circle").classed("hidden-circle", function (d) {
				return d.DATE !== bar.date;
			})
		} else {
			d3.selectAll("circle").classed("hidden-circle", false);
			d3.selectAll(".bar").classed("hidden-bar", false);
		}
	}

}


function cross(a, b) {
	var c = [], n = a.length, m = b.length, i, j;
	for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
	return c;
}


function getLabel(string){
	switch(string){
		case "BMV":
			return "B-V magnitude";
		case "MSTAR":
			return "Mass of Star";
		case "RSTAR":
			return "Radius of Star";
		case "TEFF":
			return "Teff of Star";
		case "A":
			return "Semi-Major Axis";
		case "PER":
			return "Period";
		case "ECC":
			return "Eccentricity";
		case "DIST":
			return "Distance to star";
		default:
			return string;
	}
}

function getUnits(string){
	switch(string){
		case "BMV":
			return "";
		case "MSTAR":
			return "(Solar masses)";
		case "RSTAR":
			return "(Solar radii)";
		case "TEFF":
			return "(K)";
		case "A":
			return "(AU)";
		case "PER":
			return "(Days)";
		case "ECC":
			return "";
		case "DIST":
			return "(Parsecs)";
		default:
			return string;
	}}

function isLog(string){
	switch(string){
		case "BMV":
		case "MSTAR":
		case "TEFF":
		case "ECC":
		default:
			return false;
		case "RSTAR":
		case "A":
		case "PER":
		case "DIST":
			return true;
	}
}