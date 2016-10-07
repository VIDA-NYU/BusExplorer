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

    // selected property
    var selectedProperty = undefined;

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
    function createChart(isLinear){
        // erases old json
        clearChart();

        // create chartDiv
        chartDiv = cardDiv.append("div");
        chartDiv.style("padding","5px")
            .style("margin-top", "15px");

        chart = new bus.Histogram();
        chart.create(chartDiv,selectedProperty,isLinear);
    }

    // selects the property
    function propertySelector(){
        var dropId = "propSelector";

        // adds the drop down
        var drop = bus.UiParts.DropDown(cardDiv,dropId);

        // gets the list
        var ul = drop.select("ul");
        // sets the button label
        drop.select("button").html("Select one property");

        // list of available values
        var vals = bus.availableFunctionNames[0].concat(bus.availableFunctionNames[1]);

        // binds json to items and appends
        ul.selectAll("li")
            .data(vals)
            .enter()
            .append('li')
            .html(function(d) { return '<a href="#">' + d + '</a>'; });

        // updates the button when selecting an item
        ul.selectAll("li")
            .on('click', function(d){
                drop.select('button').html(d);
                // updates the selected function
                selectedProperty = d;
                var isLinear = (bus.availableFunctionNames[0].indexOf(d)>=0);

                // creates the chart
                createChart(isLinear);
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
    }

    // card creation
    exports.initCard = function(){
        // gets the cards div
        var mainDiv = d3.select("#cards");
        // creates the card div
        createDiv(mainDiv);
        // card menu
        propertySelector();

        // close card
        closeCard();
   };

    // public api
    return exports;
};