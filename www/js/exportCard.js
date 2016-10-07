/**
#
# DOT Time Tool
#
*/

bus.ExportCard = function(){
    // d3js chart
    var chart = undefined;

    // Divs
    var cardDiv  = undefined;
    var chartDiv = undefined;

    // exported api
    var exports = {};

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

    // selects the property
    function pingSelector(propId){
        var buttonId = "pingSelector";

        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Export pings");
        // add callback
        btn.on("click", function(){
            alert("Callback pingSelector");
        });
    }

    function aggregationSelector(propId){
        var buttonId = "pingSelector";

        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Export trips");
        // add callback
        btn.on("click", function(){
            alert("Callback aggregationSelector");
        });
    }

    exports.closeCard = function(){
        if(cardDiv) cardDiv.remove();
    }

    // card creation
    exports.initCard = function(){
        // gets the cards div
        var mainDiv = d3.select("#cards");
        // creates the card div
        createDiv(mainDiv);

        // card menu
        pingSelector(0);
        aggregationSelector(0);

        
   };

    // public api
    return exports;
};