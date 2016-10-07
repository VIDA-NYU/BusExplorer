/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

bus.Main = function() {
    // map app definition
    bus.map = new bus.Map();
    // json i-o
    var dat = new bus.Data();
    // ui factory
    var gui = new bus.Ui();

    // exported api
    var exports = {};

    // slots and signals connection
    var connectSlots = function(){
        // available datasets
        Sigs.connect(
          __sig__.availableNames, dat, dat.availableNamesFile
        );
        Sigs.connect(
          __sig__.availableNamesDone, gui, gui.initMenus
        );

        // load bus dataset
        Sigs.connect(
          __sig__.loadDataSet, dat, dat.loadDataSetFile
        );
        Sigs.connect(
          __sig__.loadDataSetDone, bus.map, bus.map.initBus
        );
        Sigs.connect(
          __sig__.loadDataSetDoneNoRender, bus.map, bus.map.initBusNoRender
        );

        // update FunctionView
        Sigs.connect(
          __sig__.loadFunctionView, bus.map, bus.map.initFunctionView
        );
    };

    // public API
    exports.run = function(){
        // Connects slots and signals.
        connectSlots();
        // creates the map
        bus.map.createMap();
        // gets available json
        gui.loadAvailableNames();
    };

    // API return
    return exports;
};

// Main
window.onload = function() {
    var mlbApp = bus.Main();
    mlbApp.run();
};