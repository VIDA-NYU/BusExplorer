/**
#
# DOT Time Tool
#
*/

bus.PathCard = function(){
    // d3js chart
    var chart = undefined;

    // Divs
    var cardDiv  = undefined;
    var chartDiv = undefined;

    // exported api
    var exports = {};
    exports.showed = false;

    // clears the chart
    function clearFilter(){
        // clean DOM
        if(chartDiv) chartDiv.remove();

        // erase chart
        if(chart){
            chart.disposeDimension();
            chart = undefined;
        }
    }

    // create the div
    function createDiv(parentDiv){
        // creates the new card div
        cardDiv = parentDiv.append("div");
        // setup
        cardDiv.attr("index",bus.globalCardId)
            .classed("bgStyle export",true);
    }

    // function download(text, name, type) {
    //     var a = document.createElement("a");
    //     var file = new Blob([text], {type: type});
    //     a.href = URL.createObjectURL(file);
    //     a.download = name;
    //     a.click();
    // }

    // selects the property
    function pathSelector(propId){
        var buttonId = "pathSelector";

        var dropClass = propId==0?"":"leftSpace";
        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Save as geojson");
        // cardDiv.append("br");

        // add callback
        btn.on("click", function(){
            var geojson = bus.map.getHighlightedPath();
            var buffered = calculateBuffer(geojson);
            download(JSON.stringify(buffered), 'geo.json', 'text/plain');
            download(JSON.stringify(geojson), 'geo.json', 'text/plain');
        });
    }

    exports.closeCard = function(){
        exports.showed = false;
        if(cardDiv) cardDiv.remove();
    }

    function closeCardButton(){
        var buttonId = "closeCard";

        // adds the button
        var btn = bus.UiParts.Button(cardDiv, buttonId, "glyphicon glyphicon-remove");
        // add callback
        btn.on("click", function(){
            exports.showed = false;
            bus.map.clearPaths();
            bus.gui.clearPaths();
            bus.loadedLines = [];
            bus.loadedLions = [];
            // remove the card
            if(cardDiv) cardDiv.remove();
        });
    }

    // card creation
    exports.initCard = function(){
        // gets the cards div
        var mainDiv = d3.select("#cards");
        // creates the card div
        createDiv(mainDiv);

        // card menu
        pathSelector(0);

        // close card
        closeCardButton();

        exports.showed = true;
        
   };

    // public api
    return exports;
};