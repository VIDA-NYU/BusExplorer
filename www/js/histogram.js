/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.Histogram = function(){
    // creates chart and dim
    var chart = undefined;
    var cdim  = undefined;

    // chart size
    var width  = 380;
    var height = 190;

    // bins creation variables
    var max = 0;
    var min = 0;
    var bin = 30;

    // exported api
    var exports = {};

    // creates the crossfilter dimension
    function createDimensionLinear(selectedProperty){
        // current function
        var func = bus.loadedDataSet[bus.selectedBusName];

        // creates the basic dimension
        if(cdim){
            cdim.filterAll();
            cdim.dispose();
        }
        cdim = func.dimension(function(d){
            var val = d[selectedProperty];
            return isNaN(val)?-1:val;
        });

        // avoid invalid values
        cdim.filter(function(d){
           return d>0;
        });

        // min and max values
        var top = cdim.top(1);
        var bottom = cdim.bottom(1);

        // avoid errors
        if(top.length === 0) return;
        if(bottom.length === 0) return;

        // get extrema
        max = top[0][selectedProperty];
        min = bottom[0][selectedProperty];

        // clears the basic dimension
        cdim.filterAll();
        cdim.dispose();

        cdim = func.dimension(function(d){
            return Math.floor( (+d[selectedProperty]-min)/(max-min)*bin );
        });
    }

    // creates the crossfilter dimension
    function createDimensionOrdinal(selectedProperty){
        // current function
        var func = bus.loadedDataSet[bus.selectedBusName];

        // creates the basic dimension
        if(cdim){
            cdim.filterAll();
            cdim.dispose();
        }

        cdim = func.dimension(function(d){
            var val = d[selectedProperty];
            return (val.indexOf("b'")>=0)?"None":val;
        });
    }

    // creates the dc.js chart
    function createChartLinear(parentDiv,selectedProperty){
       // creates the group
        var grp = cdim.group();

        // creates the chart
        chart = dc.barChart(parentDiv);

        // initialize the chart
        chart.width(width)
            .height(height)
            // margins
            .margins({top: 10, right: 30, bottom: 45, left: 10})
            // axis scales
            .x(d3.scale.linear().domain([0,bin]))
            // grid lines
            .renderHorizontalGridLines(true)
            //set filter brush
            .brushOn(true)
            // y axis label
            .xAxisLabel(selectedProperty)
            .yAxisLabel("#Lots")
            // elastic
            .elasticY(true)
            // dim and group
            .dimension(cdim)
            .group(grp);

        // x ticks
        chart.xAxis()
            .ticks(10)
            .tickFormat(function(v) {
                return Math.floor(v*(max-min)/bin + min);
            });

        // render
        chart.render();
    }

    // creates the dc.js chart
    function createChartOrdinal(parentDiv,selectedProperty){
       // creates the group
        var grp = cdim.group();

        // creates the chart
        chart = dc.barChart(parentDiv);

        // initialize the chart
        chart.width(width)
            .height(height)
            // margins
            .margins({top: 10, right: 30, bottom: 45, left: 10})
            // axis scales
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            // grid lines
            .renderHorizontalGridLines(true)
            // y axis label
            .xAxisLabel(selectedProperty)
            .yAxisLabel("#Lots")
            // elastic
            .elasticY(true)
            // dim and group
            .dimension(cdim)
            .group(grp);

        // x ticks
        chart.xAxis()
            .ticks(10);

        // render
        chart.render();
    }

    // histogram construction
    exports.create = function(parentDiv, selectedProperty,isLinear){
        if(isLinear){
            // initialize dimension
            createDimensionLinear(selectedProperty);
            // create the chart
            createChartLinear(parentDiv,selectedProperty);
        }
        else{
            // initialize dimension
            createDimensionOrdinal(selectedProperty);
            // create the chart
            createChartOrdinal(parentDiv,selectedProperty);
        }
    };

    // cleans the created dimension
    exports.disposeDimension = function(){
        if(cdim) {
            cdim.filterAll();
            cdim.dispose();
        }
    };

    // exported api
    return exports;
};