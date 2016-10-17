/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.HistogramCard = function(){
    // d3js chart
    var chart = undefined;

    // Divs
    var cardDiv  = undefined;
    var chartDiv = undefined;
    var file1 = undefined;
    var file2 = undefined;

    // exported api
    var exports = {};

    // clears the chart
    function clearChart(){
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
            .classed("bgStyle card",true);
    }

    // creates the chart
    function createChart(){
        // erases old json
        clearChart();

        // create chartDiv
        chartDiv = cardDiv.append("div");
        chartDiv.style("padding","5px")
            .style("margin-top", "15px");

        chart = new bus.Histogram();
        chart.create(chartDiv,"test",true);
    }

    function fileSelector(propId){
        var dropId = "propSelector";

        var dropClass = propId==0?"":"leftSpace";

        var file1 = bus.UiParts.File(cardDiv,"histogramFileInput1",dropClass, "Select file: ");
        var file2 = bus.UiParts.File(cardDiv,"histogramFileInput2",dropClass, "Select file: ");

        $("#histogramFileInput1").change(function() {
            var reader = new FileReader();
            reader.readAsText(this.files[0]);
            reader.onload = function() {
                file1 = reader.result;
                if(file1 != undefined && file2 != undefined) {
                    createChart();
                }                
            }
        });

        $("#histogramFileInput2").change(function() {
            var reader = new FileReader();
            reader.readAsText(this.files[0]);
            reader.onload = function() {
                file2 = reader.result; 
                if(file1 != undefined && file2 != undefined) {
                    createChart();
                }               
            }
        });
    }

    // closes the card
    function closeCard(){
        var buttonId = "closeCard";

        // adds the button
        var btn = bus.UiParts.Button(cardDiv, buttonId, "glyphicon glyphicon-remove");
        // add callback
        btn.on("click", function(){
            // clears the chart
            clearChart();
            // remove the card
            if(cardDiv) cardDiv.remove();
        });

        cardDiv.append("br");
    }

    // card creation
    exports.initCard = function(){
        // gets the cards div
        var mainDiv = d3.select("#cards");
        // creates the card div
        createDiv(mainDiv);
        // close card
        closeCard();

        // card menu
        fileSelector(0);

        
   };

    // public api
    return exports;
};