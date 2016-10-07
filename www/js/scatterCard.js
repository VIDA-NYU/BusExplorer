/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.ScatterCard = function(){
    // d3js chart
    var chart = undefined;

    // Divs
    var cardDiv  = undefined;
    var chartDiv = undefined;

    // selected property
    var selectedProperty = [undefined,undefined];

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

        chart = new bus.Scatter();
        chart.create(chartDiv,selectedProperty);
    }

    // selects the property
    function propertySelector(propId){
        var dropId = "propSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var drop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);

        // gets the list
        var ul = drop.select("ul");
        // sets the button label
        drop.select("button").html("Select one property");

        // binds json to items and appends
        ul.selectAll("li")
            .data(bus.availableFunctionNames[0])
            .enter()
            .append('li')
            .html(function(d) { return '<a href="#">' + d + '</a>'; });

        // updates the button when selecting an item
        ul.selectAll("li")
            .on('click', function(d){
                drop.select('button').html(d);
                // updates the selected function
                selectedProperty[propId] = d;

                if(!selectedProperty[0] || !selectedProperty[1])
                    return;

                // creates the chart
                createChart();
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
        propertySelector(0);
        // card menu
        propertySelector(1);

        // close card
        closeCard();
   };

    // public api
    return exports;
};