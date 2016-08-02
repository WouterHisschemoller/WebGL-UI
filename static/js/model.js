
window.WH = window.WH || {};

(function (ns) {
    
    function createModel(specs) {
        
        var that = specs.that,
            patterns = [],
            selectedPattern = null,
            
            /** 
             * Create a new pattern data object.
             */
            createPattern = function(specs) {
                var ptrn = {
                    x: specs.x || 0,
                    y: specs.y || 0,
                    x: specs.z || 0,
                    position3d: specs.position3d || null,
                    object3d: null,
                    isSelected: false
                };
                
                if (ptrn.position3d) {
                    ptrn.x = ptrn.position3d.x;
                    ptrn.y = ptrn.position3d.y;
                    ptrn.z = ptrn.position3d.z;
                }
                
                patterns.push(ptrn);
            },
            
            setSelectedPatternByProperty = function(propKey, propValue) {
                var i, ptrn, n = patterns.length;
                for (i = 0; i < n; i++) {
                    ptrn =  patterns[i];
                    if (ptrn[propKey] === propValue) {
                        if (ptrn !== selectedPattern) {
                            if (selectedPattern) {
                                selectedPattern.isSelected = false;
                            }
                            selectedPattern = ptrn;
                            selectedPattern.isSelected = true;
                            return true;
                        }
                        return false;
                    }
                }
            },
            
            /**
             * @return {array} All pattern data.
             */
            getPatterns = function() {
                return patterns;
            };
            
        that.createPattern = createPattern;
        that.setSelectedPatternByProperty = setSelectedPatternByProperty;
        that.getPatterns = getPatterns;
        return that;
    }

    ns.createModel = createModel;

})(WH);
