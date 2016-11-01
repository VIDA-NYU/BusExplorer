/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.Db = function (){
    // exported object
    var exports = {};

    exports.getAvgSpeed = function(){

    };

    function getFilters(getAsString){

        if(getAsString == undefined)
            getAsString = false;


    	var data = {
			dayOfWeek:bus.filterCard.getDayOfWeek(getAsString),
			month:bus.filterCard.getMonth(getAsString),
			year:bus.filterCard.getYear(getAsString),
			startHour:bus.filterCard.getStartHour(getAsString),
			endHour:bus.filterCard.getEndHour(getAsString),
			ids:bus.filterCard.getIds(getAsString),
			lines:bus.filterCard.getLines(getAsString),
            direction:bus.filterCard.getDirection(getAsString),
			path:bus.filterCard.getPath(getAsString),
			selectionMode:bus.map.selectionMode,
            aggregateByLine:bus.filterCard.getAggregateByLine(getAsString)
        };
        return data;
    }

    function getName(){
        var data = getFilters(true);
        var name = "DayWeek."+data.dayOfWeek
                  +",Month."+data.month
                  +",Year."+data.year
                  +",StartHour."+data.startHour
                  +",EndHour."+data.endHour
                  +",Ids."+data.ids
                  +",Lines."+data.lines
                  +",Dir."+data.direction
                  +",SelectionMode."+data.selectionMode;
        return name;
    }

    exports.getSpeed = function(callAfter){

        var data = getFilters();
        var name = "speed,"+getName();
        
        $.ajax({
            type: "POST",
            url: "getSpeedCSV",
            contentType: "application/json",
            dataType: "text",
            data: JSON.stringify(data),
            error: function() {
                alert("Error getSpeed");
                callAfter();
            },
            success: function(data) {
                data = name + "\n" + data
                download(data,name+".csv","text/plain");
                callAfter();
            }, 
        });
    };

    exports.showSpeed = function(callAfter){

        var data = getFilters();
        
        $.ajax({
            type: "POST",
            url: "getSpeed",
            contentType: "application/json",
            dataType: "text",
            data: JSON.stringify(data),
            error: function() {
                alert("Error getSpeed");
                callAfter();
            },
            success: function(data) {
            	data = JSON.parse(data);
            	bus.map.showSpeed(data);
                callAfter();
            }, 
        });
    };

    exports.showDwellTime = function(callAfter){

        var data = getFilters();
        
        $.ajax({
            type: "POST",
            url: "getDwellTime",
            contentType: "application/json",
            dataType: "text",
            data: JSON.stringify(data),
            error: function() {
                alert("Error getDwellTime");
                callAfter();
            },
            success: function(data) {
                data = JSON.parse(data);
                bus.map.showDwellTime(data);
                callAfter();
            }, 
        });
    };

    exports.getPings = function(callAfter){

    	var data = getFilters();
        var name = "pings,"+getName();
        
    	$.ajax({
    		type: "POST",
    		url: "getPingsCSV",
    		contentType: "application/json",
    		dataType: "text",
    		data: JSON.stringify(data),
    		error: function() {
    			alert("Error getPings");
    			callAfter();
    		},
    		success: function(data) {
                data = name + "\n" + data
                download(data,name+".csv","text/plain");
    			callAfter();
    		}, 
        });
    };

    exports.getTrips = function(callAfter) {

    	var data = getFilters();
        var name = "trips,"+getName();
    	
    	$.ajax({
    		type: "POST",
    		url: "getTripsCSV",
    		contentType: "application/json",
    		dataType: "text",
    		data: JSON.stringify(data),
    		error: function() {
    			alert("Error getTrips");
    			callAfter();
    		},
    		success: function(data) {
                data = name + "\n" + data
                download(data,name+".csv","text/plain");
    			callAfter();
    		}, 
        });
    };

    return exports;
};