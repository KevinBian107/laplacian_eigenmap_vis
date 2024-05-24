let imagePaths;

// function to load images data
export async function load() {
    // TODO: upload images to cdn providers(AWS Cloudfront or Cloudflare) and use cdn link instead
    const data = await d3.json('/data/small_img_data.json');
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

export function drawImages() {

    // async load and parse data 
    load().then(imgPaths => {

        console.log('loaded')

        imagePaths = imgPaths;

        const margin = {top: 70, right: 100, bottom: 30, left: 100},
        width = 1100 - margin.left - margin.right, 
        height = 800 - margin.top - margin.bottom;

        d3.select("#imageVis").selectAll('svg').remove()

        // Append the svg object to the body of the page
        const svg = d3.select("#imageVis")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        svg.selectAll("image")
        .data(imagePaths)
        .enter()
        .append("svg:image")
        .attr('xlink:href', (d) => (d.path))
        .attr('x', d3.randomInt(0, width))
        .attr('y', d3.randomInt(0, height))
        .attr('width', 50)
        .attr('height', 50);

    })
    
}


