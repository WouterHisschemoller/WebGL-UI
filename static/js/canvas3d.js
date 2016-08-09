
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
            plane,
            mouse = new THREE.Vector2(),
            raycaster = new THREE.Raycaster(),
            intersection = new THREE.Vector3(),
            offset = new THREE.Vector3(),
            objects = [],
            dragObject,
            controls,
            INTERSECTED,
            isTouchDevice = 'ontouchstart' in document.documentElement,
            isDirty = false,
            doubleClickCounter = 0,
            doubleClickDelay = 300,
            doubleClickTimer,
            TWO_PI = Math.PI * 2,
        
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
                renderer.domElement.addEventListener(eventType.move, dragMove);
                renderer.domElement.addEventListener(eventType.end, dragEnd);
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
                        doubleClickCounter = 0;
                        // implement single click behaviour here
                    }, doubleClickDelay);
                } else {
                    clearTimeout(doubleClickTimer);
                    doubleClickCounter = 0;
                    // implement double click behaviour here
                    onDoubleClick(e);
                }
            },
            
            /**
             * Start dragging a pattern.
             */
            onTouchStart = function(e) {
                var intersects, outerObject;
                // update picking ray.
                updateMouseRay(e);
                // get intersected objects
                intersects = raycaster.intersectObjects(objects, true);
                // select first wheel in the intersects
                if (intersects.length) {
                    // get topmost parent of closest object
                    outerObject = getOuterParentObject(intersects[0]);
                    isDirty = model.setSelectedPatternByProperty('object3d', outerObject);
                    dragStart(outerObject, mouse);
                }
            },
            
            /**
             * Handler for the custom doubleclick event detection.
             * Create a new pattern at the location of the doubleclick.
             */
            onDoubleClick = function(e) {
                // update picking ray.
                updateMouseRay(e);
                // if ray intersects plane, store point in vector 'intersection'
                if (raycaster.ray.intersectPlane(plane, intersection)) {
                    // create a new wheel 3D object
                    createWheelAndPattern(intersection);
                    isDirty = true;
                }
            },
            
            /**
             * Initialise object dragging.
             * @param {object} object3d The Object3D to be dragged.
             */
            dragStart = function(object3d, mouse) {
                dragObject = object3d;
                // update the picking ray with the camera and mouse position
                raycaster.setFromCamera(mouse, camera);
                // if ray intersects plane, store point in vector 'intersection'
                if (raycaster.ray.intersectPlane(plane, intersection)) {
                    // offset is the intersection point minus object position,
                    // so distance from object to mouse
                    offset.copy(intersection).sub(object3d.position);
                    containerEl.style.cursor = 'move';
                    controls.enabled = false;
                }
            },
            
            dragMove = function(e) {
                e.preventDefault();
                // update picking ray.
                updateMouseRay(e);
                // if ray intersects plane, store point in vector 'intersection'
                if (dragObject) {
                    if (raycaster.ray.intersectPlane(plane, intersection)) {
                        dragObject.position.copy(intersection.sub(offset));
                        isDirty = true;
                    }
                    return;
                }
                
                // when not dragging
                var intersects = raycaster.intersectObjects(objects, true);
                if (intersects.length > 0) {
                    if (INTERSECTED != intersects[0].object) {
                        INTERSECTED = intersects[0].object;
                        // i don't understand this. set the plane based on 
                        //   1. where the camera is pointing to
                        //   2. the object under the mouse
                        // plane.setFromNormalAndCoplanarPoint(
                        //     camera.getWorldDirection(plane.normal),
                        //     INTERSECTED.position);
                    }
                    containerEl.style.cursor = 'pointer';
                } else {
                    INTERSECTED = null;
                    containerEl.style.cursor = 'auto';
                }
            },
            
            dragEnd = function(e) {
                e.preventDefault();
                if (INTERSECTED) {
                    dragObject = null;
                }
                containerEl.style.cursor = 'auto';
                controls.enabled = true;
            },
            
            /**
             * Create a new wheel mesh in the 3D world and  
             * tell the model to create a pattern.
             * @param {object} position3d Vector3 position in the world.
             */
            createWheelAndPattern = function(position3d) {
                var object3d = wheel.clone();
                object3d.position.copy(position3d);
                scene.add(object3d);
                objects.push(object3d);
                // create a new pattern at the found position
                model.createPattern({
                    object3d: object3d,
                    pointer3d: object3d.getObjectByName('pointer'),
                    position3d: position3d,
                    duration: 1000 + Math.floor(Math.random() * 1000)
                });
                model.setSelectedPatternByProperty('object3d', object3d);
            },
            
            /**
             * Initialise the WebGL 3D world.
             */
            initWorld = function() {
                var light,
                    lineMaterial;
                
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
                
				controls = new THREE.TrackballControls(camera);
				controls.rotateSpeed = 1.0;
				controls.zoomSpeed = 1.2;
				controls.panSpeed = 0.8;
				controls.noZoom = false;
				controls.noPan = false;
				controls.staticMoving = true;
				controls.dynamicDampingFactor = 0.3;
                
                plane = new THREE.Plane();
                plane.setFromNormalAndCoplanarPoint(
                    camera.getWorldDirection(plane.normal), 
                    new THREE.Vector3(0,0,0));
                    
                lineMaterial = new THREE.LineBasicMaterial({
                    color: 0xeeeeee,
                    linewidth: 3
                });
                
                wheel = createWheel(lineMaterial);
                
                // render world
                isDirty = true;
            },
            
            /**
             * Create combined Object3D of wheel.
             * @param {object} lineMaterial Default line drawing material.
             * @return {object} Object3D of drag plane.
             */
            createWheel = function(lineMaterial) {
                var hitarea = createShapeCircle(),
                    circle = createLineCircle(lineMaterial),
                    pointer = createPointer(lineMaterial),
                    selectCircle = circle.clone();
                
                circle.name = 'circle';
                circle.scale.set(0.3, 0.3, 1);
                
                selectCircle.name = 'select';
                selectCircle.scale.set(0.2, 0.2, 1);
                selectCircle.visible = false;
                
                pointer.name = 'pointer';
                
                hitarea.name = 'hitarea';
                hitarea.add(circle);
                hitarea.add(selectCircle);
                hitarea.add(pointer);
                return hitarea;
            },
            
            createShapeCircle = function() {
                var radius = 10,
                    numSegments = 8,
                    material = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        transparent: true
                    }),
                    geometry = new THREE.CircleGeometry(radius, numSegments);              
                material.opacity = 0.01;
                return new THREE.Mesh( geometry, material );
            },
            
            /**
             * 
             * @param {object} lineMaterial Default line drawing material.
             */
            createLineCircle = function(lineMaterial) {
                var radius = 10,
                    numSegments = 64,
                    geometry = new THREE.CircleGeometry(radius, numSegments);
                
                geometry.vertices.shift();
                return new THREE.Line(geometry, lineMaterial);
            },
            
            /**
             * 
             * @param {object} lineMaterial Default line drawing material.
             * @return {object} Line 3D object.
             */
            createPointer = function(lineMaterial) {
                var line, 
                    geometry = new THREE.Geometry();
                geometry.vertices.push(
                	new THREE.Vector3(-2.9, 0.7, 0),
                	new THREE.Vector3(0, 8, 0),
                	new THREE.Vector3(2.9, 0.7, 0)
                );
                line = new THREE.Line(geometry, lineMaterial);
                return line;
            },
            
            /**
             * Recursive function to get top level object of a group.
             * @param {object} object3d An Three.js Object3D.
             */
            getOuterParentObject = function(object3d) {
                if (object3d.object && object3d.object.parent && object3d.object.parent.type !== 'Scene') {
                    return getOuterParentObject(object3d.object.parent);
                }
                if (object3d.object) {
                    return object3d.object;
                }
                return object3d;
            },
            
            /**
             * Set a raycaster's ray to point from the camera to the mouse postion.
             * @param {event} mouseEvent Event rom which to get the mouse coordinates.
             */
            updateMouseRay = function(mouseEvent) {
                // update mouse vector with mouse coordinated translated to viewport
                mouse.x = ((mouseEvent.clientX - canvasRect.left) / canvasRect.width ) * 2 - 1;
				mouse.y = - ((mouseEvent.clientY - canvasRect.top) / canvasRect.height ) * 2 + 1;
                // update the picking ray with the camera and mouse position
                raycaster.setFromCamera(mouse, camera);
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
                    ptrn.object3d.getObjectByName('select').visible = ptrn.isSelected;
                    ptrn.pointer3d.rotation.z = TWO_PI * (-ptrn.position / ptrn.duration);
                }
            },
            
            /**
             * Run clock and watch for redraw requests.
             */
            run = function() {
                model.update(Date.now());
                // if (isDirty) {
                    // isDirty = false;
                    draw();
                // }
                controls.update();
                renderer.render(scene, camera);
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
