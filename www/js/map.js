/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.Map = function(){
    // path styles
    var styleOnMouseOver = {
        "color": "#00ff00",
        "opacity": 0.8,
        "fillOpacity": 0.8,
    };
    var styleDefault = {
        "opacity": 0.3,
        "fillOpacity": 0.3,
        "color": "#3388FF"
    };
    var styleHighlighted = {
        "color": "#ff0000",
        "weight": 6,
    };
    var styleHide = {
        "fillOpacity": 0,
        "opacity": 0
    };
    var styleSpeed = {
        "fillOpacity": 1,
        "opacity": 1,
        "weight": 6,
    };

    // map object
    var map = undefined;
    var thr = undefined;
    var mouseOver = undefined;
    var colorScale = new bus.ColorScale();

    // exported api
    var exports = {};
    exports.paths = {};
    exports.highlightedPaths = {};
    exports.highlightedLines = {};

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
        // console.log(e);
        // console.log(feature);
        // console.log(layer);
    };

    exports.filterByLine = function(feature, layer) {
        console.log(bus.selectedLineName,feature.properties.Route);
        if(bus.selectedLineName === "")
            return true
        if(feature.properties.Route === bus.selectedLineName)
            return true;
        
        return false;
    };

    exports.onEachFeature = function(feature, layer) {
        // var that = this;
        layer.on({
            mouseover: function(e) {
                if(mouseOver != undefined)
                    mouseOver.setStyle(styleDefault);
                layer.setStyle(styleOnMouseOver);
                mouseOver = layer;
            }
        });
        layer.on({
            mouseout: function(e) {
                layer.setStyle(styleDefault);
            }
        });
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
                var aux = L.geoJSON(newFeature, {
                    style: styleHighlighted
                }).addTo(map);
                var key = Object.keys(bus.map.highlightedPaths).length;
                bus.map.highlightedPaths[key] = aux;
            }
        });
    };

    exports.addGeoJson = function(geojson, name, enableEachFeature){

        if(enableEachFeature == undefined) enableEachFeature = true;

        if(enableEachFeature) {
            var geo = L.geoJSON(geojson, {
                onEachFeature: bus.map.onEachFeature,
                style: styleDefault
            }).addTo(map);
            geo.bringToBack();
            bus.map.paths[name] = geo;
        }
        else {
            var geo = L.geoJSON(geojson, {
                style: styleDefault
            }).addTo(map);
            geo.bringToBack();
            bus.map.paths[name] = geo;
        }
    };

    exports.removeGeoJSON = function(name){
        bus.map.paths[name].remove();
        for(var p in bus.map.highlightedPaths)
            bus.map.highlightedPaths[p].remove();
    };

    exports.addLine = function(geojson, lineName){

        var line = L.geoJSON(geojson, {
            filter: bus.map.filterByLine,
            style: styleHighlighted
        }).addTo(map);
        line.bringToFront();
        bus.map.highlightedLines[lineName] = line;
    };

    function getColor(value) {
        value = value / 80.0;
        if(value > 0)
            color = colorScale.getHexColor(value);
        else
            color = '#000000';
        return color;
    }

    function jsonToText(json, value) {
        value = Math.round(value * 100) / 100;
        var text = ("<b>Avg:</b> <div style=\"color:"+getColor(value)+"\">"+value+" km/h</div>");
        for(var l in json) {
            var aux = Math.round(json[l] * 100) / 100;
            var color = getColor(aux);
            
            text += ("<b>"+l+":</b> <div style=\"color:"+color+"\">"+aux+" km/h</div>"); 
        }
        return text;
    };

    exports.showSpeed = function(json) {
        console.log(json);
        // var count = 0;
        // for(p in bus.map.paths) {
        //     var avgSpeed = 0;
        //     for(var l in json[count]) {
        //         avgSpeed += json[count][l];
        //     }
        //     avgSpeed = avgSpeed / (Object.keys(json[count]).length);
        //     console.log(avgSpeed, colorScale.getHexColor(avgSpeed));
        //     bus.map.paths[p].setStyle({color: colorScale.getHexColor(avgSpeed)});
        //     count++;
        // }
        var count = 0;
        bus.map.paths['withoutBuffer'].eachLayer(function(layer) {
            // var value = Math.random();
            var value = 0;
            var numLines = Object.keys(json[count]).length;
            if(numLines > 0) {
                for(var l in json[count]) {
                    value += json[count][l];
                }
                value = value / numLines;
                console.log(layer, value, getColor(value));
                layer.setStyle(styleSpeed);
                layer.setStyle({color: getColor(value)});
                layer.feature.properties.speeds = json[count];
                layer.feature.style = {color: getColor(value)};

                var customOptions = {
                    'maxHeight': 500,
                    'closeOnClick': true
                }
                layer.bindPopup(jsonToText(json[count], value),customOptions);
                count++;  
            }
            else {
                layer.setStyle(styleSpeed);
                layer.setStyle({color: "#FFFFFF"});
                count++;  
            }
            
        });
    }

    exports.showFilterBuffer = function(show) {
        if(bus.map.paths["filter"] == undefined)
            return;

        if(show) {
            bus.map.paths["filter"].setStyle(styleDefault);
        }
        else {
            bus.map.paths["filter"].setStyle(styleHide);
        }
    }

    exports.removeLine = function(lineName){
        bus.map.highlightedLines[lineName].remove();
    };

    exports.clearPaths = function(){
        for(var p in bus.map.paths)
            bus.map.paths[p].remove();
        for(var p in bus.map.highlightedPaths)
            bus.map.highlightedPaths[p].remove();
        for(var p in bus.map.highlightedLines)
            bus.map.highlightedLines[p].remove();
        
        bus.map.paths = {};
        bus.map.highlightedPaths = {};
        bus.map.highlightedLines = {};
    };

    exports.getHighlightedPath = function() {
        var featureGroup = new L.FeatureGroup();
        for(var l in bus.map.highlightedPaths) {
            var geojson = bus.map.highlightedPaths[l].toGeoJSON();
            for(var f in geojson.features) {
                var aux = L.GeoJSON.geometryToLayer(geojson.features[f]);
                aux.addTo(featureGroup);
            }
        }
        for(var l in bus.map.highlightedLines) {
            var geojson = bus.map.highlightedLines[l].toGeoJSON();
            for(var f in geojson.features) {
                var aux = L.GeoJSON.geometryToLayer(geojson.features[f]);
                aux.addTo(featureGroup);
            }
        }
        return featureGroup.toGeoJSON();
    };

    exports.saveImage = function() {
        var savingImage = true;
        var zoom = map.getZoom();
        var center = map.getCenter();
        map.setView(center, zoom, {reset: true});
        map.setZoom(zoom);
        
        var doImage = function(err, canvas) {
            var image = canvas.toDataURL("image/png");
            downloadImage(image);
        }
        leafletImage(map, doImage);
        
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
            center: [40.7829, -73.9654],
            zoom  : 13,
            bounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
            layers: [L.tileLayer(maps[mapId][0], maps[mapId][1])],
            closePopupOnClick : true,
            zoomControl : false,
            preferCanvas: true
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