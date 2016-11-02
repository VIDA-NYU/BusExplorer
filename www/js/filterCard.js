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

    function handleClick(obj, dropId, d) {
        if(bus.selectedProperties[dropId] == undefined)
            bus.selectedProperties[dropId] = [];

        var index = bus.selectedProperties[dropId].indexOf(d);
        if(index < 0) {
            bus.selectedProperties[dropId].push(d);
            d3.select(obj).select("a").style("font-weight", "bold");
        }
        else {
            bus.selectedProperties[dropId].splice(index, 1);
            d3.select(obj).select("a").style("font-weight", "normal");
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
        var dropClass = propId==0?"":"leftSpace topSpace";
        var dayDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);
        // cardDiv.append("br");

        // gets the list
        var ul = dayDrop.select("ul");
        // sets the button label
        dayDrop.select("button").html("Day of week");

        // binds json to items and appends
        ul.selectAll("li")
            .data(["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"])
            .enter()
            .append('li')
            .html(function(d) { return '<a href="#">' + d + '</a>'; });

        ul.selectAll("li")
            .on('click', function(d){
                handleClick(this, dropId, d);
            });
    }

    function monthSelector(propId){
        var dropId = "monthSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace topSpace";
        var monthDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);
        // cardDiv.append("br");

        // gets the list
        var ul = monthDrop.select("ul");
        // sets the button label
        monthDrop.select("button").html("Month");

        // binds json to items and appends
        ul.selectAll("li")
            .data([].concat(d3.range(1,13,1)))
            .enter()
            .append('li')
            .html(function(d) { return '<a href="#">' + d + '</a>'; });

        ul.selectAll("li")
            .on('click', function(d){
                handleClick(this, dropId, d);
            });
    }

    function yearSelector(propId){
        var dropId = "yearSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace topSpace";
        var yearDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);
        // cardDiv.append("br");

        // gets the list
        var ul = yearDrop.select("ul");
        // sets the button label
        yearDrop.select("button").html("Year");

        // binds json to items and appends
        ul.selectAll("li")
            .data([].concat(d3.range(2013,2016,1)))
            .enter()
            .append('li')
            .html(function(d) { return '<a href="#">' + d + '</a>'; });

        ul.selectAll("li")
            .on('click', function(d){
                handleClick(this, dropId, d);
            });
    }

    function directionSelector(propId){
        var dropId = "directionSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace topSpace";
        var directionDrop = bus.UiParts.DropDown(cardDiv,dropId,dropClass);

        // gets the list
        var ul = directionDrop.select("ul");
        // sets the button label
        directionDrop.select("button").html("Direction");

        // binds json to items and appends
        ul.selectAll("li")
            .data([].concat([0,1]))
            .enter()
            .append('li')
            .html(function(d) { return '<a href="#">' + d + '</a>'; });

        ul.selectAll("li")
            .on('click', function(d){
                handleClick(this, dropId, d);
            });

        cardDiv.append("hr");
    }

    function hourSelector(propId){
        var dropId = "hourSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var start = bus.UiParts.SimpleText(cardDiv,dropId+"Label",dropClass,"Hours: ");
        var startPicker = bus.UiParts.Slider(cardDiv,"picker", [0,23], [0,23]);
        cardDiv.append("hr");
    }

    function dateSelector(propId){
        var dropId = "dateSelector";

        // adds the drop down
        var dropClass = propId==0?"":"leftSpace";
        var start = bus.UiParts.SimpleText(cardDiv,dropId+"Label",dropClass,"Range: ");
        var startPicker = bus.UiParts.Date(cardDiv,"dateStart");
        cardDiv.append("hr");
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

        cardDiv.append("hr");
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
                    bus.map.clearPaths();
                    bus.map.changeSelectionMode("segment");
                    bus.map.addGeoJson(path, "withoutBuffer", false);
                    path = calculateBuffer(path);
                    bus.map.addGeoJson(path, "filter", false, true);
                    bus.map.showFilterBuffer(false);
                    $("#filterBufferSizeSelector").collapse("hide");
                    $("#filterCheckbox").find("input").attr("disabled",false);
                    $("#filterCheckbox").find("input").prop("checked",false);
                    $("#showSpeedSelector").attr("disabled", false);
                    d3.select(".filter").transition().style("height", "800px");
                }
                else if(type === "Point"){
                    bus.map.clearPaths();
                    bus.map.changeSelectionMode("node");
                    bus.map.addGeoJson(path, "filter", false, true);
                    bus.map.showFilterBuffer(true);
                    $("#filterBufferSizeSelector").collapse("show");
                    $("#filterCheckbox").find("input").prop("checked",true);
                    $("#filterCheckbox").find("input").attr("disabled",true);
                    $("#showSpeedSelector").attr("disabled", true);
                    d3.select(".filter").transition().style("height", "820px");

                }
            }
        });

        var checkbox = bus.UiParts.CheckBox(cardDiv, "filterCheckbox", dropClass, "Show filter buffer");
        $("#filterCheckbox").find("input").prop("checked",false);
        $("#filterCheckbox").change(function () {
            if ($("#filterCheckbox").find("input").is(":checked")) {
                $("#filterBufferSizeSelector").collapse("show");
                d3.select(".filter").transition().style("height", "820px");
                bus.map.showFilterBuffer(true);
            } else {
                $("#filterBufferSizeSelector").collapse("hide");
                d3.select(".filter").transition().style("height", "800px");
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

        cardDiv.append("hr");
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

        cardDiv.append("hr");
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

        var dropClass = propId==0?"":"leftSpace";
        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Export speed csv", dropClass);
        // add callback
        btn.on("click", function(){
            $("#exportSpeedSelector").button("loading");
            var callAfter = function() {
                $("#exportSpeedSelector").button("reset");
            }
            bus.db.getSpeed(callAfter);
        });

        var checkbox = bus.UiParts.CheckBox(cardDiv, "aggregationCheckbox", dropClass, "Aggregate by line");
        $("#aggregationCheckbox").find("input").prop("checked",true);

        cardDiv.append("hr");
    }

    function exportSpeedGeoJSONSelector(propId){
        var buttonId = "exportSpeedGeoJSONSelector";

        var dropClass = propId==0?"":"leftSpace";
        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Export speed json", dropClass);
        // add callback
        btn.on("click", function(){
            $("#exportSpeedGeoJSONSelector").button("loading");

            if(bus.map.paths['withoutBuffer'] != undefined) {
                download(JSON.stringify(bus.map.paths['withoutBuffer'].toGeoJSON()), 'geo.json', 'text/plain');
            }
            $("#exportSpeedGeoJSONSelector").button("reset");
        });

        cardDiv.append("hr");
    }

    function showSpeedSelector(propId){
        var buttonId = "showSpeedSelector";

        var dropClass = propId==0?"":"leftSpace";
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

    function showDwellTimeSelector(propId){
        var buttonId = "showDwellTimeSelector";

        var dropClass = propId==0?"":"leftSpace";
        var btn = bus.UiParts.ButtonText(cardDiv, buttonId, "Show dwell time", dropClass);
        // add callback
        btn.on("click", function(){
            $("#showDwellTimeSelector").button("loading");
            var callAfter = function() {
                $("#showDwellTimeSelector").button("reset");
            }
            bus.db.showDwellTime(callAfter);
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
        daySelector(1);
        monthSelector(1);
        yearSelector(1);
        directionSelector(1);
        dateSelector(0);
        idSelector(0);
        lineSelector(0);
        hourSelector(0);
        pathSelector(0);
        filterBufferSizeSelector(0);
        exportPingCSVSelector(0);
        exportTripCSVSelector(1);
        exportSpeedCSVSelector(1);
        exportSpeedGeoJSONSelector(1);
        showSpeedSelector(1);
        showDwellTimeSelector(1);
    };

    exports.getDayOfWeek = function(returnString){

        if(returnString == undefined)
            returnString = false;

        var vals = [];
        for(var d in bus.selectedProperties["daySelector"]) {
            var name = bus.selectedProperties["daySelector"][d];
            switch(name) {
                case "Monday":
                    vals.push(0);
                    break;
                case "Tuesday":
                    vals.push(1);
                    break;
                case "Wednesday":
                    vals.push(2);
                    break;
                case "Thursday":
                    vals.push(3);
                    break;
                case "Friday":
                    vals.push(4);
                    break;
                case "Saturday":
                    vals.push(5);
                    break;
                case "Sunday":
                    vals.push(6);
                    break;
            }
        }

        if(vals == undefined || vals.length == 0) {
            if(returnString)
                return "";
            else
                return -1;
        }

        if(returnString) {
            return (""+vals).replace(/,/g,"+");
        }
        return vals;
    };

    exports.getMonth = function(returnString){

        var vals = bus.selectedProperties["monthSelector"];
        if(vals == undefined || vals.length == 0) {
            if(returnString)
                return "";
            else
                return -1;
        }

        if(returnString) {
            return (""+vals).replace(/,/g,"+");
        }
        return vals;
    };

    exports.getYear = function(returnString){

        var vals = bus.selectedProperties["yearSelector"];
        if(vals == undefined || vals.length == 0) {
            if(returnString)
                return "";
            else
                return -1;
        }

        if(returnString) {
            return (""+vals).replace(/,/g,"+");
        }
        return vals;
    };

    exports.getDirection = function(returnString){

        var vals = bus.selectedProperties["directionSelector"];
        if(vals == undefined || vals.length == 0) {
            if(returnString)
                return "";
            else
                return -1;
        }

        if(returnString) {
            return (""+vals).replace(/,/g,"+");
        }
        return vals;
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
        for(f in path.features) {
            path.features[f].filterSize = bus.filterSize;
        }
        return path;
    };

    exports.getDate = function(){
        if($("#dateStart").val() == "")
            return -1;
        return [$("#dateStart").data('daterangepicker').startDate.format("MM/DD/YY HH:mm"), $("#dateStart").data('daterangepicker').endDate.format("MM/DD/YY HH:mm")];
    }

    exports.getAggregateByLine = function(){
        return $("#aggregationCheckbox").find("input").is(":checked");
    };


    // public api
    return exports;
};