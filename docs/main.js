const img_path_url = 'https://raw.githubusercontent.com/KevinBian107/laplacian_eigenmap_vis/master/asset/full_small_image_data.json'

// const img_path_url = 'https://res.cloudinary.com/duyoevfl6/raw/upload/v1717020699/DSC106%20MET%20Images/cloud_path.json'

export let imagePathsData;
export let loadedknnData;

let loadedImages = false;

const margin = {top: 0, right: 70, bottom: 0, left: 70}, 
    width = 700 - margin.left - margin.right,
    height = 820 - margin.top - margin.bottom;
const imgWidth = 35, imgHeight = 35;

const xScale = d3.scaleLinear([0, 1], [0, width-imgWidth])
const yScale = d3.scaleLinear([0, 1], [0, height-2.3*imgHeight])

// function to load images data
export async function load(url) {
    const data = await d3.json(url);
    return data
}


export function loadImages() {

    if (!loadedImages) {

        document.getElementById("loadButton").addEventListener("click", () => {
            const loaderContainer = document.getElementById('loader-container');
            loaderContainer.classList.remove('hidden');

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
                    if (i === 80){
                        loaderContainer.classList.add('hidden');
                    }
                });

                const stepNum = [1, 2, 3, 4, 5, 6]
                // allow for scrolling
                stepNum.forEach((i) => {
                    document.getElementById(`step_${i}`).classList.remove("hidden");
                })
                loadedImages=true;
            })

            document.getElementById("loadButton").classList.add('hidden');

        })

    } else {
        // not append images, but instead, move images to their original position 
        const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");

        imagesSvg
        .data(imagePathsData.nodes_info)
        .transition()
        .duration(800)
        .attr('x', (d) => xScale(d.org_pos_x))
        .attr('y', (d) => yScale(d.org_pos_y))
        .attr('width', imgWidth)
        .attr('height', imgHeight)
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
        .attr('stroke-width', 1);

    setTimeout(() => {
        // animation 
        linkVis
        .transition()
        .delay((d, i) => Math.floor(i / 5) * 3) // Delay for spread out animation
        .duration(1000)
        .attr('x2', d => xScale(imagePathsData.nodes_info.find((node) => node.id === d.target).org_pos_x)+imgWidth/2)
        .attr('y2', d => yScale(imagePathsData.nodes_info.find((node) => node.id === d.target).org_pos_y)+imgHeight/2)
    }, 200)

    // tooltip functionality with all images
    // allImages
    // .on('mouseover', mouseOver)
    // .on('mouseout', mouseOut);

    // d3.select('.scroll__vis').selectAll('.tooltip').remove();

    // const tooltip = d3.select('.scroll__vis').append('div').attr('class', 'tooltip');

    // function mouseOver(event, d) {
    //     const neighbors = imagePathsData.link_15.filter(link => link.source === d.id);
    //     const neighborIds = neighbors.map(link => link.target);
    //     neighborIds.push(d.id);
            
    //     // gray out lines
    //     linkVis.filter(link => link.source !== d.id)
    //     .attr('opacity', 0.2)
    //     .attr('stroke-width', 1);
        
    //     linkVis.filter(link => link.source === d.id)
    //     .attr('stroke-width', 3)
    //     .attr('stroke', 'red');

    //     tooltip.style('opacity', 1)
    //     .html(`Point:`);
    // }
            
    // function mouseOut(event, d) {
    //     console.log('mouse out')
    //     linkVis
    //     .attr('opacity', 1)
    //     .attr('stroke', 'black')
    //     .attr('stroke-width', 2);
    // }
    
}

export function embedding() {

    const eigenxScale = d3.scaleLinear()
    .domain([d3.min(imagePathsData.nodes_info, d => d.knn_2e_x), d3.max(imagePathsData.nodes_info, d => d.knn_2e_x)])
    .range([0, width-imgWidth]);

    const eigenyScale = d3.scaleLinear()
    .domain([d3.min(imagePathsData.nodes_info, d => d.knn_2e_y), d3.max(imagePathsData.nodes_info, d => d.knn_2e_y)])
    .range([0, height-2.3*imgHeight]);

    const eigen1Scale = d3.scaleLinear()
    .domain([d3.min(imagePathsData.nodes_info, d => d.knn_1e_x), d3.max(imagePathsData.nodes_info, d => d.knn_1e_x)])
    .range([0, height-2.3*imgHeight]);

    const linkSvg = d3.select("#linkVis").select('svg');

    linkSvg.remove()

    // linkSvg.selectAll('.link')
    // .transition()
    // .duration(800)
    // .attr('x1', d => xScale(d.knn_2e_x)+imgWidth/2)
    // .attr('y1', d => yScale(d.knn_2e_y)+imgHeight/2)
    // .attr('x2', d => xScale(d.knn_2e_x)+imgWidth/2)
    // .attr('y2', d => yScale(d.knn_2e_y)+imgHeight/2)

    const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");

    // initial transformation
    imagesSvg
    .transition()
    .duration(800)
    .attr('x', (d) => eigenxScale(d.knn_2e_x))
    .attr('y', (d) => eigenyScale(d.knn_2e_y));

    // Toggle button value on click
    const transformButton = document.getElementById("transformButton");
    // Get the value indicator
    let transformText = document.getElementById("transformText");
    transformText.innerHTML = `Reduce to 1 Dimensional Space`;

    let currentDim = 2

    transformButton.addEventListener("click", () => {

        currentDim = currentDim === 2 ? 1 : 2;

        // Add any additional logic to handle the toggle effect
        // For example, you can start/stop the simulation or change its parameters
        if (currentDim === 2) {
            transformText.innerHTML = `Reduce to 1 Dimensional Space`;
            imagesSvg
            .transition()
            .duration(800)
            .attr('x', (d) => eigenxScale(d.knn_2e_x))
            .attr('y', (d) => eigenyScale(d.knn_2e_y));

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

function knnTransistion(k) {
    const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");

    imagesSvg
    .transition()
    .duration(600)
    .attr('x', (d) => xScale(d.org_pos_x))
    .attr('y', (d) => yScale(d.org_pos_y));

    const xEigen = `knn_2e_x_${k}`, yEigen = `knn_2e_y_${k}`

    const eigenxScale = d3.scaleLinear()
    .domain([d3.min(imagePathsData.nodes_info, d => d[xEigen]), d3.max(imagePathsData.nodes_info, d => d[xEigen])])
    .range([0, width-imgWidth]);

    const eigenyScale = d3.scaleLinear()
    .domain([d3.min(imagePathsData.nodes_info, d => d[yEigen]), d3.max(imagePathsData.nodes_info, d => d[yEigen])])
    .range([0, height-2.3*imgHeight]);

    console.log(imagePathsData)

    setTimeout(() =>{
        imagesSvg
        .transition()
        .duration(800)
        .attr('x', (d) => {
            console.log(d[xEigen]);
            console.log(d);
            return eigenxScale(d[xEigen])
        })
        .attr('y', (d) => eigenyScale(d[yEigen]));
    }, 1000);

}

export function knnExplorer() {

    const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");

    imagesSvg
    .transition()
    .duration(600)
    .attr('x', (d) => xScale(d.org_pos_x))
    .attr('y', (d) => yScale(d.org_pos_y));

    // Add event listener to transform images based on selected K
    document.getElementById("kEffectButton").addEventListener("click", () => {
        const selectedK = document.getElementById("kDropdown").value;

        console.log(selectedK);
        knnTransistion(selectedK);
    });


}
