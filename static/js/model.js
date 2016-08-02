
window.WH = window.WH || {};

(function (ns) {
    
    function createModel(specs) {
        
        var that = specs.that,
            patterns = [],
            
            /** 
             * Create a new pattern data object.
             */
            createPattern = function(specs) {
                var ptrn = {
                    x: specs.x || 0,
                    y: specs.y || 0,
                    x: specs.z || 0,
                    position3d: specs.position3d || null,
                    object3d: null
                };
                
                if (ptrn.position3d) {
                    ptrn.x = ptrn.position3d.x;
                    ptrn.y = ptrn.position3d.y;
                    ptrn.z = ptrn.position3d.z;
                }
                
                patterns.push(ptrn);
            },
            
            /**
             * @return {array} All pattern data.
             */
            getPatterns = function() {
                return patterns;
            };
            
        that.createPattern = createPattern;
        that.getPatterns = getPatterns;
        return that;
    }

    ns.createModel = createModel;

})(WH);
