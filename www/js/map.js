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
    var styleRoute = {
         "opacity": 1.0,
         "fillOpacity": 1.0,
         "color": "#ff780f"
    };
    var styleStop = {
        "weight": 1,
        "opacity": 1.0,
        "fillOpacity": 1.0,
        "color": "#ff780f"
    };
    var styleDefault = {
        "weight": 8,
        "opacity": 0.3,
        "fillOpacity": 0.3,
        "color": "#3388FF"
    };
    var styleHighlighted = {
        "color": "#ff0000",
        "weight": 9
    };
    var styleHide = {
        "fillOpacity": 0,
        "opacity": 0
    };
    var styleSpeed = {
        "fillOpacity": 1,
        "opacity": 1,
        "weight": 8
    };
    var styleSpeedHidden = {
        "fillOpacity": 0.25,
        "opacity": 0.25,
        "weight": 4,
    };

    // map object
    var map = undefined;
    var thr = undefined;
    var mouseOver = undefined;
    var lastClick = undefined;
    var removingFeature = false;
    var colorScale = new bus.ColorScale();

    // exported api
    var exports = {};
    exports.paths = {};
    exports.highlightedPaths = {};
    exports.highlightedLines = {};
    exports.selectionMode = "node";

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

    exports.addSegment = function(e,feature,layer) {
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
        var key = ""+newFeature.geometry.coordinates;
        if(bus.map.highlightedPaths[key] != undefined)
            return;


        var aux = L.geoJSON(newFeature, {
            style: styleHighlighted,
            onEachFeature: function(feature, layer) {
                layer.on({
                    click: function(e) {
                        console.log("removing...");
                        bus.map.highlightedPaths[key].remove();
                        delete bus.map.highlightedPaths[key];
                    }
                });
                layer.on({
                    mouseout: function(e) {
                        if(mouseOver != undefined) 
                            mouseOver.setStyle(styleDefault);
                    }
                })
            }
        }).addTo(map);
        aux.bringToFront();
        bus.map.highlightedPaths[key] = aux;
    };

    exports.addNode = function(e, feature, layer) {

        var key = ""+e.latlng;
        var aux = L.circle(e.latlng, bus.filterSize, styleHighlighted).addTo(map);
        aux.on('click', function(e) {
            console.log("removing...");
            bus.map.highlightedPaths[key].remove();
            delete bus.map.highlightedPaths[key];
        });
        aux.bringToFront();
        bus.map.highlightedPaths[key] = aux;
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
                
                // avoid click being called twice for same click
                if(lastClick == undefined || (lastClick.x != e.layerPoint.x && lastClick.y != e.layerPoint.y)) {
                    if(bus.map.selectionMode === "segment") {
                        console.log("adding segment");
                        bus.map.addSegment(e,feature,layer);
                    }
                    else if(bus.map.selectionMode === "node") {
                        console.log("adding node");
                        bus.map.addNode(e,feature,layer);
                    }
                    lastClick = e.layerPoint;
                }                
            }
        });
    };

    exports.onEachFeatureStop = function(feature, layer) {
        layer.on({
            click: function(e) {
                
                // avoid click being called twice for same click
                if(lastClick == undefined || (lastClick.x != e.layerPoint.x && lastClick.y != e.layerPoint.y)) {
                    if(bus.map.selectionMode === "segment") {
                        console.log("adding segment");
                        bus.map.addSegment(e,feature,layer);
                    }
                    else if(bus.map.selectionMode === "node") {
                        console.log("adding node");
                        bus.map.addNode(e,feature,layer);
                    }
                    lastClick = e.layerPoint;
                }

                
            }
        });

        layer.bindPopup(feature.properties.bus_lines);
        layer.on({
            mouseover: function(e) {
                this.openPopup();
            }
        });
        layer.on({
            mouseout: function(e) {
                this.closePopup();
            }
        })
    };

    exports.addGeoJson = function(geojson, name, enableEachFeature, hidden){

        if(enableEachFeature == undefined) enableEachFeature = true;
        if(hidden == undefined) hidden = false;

        var style;
        if(hidden) {
            style = styleHide;
        }
        else {
            style = styleDefault;
        }

        if(enableEachFeature) {
            var geo = L.geoJSON(geojson, {
                onEachFeature: bus.map.onEachFeature,
                style: style,
                pointToLayer: function (feature, latlng) {
                    return L.circle(latlng, bus.filterSize, style);
                }
            }).addTo(map);
            geo.bringToBack();
            bus.map.paths[name] = geo;
        }
        else {
            var geo = L.geoJSON(geojson, {
                style: style,
                pointToLayer: function (feature, latlng) {
                    return L.circle(latlng, bus.filterSize, style);
                }
            }).addTo(map);
            geo.bringToBack();
            bus.map.paths[name] = geo;
        }
    };

    exports.addGeoJsonStops = function(geojson, name){

        var style = styleStop;
        var geo = L.geoJSON(geojson, {
            style: style,
            onEachFeature: bus.map.onEachFeatureStop,
            pointToLayer: function (feature, latlng) {
                return L.circle(latlng, 10, style);
            }
        }).addTo(map);
        geo.bringToBack();
        bus.map.paths[name] = geo;
        
    };

    exports.removeGeoJSON = function(name){
        bus.map.paths[name].remove();
        for(var p in bus.map.highlightedPaths)
            bus.map.highlightedPaths[p].remove();
    };

    exports.addLine = function(geojson, lineName){

        var line = L.geoJSON(geojson, {
            filter: bus.map.filterByLine,
            style: styleRoute
        }).addTo(map);
        line.bringToBack();
        bus.map.highlightedLines[lineName] = line;
    };

    function getColor(value, invert) {
        if(invert == undefined)
            invert = false;

        if(value > 0)
            color = colorScale.getHexColor(value, invert);
        else
            color = '#000000';
        return color;
    }

    function popupSpeed(segmentId, json) {
        var value = Math.round(json["all"].mean * 100) / 100;
        var text = ("<b>Segment "+segmentId+"<br>Mean:</b> <div style=\"color:"+getColor(value / 26.0, true)+"\">"+value+" mph</div>");
        for(var l in json) {
            var value = Math.round(json[l].mean * 100) / 100;
            var color = getColor(value / 26.0, true);
            
            text += ("<b>"+l+":</b> <div style=\"color:"+color+"\">"+value+" mph</div>"); 
        }
        return text;
    };

    exports.highlightSegment = function(segmentId) {
        if(bus.map.paths['withoutBuffer'] == undefined)
            return false;

        var count = 0;
        bus.map.paths['withoutBuffer'].eachLayer(function(layer) {
            if(count == segmentId || segmentId == -1) {
                layer.setStyle(styleSpeed);
            }
            else {
                layer.setStyle(styleSpeedHidden);
            }
            count++
        });
        return true;
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
            if(json[count]["all"] != undefined) {
                console.log(json[count]["all"].mean);
                layer.setStyle(styleSpeed);
                layer.setStyle({color: getColor(json[count]["all"].mean / 26.0, true)});
                layer.feature.properties.speeds = json;
                layer.feature.style = {color: getColor(json[count]["all"].mean / 26.0, true)};

                var customOptions = {
                    'maxHeight': 500,
                    'closeOnClick': true
                }
                layer.bindPopup(popupSpeed(count, json[count]),customOptions);
            }
            else {
                layer.setStyle(styleSpeed);
                layer.setStyle({color: "#FFFFFF"});
            }
            count++;
            
        });
    };

    exports.showDwellTime = function(json) {
        console.log(json);

        var count = 0;
        bus.map.paths['filter'].eachLayer(function(layer) {
            if(json[count] != undefined) {
                layer.setStyle(styleSpeed);
                layer.setStyle({color: getColor(json[count] / 300.0)});
                layer.feature.properties.speeds = json;
                layer.feature.style = {color: getColor(json[count] / 300.0)};

                var customOptions = {
                    'maxHeight': 500,
                    'closeOnClick': true
                }

                var value = Math.round(json[count] * 100) / 100;;
                var text = "Dwell time: "+value+" seconds";
                layer.bindPopup(text,customOptions);
            }
            else {
                layer.setStyle(styleSpeed);
                layer.setStyle({color: "#FFFFFF"});
            }
            count++;
            
        });
    };

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

    exports.changeSelectionMode = function(mode) {
        bus.map.selectionMode = mode;
        for(var p in bus.map.highlightedPaths)
            bus.map.highlightedPaths[p].remove();
        bus.map.highlightedPaths = {};
    };

    exports.changeFilterSize = function(newSize) {
        if(bus.map.paths["filter"] == undefined)
            return;

        bus.filterSize = newSize;

        if(bus.map.selectionMode === "node") {
            bus.map.paths["filter"].eachLayer(function(layer) {
                layer.setRadius(newSize);
            });
        }
        else {
            bus.map.paths["filter"].remove();
            var path = calculateBuffer(bus.map.paths["withoutBuffer"].toGeoJSON(), newSize);
            bus.map.addGeoJson(path, "filter", false, false);
        }
    };

    exports.clearPaths = function(){
        console.log("clearing...");
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
        if(bus.map.selectionMode === "segment") {
            var featureGroup = new L.FeatureGroup();
            for(var l in bus.map.highlightedPaths) {
                var geojson = bus.map.highlightedPaths[l].toGeoJSON();
                console.log(geojson);
                for(var f in geojson.features) {
                    var aux = L.GeoJSON.geometryToLayer(geojson.features[f]);
                    aux.addTo(featureGroup);
                }
            }
            return featureGroup.toGeoJSON();
        }
        else {
            var featureGroup = {};
            featureGroup.type = "FeatureCollection";
            featureGroup.features = [];
            for(var l in bus.map.highlightedPaths) {
                var geojson = bus.map.highlightedPaths[l].toGeoJSON();
                featureGroup.features.push(geojson);
            }
            console.log(featureGroup);
            return featureGroup;
        }
    };

    exports.saveImage = function() {
        var savingImage = true;
        var zoom = map.getZoom();
        var center = map.getCenter();
        map.setView(center, zoom, {reset: true});
        map.setZoom(zoom);
        
        var doImage = function(err, canvas) {

            var svg = d3.select("#cscale");
            svg.append("defs").append("style").attr("type", "text/css").text("path {fill: none; stroke: #000000} text {font: 12px sans-serif}");
            var svgHtml = document.getElementById("cscale").outerHTML;
            canvg(canvas, svgHtml, {ignoreClear: true, ignoreDimensions: true});
            downloadImage(canvas, "image.png"); 
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