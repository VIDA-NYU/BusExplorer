/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

calculateBuffer = function(geoJSON) {
    var buffer = turf.buffer(geoJSON, 0.05, 'kilometers');
    return buffer;
};