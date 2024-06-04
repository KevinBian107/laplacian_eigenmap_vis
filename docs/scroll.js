import { loadImages, allImagesKnn, embedding } from './main.js';
import { zoomInImages, updateKNNLink, matrixKnn } from './knn.js';

let container = d3.select("#scroll").select(".scroll__container");
let text = container.select(".scroll__text");
let imageVis = container.select(".scroll__vis").select('#imageVis');
let steps = text.selectAll(".step");

let prevIndex = -1;

// initialize the scrollama
var scroller = scrollama();

// generic window resize listener event
function handleResize() {
	// 1. update height of step elements
	var stepH = Math.floor(window.innerHeight*1.5);
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

	steps.classed("is-active", function (d, i) {
		return i === response.index;
	});

	// update graphic based on step
	const index = response.index;
	console.log(index);

	switch (index) {
        case 0:
			loadImages();

			if (prevIndex !== -1){
				d3.select("#linkVis").select('svg').remove();
			}
			break;

        case 1:
			console.log('zoom in')
			
			if (prevIndex === 2) {
				d3.select("#matrixKnnVis").select('svg').remove();
			}

            zoomInImages();

			// Get the slider
			let slider = document.getElementById("myRange");

			// Get the value indicator
			let output = document.getElementById("sliderValue");


			// Set the initial value
			slider.value = 1;
			output.innerHTML = 1;

			// Update the value indicator as the slider is moved
			slider.oninput = function() {
				output.innerHTML = this.value;

				// Update graph based on slider value
				updateKNNLink(this.value);
			};

            break;

        case 2:
			console.log('similarity matrix and degree matrix');

			const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image")

			if (prevIndex === 3) {
				imagesSvg
				.transition()
				.duration(300)
				.attr('opacity', 0);
			}

			matrixKnn();

            break;
		case 3:
			console.log('all images Knn');

			allImagesKnn()

			break;

		case 4:
			console.log('embedding');

			embedding()

    }
	
	prevIndex = index;
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
			debug: false
		})
		.onStepEnter(handleStepEnter);
	
	window.addEventListener("resize", handleResize);

}

// initialize
init();