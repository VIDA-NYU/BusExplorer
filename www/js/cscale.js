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
    var seqMap = [[255,247,236],[254,232,200],[253,212,158],[253,187,132],
                  [252,141, 89], // central color
                  [239,101, 72],[215, 48, 31],[179,  0,  0],[127,  0,  0]];

    // linear interpolation
    function lerp(a, b, u){
        return (1 - u) * a + u * b;
    }

    // protected color computation
    function getColor(val, isDiv){
        // colormap definition
        var cmap = typeof isDiv === 'undefined'? seqMap:divMap;

        // ensure value between 0 and 1
        val = val<0?0:val;
        val = val>1?1:val;

        // invert: red low, white high
        val = 1-val;

        // scale conversion
        var bin = val*7;

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

    exports.drawColorScale = function(parentDiv){
        // dataset
        var data = d3.range(125);

        // creates the quads
        parentDiv.append("svg")
            .attr("width",125)
            .attr("height",30)
            .attr("id", "cscale")
            .classed("leftSpace",true)
          .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d,i){ return i; } )
            .attr("y", 0 )
            .attr("width", 1)
            .attr("height", 30)
            .style("fill", function(d) {
                var c = getColor(d/124);
                return d3.rgb(c[0],c[1],c[2]);
            })
            .style("stroke-width", 0);
    };

    // public api
    return exports;
};