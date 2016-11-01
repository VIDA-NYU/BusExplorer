/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.ColorScale = function(){
    // exported object
    var exports = {};

    // divergent colormap
    var divMap = [[178, 24, 43],[214, 96, 77],[244,165,130],[253,219,199],
                  [247,247,247], // central color
                  [209,229,240],[146,197,222],[ 67,147,195],[ 33,102,172]];

    // sequential colormap
    // var seqMap = [[255,247,236],[254,232,200],[253,212,158],[253,187,132],
                  // [252,141, 89], // central color
                  // [239,101, 72],[215, 48, 31],[179,  0,  0],[127,  0,  0]];
    var seqMap = [[26, 150, 65], [166, 217, 106], [255, 255, 191], [253, 174, 97], [215, 25, 28],[215, 15, 10]];

    var width = 250;
    var height = 30;
    var margin = {top: 0, right: 10, bottom: 50, left: 10};
    var invert = false;

    // linear interpolation
    function lerp(a, b, u){
        return (1 - u) * a + u * b;
    }

    // protected color computation
    function getColor(val, isDiv, inv){
        // colormap definition
        var cmap = typeof isDiv === 'undefined'? seqMap:divMap;

        // ensure value between 0 and 1
        val = val<0?0:val;
        val = val>1?1:val;

        // invert: red low, white high
        if(invert || inv)
            val = val;
        else
            val = 1-val;

        // scale conversion
        var bin = val*(cmap.length-2);

        // color bin
        var idx = Math.floor(bin);
        var fac = bin%1;

        // compute each component
        var r = lerp(cmap[idx][0],cmap[idx+1][0],fac);
        var g = lerp(cmap[idx][1],cmap[idx+1][1],fac);
        var b = lerp(cmap[idx][2],cmap[idx+1][2],fac);

        // return the color
        return [r,g,b];
    }

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    exports.getHexColor = function(val, isDiv, inv) {
        var rgb = getColor(val, isDiv);
        return "#" + componentToHex(Math.floor(rgb[0])) + componentToHex(Math.floor(rgb[1])) + componentToHex(Math.floor(rgb[2]));
    };

    // Threejs color
    exports.getThreeColor = function(val, isDiv){
        // computes the rgb values
        var rgb = getColor(val,isDiv);
        // Three.js color
        var color = new THREE.Color();
        color.setRGB(rgb[0]/255,rgb[1]/255,rgb[2]/255);

        // return the color
        return color;
    };

    exports.drawColorScale = function(parentDiv, legendText, range, inv){

        if(inv == undefined) inv = false;
        invert = inv;

        // dataset
        var numBins = 50;
        var data = d3.range(numBins);

        var x0 = d3.scale.linear()
            .domain(range)
            .range([margin.left, width+margin.left]);

        // axis
        var xAxis = d3.svg.axis()
            .scale(x0)
            .orient("bottom");

        // creates the quads
        var svg = parentDiv.append("svg");

        svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", "cscale")
          .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("x", function(d,i){ return (width/data.length)*i; } )
            .attr("y", 0 )
            .attr("width", (width/data.length)+1)
            .attr("height", height)
            .style("fill", function(d) {
                var c = getColor(d/numBins);
                return d3.rgb(c[0],c[1],c[2]);
            })
            .style("stroke-width", 0);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("text")
            .text(legendText)
            .attr("x", width/2)
            .attr("y", height + margin.top + margin.bottom/1.5)
            .attr("text-anchor", "middle")

    };

    // public api
    return exports;
};