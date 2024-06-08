import { knnData, loadImages, allImagesKnn, embedding, knnExplorer } from './main.js';
import { zoomInImages, updateKNNLink, matrixKnn, knnxScale, knnyScale } from './knn.js';

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
	var stepH = Math.floor(window.innerHeight*1.7);
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

	// steps.classed("is-active", function (d, i) {
	// 	return i === response.index;
	// });

	// update graphic based on step
	const index = response.index;

	switch (index) {
        case 0:
			loadImages();

			if (prevIndex === 1){
				d3.select("#linkVis").select('svg').remove();
				document.getElementById('knnVis').style.zIndex = '1';
			}
			break;

        case 1:
			
			if (prevIndex === 2) {
				d3.select("#matrixKnnVis").select('svg').remove();
				d3.select("#linkVis").select('svg').remove();
				document.getElementById('matrixKnnVis').style.zIndex = '1';
				d3.select('.scroll__vis').selectAll('.tooltip').style('opacity', 0);
			}

            zoomInImages()

			// Get the slider and values
			let slider = document.getElementById("myRange");
			let output = document.getElementById("sliderValue");
			let currentLink = `link_k_3`;
			let lock = false;
			let pointID;

			// Set the initial value
			slider.value = 3;
			output.innerHTML = 3;

			// Update the value indicator as the slider is moved
			slider.oninput = function() {
				output.innerHTML = this.value;
				currentLink = `link_k_${this.value}`;

				// Update graph based on slider value
				updateKNNLink(this.value);

				if (lock) {
					const neighborIds = knnData[currentLink]
					.filter(link => link.source === pointID)
					.map(link => link.target);

					neighborIds.push(pointID);

					const linkVis = d3.select("#linkVis").selectAll('.link');
					const knnVisImg = d3.select("#knnVis").select('svg').selectAll("image");
					
					linkVis.filter(link => link.source === pointID)
					.attr('stroke', 'red')
					.attr('stroke-width', 2);

					linkVis.filter(link => link.source !== pointID)
					.attr('opacity', 0.1)
					.attr('stroke-width', 0.5);

					knnVisImg.filter(img => !neighborIds.includes(img.id))
					.transition()
					.duration(100)
					.attr('opacity', 0.3);

					knnVisImg.filter(img => neighborIds.includes(img.id))
					.transition()
					.duration(250)
					.attr('opacity', 1);
				}
			};

			// tooltip set up
			document.getElementById('knnVis').style.zIndex = '2';

			// will run after the zoomInImage function is fully completed
			document.addEventListener('knnVisSvgAppended', function() {
				const knnVisImg = d3.select("#knnVis").select('svg').selectAll("image");

				// tooltip functionality with knnVis images
				knnVisImg
					.on('mouseover', mouseOver)
					.on('mouseout', mouseOut)
					.on("click", lockImage);

			});
	
			function mouseOver(event, d) {
				if (!lock) {
					const neighbors = knnData[currentLink].filter(link => link.source === d.id);
					const neighborIds = neighbors.map(link => link.target);
					neighborIds.push(d.id);
		
					const linkVis = d3.select("#linkVis").selectAll('.link');
					const knnVisImg = d3.select("#knnVis").select('svg').selectAll("image");

					knnVisImg.filter(img => !neighborIds.includes(img.id))
					.attr('opacity', 0.3);
					
					// gray out lines
					linkVis.filter(link => link.source !== d.id)
					.attr('opacity', 0.1)
					.attr('stroke-width', 0.5);
		
					linkVis.filter(link => link.source === d.id)
					.attr('stroke-width', 2)
					.attr('stroke', 'red');
				}
			}
				
			function mouseOut(event, d) {
				if (!lock) {
					const linkVis = d3.select("#linkVis").selectAll('.link');
					const knnVisImg = d3.select("#knnVis").select('svg').selectAll("image");
	
					knnVisImg
						.attr('opacity', 1);
		
					linkVis
						.attr('opacity', 1)
						.attr('stroke', 'black')
						.attr('stroke-width', 1);
				}
			}

			// lock an image in perspective 
			function lockImage(event, d) {
				if (!lock) {
					lock = true;
					pointID = d.id;
				} else if (d.id === pointID) {
					lock = false;
					mouseOut(event, d);
				}
			}

            break;

        case 2:
			console.log('similarity matrix and degree matrix');

			if (prevIndex === 3) {
				const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");
				imagesSvg
				.transition()
				.duration(300)
				.attr('opacity', 0);
				document.getElementById('imageVis').style.zIndex = '1';
			}

			document.getElementById('knnVis').style.zIndex = '1';

			matrixKnn();

            break;
		case 3:
			console.log('all images Knn');

			if (prevIndex === 2) {
				document.getElementById('matrixKnnVis').style.zIndex = '1';
				d3.select('.scroll__vis').selectAll('.tooltip').style('opacity', 0);
			}

			allImagesKnn()

			break;

		case 4:
			console.log('embedding');

			embedding()

			break;
		case 5:
			console.log('knn explorer');
			knnExplorer();

			break;

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