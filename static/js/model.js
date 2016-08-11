
window.WH = window.WH || {};

(function (ns) {
    
    function createModel(specs) {
        
        var that = specs.that,
            patterns = [],
            selectedPattern = null,
            
            /** 
             * Create a new pattern data object.
             * @param {object} specs Pattern settings.
             * @return {object} The created pattern object.
             */
            createPattern = function(specs) {
                var ptrn = {
                        // euclidean settings
                        steps: specs.steps || 16,
                        pulses: specs.pulses || 4,
                        rotation: specs.rotation || 0,
                        euclidPattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                        
                        object3d: specs.object3d || null,
                        centreCircle3d: specs.centreCircle3d || null,
                        select3d: specs.select3d || null,
                        centreDot3d: specs.centreDot3d || null,
                        pointer3d: specs.pointer3d || null,
                        dots3d: specs.dots3d || null,
                        position3d: specs.position3d || null,
                        
                        // position and duration within the pattern
                        position: specs.position || 0,
                        lastPosition: specs.position || 0,
                        duration: specs.duration || 1600,
                        
                        pulseDuration: 50,
                        
                        pulseStartTimes: [],
                        pulseNextIndex: 0,
                        pulseIndex: 0,
                        isNoteOn: false,
                        
                        isSelected: false,
                        isOn: false
                    };
                
                // set properties
                var nowPosition = Date.now() % ptrn.duration,
                    startTime,
                    isFound = false;
                for (var i = 0; i < ptrn.euclidPattern.length; i++) {
                    if (ptrn.euclidPattern[i]) {
                        startTime = (i / ptrn.euclidPattern.length) * ptrn.duration;
                        ptrn.pulseStartTimes.push({
                            index: i,
                            time: startTime
                        });
                        if (startTime > nowPosition && !isFound) {
                            ptrn.pulseNextIndex = ptrn.pulseStartTimes.length - 1;
                            isFound = true;
                        }
                    }
                }
                
                patterns.push(ptrn);
                
                return ptrn;
            },
            
            /**
             * Update the pattern's playback positions.
             * @param {number} now Current time in ms.
             */
            update = function(now) {
                var i, ptrn, n = patterns.length,
                    nextStartTime;
                    
                for (i = 0; i < n; i++) {
                    ptrn =  patterns[i];
                    ptrn.position = now % ptrn.duration;
                    
                    // if a not went on in the previous update, remove that marker
                    if (ptrn.isNoteOn) {
                        ptrn.isNoteOn = false;
                    }
                    
                    // set index of the next pulse to play
                    nextStartTime = ptrn.pulseStartTimes[ptrn.pulseNextIndex].time;
                    if ((ptrn.position >= nextStartTime && ptrn.lastPosition < nextStartTime) ||
                        (ptrn.position < ptrn.lastPosition && ptrn.position > nextStartTime)) {
                        ptrn.isNoteOn = true;
                        ptrn.pulseIndex = ptrn.pulseNextIndex;
                        ptrn.pulseNextIndex = (ptrn.pulseNextIndex + 1) % ptrn.pulseStartTimes.length;
                    }
                    
                    ptrn.lastPosition = ptrn.position;
                }
            },
            
            /**
             * Select pattern by the value of one of its properties.
             * @return {boolean} True if exists and differs from the previous.
             */
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
