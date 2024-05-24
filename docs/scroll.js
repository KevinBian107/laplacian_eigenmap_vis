import { drawImages } from './main.js';

let container = d3.select("#scroll").select(".scroll__container");
let text = container.select(".scroll__text");
let imageVis = container.select(".scroll__vis").select('#imageVis');
let steps = text.selectAll(".step");

let imagePaths;

// initialize the scrollama
var scroller = scrollama();

// Initialize the visualization (example using D3.js)
const svg = d3.select("#imageVis")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g");

// Example visualization elements
svg.append("circle")
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", 50)
    .attr("fill", "blue");

// generic window resize listener event
function handleResize() {
	// 1. update height of step elements
	var stepH = Math.floor(window.innerHeight*0.9);
	steps.style("height", stepH + "px");

	// 2. update height of graphic element
	var bodyWidth = d3.select('body').node().offsetWidth;

	// graphic.style('height', window.innerHeight + 'px');

	// 3. update width of chart by subtracting from text width
	// make the height 1/2 of viewport
	// var chartHeight = Math.floor(window.innerHeight / 2);

	// imageVis.style('height', chartHeight + 'px');

	// 3. tell scrollama to update new element dimensions
	scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response) {
	// response = { element, direction, index }

	// add color to current step only
	steps.classed("is-active", function (d, i) {
		return i === response.index;
	});

	// update graphic based on step

	const index = response.index;

	switch (index) {
        case 0:
			drawImages();
            break;
        case 1:
            svg.select("circle")
                .transition()
                .attr("fill", "green")
                .attr("r", 100);
            break;
        case 2:
            svg.select("circle")
                .transition()
                .attr("fill", "red")
                .attr("r", 150);
            break;
    }
}

function init() {

	// 1. force a resize on load to ensure proper dimensions are sent to scrollama
	handleResize();

	// 2. bind scrollama event handlers (this can be chained like below)
	scroller
		.setup({
			container: ".scroll__container",
			step: ".step",
			offset: 0.5,
			debug: true
		})
		.onStepEnter(handleStepEnter);
	
	window.addEventListener("resize", handleResize);

}

// initialize
init();