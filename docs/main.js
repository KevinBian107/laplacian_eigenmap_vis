const img_path_url = '/data/small_image_paths.json'
const knn_ex_url = '/data/knn_ex_network.json'

let imagePaths;
let loadedImages = false;
let images;
let filtered_images;

let knnData;

const margin = {top: 0, right: 70, bottom: 0, left: 70},
    width = 750 - margin.left - margin.right, 
    height = 820 - margin.top - margin.bottom;
const imgWidth = 40, imgHeight = 40;
const zoomWidth = 65, zoomHeight = 65;

const xScaleFunc = (w) => d3.scaleLinear([0, 1], [0, w]);
const yScaleFunc = (h) => d3.scaleLinear([0, 1], [0, h]);

const knnxScale = xScaleFunc(width-zoomWidth);
const knnyScale = yScaleFunc(height-2*zoomHeight);

// function to load images data
export async function load(url) {
    // TODO: upload images to cdn providers(AWS Cloudfront or Cloudflare) and use cdn link instead
    const data = await d3.json(url);

    return data
}


// preload images
// async function preloadImages(paths) {
//     //let loadedImages = 0;
//     let images = [];
    
//     paths.forEach((path, index) => {
//         // preloading
//         const img = new Image();
//         img.src = '/data/' + path.path;
        
//         images[index] = img;
        
//         // images[index].onload = () => {
//         //     loadedImages++;
//         //     if (loadedImages === paths.length) {
//         //         callback(images);  // All images are loaded, call the callback
//         // };
//         //     }

//         images[index].onerror = () => {
//             console.error(`Error loading image: ${path.path}`);
//         };
//     });

//     return images
// }

export function loadImages() {

    // async load and parse data 
    load(img_path_url).then(imgPaths => {

        imagePaths = imgPaths.slice(0, 250);

        d3.select("#imageVis").selectAll('svg').remove();

        const xScale = xScaleFunc(width-imgWidth)
        const yScale = yScaleFunc(height-2*imgHeight)

        // Append the svg object to the body of the page
        const svg = d3.select("#imageVis")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        images = svg.selectAll("image")
        .data(imagePaths)
        .enter()
        .append("svg:image")
        .attr('xlink:href', (d) => ('/data/' + d.path))
        .attr('x', (d) => xScale(d.org_pos_x))
        .attr('y', (d) => yScale(d.org_pos_y))
        .attr('width', imgWidth)
        .attr('height', imgHeight);

        loadedImages=true;

        d3.select("#linkVis").select('svg').remove();

    })
}

export function zoomInImages() {

    // Define the zoom scale and center point
    //  const zoomScale = 3;
    //  const centerX = width / 2;
    //  const centerY = height / 2;
    // zoom in visualization 
    // const images = d3.select('#imageVis').select('svg')
    // .transition()
    // .duration(1000)
    // .attr("transform", `translate(${margin.left},${margin.top}) scale(${zoomScale}) translate(${-centerX / zoomScale},${-centerY / zoomScale})`)
    // Select center images
    // const center_img = imagePaths.filter((d) => (d.org_pos_x > 0.47 & 
    //     d.org_pos_x < 0.53 & 
    //     d.org_pos_y > 0.47 & 
    //     d.org_pos_y < 0.53)
    // );

    load(knn_ex_url).then(data => {

        knnData = data;

        const randomIndices = d3.range(250)
        .sort(() => 0.5 - Math.random())
        .slice(0, 15);

        const svg = d3.select('#imageVis').select('svg');

        // Hide other images
        images.filter((d, i) => !randomIndices.includes(i))
        .attr('opacity', 0);

        filtered_images = svg.selectAll("image")
        .filter((d, i) => randomIndices.includes(i))

        filtered_images
        .data(knnData.nodes_info)
        .transition()
        .duration(1000)
        .attr('x', (d) => knnxScale(d.org_pos_x))
        .attr('y', (d) => knnyScale(d.org_pos_y))
        .attr('width', zoomWidth)
        .attr('height', zoomHeight);

        updateKNNLink(1, knnData)
    })

}

