
window.WH = window.WH || {};

(function (ns) {
    
    function createCanvas3d(specs) {
        
        var that = specs.that,
            model = specs.model,
            containerEl = document.getElementById('container-webgl'),
            canvasRect,
            renderer,
            scene,
            camera,
            circle,
            isDirty = false,
            doubleClickCounter = 0,
            doubleClickDelay = 300,
            doubleClickTimer,
            isTouchDevice = 'ontouchstart' in document.documentElement,
        
            /**
             * Type of events to use, touch or mouse
             * @type {String}
             */
            eventType = {
                start: isTouchDevice ? 'touchstart' : 'mousedown',
                end: isTouchDevice ? 'touchend' : 'mouseup',
                click: isTouchDevice ? 'touchend' : 'click',
                move: isTouchDevice ? 'touchmove' : 'mousemove',
            },
            
            /**
             * Initialise DOM events for click, drag etcetera.
             */
            initDOMEvents = function() {
                renderer.domElement.addEventListener(eventType.click, onClick);
                renderer.domElement.addEventListener(eventType.start, onTouchStart);
                // prevent system doubleclick to interfere with the custom doubleclick
                renderer.domElement.addEventListener('dblclick', function(e) {e.preventDefault();});
            },
            
            /**
             * Separate click and doubleclick.
             * @see http://stackoverflow.com/questions/6330431/jquery-bind-double-click-and-single-click-separately
             */
            onClick = function(e) {
                // separate click from doubleclick
                doubleClickCounter ++;
                if (doubleClickCounter == 1) {
                    doubleClickTimer = setTimeout(function() {
                        // single click
                        doubleClickCounter = 0;
                        // not used yet
                    }, doubleClickDelay);
                } else {
                    // doubleclick
                    clearTimeout(doubleClickTimer);
                    doubleClickCounter = 0;
                    // create new pattern
                    onDoubleClick(e);
                }
            },
            
            /**
             * Start dragging a pattern.
             */
            onTouchStart = function(e) {
                // translate page to canvas to viewport coordinates
                // viewport x and y are from -1.0 to 1.0
                var elX = e.clientX - canvasRect.left,
                    elY = e.clientY - canvasRect.top,
                    vpX = (elX / canvasRect.width) * 2 - 1,
                    vpY = (elY / canvasRect.height) * -2 + 1,
                    vector, raycaster, intersects;
                
                vector = new THREE.Vector3();
                vector.set(vpX, vpY, 0.5);
                vector.unproject(camera);
                
                // ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());
                raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
                intersects = raycaster.intersectObjects(scene.children, false);
                
                console.log('touchstart', scene.children.length, intersects.length);
            },
            
            /**
             * Handler for the custom doubleclick event detection.
             * Create a new pattern at the location of the doubleclick.
             */
            onDoubleClick = function(e) {
                // translate page to canvas to viewport coordinates
                // viewport x and y are from -1.0 to 1.0
                var elX = e.clientX - canvasRect.left,
                    elY = e.clientY - canvasRect.top,
                    vpX = (elX / canvasRect.width) * 2 - 1,
                    vpY = (elY / canvasRect.height) * -2 + 1,
                    vector, direction, distance, position;
                
                // translate viewport to 3D world position at z == 0
                // @see http://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z
                vector = new THREE.Vector3();
                vector.set(vpX, vpY, 0.5);
                vector.unproject(camera);
                
                direction = vector.sub(camera.position).normalize();
                distance = - camera.position.z / direction.z;
                position = camera.position.clone().add(direction.multiplyScalar(distance));
                
                model.createPattern({
                    position3d: position
                });
                isDirty = true;
            },
            
            /**
             * Initialise the WebGL 3D world.
             */
            initWorld = function() {
                var light;
                
                renderer = new THREE.WebGLRenderer({
                    antialias: true
                });
                renderer.setClearColor(0xf9f9f9);
                renderer.setSize(containerEl.offsetWidth, containerEl.offsetHeight);
                containerEl.appendChild(renderer.domElement);
                canvasRect = renderer.domElement.getBoundingClientRect();
                
                scene = new THREE.Scene();
                
                camera = new THREE.PerspectiveCamera(45, containerEl.offsetWidth / containerEl.offsetHeight, 1, 500);
                camera.position.set(0, 0, 80);
                scene.add(camera);
                
                light = new THREE.DirectionalLight(0xffffff, 1.5);
                light.position.set(0, 0, 1);
                scene.add(light);
                
                circle = createShapeCircle();
                
                // render it
                renderer.render(scene, camera);
            },
            
            createShapeCircle = function() {
                var radius = 10,
                    numSegments = 8,
                    material = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        transparent: true
                    }),
                    circleGeometry = new THREE.CircleGeometry(radius, numSegments);              
                material.opacity = 0.1;
                return new THREE.Mesh( circleGeometry, material );
            },
            
            createLineCircle2 = function() {
                var radius = 10,
                    numSegments = 64,
                    material = new THREE.LineBasicMaterial({
                        color: 0xdddddd,
                        linewidth: 3
                    }),
                    geometry = new THREE.CircleGeometry(radius, numSegments);
                
                geometry.vertices.shift();
                return new THREE.Line(geometry, material);
            },
            
            /**
             * Create a line circle
             */
            createLineCircle = function() {
                var geometry,
                    vector,
                    material,
                    circle,
                    radius = 10,
                    numSegments = 120,
                    pointIndex,
                    i, x, y,
                    twoPi = Math.PI * 2;
                
                // create an empty geometry object to hold the line vertex data
                geometry = new THREE.Geometry();
                
                // create points along the circumference of a circle with radius
                for (i = 0; i <= numSegments; i++) {
                    pointIndex = i % numSegments;
                    x = radius * Math.cos((pointIndex / numSegments) * twoPi);
                    y = radius * Math.sin((pointIndex / numSegments) * twoPi);
                    vector = new THREE.Vector3(x, y, 0);
                    geometry.vertices.push(vector);
                }
                
                // create a line material
                material = new THREE.LineBasicMaterial({
                    color: 0xdddddd,
                    linewidth: 3
                });
                
                // create the line circle
                circle = new THREE.Line(geometry, material);
                
                return circle;
            },
            
            /**
             * Redraw all patterns on the canvas.
             */
            draw = function() {
                var patterns = model.getPatterns(),
                    ptrn,
                    object3D,
                    i,
                    numPatterns = patterns.length;
                
                for (i = 0; i < numPatterns; i++) {
                    ptrn = patterns[i];
                    
                    // create new 3D object if it misses
                    if (!ptrn.object3d) {
                        object3d = circle.clone();
                        object3d.position.set(ptrn.x, ptrn.y, ptrn.z);
                        scene.add(object3d);
                        ptrn.object3d = object3d;
                    }
                }
                
                renderer.render(scene, camera);
            },
            
            /**
             * Run clock and watch for redraw requests.
             */
            run = function() {
                if (isDirty) {
                    isDirty = false;
                    draw();
                }
                requestAnimationFrame(run.bind(this));
            };
        
        that = specs.that;

        initWorld();
        initDOMEvents();
        run();

        return that;
    }

    ns.createCanvas3d = createCanvas3d;

})(WH);
