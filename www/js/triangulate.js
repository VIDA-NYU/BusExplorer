/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

function addContour( vertices, contour ) {
    for ( var i = 0; i < contour.length; i++ ) {
        vertices.push( contour[i].x );
        vertices.push( contour[i].y );
    }
}

THREE.Shape.Utils.triangulateShape = function ( contour, holes ) {
    var vertices = [];

    addContour( vertices, contour );

    var holeIndices = [];
    var holeIndex = contour.length;

    for ( i = 0; i < holes.length; i++ ) {
        holeIndices.push( holeIndex );
        holeIndex += holes[i].length;
        addContour( vertices, holes[i] );
    }

    var result = earcut( vertices, holeIndices, 2 );

    var grouped = [];
    for ( var i = 0; i < result.length; i += 3 ) {
        grouped.push( result.slice( i, i + 3 ) );
    }
    return grouped;
};