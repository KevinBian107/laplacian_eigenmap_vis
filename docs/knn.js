import { load, imagePathsData, xScale, yScale } from './main.js';

const knn_ex_url = 'https://raw.githubusercontent.com/KevinBian107/laplacian_eigenmap_vis/master/asset/knn_ex_network.json'

// const knn_ex_url = 'https://res.cloudinary.com/duyoevfl6/raw/upload/v1717021257/DSC106%20MET%20Images/knn_path.json' 

const margin = {top: 0, right: 70, bottom: 0, left: 70}, 
    width = 700 - margin.left - margin.right,
    height = 820 - margin.top - margin.bottom;

export let knnData;
const zoomWidth = 65, zoomHeight = 65;
const imgWidth = 35, imgHeight = 35;

export const knnxScale = d3.scaleLinear([0, 1], [0, width-zoomWidth]);
export const knnyScale = d3.scaleLinear([0, 1], [0, height-2*zoomHeight]); 

const simMatrix = [ 
    [1, 0, 1, 1, 0, 1], 
    [1, 1, 1, 1, 1, 1], 
    [1, 1, 1, 1, 1, 0], 
    [1, 1, 1, 1, 0, 0], 
    [0, 1, 0, 0, 1, 1], 
    [0, 0, 0, 0, 1, 1] 
]

const highlightedCells = {
    'A':['00', '10', '20', '30'],
    'B':['11', '21', '31', '41'],
    'C':['02', '12', '22', '32'],
    'D':['03', '13', '23', '33'],
    'E':['14', '24', '44', '54'],
    'F':['05', '15', '45', '55']
};

const degreeMatrix = [ 
    [3, 0, 0, 0, 0, 0], 
    [0, 3, 0, 0, 0, 0], 
    [0, 0, 3, 0, 0, 0], 
    [0, 0, 0, 3, 0, 0], 
    [0, 0, 0, 0, 3, 0], 
    [0, 0, 0, 0, 0, 3] 
]

export async function zoomInImages() {

    // zoom in visualization 
    load(knn_ex_url).then(data => {

        knnData = data;

        const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");

        imagesSvg
            .transition()
            .duration(600)
            .attr('y', knnyScale(1))
            .attr('opacity', 0);

        d3.select("#knnVis").select('svg').remove();

        // Append the svg object to the div tag
        const imgSvg = d3.select("#knnVis")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const knnImgPath = imagePathsData.nodes_info.slice(0, 15);
        
        // load and randomly position images
        const knnImg = imgSvg
            .selectAll("image")
            .data(knnImgPath)
            .enter()
            .append("svg:image")
            .attr('xlink:href', (d) => (d.path))
            .attr('x', (d) => xScale(d.org_pos_x))
            .attr('y', (d) => yScale(d.org_pos_y))
            .attr('width', imgWidth)
            .attr('height', imgHeight);

        // transform images to correct position 
        knnImg
            .data(knnData.nodes_info)
            .transition()
            .duration(600)
            .attr('x', (d) => knnxScale(d.org_pos_x))
            .attr('y', (d) => knnyScale(d.org_pos_y))
            .attr('width', zoomWidth)
            .attr('height', zoomHeight)
            .attr('opacity', 1);

        setTimeout(() => {
            updateKNNLink(3)
        }, 500);

        // Dispatch a custom event indicating the SVG is added
        document.dispatchEvent(new CustomEvent('knnVisSvgAppended'));

    })

}

export async function updateKNNLink(k){

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
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

}

