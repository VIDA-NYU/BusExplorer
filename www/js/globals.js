/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

// Namespace definition
bus = {};


// available bus json sets
bus.availableBusNames = [];

// available bus properties
bus.availableFunctionNames = [undefined,undefined];


// currently selected Pluto dataset
bus.selectedBusName = "";

// currently selected function view
bus.selectedFunctionName = "yearbuilt";


// currently selected Pluto dataset
bus.selectedPlutoCompareName = "";

// TODO: Do I need to have that?
// currently selected function view
// bus.selectedFunctionCompareName = "merges";


// currently selected bus layers (busId:bus.Layer)
bus.loadedBus = {};

// currently selected bus layers (busId:rtree)
bus.loadedIndex = {};

// currently selected function tables (busId:crossfilter)
bus.loadedDataSet = {};

bus.map = null;

//TODO: Remove?
// number of created cards
bus.globalCardId = 0;
bus.selectedProperties = {};
bus.filterCard = null;
bus.exportCard = null;
