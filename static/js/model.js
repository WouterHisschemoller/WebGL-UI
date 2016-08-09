
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
                    // euclidean settings
                    steps: specs.steps || 16,
                    pulses: specs.pulses || 4,
                    rotation: specs.rotation || 0,
                    euclidPattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                    
                    object3d: specs.object3d || null,
                    pointer3d: specs.pointer3d || null,
                    position3d: specs.position3d || null,
                    
                    // position and duration within the pattern
                    position: specs.position || 0,
                    duration: specs.duration || 1000,
                    
                    isSelected: false
                };
                
                patterns.push(ptrn);
            },
            
            /**
             * 
             */
            update = function(now) {
                var i, ptrn, n = patterns.length;
                for (i = 0; i < n; i++) {
                    ptrn =  patterns[i];
                    ptrn.position = now % ptrn.duration;
                }
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
        that.update = update;
        that.setSelectedPatternByProperty = setSelectedPatternByProperty;
        that.getPatterns = getPatterns;
        return that;
    }

    ns.createModel = createModel;

})(WH);
