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

    function getData(){
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

    exports.getPings = function(callAfter){

    	var data = getData();
        
    	$.ajax({
    		type: "POST",
    		url: "getPings",
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

    	var data = getData();
    	
    	$.ajax({
    		type: "POST",
    		url: "getTrips",
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