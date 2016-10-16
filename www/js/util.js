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

var dataURLtoBlob = function(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

var downloadImage = function(data) {
	var blob = dataURLtoBlob(data);
	var objurl = URL.createObjectURL(blob);
	var link = document.createElement("a");
	link.download = "image.png";
	link.href = objurl;
	link.click();
}

