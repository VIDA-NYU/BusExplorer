/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.BarChart = function(){
    // creates chart and dim
    var chart = undefined;
    var cdim  = undefined;
    var parent = undefined;
    var y = undefined;
    var n = 0;

    // chart size
    var margin = {top: 20, right: 30, bottom: 30, left: 40};
    var width  = 380 - margin.left - margin.right;
    var height = 190 - margin.top - margin.bottom;

    // bins creation variables
    var max = 0;
    var min = 0;

    // exported api
    var exports = {};

    // creates the dc.js chart
    function createChart(parentDiv,data){
        console.log(data);
        var m = 2; // number of cases
        var max = 0;
        n = 0; // number of segments

        // find number of segments
        for(var i=0; i<m; i++) {
            for(var j=0; j<data[i].length; j++) {
                data[i][j].caseId = i; // used for update
                n = Math.max(n,data[i][j].segment);
                max = Math.max(max,data[i][j].mean);
            }
        }
        n = n+1;

        console.log(n);


        y = d3.scale.linear()
            .domain([0, max])
            .range([height, 0]);

        var x0 = d3.scale.ordinal()
            .domain(d3.range(n))
            .rangeBands([0, width], .2);

        var x1 = d3.scale.ordinal()
            .domain(d3.range(m))
            .rangeBands([0, x0.rangeBand()]);

        var z = d3.scale.category10();

        var xAxis = d3.svg.axis()
            .scale(x0)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        parent = parentDiv.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        var svg = parent.append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g").selectAll("g")
            .data(d3.range(m))
          .enter().append("g")
            .style("fill", function(d, i) { return z(i); })
            .attr("transform", function(d, i) { return "translate(" + x1(i) + ",0)"; })
          .selectAll("rect")
            .data(function(d,i) {
                console.log(i);
                return data[i%2];
            })
          .enter().append("rect")
            .attr("caseId", function(d) {return d.caseId})
            .attr("segmentId", function(d) {return d.segment})
            .attr("class", "caseRect")
            .attr("width", x1.rangeBand())
            .attr("height", function(d) {return y(0)-y(d.mean);})
            .attr("x", function(d, i) { return x0(i); })
            .attr("y", function(d) { return y(d.mean); })
            .on("mouseover", function(d,i) {
                if(bus.map.highlightSegment(i)) {
                    svg.selectAll("rect").style("opacity",0.5);
                    d3.select(this).style("opacity",1.0);
                }
            })
            .on("mouseout", function() {
                svg.selectAll("rect").style("opacity",1.0);
                bus.map.highlightSegment(-1);
            });

        svg.append("text")
            .text("Mean")
            .attr("x", margin.left/2)
            .attr("y", -margin.top/2)
            .attr("text-anchor", "middle")

        svg.append("text")
            .text("Segments")
            .attr("x", width/2)
            .attr("y", height + margin.top + margin.bottom/4)
            .attr("text-anchor", "middle")

        // in order for saveImage to work, style must be in the element itself, and not inhereted
        // svg.selectAll("path").attr("style", "fill: none; stroke: #0000");
        // svg.selectAll(".y axis").selectAll("text").attr("style", "font: 12px sans-serif; text-anchor: end;");
        // svg.selectAll(".x axis").selectAll("text").attr("style", "font: 12px sans-serif; text-anchor: middle;");
        svg.append("defs").append("style").attr("type", "text/css").text("path {fill: none; stroke: #000000} text {font: 12px sans-serif}");
    }

    exports.update = function(data) {

        parent.selectAll(".caseRect").each(function(d,i) {
            var caseId = d.caseId;
            var segmentId = d.segment;

            var filtered = [];
            if(data[caseId] == undefined) {
                filtered.push({'mean': 0});
            }
            else {
                filtered = data[caseId].filter(function(d) {return d.segment == segmentId});
                if(filtered == undefined || filtered.length == 0) {
                    filtered.push({'mean': 0});
                }
            }

            filtered[0].segment = segmentId;
            filtered[0].caseId = caseId;

            d3.select(this).data(filtered)
                    .transition().attr("height", function(d) {return y(0)-y(d.mean);})
                    .attr("y", function(d) { return y(d.mean); });
            
        });
    }

    exports.saveImage = function(){
        console.log("Saving image");
        var html = parent.attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;

        var canvas = document.createElement("canvas");
        canvas.width = width + margin.left + margin.right;
        canvas.height = height + margin.top + margin.bottom;
        var context = canvas.getContext("2d");

        var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
        var img = new Image();
        img.onload = function() {
            console.log("onload");
            context.drawImage(img, 0, 0);

            var canvasdata = canvas.toDataURL("image/png");

            var a = document.createElement("a");
            a.download = "sample.png";
            a.href = canvasdata;
            a.click();
        };
        img.src = imgsrc;

    };

    // histogram construction
    exports.create = function(parentDiv,data1, data2){
        createChart(parentDiv,data1,data2);
    };

    // exported api
    return exports;
};