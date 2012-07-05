//TODO:
//  option to specify xml file loc for dzi
//  actually be able to override options hash
//  refactor _addOverlayToDZI

// TODO: check if dependencies are loaded
Array.prototype.peek = function() {
    if (this.length <= 0)
        return undefined;
    return this[this.length - 1];
}

var $ = jQuery.noConflict();

var EUL = {};
EUL.Utils = {};

EUL.Utils.Colors = {
    getColor: function() {
        var self = this;

        if (self.index == self.choices.length)
            self.index = 0;
        val = self.choices[self.index];    
        self.index++;
        return val;
    },
    index : 0,
    choices : [
        "#FF0000", "#00FF00", "#0000FF",
        "#990000", "#009900", "#000099"
    ]
}


EUL.Utils.Polygon = No5.Seajax.Shapes.Polygon;
EUL.Utils.Marker  = No5.Seajax.Shapes.Marker;

EUL.Utils.ClearTemps = function () {
    var temp = $('.temp-point');
    $(temp).remove();
}

EUL.Utils.clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
/**
 *  EUL.OverlayManager constructor
 *
 *
 */
EUL.OverlayManager = function(options) {
    var self = this;
    if (typeof jQuery == 'undefined') {
        alert("MapManager requires jQuery to function.");
        return;
    }
    // options
    self.options = {
        precision : 5,
        map_container : "mapcontainer",
        dzi_path: "/images/map/GeneratedImages/dzc_output.xml",
        edit_mode: false
    }
    jQuery.extend(self.options, options);

    // member vars
    self.viewer = null;
    self.overlays = [];
    self.newOverlays = [];
    self.newOverlayPoints = [];
    self.data = null;
    self.isDirty = false;

    self.viewer = new Seadragon.Viewer(self.options.map_container);
    self.viewer.openDzi(self.options.dzi_path);

    self.points = [];

    // listeners to print data to screen
    self.viewer.addEventListener("open", self._showViewport);
    self.viewer.addEventListener("animation", self._showViewport);
    //Seadragon.Utils.addEvent(self.viewer.elmt, "mousemove", self.showMouse);
    // listener to add click points to img
    var tempMarker = null;
    self.viewer.tracker.clickHandler = function(tracker, position) {
        if (!self.options.edit_mode)
            return;
        var pixel = Seadragon.Utils.getMousePosition(self.event).minus(Seadragon.Utils.getElementPosition(self.viewer.elmt));
        var point = self.viewer.viewport.pointFromPixel(pixel);
        
        if (!self.points) {self.points = new Array();}

        var newPoint = new No5.Seajax.toImageCoordinates(self.viewer, point.x, point.y);

        self.points.push(newPoint);

        var img = document.createElement("img");
        img.src = "/wp-content/themes/viewsofrome-theme/images/point_marker.gif";
        img.className = 'temp-point';
        
        // $(point.img).addClass('temp-point');
        var anchor = new Seadragon.Point(point.x, point.y);
        var placement = Seadragon.OverlayPlacement.CENTER;
        self.viewer.drawer.addOverlay(img, anchor, placement);
    }
}

EUL.OverlayManager.prototype.showMouse = function(event) {
    var self = this;
    self.event = event;
}

EUL.OverlayManager.prototype.getViewer = function() {
    var self = this;
    return self.viewer;
}

EUL.OverlayManager.prototype.getData = function() {
    var self = this;

    return self.data;
}

EUL.OverlayManager.prototype.serializeOverlays = function() {
    var self = this;

    var tempData = [];
    for (var i = 0; i < self.newOverlays.length; i++) {
        tempData.push(self.newOverlays[i].getPointsJSON());
    }

    return tempData;
}

EUL.OverlayManager.prototype.reloadData = function() {
    var self = this;
    // TODO: peform ajax to reload data and init new overlays
    // after destroying old overlays

    self.overlays = []
    /*
    for (i in data) {
        //create overlay from points
        // self.overlays.push(overlay);
    }
    */
}

