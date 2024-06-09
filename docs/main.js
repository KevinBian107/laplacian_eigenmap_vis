const img_path_url = 'https://raw.githubusercontent.com/KevinBian107/laplacian_eigenmap_vis/master/asset/full_image_data.json'
const knn_ex_url = 'https://raw.githubusercontent.com/KevinBian107/laplacian_eigenmap_vis/master/asset/knn_ex_network.json'

// const img_path_url = 'https://res.cloudinary.com/duyoevfl6/raw/upload/v1717020699/DSC106%20MET%20Images/cloud_path.json'

export let imagePathsData;
export let knnData;

let loadedImages = false;
let firstTransition = true;

const margin = {top: 0, right: 70, bottom: 0, left: 70}, 
    width = 700 - margin.left - margin.right,
    height = 820 - margin.top - margin.bottom;
const imgWidth = 35, imgHeight = 35;

export const xScale = d3.scaleLinear([0, 1], [0, width-imgWidth]);
export const yScale = d3.scaleLinear([0, 1], [0, height-2.3*imgHeight]);

// function to load images data
export async function load(url) {
    const data = await d3.json(url);
    return data
}

export function loadButton() {
    document.getElementById("loadButton").addEventListener("click", () => {
        const loaderContainer = document.getElementById('loader-container');
        loaderContainer.classList.remove('hidden');
        document.getElementById("loadButton").classList.add('hidden');

        document.getElementById('scroll').style.marginBottom = '400px';
        
    })
}

export function loadImages() {

    if (!loadedImages) {

        document.getElementById("loadButton").addEventListener("click", () => {
            const loaderContainer = document.getElementById('loader-container');
            loaderContainer.classList.remove('hidden');
            document.getElementById("loadButton").classList.add('hidden');

            document.getElementById('scroll').style.marginBottom = '400px';

            // preload knnData
            load(knn_ex_url).then(knn_ex => {
                // ensure knnData is loaded first before showing images
                knnData = knn_ex;
                // async load and parse data 
                load(img_path_url).then(imgPaths => {

                    imagePathsData = imgPaths;

                    d3.select("#imageVis").selectAll('svg').remove();

                    // Append the svg object to the body of the page
                    const svg = d3.select("#imageVis")
                        .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", `translate(${margin.left},${margin.top})`);

                    const images = svg.selectAll("image")
                        .data(imagePathsData.nodes_info)
                        .enter()
                        .append("svg:image")
                        .attr('xlink:href', (d) => (d.path))
                        .attr('x', (d) => xScale(d.org_pos_x))
                        .attr('y', (d) => yScale(d.org_pos_y))
                        .attr('width', imgWidth)
                        .attr('height', imgHeight)
                        .attr('opacity', 0);

                    images
                    .transition()
                    .delay((d, i) => (i * 3))
                    .duration(900)
                    .attr('opacity', 1)
                    .on('start', (d, i) => {
                        // This callback will run after each transition ends
                        if (i > 70){
                            loaderContainer.classList.add('hidden');
                        }
                    });

                    const stepNum = [1, 2, 3, 4, 5, 6]
                    // allow for scrolling
                    stepNum.forEach((i) => {
                        document.getElementById(`step_${i}`).classList.remove("hidden");
                    })
                    document.getElementById(`footer`).classList.remove("hidden");

                    loadedImages=true;
                })
            })

        })

    } else {
        // not append images, but instead, move images to their original position 
        const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");
        const knnVisImg = d3.select("#knnVis").select('svg').selectAll("image");
        const knnImgPath = imagePathsData.nodes_info.slice(0, 15);

        imagesSvg.filter((d, i) => i < 15)
        .attr('opacity', 0)

        knnVisImg
            .data(knnImgPath)
            .transition()
            .duration(800)
            .attr('x', (d) => xScale(d.org_pos_x))
            .attr('y', (d) => yScale(d.org_pos_y))
            .attr('width', imgWidth)
            .attr('height', imgHeight);

        imagesSvg
            .transition()
            .duration(800)
            .attr('x', (d) => xScale(d.org_pos_x))
            .attr('y', (d) => yScale(d.org_pos_y))
            .attr('opacity', 1);

    }
}

export function allImagesKnn() {
    

    d3.select("#matrixKnnVis").select('svg').remove();
    d3.select("#linkVis").select('svg').remove();

    const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");

    imagesSvg
    .attr('y', (d) => xScale(1))
    .attr('width', imgWidth)
    .attr('height', imgHeight)
    
    imagesSvg
    .data(imagePathsData.nodes_info)
    .transition()
    .duration(600)
    .attr('x', (d) => xScale(d.org_pos_x))
    .attr('y', (d) => yScale(d.org_pos_y))
    .attr('width', imgWidth-3)
    .attr('height', imgHeight-3)
    .attr('opacity', 1);

    const linkSvg = d3.select("#linkVis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add new knn links
    const linkVis = linkSvg.selectAll('.link')
        .data(imagePathsData["link_15"])
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('x1', d => xScale(imagePathsData.nodes_info.find((node) => node.id === d.source).org_pos_x)+imgWidth/2)
        .attr('y1', d => yScale(imagePathsData.nodes_info.find((node) => node.id === d.source).org_pos_y)+imgHeight/2)
        .attr('x2', d => xScale(imagePathsData.nodes_info.find((node) => node.id === d.source).org_pos_x)+imgWidth/2)
        .attr('y2', d => yScale(imagePathsData.nodes_info.find((node) => node.id === d.source).org_pos_y)+imgHeight/2)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.6);

    setTimeout(() => {
        // animation 
        linkVis
        .transition()
        .delay((d, i) => Math.floor(i / 8) * 3) // Delay for spread out animation
        .duration(1000)
        .attr('x2', d => xScale(imagePathsData.nodes_info.find((node) => node.id === d.target).org_pos_x)+imgWidth/2)
        .attr('y2', d => yScale(imagePathsData.nodes_info.find((node) => node.id === d.target).org_pos_y)+imgHeight/2)

    }, 200)

    setTimeout(() => {
        // Initialize the force simulation
        const simulation = d3.forceSimulation(imagesSvg)
        .force("link", d3.forceLink(linkVis).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(svg.attr("width") / 2, svg.attr("height") / 2))
        .on("tick", ticked);
    
        imagesSvg.call(drag(simulation))

        // Function to handle the tick event
        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        }

        // Function to handle drag events
        function drag(simulation) {
            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }

            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }
    }, 2700);
    
}

