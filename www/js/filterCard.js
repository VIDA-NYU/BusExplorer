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
    var path     = undefined;

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
        var day = bus.UiParts.SimpleText(cardDiv,dropId+"Label",dropClass,"Day of week: ");
        var dayDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);
        // cardDiv.append("br");

        // gets the list
        var ul = dayDrop.select("ul");
        // sets the button label
        dayDrop.select("button").html("All");

        // binds json to items and appends
        ul.selectAll("li")
            .data(["All","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"])
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
        var month = bus.UiParts.SimpleText(cardDiv,dropId+"Label",dropClass,"Month: ");
        var monthDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);
        // cardDiv.append("br");

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
        var year = bus.UiParts.SimpleText(cardDiv,dropId+"Label",dropClass,"Year: ");
        var yearDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);
        // cardDiv.append("br");

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

    function directionSelector(propId){
        var dropId = "directionSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var direction = bus.UiParts.SimpleText(cardDiv,dropId+"Label",dropClass,"Direction: ");
        var directionDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);

        // gets the list
        var ul = directionDrop.select("ul");
        // sets the button label
        directionDrop.select("button").html("All");

        // binds json to items and appends
        ul.selectAll("li")
            .data(["All"].concat([0,1]))
            .enter()
            .append('li')
            .html(function(d) { return '<a href="#">' + d + '</a>'; });

        ul.selectAll("li")
            .on('click', function(d){
                directionDrop.select('button').html(d);
                // updates the selected function
                bus.selectedProperties[dropId] = d;
            });
    }

    function hourSelector(propId){
        var dropId = "hourSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var start = bus.UiParts.SimpleText(cardDiv,dropId+"Label",dropClass,"Hours: ");
        var startPicker = bus.UiParts.Slider(cardDiv,"picker", [0,23], [0,23]);
        // cardDiv.append("br");
    }

    function idSelector(propId){
        var dropId = "idSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var line = bus.UiParts.SimpleText(cardDiv,dropId+"Label",dropClass,"Filter by bus id: ");
        var linePicker = bus.UiParts.InputFilter(cardDiv,"ids");
        // cardDiv.append("br");
    }

    function lineSelector(propId){
        var dropId = "lineSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var line = bus.UiParts.SimpleText(cardDiv,dropId+"Label",dropClass,"Filter by line name: ");
        var linePicker = bus.UiParts.LineFilter(cardDiv,"lines");
        cardDiv.append("br");

        d3.select("#linesInput")
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
                    $('#linesArea').append(item+', ');
                    // bus.map.addLine(item);
                    return '';
                }
            });
        });
    }

    function pathSelector(propId){
        var dropId = "pathSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var file = bus.UiParts.File(cardDiv,"fileInput",dropClass, "Filter by line trajectory: ");
        
        $("#fileInput").change(function() {
            var reader = new FileReader();
            reader.readAsText(this.files[0]);
            reader.onload = function() {
                
                path = JSON.parse(reader.result);
                var type = path.features[0].geometry.type;

                if(type === "LineString") {
                    bus.map.addGeoJson(path, "withoutBuffer", false);
                    path = calculateBuffer(path);
                    bus.map.addGeoJson(path, "filter", false, true);
                    $("#filterCheckbox").find("input").attr("disabled",false);
                }
                else if(type === "Point"){
                    bus.map.addGeoJson(path, "filter", false, true);
                    bus.map.showFilterBuffer(true);
                    $("#filterBufferSizeSelector").collapse("show");
                    $("#filterCheckbox").find("input").prop("checked",true);
                    $("#filterCheckbox").find("input").attr("disabled",true);
                }
            }
        });

        var checkbox = bus.UiParts.CheckBox(cardDiv, "filterCheckbox", dropClass, "Show filter buffer");
        $("#filterCheckbox").find("input").prop("checked",false);
        $("#filterCheckbox").change(function () {
            if ($("#filterCheckbox").find("input").is(":checked")) {
                $("#filterBufferSizeSelector").collapse("show");
                bus.map.showFilterBuffer(true);
            } else {
                $("#filterBufferSizeSelector").collapse("hide");
                bus.map.showFilterBuffer(false);
            }
        });

    }

    function filterBufferSizeSelector(propId){
        var dropId = "filterBufferSizeSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var div = cardDiv.append("div").attr("class", "collapse").attr("id", dropId);
        var start = bus.UiParts.SimpleText(div,dropId+"Label",dropClass,"Buffer size (in feet): ");
        var startPicker = bus.UiParts.Slider(div,"bufferSize", [30,300], bus.filterSize * 3.28084);

        $("#bufferSize").change(function() {
            var value = $("#bufferSize").val();
            bus.map.changeFilterSize(parseFloat(value) * 0.3048);
        })
    }

    // selects the property
    function exportPingCSVSelector(propId){
        var buttonId = "pingSelector";

        var dropClass = propId==0?"":"leftSpace";
        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Export pings csv", dropClass);
        // add callback
        btn.on("click", function(){
            $("#pingSelector").button("loading");
            var callAfter = function() {
                $("#pingSelector").button("reset");
            }
            bus.db.getPings(callAfter);
        });
    }

    function exportTripCSVSelector(propId){
        var buttonId = "tripSelector";

        var dropClass = propId==0?"":"leftSpace";
        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Export trips csv", dropClass);

        // add callback
        btn.on("click", function(){
            $("#tripSelector").button("loading");
            var callAfter = function() {
                $("#tripSelector").button("reset");
            }
            bus.db.getTrips(callAfter);
        });
    }

    function exportSpeedCSVSelector(propId){
        var buttonId = "exportSpeedSelector";

        var dropClass = propId==0?"":"topSpace";
        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Export speed csv", dropClass);
        // add callback
        btn.on("click", function(){
            $("#exportSpeedSelector").button("loading");
            var callAfter = function() {
                $("#exportSpeedSelector").button("reset");
            }
            bus.db.getSpeed(callAfter);
        });
    }

    function exportSpeedGeoJSONSelector(propId){
        var buttonId = "exportSpeedGeoJSONSelector";

        var dropClass = propId==0?"":"topSpace";
        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Export speed GeoJSON", dropClass);
        // add callback
        btn.on("click", function(){
            $("#exportSpeedGeoJSONSelector").button("loading");

            if(bus.map.paths['withoutBuffer'] != undefined) {
                download(JSON.stringify(bus.map.paths['withoutBuffer'].toGeoJSON()), 'geo.json', 'text/plain');
            }
            $("#exportSpeedGeoJSONSelector").button("reset");
        });
    }

    function showSpeedSelector(propId){
        var buttonId = "showSpeedSelector";

        var dropClass = propId==0?"":"topSpace leftSpace";
        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Show speed", dropClass);
        // add callback
        btn.on("click", function(){
            $("#showSpeedSelector").button("loading");
            var callAfter = function() {
                $("#showSpeedSelector").button("reset");
            }
            bus.db.showSpeed(callAfter);
        });
    }

    function closeCardSelector(){
        var buttonId = "closeCard";

        // adds the button
        var btn = bus.UiParts.Button(cardDiv, buttonId, "glyphicon glyphicon-remove");
        // add callback
        btn.on("click", function(){
            // clears the chart
            exports.closeCard();
            bus.filterCard = null;
        });

        cardDiv.append("br");
    }

    exports.closeCard = function(){
        bus.map.clearPaths();
        bus.gui.clearPaths();
        bus.loadedLines = [];
        bus.loadedLions = [];
        if(cardDiv) cardDiv.remove();
    }

    // card creation
    exports.initCard = function(){
        // gets the cards div
        var mainDiv = d3.select("#cards");
        // creates the card div
        createDiv(mainDiv);

        closeCardSelector();

        // card menu
        daySelector(0);
        monthSelector(0);
        yearSelector(0);
        directionSelector(0);
        hourSelector(0);
        idSelector(0);
        lineSelector(0);
        pathSelector(0);
        filterBufferSizeSelector(0);
        exportPingCSVSelector(0);
        exportTripCSVSelector(1);
        exportSpeedCSVSelector(1);
        showSpeedSelector(1);
        exportSpeedGeoJSONSelector(1);

    };

    exports.getDayOfWeek = function(){
        var val = $("#daySelector").children("button").text();
        switch(val) {
            case "All":
                return -1;
            case "Monday":
                return 0;
            case "Tuesday":
                return 1;
            case "Wednesday":
                return 2;
            case "Thursday":
                return 3;
            case "Friday":
                return 4;
            case "Saturday":
                return 5;
            case "Sunday":
                return 6;
        }
        return -1;
    };

    exports.getMonth = function(){
        var month = $("#monthSelector").children("button").text();
        if(month === "All")
            return -1;
        return parseInt(month);
    };

    exports.getYear = function(){
        var year = $("#yearSelector").children("button").text();
        if(year === "All")
            return -1;
        return parseInt(year);
    };

    exports.getDirection = function(){
        var dir = $("#directionSelector").children("button").text();
        if(dir === "All")
            return -1;
        return parseInt(dir);
    };

    exports.getStartHour = function(){
        return parseInt($("#picker").attr("value").split(",")[0]);
    };

    exports.getEndHour = function(){
        return parseInt($("#picker").attr("value").split(",")[1]);
    };

    exports.getIds = function(){
        return $("#idsInput").val();
    };

    exports.getLines = function(){
        return $("#linesArea").val();
    };

    exports.getPath = function(){
        return path;
    };


    // public api
    return exports;
};