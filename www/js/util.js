/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

var calculateBuffer = function(geoJSON, bufferSizeInMeters) {
    if(bufferSizeInMeters == undefined)
        bufferSizeInMeters = 50.0;

    var buffer = turf.buffer(geoJSON, bufferSizeInMeters * 0.001, 'kilometers');
    return buffer;
};

var download = function(text, name, type) {
    var file = new File([text], name, {type: type});
    saveAs(file);
};

var dataURLtoBlob = function(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
};

var downloadImage = function(canvas, name) {
	
	canvas.toBlob(function(blob) {
	    saveAs(blob, name);
	});
};

