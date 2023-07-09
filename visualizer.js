function exportCanvas() {
    var canvas = document.getElementById('canvas');
    var dataURL = canvas.toDataURL();
    // download image
    var link = document.createElement('a');
    link.download = 'visual.png';
    link.href = dataURL;
    link.click();
}

// Path: visualizer.js
class Visualizer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

    }

    clear() {
        // make canvas completely transparent
        this.ctx.clearRect(0, 0, this.width, this.height);

    }

    draw() { }
}

class Node {
    constructor(height, width) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.weight = Math.random();
        this.connections = 0;


    }




    draw(ctx) {
        // draw circle
        /*
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
        */

        let radius = 8;
        
        // draw outer ring for x connections
        const levels = [0, 5, 10, 25, 50, 100];
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'white';
        ctx.lineWidth = 2;
        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            if (this.connections >= level) {
                /*
                ctx.beginPath();
                ctx.arc(this.x, this.y, 10 + i * 10, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.closePath();
                */

                //radius+=10;
            }
        }

        var gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        // draw filled circle with soft edges
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.fill();
        ctx.closePath();


        

    }
}

class NNVisualizer extends Visualizer {
    constructor() {
        super();

        const NODE_COUNT = 40;
        const GRID_SIZE = 200;
        this.nodes = [];
        /*
        for (let i = 0; i < NODE_COUNT; i++) {
            this.nodes.push(new Node(this.height, this.width));
        }
        */
        noise.seed(Math.random());
        const PERLIN_SCALE = 0.10;

        for(let i = 1; i < GRID_SIZE-1; i++) {
            for(let j = 1; j < GRID_SIZE-1; j++) {
                var value = noise.perlin2(i * PERLIN_SCALE, j * PERLIN_SCALE);
                console.log(value);
                if(value * value * value > Math.random()) {
                    var node = new Node(this.height, this.width);
                    node.x = i * this.width / GRID_SIZE;
                    node.y = j * this.height / GRID_SIZE;
                    node.weight = value;
                    this.nodes.push(node);
                }
            }
        }
                

        this.draggedNode = null;

        this.regEvents();
    }

    regEvents() {
        this.canvas.addEventListener('mousedown', this.mouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.mouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.drag.bind(this));
    }

    drag(event) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;

