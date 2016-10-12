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

    exports.getPings = function(callAfter){
        
    	$.post('/getPings',
            {dayOfWeek:bus.filterCard.getDayOfWeek(),
             month:bus.filterCard.getMonth(),
             year:bus.filterCard.getYear(),
             startHour:bus.filterCard.getStartHour(),
             endHour:bus.filterCard.getEndHour(),
             ids:bus.filterCard.getIds(),
             lines:bus.filterCard.getLines(),
             path:bus.filterCard.getPath()
            }, 
            function(data) {
            	console.log(data);
                callAfter();
        	}
        );
    };

    exports.getTrips = function(callAfter) {
    	$.post('/getTrips',
            {dayOfWeek:bus.filterCard.getDayOfWeek(),
             month:bus.filterCard.getMonth(),
             year:bus.filterCard.getYear(),
             startHour:bus.filterCard.getStartHour(),
             endHour:bus.filterCard.getEndHour(),
             ids:bus.filterCard.getIds(),
             lines:bus.filterCard.getLines(),
             path:bus.filterCard.getPath()
            }, 
            function(data) {
            	console.log(data);
                callAfter();
        	}
        );
    };

    return exports;
};