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

    function getFilters(){
    	var data = {
			dayOfWeek:bus.filterCard.getDayOfWeek(),
			month:bus.filterCard.getMonth(),
			year:bus.filterCard.getYear(),
			startHour:bus.filterCard.getStartHour(),
			endHour:bus.filterCard.getEndHour(),
			ids:bus.filterCard.getIds(),
			lines:bus.filterCard.getLines(),
			path:bus.filterCard.getPath()
        };
        return data;
    }

    exports.getSpeed = function(callAfter){

        var data = getFilters();
        
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
                download(data,"export.csv","text/plain");
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

    exports.getPings = function(callAfter){

    	var data = getFilters();
        
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
                download(data,"export.csv","text/plain");
    			callAfter();
    		}, 
        });
    };

    exports.getTrips = function(callAfter) {

    	var data = getFilters();
    	
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
                download(data,"export.csv","text/plain");
    			callAfter();
    		}, 
        });
    };

    return exports;
};