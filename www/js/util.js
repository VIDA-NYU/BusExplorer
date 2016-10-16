/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

var calculateBuffer = function(geoJSON) {
    var buffer = turf.buffer(geoJSON, 0.05, 'kilometers');
    return buffer;
};

var download = function(text, name, type) {
    if (navigator.msSaveBlob)
    {
      var blob = new Blob([text],{type: type});
      navigator.msSaveBlob(blob, name)
    }
    else
    {
      window.open('data:text/csv;charset=utf-8,' + escape(text));                      
    } 
};