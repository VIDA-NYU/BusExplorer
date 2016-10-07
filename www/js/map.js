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

    exports.addGeoJson = function(geojson){
        L.geoJSON(geojson).addTo(map);
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