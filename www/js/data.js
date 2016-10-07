/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.Data = function (){
    // exported object
    var exports = {};

    // load the available datasets
    exports.availableNames = function(){
        $.get(
            '/availableNames',
            {},
            function(data){
                // json json
                var jsonData = JSON.parse(data);
                // store the json
                bus.availablePlutoNames       = jsonData.bus;
                bus.availableFunctionNames[0] = jsonData.functionLinear;
                bus.availableFunctionNames[1] = jsonData.functionOrdinal;

                // emmit signal
                __sig__.emit(__sig__.availableNamesDone);
            }
        );
    };

    // load a bus json
    exports.loadDataSet = function(){
        $.get(
            '/loadDataSet',
            {
              'name': bus.selectedPlutoName
            },
            function(data){
                // json json
                var jsonData = JSON.parse(data);
                // stores the crossfilter
                bus.loadedDataSet[bus.selectedPlutoName] = crossfilter(jsonData);

                // emmit signal
                __sig__.emit(__sig__.loadDataSetDone);
            }
        );
    };

    // load the available datasets from a json file
    exports.availableNamesFile = function(){
        $.getJSON("/json/availableNames.json", function(json) {
            // parses json
            var jsonData = JSON.parse(json);
            // store the json
            bus.availableBusNames         = jsonData.lines;
            bus.availableFunctionNames[0] = jsonData.functionLinear;
            bus.availableFunctionNames[1] = jsonData.functionOrdinal;

            // emmit signal
            __sig__.emit(__sig__.availableNamesDone);
        });
    };

    // load a bus json
    exports.loadDataSetFile = function(render) {
        // default value
        render = typeof render !== 'undefined' ? render : true;
        // data set name
        var dataName = render?bus.selectedBusName:bus.selectedBusCompareName;

        $.getJSON("/json/"+dataName+".geojson", function(json) {
            bus.map.addGeoJson(json);

            // parses json
            // var jsonData = GeoJSON.parse(json);

            // stores the crossfilter
            // bus.loadedDataSet[dataName] = crossfilter(json);

            // emmit signal
            // if(render)
            //     __sig__.emit(__sig__.loadDataSetDone);
            // else
            //     __sig__.emit(__sig__.loadDataSetDoneNoRender)
        });
    };

    return exports;
};