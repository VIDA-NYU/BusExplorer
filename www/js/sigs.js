/**
#
# DOT Time Tool, based on Pluto data viewer
#
*/

var Sigs = (function() {
    // layers available on server
    __sig__.availableNames = function() {};
    __sig__.availableNamesDone = function() {};

    // load layer signals
    __sig__.loadDataSet = function(render) {};
    __sig__.loadDataSetDone = function() {};
    __sig__.loadDataSetDoneNoRender = function() {};

    // update function view
    __sig__.loadFunctionView = function() {};

    var pub = {};
    // Connects signals to slots.
    // e.g. SigSlots.connect(__sig__.eventHappened, myObject, myObject.onEventHappened);
    pub.connect = function(signal, slotInstance, slotMethod) {
        __sig__.connect( __sig__, signal, slotInstance, slotMethod);
    };

    return pub;
}());
