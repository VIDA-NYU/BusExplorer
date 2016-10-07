/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.Scatter = function(){
    // creates chart and dim
    var chart = undefined;
    var cdim  = undefined;

    // chart size
    var width  = 380;
    var height = 190;

    // bins creation variables
    var max = [0,0];
    var min = [0,0];
    var bin = 30;

    // exported api
    var exports = {};

    // creates the crossfilter dimension
    function createDimension(selectedProperty){
        // current function
        var func = bus.loadedDataSet[bus.selectedBusName];

        // creates the basic dimension
        for(var id=0; id<2; id++){
            if(cdim){
                cdim.filterAll();
                cdim.dispose();
            }
            cdim = func.dimension(function(d){
                return +d[selectedProperty[id]];
            });

            // avoid invalid values
            cdim.filter(function(d){
               return d>0;
            });

            // min and max values
            var top = cdim.top(1);
            var bottom = cdim.bottom(1);

            // avoid errors
            if(top.length == 0) return;
            if(bottom.length == 0) return;

            // get extrema
            max[id] = top[0][selectedProperty[id]];
            min[id] = bottom[0][selectedProperty[id]];
        }

        // create chart dimension
        cdim.filterAll();
        cdim.dispose();

        cdim = func.dimension(function(d){
            var d0 = Math.floor( (+d[selectedProperty[0]]-min[0])/(max[0]-min[0])*bin );
            var d1 = Math.floor( (+d[selectedProperty[1]]-min[1])/(max[1]-min[1])*bin );
            return [d0,d1];
        });
    }

    // creates the dc.js chart
    function createChart(parentDiv,selectedProperty){
       // creates the group
        var grp = cdim.group();

        // creates the chart
        chart = dc.scatterPlot(parentDiv);

        // initialize the chart
        chart.width(width)
            .height(height)
            // margins
            .margins({top: 10, right: 30, bottom: 35, left: 20})
            // axis scales
            .x(d3.scale.linear().domain([0,bin]))
            .y(d3.scale.linear().domain([0,bin]))
            // grid lines
            .renderVerticalGridLines(true)
            .renderHorizontalGridLines(true)
            //set circle size
            .symbolSize(4)
            // y axis label
            .xAxisLabel(selectedProperty[0])
            .yAxisLabel(selectedProperty[1])
            // padding
            .yAxisPadding(5)
            .xAxisPadding(5)
            // dim and group
            .dimension(cdim)
            .group(grp);

        // x ticks
        chart.xAxis()
            .ticks(10)
            .tickFormat(function(v) {
                return Math.floor(v*(max[0]-min[0])/bin + min[0]);
            });
        // y ticks
        chart.yAxis()
            .ticks(10)
            .tickFormat(function(v) {
                return Math.floor(v*(max[1]-min[1])/bin + min[1]);
            });

        // render
        chart.render();
    }

    // histogram construction
    exports.create = function(parentDiv,selectedProperty){
        // initialize dimension
        createDimension(selectedProperty);
        // create the chart
        createChart(parentDiv,selectedProperty);
    };

    // cleans the created dimension
    exports.disposeDimension = function(){
        if(cdim){
            cdim.filterAll();
            cdim.dispose();
        }
    };

    // exported api
    return exports;
};