export function matrixKnn() {

    load(knn_ex_url).then(data => {
        // knn example with 6 images
        knnData = data;

        d3.select("#linkVis").select('svg').remove();

        // const imagesSvg = d3.select('#imageVis').select('svg').selectAll("image");
        const knnVisImg = d3.select("#knnVis").select('svg').selectAll("image");

        knnVisImg
        .transition()
        .duration(800)
        .attr('y', knnyScale(1))
        .attr('opacity', 0);

        d3.select("#matrixKnnVis").select('svg').remove();

        // Append the svg object to the div tag
        const imgSvg = d3.select("#matrixKnnVis")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const knnImgPath = imagePathsData.nodes_info.slice(0, 6)
        
        // load and randomly position images
        const knnImg = imgSvg
            .selectAll("image")
            .data(knnImgPath)
            .enter()
            .append("svg:image")
            .attr('xlink:href', (d) => (d.path))
            .attr('x', (d) => knnxScale(d.org_pos_x))
            .attr('y', knnyScale(0));
        
        // transform images to correct position 
        knnImg
            .data(knnData.small_node_info)
            .transition()
            .duration(1000)
            .attr('x', (d) => knnxScale(d.org_pos_x))
            .attr('y', (d) => knnyScale(d.org_pos_y))
            .attr('width', zoomWidth+20)
            .attr('height', zoomHeight+20);

        // append knn link 
        const linkSvg = d3.select("#linkVis")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Add new links
        const knnLink = linkSvg
            .selectAll('.link')
            .data(knnData.small_link)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('x1', d => knnxScale(knnData.small_node_info.find((node) => node.id === d.source).org_pos_x)+zoomWidth/2)
            .attr('x2', d => knnxScale(knnData.small_node_info.find((node) => node.id === d.target).org_pos_x)+zoomWidth/2)
            .attr('y1', d => knnyScale(knnData.small_node_info.find((node) => node.id === d.source).org_pos_y)+zoomHeight/2)
            .attr('y2', d => knnyScale(knnData.small_node_info.find((node) => node.id === d.target).org_pos_y)+zoomHeight/2)
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
        const idToLabels = [
            {'id':7975, 'point':'C', 'neighbor': 'A, B, D'},
            {'id':10049, 'point':'D', 'neighbor': 'A, B, C'},
            {'id':2968, 'point':'A', 'neighbor': 'B, C, D'},
            {'id':3480, 'point':'B', 'neighbor': 'C, D, E'},
            {'id':3242, 'point':'E', 'neighbor': 'B, C, F'},
            {'id':2341, 'point':'F', 'neighbor': 'A, B, E'},
        ]

        // append label A to F
        labels.forEach((label, i) => {
            linkSvg
            .append("text")
            .attr('x', knnxScale(knnData.small_node_info[i].org_pos_x)+100)
            .transition()
            .duration(1000)
            .attr('y', knnyScale(knnData.small_node_info[i].org_pos_y))
            .text(label)
            .style("font-size", "20px")
            .style("font-weight", "bold");
        })

        document.getElementById('matrixKnnVis').style.zIndex = '2';

        // tooltip functionality in knn example with 6 images
        knnImg.on('mouseover', mouseOver)
        .on('mouseout', mouseOut)
        .on('mousemove', mouseMove);

        d3.select('.scroll__vis').selectAll('.tooltip').remove();

        const tooltip = d3.select('.scroll__vis').append('div').attr('class', 'tooltip');

        function mouseOver(event, d) {
            const neighbors = knnData.small_link.filter(link => link.source === d.id);
            const neighborIds = neighbors.map(link => link.target);
            neighborIds.push(d.id);
        
            knnImg.filter(img => !neighborIds.includes(img.id))
            .attr('opacity', 0.2)
            
            // gray out lines
            knnLink.filter(link => link.source !== d.id)
            .attr('opacity', 0.2)
            .attr('stroke-width', 1);
        
            knnLink.filter(link => link.source === d.id)
            .attr('stroke-width', 3)
            .attr('stroke', 'red');
        
            const label = idToLabels.find((x) => d.id === x.id)
            
            // tooltip box
            tooltip.style('opacity', 1)
            .html(`Point: ${label.point}<br>Nearest Neighbors: <br>${label.neighbor}`);

            updateMatrixEnter(highlightedCells[label.point], label.point);
        }
                
        function mouseOut(event, d) {
            knnImg
            .attr('opacity', 1);
        
            knnLink
            .attr('opacity', 1)
            .attr('stroke', 'black')
            .attr('stroke-width', 2);
        
            tooltip.style('opacity', 0);
            
            updateMatrixExit();
        }
        
        function mouseMove(event, d) {
            const [xm, ym] = d3.pointer(event);
            tooltip.style('left', (xm + 150) + 'px')
                    .style('top', (ym - 30) + 'px');
        }

        createMatrix('similarityMatrix', simMatrix);
        createMatrix('degreeMatrix', degreeMatrix);
        
    })

}


// Function to create the MathJax matrix
function createMatrix(id, matrixArray) {
    const matrixContainer = document.getElementById(id);
    id = id.substring(0, 3);

    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    let matrix = `
    <div></div>  
    ${rows.map((label, i) => `<div id="${id}-label-col-${i}" class="label">${label}</div>`).join('')}
    `;  // column label
    
    for (let i = 0; i < 6; i++) {
        matrix += `<div id="${id}-label-row-${i}" class="label">${rows[i]}</div>`;  // Row label
        for (let j = 0; j < 6; j++) {
            matrix += `<div id="${id}-cell-${i}-${j}" class="cell" >${matrixArray[i][j]}</div>`;
        }
    }

    matrixContainer.innerHTML = matrix;
    d3.selectAll('.matrix-label').style('opacity', 1);
}


function updateMatrixEnter(highlightedCells, point) {
    console.log('highlight matrix');
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            if (highlightedCells.includes(`${i}${j}`)) {
                const cell = document.getElementById(`sim-cell-${i}-${j}`);
                const rowLabel = document.getElementById(`sim-label-row-${i}`);
                const colLabel = document.getElementById(`sim-label-col-${j}`);
                
                // highlight degree matrix
                if (i === j) {
                    document.getElementById(`deg-label-col-${j}`).style.backgroundColor = 'rgb(255, 251, 145)'
                    document.getElementById(`deg-label-row-${i}`).style.backgroundColor = 'rgb(255, 251, 145)'
                    document.getElementById(`deg-cell-${i}-${j}`).style.backgroundColor = 'rgb(255, 251, 145)'
                }

                cell.style.backgroundColor = 'rgb(255, 251, 145)';
                rowLabel.style.backgroundColor = 'rgb(255, 251, 145)';
                colLabel.style.backgroundColor = 'rgb(255, 251, 145)';
            }
        }
    }
}

// clear highlighted matrix entries 
function updateMatrixExit() {
    console.log('not highlight matrix');
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            document.getElementById(`sim-cell-${i}-${j}`).style.backgroundColor = '';

            // clear degree matrix highlight
            if (i === j) {
                document.getElementById(`deg-label-col-${j}`).style.backgroundColor = ''
                document.getElementById(`deg-label-row-${i}`).style.backgroundColor = ''
                document.getElementById(`deg-cell-${i}-${j}`).style.backgroundColor = ''
            }
        }
        document.getElementById(`sim-label-row-${i}`).style.backgroundColor = '';
        document.getElementById(`sim-label-col-${i}`).style.backgroundColor = '';
    }
}
