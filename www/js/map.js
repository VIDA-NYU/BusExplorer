/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.Map = function(){
    // map object
    var map = undefined;
    var thr = undefined;

    // exported api
    var exports = {};
    exports.paths = undefined;
    exports.highlightedPaths = undefined;

    // create a new bus layer
    function createNewBus(render){
        // default value
        render = typeof render !== 'undefined' ? render : true;
        // data set name
        var dataName = render?bus.selectedBusName:bus.selectedBusCompareName;

        // crossfilter set
        var dataSet = bus.loadedDataSet[dataName];

        // creates the layers
        var layer = new bus.Layer();
        // create layer.
        layer.loadStrokeLayer(thr, dataSet, render);

        // store loaded layer
        bus.loadedBus[dataName] = layer;
    }

    // create a new bus layer
    function createNewFunctionView(){
        // json set
        var dataSet = bus.loadedDataSet[bus.selectedBusName];

        // gets the bus
        var layer = bus.loadedBus[bus.selectedBusName];
        // create layer.
        layer.loadFillLayer(thr, bus.selectedFunctionName, dataSet);
    }

    // Three.js layer cleanup
    exports.initGL = function(glCanvas){
        // resets the scene
        glCanvas.scene = new THREE.Scene();
    };

    //
    exports.initBusNoRender = function(){
        // previously loaded layer
        if(bus.selectedBusCompareName in bus.loadedBus) return;

        // creates a new layer
        createNewBus(false);
    };

    // Three.js Bus render creatioz
    exports.initBus = function(){
        // clears the scene
        thr.clearScene();

        // previously loaded layer
        if(bus.selectedBusName in bus.loadedBus){
            // loads the corresponding bus
            var geom = bus.loadedBus[bus.selectedBusName].getGeometry();
            thr.loadObject(geom);
        }
        else{
            // creates a new layer
            createNewBus();
        }
        // redraw
        thr.draw();
    };

    // Three.js function render creation
    exports.initFunctionView = function(){
        // only load functions if selected is available
        if( !(bus.selectedBusName in bus.loadedBus) )
            return;

        // clears the scene
        thr.clearScene();

        // creates the function
        createNewFunctionView();

        // loads the corresponding bus
        var geom = bus.loadedBus[bus.selectedBusName].getGeometry();
        thr.loadObject(geom);

        // redraw
        thr.draw();
    };

    exports.clickedFeature = function(e,feature,layer) {
        console.log(e);
        console.log(feature);
        console.log(layer);
    };

    exports.onEachFeature = function(feature, layer) {
        // var that = this;
        layer.on({
            click: function(e) {
                bus.map.clickedFeature(e,feature,layer);

                // remove selected feature
                // bus.map.paths.removeLayer(layer);

                var newFeature = {};
                newFeature.type = "Feature";
                newFeature.geometry = {}
                newFeature.geometry.type = "LineString";
                newFeature.geometry.coordinates = null;
                // iterate through all coordinates of features.geometry 
                // until we find the one LineString that we clicked
                

                if(feature.geometry.type == "LineString") {
                    var minDistance = Infinity;
                    var index = 0;

                    var coords = feature.geometry.coordinates;
                    var numCoords = coords.length;
                    console.log(coords);
                    for(var j=0; j<numCoords-1; j++) {
                        var distance = L.LineUtil.pointToSegmentDistance( map.project(e.latlng),map.project(L.latLng(coords[j][1],coords[j][0])),map.project(L.latLng(coords[j+1][1],coords[j+1][0])) );
                        if(distance < minDistance) {
                            minDistance = distance;
                            index = j;
                        }
                    }
                    newFeature.geometry.coordinates = [feature.geometry.coordinates[index], feature.geometry.coordinates[index+1]];
                }
                else if(feature.geometry.type == "MultiLineString") {
                    var minDistance = Infinity;
                    var indexi = 0;
                    var indexj = 0;

                    var lines = feature.geometry.coordinates;
                    var numLines = lines.length;
                    for(var i=0; i<numLines; i++) {
                        var coords = lines[i];
                        var numCoords = lines[i].length;
                        console.log(coords);
                        for(var j=0; j<numCoords-1; j++) {
                            var distance = L.LineUtil.pointToSegmentDistance( map.project(e.latlng),map.project(L.latLng(coords[j][1],coords[j][0])),map.project(L.latLng(coords[j+1][1],coords[j+1][0])) );
                            if(distance < minDistance) {
                                minDistance = distance;
                                indexi = i;
                                indexj = j;
                            }
                        }
                    }
                    newFeature.geometry.coordinates = [feature.geometry.coordinates[indexi][indexj], feature.geometry.coordinates[indexi][indexj+1]];
                }
                
                
                // add new feature to highlighted selection
                bus.map.highlightedPaths.addData(newFeature);
            }
        });
    };

    exports.addGeoJson = function(geojson){
        var style = {
            "color": "#ff0000",
        };
        bus.map.highlightedPaths = L.geoJSON(false, {
            style: style
        }).addTo(map);

        bus.map.paths = L.geoJSON(geojson, {
            onEachFeature: bus.map.onEachFeature
        }).addTo(map);
    };

    // map creation
    exports.createMap = function(){
        // // get the container
        var container = document.getElementById("gmaps");
        // // creates the map
        // map = new google.maps.Map(container,
        // {
        //     zoom: 16,
        //     mapTypeControl: false,
        //     streetViewControl: false,
        //     center: new google.maps.LatLng(40.756119, -73.983159),
        //     mapTypeId: google.maps.MapTypeId.ROADMAP,
        //     styles: bus.styles
        // });

        var maps = [['http://api.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=HIDDEN',
                     {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
                      '&copy; <a href="http://cartodb.com/attributions">MapBox</a> base maps, ' +
                      '&copy; <a href="http://cusp.nyu.edu">NYU</a> analysis &amp; visualization'}],
                    ['https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
                     {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
                      '&copy; <a href="http://cartodb.com/attributions">CartoDB</a> base maps, ' +
                      '&copy; <a href="http://cusp.nyu.edu">NYU</a> analysis &amp; visualization'}],
                    ['http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                     {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
                      '&copy; <a href="http://cartodb.com/attributions">CartoDB</a> base maps, ' +
                      '&copy; <a href="http://cusp.nyu.edu">NYU</a> analysis &amp; visualization'}]];
        var mapId = 2;

        var options = {
            center: [40.7127, -74.0059],
            zoom  : 13,
            bounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
            layers: [L.tileLayer(maps[mapId][0], maps[mapId][1])],
            closePopupOnClick : false,
            zoomControl : false,
        };

        map = L.map(container, options);
        L.control.zoom({
             position:'bottomleft'
        }).addTo(map);

        // creates the three.js layer
        // thr = new ThreejsLayer({map:map}, exports.initGL);
    };

    // return the public api
    return exports;
};