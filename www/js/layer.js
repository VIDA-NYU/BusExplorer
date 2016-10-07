/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.Layer = function(){
    // Group of Three.js elements
    var stroke = undefined;
    // Group of Three.js elements
    var fill   = undefined;

    // ColorMap
    var colorMap = new bus.ColorScale();

    // exported api
    var exports = {};

    // Three.js stroke layer creation
    exports.loadStrokeLayer = function(glCanvas, crossData, render) {
        // default value
        render = typeof render !== 'undefined' ? render : true;

        // console message
        console.log ("Loading bus stroke layer...");
        console.time("Loading bus stroke layer");

        // gets the polygon dimension
        var dim = crossData.dimension(function(d){
            return d["MY_BBL"];
        });
        // get all polygons
        var data = dim.top(Infinity);

        // creates the strokes
        stroke = new THREE.Geometry();
        // auxiliary geometry
        var gmt = new THREE.Geometry();

        // material definition
        var mtl = new THREE.LineBasicMaterial({
            color: new THREE.Color("rgb(160,160,160)")
        });

        // loops over the polygons
        var poly = [];
        for (var pid = 0, plen = data.length; pid<plen; ++pid) {
            // gets the poly
            poly = data[pid]["MY_POLYGON"];

            // first point
            var vtx0 = new google.maps.LatLng(poly[0].y, poly[0].x);
            // converts lng,lat to google lat,long
            vtx0 = glCanvas.fromLatLngToVertex(vtx0);
            vtx0.z = 10;

            // loops over the vertices
            for (var vid = 0, vlen = poly.length; vid<vlen-1; vid++) {
                // new point
                var vtx1 = new google.maps.LatLng(poly[vid+1].y, poly[vid+1].x);
                // converts lat,lng to x,y
                vtx1 = glCanvas.fromLatLngToVertex(vtx1);
                vtx1.z = 10;

                // stores the point
                gmt.vertices[2*vid  ]=vtx0;
                gmt.vertices[2*vid+1]=vtx1;

                // copies the current to old
                vtx0 = vtx1;
            }

            // merges the geometry
            stroke.merge(gmt);

            // frees the geometry
            gmt.vertices = [];
        }

        stroke = new THREE.LineSegments(stroke, mtl);

        // adds the group to canvas
        if(render) glCanvas.add(stroke);

        // frees the dimension
        dim.filterAll();
        dim.dispose();

        // logs the
        console.timeEnd("Loading bus stroke layer");
    };

    // Three.js fill Layer creation
    exports.loadFillLayer = function(glCanvas, funcName, crossData) {
        // console message
        console.log ("Loading bus fill layer...");
        console.time("Loading bus fill layer:");

        // creates the group
        fill = new THREE.Geometry();
        // three.js geometry
        var gmt = new THREE.Geometry();

        // gets the polygon dimension
        var dim = crossData.dimension(function(d){
            return d[funcName];
        });

        // get all polygons
        var data = dim.top(Infinity);
        dim.filter(function(d){
           return d>0;
        });

        // json extremes
        var max = dim.top(1);
        var min = dim.bottom(1);
        // ensure bounds
        max = max.length?max[0][funcName]:0;
        min = min.length?min[0][funcName]:0;

        // material definition
        var mtl = new THREE.MeshBasicMaterial({
            shading: THREE.FlatShading,
            side: THREE.DoubleSide,
            vertexColors: THREE.FaceColors,
            polygonOffset: true
        });

        // loops over the json
        var nlots = 0, poly = [];
        for (var pid = 0, plen = data.length; pid<plen; ++pid) {
            // gets the poly
            poly = data[pid]["MY_POLYGON"];

            // avoid empty polygons
            if(!poly.length) continue;

            // gets the value
            var den = (max === min)?1:(max-min);
            var val = (data[pid][funcName]-min)/den;

            // loops over the vertices
            for (var vid = 0, vlen = poly.length; vid<vlen; vid++) {
                // converts lng,lat to google lat,long
                var vtx = new google.maps.LatLng(poly[vid].y, poly[vid].x);
                // converts lat,lng to x,y
                vtx = glCanvas.fromLatLngToVertex(vtx);
                // stores the point
                gmt.vertices[vid]=vtx;
            }

            // face color
            var fColor = colorMap.getThreeColor(val);

            // triangulates the region
            var triangles = THREE.Shape.Utils.triangulateShape(gmt.vertices, []);
            // loads the triangles
            for(var fid= 0, tlen=triangles.length; fid<tlen; fid++){
                // trig vertices
                var trig = new THREE.Face3(triangles[fid][0], triangles[fid][1], triangles[fid][2]);
                // trig colors
                trig.color = fColor;

                // appends the face
                gmt.faces[fid] = trig;
            }

            // adds one lot
            nlots += 1;

            // creates the mesh
            var mesh = new THREE.Mesh(gmt, mtl);
            // update matrix
            mesh.updateMatrix();
            // adds the mesh to the group
            fill.merge(mesh.geometry, mesh.matrix);

            // frees the geometry
            gmt.vertices = [];
            gmt.faces = [];
        }

        fill = new THREE.Mesh(fill, mtl);
        // adds to the canvas
        glCanvas.add(fill);

        // frees the dimension
        dim.filterAll();
        dim.dispose();

       // logs the
        console.timeEnd("Loading bus fill layer:");
    };

    // Access to the group
    exports.getGeometry = function(){
        // returns the stroke object
        return stroke;
    };

    // public api
    return exports;
};