EUL.OverlayManager.prototype.getNewOverlayFromPoints = function(points) {
    var self = this;

    var viewer = self.viewer; // hack because Seajax uses global viewer for this

    // get the polygon and overlay obects for manipulation
    var polygon = new EUL.Utils.Polygon(points, self.viewer);
    var overlay = new EUL.OverlayManager.Overlay();

    overlay.polygon = polygon;
    overlay.points = points.slice();

    // TODO: look into default classes and adding htem to the dom?
    // set polygon's fill color
    var fillColor = EUL.Utils.Colors.getColor();
    overlay.polygon.getElement().attr({
        "fill" : fillColor, 
        "fill-opacity" : 0.5
    });
    $(overlay.polygon.div).addClass("overlay-div");

    // event handlers for the overlay
    var polyElement = overlay.polygon.getElement();
    polyElement.node.onmouseover = function() {
        polyElement.attr({
            'fill': '#fff'
        });
    }

    polyElement.node.onmouseout = function() {
        polyElement.attr({
            'fill': fillColor
        })
    }

    polyElement.node.onclick = function() {}

    return overlay;
}

EUL.OverlayManager.prototype.addOMDiv = function(overlay) {
    var self = this;
    // container corresponding to current overlay
    var div = $("<div>");
    div.addClass("remove-link");

    // legend to visually associate with an overlay
    var legend = $("<div>");
    legend.css({
        "width" : "20px",
        "height" : "20px",
        "background-color": overlay.polygon.getElement().attr('fill'),
        "opacity": 0.5,
        "float": "left",
        "margin-right": "10px;"
    });
    div.append(legend);

    // actual remove link
    var removeLink = $("<a>");
    removeLink.css({
        "margin": "0 0 0 15px",
        "float": "left"
    });
    removeLink.html("Remove this Overlay");
    removeLink.click(function() {
        self.destroyOverlay(overlay);
        $(div).remove();
    });

    removeLink.hover(overlay.polygon.getElement().node.onmouseover);
    removeLink.mouseout(overlay.polygon.getElement().node.onmouseout);

    div.hover(overlay.polygon.getElement().node.onmouseover);
    div.mouseout(overlay.polygon.getElement().node.onmouseout);

    legend.hover(overlay.polygon.getElement().node.onmouseover);
    legend.mouseout(overlay.polygon.getElement().node.onmouseout);

    div.append(removeLink);
    div.append("<div style='clear:both;'></div>");
    $("#overlay-staging").append(div);
}

EUL.OverlayManager.prototype._addOverlayToDZI = function() {
    var self = this;

    var overlay = self.getNewOverlayFromPoints(self.points);

    // attach overlay to the map
    overlay.polygon.attachTo(self.viewer);

    // push to overlays for serialization
    self.newOverlays.push(overlay);

    self.addOMDiv(overlay);

    setTimeout(function() {
        overlay.polygon.redraw(self.viewer);
    }, 500);

    //clear temp points
    self.points = [];
    $('img.temp-point').each(function(index, item) {
        self.viewer.drawer.removeOverlay(item);
    });
}

EUL.OverlayManager.prototype.addOverlayFromJSON = function() {

}

// TODO: consider moving to Overlay class
EUL.OverlayManager.prototype.destroyOverlay = function(overlay) {
    var self = this;
    // remove overlay
    self.viewer.drawer.removeOverlay(overlay.polygon.div);
}

EUL.OverlayManager.Overlay = function(id, category, points, polygon) {
    var self = this;

    self.id = (id != 'undefined') ? id : null;
    self.category = (category != 'undefined') ? category : null;
    self.points = (points != 'undefined') ? points : null;
    self.polygon = (polygon != 'undefined') ? polygon : null;
}

EUL.OverlayManager.Overlay.prototype.getPointsJSON = function() {
    var self = this;

    var pointsArray = [];
    for (i = 0; i < self.points.length; i++) {
        var temp = {};
        temp.x = self.points[i].x;
        temp.y = self.points[i].y;

        pointsArray.push(temp);
    }
    return pointsArray;
}

EUL.OverlayManager.Overlay.prototype.getPolygon = function() {
    var self = this;
    return self.polygon;
}