        if (this.draggedNode) {
            this.draggedNode.x = x;
            this.draggedNode.y = y;

            this.draw();
        }
    }

    mouseUp(event) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;

        if (this.draggedNode === null) {
            // create new node
            let newNode = new Node(this.height, this.width);
            newNode.x = x;
            newNode.y = y;
            this.nodes.push(newNode);
            this.draw();
        }


        this.draggedNode = null;
    }



    mouseDown(event) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;

        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const dx = node.x - x;
            const dy = node.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 10) {
                this.draggedNode = node;
                break;
            }
        }

    }

    drawPath45(node1, node2, maxWidth, maxDist) {
        const dx = node1.x - node2.x;
        const dy = node1.y - node2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
            return;
        }

        const width = (maxDist - dist) / maxDist * maxWidth;
        const alpha = (maxDist - dist) / maxDist;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha + ')';
        this.ctx.lineWidth = width;

        // draw from node1 to node2
        let x1 = node1.x;
        let y1 = node1.y;
        while (true) {
            let dx = node2.x - x1;
            let dy = node2.y - y1;

            if (dx === 0 && dy === 0) {
                break;
            }

            if (dx === 0 || dy === 0) {
                // draw line
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(node2.x, node2.y);
                this.ctx.stroke();
                this.ctx.closePath();
                break;
            }

            // calculate target point
            // go to x pos first in 45 degree angle
            const x2 = x1 + Math.sign(dx) * Math.min(Math.abs(dx), Math.abs(dy));
            const y2 = y1 + Math.sign(dy) * Math.min(Math.abs(dx), Math.abs(dy));

            // draw line
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            this.ctx.closePath();

            // update x1, y1
            x1 = x2;
            y1 = y2;

        }
    }


    drawPath(node1, node2, maxWidth, maxDist) {
        const dx = node1.x - node2.x;
        const dy = node1.y - node2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
            return;
        }

        const width = (maxDist - dist) / maxDist * maxWidth;
        const alpha = (maxDist - dist) / maxDist;
        alpha = Math.min(1, alpha * node1.weight * node2.weight);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha + ')';
        this.ctx.lineWidth = width;

        this.ctx.beginPath();
        this.ctx.moveTo(node1.x, node1.y);
        this.ctx.lineTo(node2.x, node2.y);
        this.ctx.stroke();
        this.ctx.closePath();
    }



    drawPaths() {
        const maxDist = 300;
        const maxWidth = 7;

        this.ctx.strokeStyle = 'white';
        this.ctx.fillStyle = 'white';
        var drawn = [];
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            node.connections = 0;
            drawn.push(node);
            for (let j = 0; j < this.nodes.length; j++) {
                const otherNode = this.nodes[j];
                if (node === otherNode) {
                    continue;
                }

                if (drawn.includes(otherNode)) {
                    continue;
                }

                const dx = node.x - otherNode.x;
                const dy = node.y - otherNode.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                let realDist = maxDist * (node.weight + otherNode.weight);
                realDist = maxDist;

                if (dist > realDist) {
                    continue;
                }

                node.connections++;

                this.drawPath45(node, otherNode, maxWidth, realDist);
            }
        }
    }


    transform() {

        var imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        var pixels = imageData.data;
        const zoomRadius = 100;
        const zoomFactor = 50;

        // create empty image data
        var newImageData = this.ctx.createImageData(this.width, this.height);
        var newPixels = newImageData.data;


        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];

            let zoomCenterX = node.x;
            let zoomCenterY = node.y;

            let zR = zoomRadius * node.weight;
            let zF = zoomFactor * node.weight;

            // Iterate through each pixel in the canvas
            for (var y = 0; y < canvas.height; y++) {
                if(Math.sqrt((y - zoomCenterY) * (y - zoomCenterY)) > zR) {
                    continue;
                }
                for (var x = 0; x < canvas.width; x++) {
                    if(Math.sqrt((x - zoomCenterX) * (x - zoomCenterX)) > zR) {
                        continue;
                    }
                    // Calculate the distance from the pixel to the zoom center
                    var dx = x - zoomCenterX;
                    var dy = y - zoomCenterY;
                    var distance = Math.sqrt(dx * dx + dy * dy);

                    // Check if the pixel is within the zoom radius
                    if (distance <= zoomRadius) {
                        // Calculate the zoom factor based on the distance
                        var factor = 1 - (distance / zoomRadius) * (1 - zoomFactor);

                        var total = dx + dy;
                        // Calculate the new coordinates for the pixel
                        var newX = zoomCenterX + dx * factor / total;
                        var newY = zoomCenterY + dy * factor / total;

                        // Get the original pixel color
                        var index = (y * canvas.width + x) * 4;
                        var red = pixels[index];
                        var green = pixels[index + 1];
                        var blue = pixels[index + 2];
                        var alpha = pixels[index + 3];

                        // Set the new pixel color at the updated coordinates
                        var newIndex = (Math.round(newY) * canvas.width + Math.round(newX)) * 4;
                        pixels[newIndex] = red;
                        pixels[newIndex + 1] = green;
                        pixels[newIndex + 2] = blue;
                        pixels[newIndex + 3] = alpha;
                    }
                }
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }


    draw() {
        this.clear();

        // draw paths
        this.drawPaths();

        // draw nodes
        this.ctx.strokeStyle = 'white';
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].draw(this.ctx);
        }

        //this.transform();

    }
}

const visualizer = new NNVisualizer();
visualizer.draw();