export function updateKNNLink(k){

    d3.select("#linkVis").select('svg').remove();

    const linkSvg = d3.select("#linkVis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add new links
    linkSvg.selectAll('.link')
       .data(knnData[`link_k_${k}`])
       .enter()
       .append('line')
       .attr('class', 'link')
       .attr('x1', d => knnxScale(knnData.nodes_info.find((node) => node.id === d.source).org_pos_x)+zoomWidth/2)
       .attr('y1', d => knnyScale(knnData.nodes_info.find((node) => node.id === d.source).org_pos_y)+zoomHeight/2)
       .attr('x2', d => knnxScale(knnData.nodes_info.find((node) => node.id === d.target).org_pos_x)+zoomWidth/2)
       .attr('y2', d => knnyScale(knnData.nodes_info.find((node) => node.id === d.target).org_pos_y)+zoomHeight/2)
       .attr('stroke', 'black');

}

export function matrixKnn() {

    // load(knn_ex_url).then(data => {

    //     const mtxKnnData = data;

    //     d3.select("#linkVis").select('svg').remove();
    //     d3.select("#imageVis").selectAll('svg').remove();

    //     // Append the svg object to the body of the page
    //     const svg = d3.select("#imageVis")
    //         .append("svg")
    //         .attr("width", width + margin.left + margin.right)
    //         .attr("height", height + margin.top + margin.bottom)
    //         .append("g")
    //         .attr("transform", `translate(${margin.left},${margin.top})`);
    // })

    // Hide other images
    filtered_images.filter((d, i) => i>=6)
    .attr('opacity', 0);

    const knnImg = filtered_images
    .filter((d, i) => i<6)

    knnImg.data(knnData.small_node_info)
    .transition()
    .duration(1000)
    .attr('x', (d) => knnxScale(d.org_pos_x))
    .attr('y', (d) => knnyScale(d.org_pos_y))
    .attr('width', zoomWidth+20)
    .attr('height', zoomHeight+20);

    // remove links from knn graph
    d3.select("#linkVis").select('svg').remove();

    const linkSvg = d3.select("#linkVis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add new links
    linkSvg.selectAll('.link')
        .data(knnData.small_link)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('x1', d => knnxScale(knnData.small_node_info.find((node) => node.id === d.source).org_pos_x)+zoomWidth/2)
        .attr('y1', d => knnyScale(knnData.small_node_info.find((node) => node.id === d.source).org_pos_y)+zoomHeight/2)
        .attr('x2', d => knnxScale(knnData.small_node_info.find((node) => node.id === d.target).org_pos_x)+zoomWidth/2)
        .attr('y2', d => knnyScale(knnData.small_node_info.find((node) => node.id === d.target).org_pos_y)+zoomHeight/2)
        .attr('stroke', 'black');
    

    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

    labels.forEach((label, i) => {
        linkSvg
        .append("text")
        .attr('x', knnxScale(knnData.small_node_info[i].org_pos_x)+100)
        .attr('y', knnyScale(knnData.small_node_info[i].org_pos_y))
        .text(label)
        .style("font-size", "18px")
        .style("font-weight", "bold");
    })

    // tooltip
    knnImg.on('mouseover', mouseOver)
    .on('mouseout', handleMouseOut)
    .on('mousemove', handleMouseMove);

    const tooltip = d3.select('#tooltip');

    function mouseOver(event, d) {
        console.log('move in');

        const neighbors = knnData.small_link.filter(link => link.source === d.id);
        const neighborIds = neighbors.map(link => link.target);

        console.log(d)
    
        knnImg.filter(img => !neighborIds.includes(img.id)).attr('opacity', 0.3);
        d3.select(this).attr('opacity', 1);
        // console.log(knnImg.filter(img => !neighborIds.includes(img.id)))

        //linkSvg.filter(link => !(link.source === d.id && link.target === d.id)).attr('opacity', 0.3);
    
        tooltip.style('opacity', 1)
        .html(`ID: ${d.id}<br>X: ${d.org_pos_x}<br>Y: ${d.org_pos_y}`);
    }
    
    function handleMouseOut(event, d) {
        console.log('mouse out')

        knnImg.attr('opacity', 1);
        linkSvg.attr('opacity', 1);
    
        // tooltip.style('opacity', 0);
    }
    
    function handleMouseMove(event, d) {
        tooltip.style('left', (event.pageX + 10) + 'px')
               .style('top', (event.pageY - 28) + 'px');
    }

}





export function zoomOutImages() {
    
}
