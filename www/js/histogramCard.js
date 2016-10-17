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
    var data1 = undefined;
    var data2 = undefined;

    // exported api
    var exports = {};

    // clears the chart
    function clearChart(){
        // clean DOM
        if(chartDiv) chartDiv.remove();

        // erase chart
        if(chart){
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

        var btn = bus.UiParts.Button(cardDiv,"saveChart", "glyphicon glyphicon-floppy-disk","leftSpace topSpace");

        // create chartDiv
        chartDiv = cardDiv.append("div");
        chartDiv.style("padding","5px")
            .style("margin-top", "0px");

        chart = new bus.BarChart();
        chart.create(chartDiv,data1,data2);

        btn.on('click', function(){
            chart.saveImage();
        });
    }

    function parseLine(d) {
        return {
                segment: parseInt(d.segment),
                line: d.line,
                avgSpeed : parseFloat(d.avgspeed)
            };
    }

    function fileSelector(propId){
        var dropId = "propSelector";

        var dropClass = propId==0?"":"leftSpace";

        var file1 = bus.UiParts.File(cardDiv,"histogramFileInput1_"+bus.globalCardId,dropClass, "Select file: ");
        var file2 = bus.UiParts.File(cardDiv,"histogramFileInput2_"+bus.globalCardId,dropClass, "Select file: ");

        $("#histogramFileInput1_"+bus.globalCardId).change(function() {
            var reader = new FileReader();
            reader.readAsText(this.files[0]);
            reader.onload = function() {
                data1 = d3.csv.parse(reader.result, function(d) {
                    return parseLine(d);
                });
                if(data1 != undefined && data2 != undefined) {
                    createChart();
                }
            }
        });

        $("#histogramFileInput2_"+bus.globalCardId).change(function() {
            var reader = new FileReader();
            reader.readAsText(this.files[0]);
            reader.onload = function() {
                data2 = d3.csv.parse(reader.result, function(d) {
                    return parseLine(d);
                });
                if(data1 != undefined && data2 != undefined) {
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