export function embedding() {

    const eigenxScale = d3.scaleLinear()
    .domain([d3.min(imagePathsData.nodes_info, d => d.knn_2e_x_35), d3.max(imagePathsData.nodes_info, d => d.knn_2e_x_35)])
    .range([0, width-imgWidth]);

    const eigenyScale = d3.scaleLinear()
    .domain([d3.min(imagePathsData.nodes_info, d => d.knn_2e_y_35), d3.max(imagePathsData.nodes_info, d => d.knn_2e_y_35)])
    .range([0, height-2.3*imgHeight]);

    const eigen1Scale = d3.scaleLinear()
    .domain([d3.min(imagePathsData.nodes_info, d => d.knn_1e_x), d3.max(imagePathsData.nodes_info, d => d.knn_1e_x)])
    .range([0, height-2.3*imgHeight]);

    d3.select("#linkVis").select('svg').remove();

    const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");
    
    // initial transformation
    imagesSvg
        .transition()
        .duration(800)
        .attr('x', (d) => eigenxScale(d.knn_2e_x_35))
        .attr('y', (d) => eigenyScale(d.knn_2e_y_35));

    // Toggle button value on click
    const transformButton = document.getElementById("transformButton");
    
    // Get the value indicator
    let transformText = document.getElementById("transformText");
    transformText.innerHTML = `Reduce to 1 Dimensional Space`;

    let currentDim = 2

    transformButton.addEventListener("click", () => {

        currentDim = currentDim === 2 ? 1 : 2;

        // transistion between two dimension
        if (currentDim === 2) {
            transformText.innerHTML = `Reduce to 1 Dimensional Space`;
            imagesSvg
            .transition()
            .duration(800)
            .attr('x', (d) => eigenxScale(d.knn_2e_x_35))
            .attr('y', (d) => eigenyScale(d.knn_2e_y_35));
        } else {
            transformText.innerHTML = `Back to 2 Dimensional Space`;
            imagesSvg
            .transition()
            .duration(800)
            .attr('y', (d) => eigen1Scale(d.knn_1e_x))
            .attr('x', (d) => xScale(0.5 + (Math.random()-0.5)*0.5));
        }
    });
   
}

// transisiton to coordinates based on laplaican eigenmap algorithm output
function eigenTransisiton(k) {
    const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");

    const xEigen = `knn_2e_x_${k}`, yEigen = `knn_2e_y_${k}`;

    const eigenxScale = d3.scaleLinear()
    .domain([d3.min(imagePathsData.nodes_info, d => d[xEigen]), d3.max(imagePathsData.nodes_info, d => d[xEigen])])
    .range([0, width-imgWidth]);

    const eigenyScale = d3.scaleLinear()
    .domain([d3.min(imagePathsData.nodes_info, d => d[yEigen]), d3.max(imagePathsData.nodes_info, d => d[yEigen])])
    .range([0, height-2.3*imgHeight]);

    imagesSvg
    .transition()
    .duration(800)
    .attr('x', (d) => eigenxScale(d[xEigen]))
    .attr('y', (d) => eigenyScale(d[yEigen]));
}

function knnFromToTransisiton(k1, k2) {

    const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");

    imagesSvg
        .transition()
        .duration(600)
        .attr('x', (d) => xScale(d.org_pos_x))
        .attr('y', (d) => yScale(d.org_pos_y));

    setTimeout(() =>{
        eigenTransisiton(k1);
    }, 1000);

    setTimeout(() =>{
        eigenTransisiton(k2);
    }, 2000);

}

export function knnExplorer() {
    const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");

    // intiial transisiton
    imagesSvg
    .transition()
    .duration(600)
    .attr('x', (d) => xScale(d.org_pos_x))
    .attr('y', (d) => yScale(d.org_pos_y));

    // transform images based on selected K
    document.getElementById("kEffectButton").addEventListener("click", () => {
        const selectedK = document.getElementById("kDropdown").value;
    
        // disable transition for first selection
        if (!firstTransition) {
            imagesSvg
            .transition()
            .duration(600)
            .attr('x', (d) => xScale(d.org_pos_x))
            .attr('y', (d) => yScale(d.org_pos_y));
        } else {
            firstTransition = false;
        }
    
        setTimeout(() =>{
            eigenTransisiton(selectedK);
        }, 1000);
    });

    // transform images from K1 to K2
    document.getElementById("kFromToButton").addEventListener("click", () => {
        const fromK = document.getElementById("kDropdown_from").value;
        const toK = document.getElementById("kDropdown_to").value;

        if (fromK === toK) {
            document.getElementById("warning").classList.remove("hidden");
        } else {
            document.getElementById("warning").classList.add("hidden");
            knnFromToTransisiton(fromK, toK);
        }

    });

}
