
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
            wheel,
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
                    i, vector, raycaster, intersects, intersected, wheel;
                
                vector = new THREE.Vector3();
                vector.set(vpX, vpY, 0.5);
                vector.unproject(camera);
                
                // ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());
                raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
                intersects = raycaster.intersectObjects(scene.children, true);
                
                if (intersects.length) {
                    intersected = intersects[0];
                    wheel = getOuterParentObject(intersected);
                    console.log('touchstart', intersected.object.name, wheel.name);
                }
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
                
                wheel = createWheel();
                
                // render it
                renderer.render(scene, camera);
            },
            
            createWheel = function() {
                var wheel = new THREE.Object3D(),
                    hitarea = createShapeCircle(),
                    circle = createLineCircle(),
                    selectCircle = circle.clone();
                
                wheel.name = 'wheel';
                hitarea.name = 'hitarea';
                circle.name = 'circle';
                
                selectCircle.scale.set(0.5, 0.5, 1);
                selectCircle.visible = false;
                selectCircle.name = 'select';
                    
                wheel.add(hitarea);
                wheel.add(circle);
                wheel.add(selectCircle);
                return wheel;
            },
            
            createShapeCircle = function() {
                var radius = 10,
                    numSegments = 8,
                    material = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        transparent: true
                    }),
                    circleGeometry = new THREE.CircleGeometry(radius, numSegments);              
                material.opacity = 0.01;
                return new THREE.Mesh( circleGeometry, material );
            },
            
            createLineCircle = function() {
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
             * Recursive function to get top level object of a group.
             * @param {object} object3d An Three.js Object3D.
             */
            getOuterParentObject = function(object3d) {
                if (object3d.object && object3d.object.parent) {
                    return getOuterParentObject(object3d.object.parent);
                }
                return object3d;
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
                        object3d = wheel.clone();
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
