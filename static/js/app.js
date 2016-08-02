/**
 * @description Test for UI in WebGL canvas.
 * @author Wouter Hisschemöller
 * @version 0.1.0
 */

'use strict';

window.WH = window.WH || {};

/**
 * Application startup.
 */
document.addEventListener('DOMContentLoaded', function(e) {
    var canvas3d = {},
        model = {};
    
    WH.createModel({
        that: model
    });
    WH.createCanvas3d({
        that: canvas3d,
        model: model
    });
});
