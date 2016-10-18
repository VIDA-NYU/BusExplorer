/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

// Namespace definition
bus = {};


// available bus json sets
bus.availableLionNames  = [];
bus.availableRouteNames = [];
bus.availableLineNames  = [];

// available bus properties
bus.availableFunctionNames = [undefined,undefined];


// currently selected bus dataset
bus.selectedLionName = "";
bus.selectedLineName = "";

// currently selected function view
bus.selectedFunctionName = "yearbuilt";


// currently selected Pluto dataset
bus.selectedPlutoCompareName = "";

// TODO: Do I need to have that?
// currently selected function view
// bus.selectedFunctionCompareName = "merges";


// currently selected bus layers (busId:bus.Layer)
bus.loadedLines = [];
bus.loadedLions = [];

// currently selected bus layers (busId:rtree)
bus.loadedIndex = {};

// currently selected function tables (busId:crossfilter)
bus.loadedDataSet = {};

bus.map = null;
bus.db = null;
bus.gui = null;

//TODO: Remove?
// number of created cards
bus.globalCardId = 0;
bus.selectedProperties = {};
bus.filterCard = null;
bus.exportCard = null;

bus.filterSize = 50;