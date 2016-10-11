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
            bus.availableLionNames        = jsonData.lion;
            bus.availableRouteNames       = jsonData.routes;
            bus.availableLineNames        = jsonData.lines;
            bus.availableFunctionNames[0] = jsonData.functionLinear;
            bus.availableFunctionNames[1] = jsonData.functionOrdinal;

            // emmit signal
            __sig__.emit(__sig__.availableNamesDone);
        });
    };

    // load a bus json
    exports.loadDataSetFile = function() {

        if(bus.selectedLionName !== "") {
            $.getJSON("/json/"+bus.selectedLionName+".geojson", function(json) {
                bus.map.addGeoJson(json);
                bus.selectedLionName = "";
            });
        }
        else if(bus.selectedLineName !== "") {
            if(bus.selectedLineName.substring(0,1) === "B") {
                $.getJSON("/json/buses_brooklyn.geojson", function(json) {
                    bus.map.addLine(json);
                    bus.selectedLineName = "";
                });
            }
            else if(bus.selectedLineName.substring(0,2) === "Bx") {
                $.getJSON("/json/buses_bronx.geojson", function(json) {
                    bus.map.addLine(json);
                    bus.selectedLineName = "";
                });
            }
            else if(bus.selectedLineName.substring(0,1) === "M") {
                $.getJSON("/json/buses_manhattan.geojson", function(json) {
                    bus.map.addLine(json);
                    bus.selectedLineName = "";
                });
            }
            else if(bus.selectedLineName.substring(0,1) === "S") {
                $.getJSON("/json/buses_staten.geojson", function(json) {
                    bus.map.addLine(json);
                    bus.selectedLineName = "";
                });
            }
        }
    };

    return exports;
};