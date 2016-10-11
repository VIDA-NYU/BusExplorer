/**
#
# DOT Time Tool
#
*/

bus.FilterCard = function(){
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
            .classed("bgStyle filter",true);
    }

    // selects the property
    function daySelector(propId){
        var dropId = "daySelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var day = bus.UiParts.SimpleText(cardDiv,dropId,dropClass,"Day of week: ");
        var dayDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);
        cardDiv.append("br");

        // gets the list
        var ul = dayDrop.select("ul");
        // sets the button label
        dayDrop.select("button").html("All");

        // binds json to items and appends
        ul.selectAll("li")
            .data(["All","Monday","Tuesday","Wednsday","Thursday","Friday","Saturday","Sunday"])
            .enter()
            .append('li')
            .html(function(d) { return '<a href="#">' + d + '</a>'; });

        ul.selectAll("li")
            .on('click', function(d){
                dayDrop.select('button').html(d);
                // updates the selected function
                bus.selectedProperties[dropId] = d;
            });
    }

    function monthSelector(propId){
        var dropId = "monthSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var month = bus.UiParts.SimpleText(cardDiv,dropId,dropClass,"Month: ");
        var monthDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);
        cardDiv.append("br");

        // gets the list
        var ul = monthDrop.select("ul");
        // sets the button label
        monthDrop.select("button").html("All");

        // binds json to items and appends
        ul.selectAll("li")
            .data(["All"].concat(d3.range(1,13,1)))
            .enter()
            .append('li')
            .html(function(d) { return '<a href="#">' + d + '</a>'; });

        ul.selectAll("li")
            .on('click', function(d){
                monthDrop.select('button').html(d);
                // updates the selected function
                bus.selectedProperties[dropId] = d;
            });
    }

    function yearSelector(propId){
        var dropId = "yearSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var year = bus.UiParts.SimpleText(cardDiv,dropId,dropClass,"Year: ");
        var yearDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);
        cardDiv.append("br");

        // gets the list
        var ul = yearDrop.select("ul");
        // sets the button label
        yearDrop.select("button").html("All");

        // binds json to items and appends
        ul.selectAll("li")
            .data(["All"].concat(d3.range(2013,2016,1)))
            .enter()
            .append('li')
            .html(function(d) { return '<a href="#">' + d + '</a>'; });

        ul.selectAll("li")
            .on('click', function(d){
                yearDrop.select('button').html(d);
                // updates the selected function
                bus.selectedProperties[dropId] = d;
            });
    }

    function hourSelector(propId){
        var dropId = "hourSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var start = bus.UiParts.SimpleText(cardDiv,dropId,dropClass,"Hours: ");
        var startPicker = bus.UiParts.Slider(cardDiv,"picker");
        cardDiv.append("br");
    }

    function idSelector(propId){
        var dropId = "idSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var line = bus.UiParts.SimpleText(cardDiv,dropId,dropClass,"Filter by bus id: ");
        var linePicker = bus.UiParts.InputFilter(cardDiv,"ids");
        cardDiv.append("br");
    }

    function lineSelector(propId){
        var dropId = "lineSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var line = bus.UiParts.SimpleText(cardDiv,dropId,dropClass,"Filter by line name: ");
        var linePicker = bus.UiParts.LineFilter(cardDiv,"lines");
        cardDiv.append("br");

        d3.select(".searchBusLine")
            .selectAll("option").data(bus.availableLineNames)
            .enter().append("option")
            .attr("value", function (d) { return d; } )
            .html(function (d) { return d; } );
        $(document).ready(function(){
            $('.typeahead').typeahead();
            $('.typeahead').typeahead('destroy');
            $('#linesInput').typeahead({
                source:bus.availableLineNames,
                updater: function(item) {
                    $('#linesArea').append('"'+item+'"', ',');
                    bus.map.addLine(item);
                    return '';
                }
            });
        });
    }

    function pathSelector(propId){
        var dropId = "pathSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var line = bus.UiParts.SimpleText(cardDiv,dropId,dropClass,"Filter by line trajectory: ");

        cardDiv.append("input")
            .attr("type", "file")
            .attr("id", "fileInput");

        $("#fileInput").filestyle({badge: false, buttonName: "btn-primary"});
        cardDiv.append("br");

        $("#fileInput").change(function() {
            var reader = new FileReader();
            reader.readAsText(this.files[0]);
            reader.onload = function() {
                bus.map.addGeoJson(JSON.parse(reader.result));
            }
        })

        // add callback
        // btn.on("click", function(){
        //     upload();
        // });
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
        daySelector(0);
        monthSelector(0);
        yearSelector(0);
        hourSelector(0);
        idSelector(0);
        lineSelector(0);
        pathSelector(0);

        
   };

    // public api
    return exports;
};