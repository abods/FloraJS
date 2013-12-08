/*global Burner, document, clearInterval, setInterval */
/**
 * Creates a new Mover. All Flora elements extend Mover.
 *
 * @constructor
 * @extends Burner.Item
 *
 * @param {Object} [opt_options=] A map of initial properties.
 */
function Mover(opt_options) {
  var options = opt_options || {};
  options.name = options.name || 'Mover';
  Burner.Item.call(this, options);
}
Utils.extend(Mover, Burner.Item);

/**
 * Initializes an instance.
 *
 * @param {Object} [opt_options=] A map of initial properties.
 * @param {number} [opt_options.width = 10] Width
 * @param {number} [opt_options.height = 10] Height
 * @param {string|Array} [opt_options.color = 255, 255, 255] Color.
 * @param {number} [opt_options.angle = 0] Angle
 * @param {boolean} [opt_options.pointToDirection = true] If true, object will point in the direction it's moving.
 * @param {boolean} [opt_options.draggable = false] If true, object can move via drag and drop.
 * @param {Object} [opt_options.parent = null] A parent object. If set, object will be fixed to the parent relative to an offset distance.
 * @param {boolean} [opt_options.pointToParentDirection = false] If true, object points in the direction of the parent's velocity.
 * @param {number} [opt_options.offsetDistance = 30] The distance from the center of the object's parent.
 * @param {number} [opt_options.offsetAngle = 0] The rotation around the center of the object's parent.
 * @param {function} [opt_options.beforeStep = null] A function to run before the step() function.
 * @param {function} [opt_options.afterStep = null] A function to run after the step() function.
 */
Mover.prototype.init = function(options) {

  //this.width = typeof options.width === 'undefined' ? 20 : options.width;
  //this.height = typeof options.height === 'undefined' ? 20 : options.height;
  this.color = options.color || [255, 255, 255];
  //this.motorSpeed = options.motorSpeed || 0;
  //this.angle = options.angle || 0;
  this.pointToDirection = typeof options.pointToDirection === 'undefined' ? true : options.pointToDirection;
  this.draggable = !!options.draggable;
  this.parent = options.parent || null;
  this.pointToParentDirection = !!options.pointToParentDirection;
  this.offsetDistance = typeof options.offsetDistance === 'undefined' ? 30 : options.offsetDistance;
  this.offsetAngle = options.offsetAngle || 0;
  this.beforeStep = options.beforeStep || null;
  this.afterStep = options.afterStep || null;

  //

  this.isMouseOut = false;
  this.isPressed = false;

  var mouseover = (function (me) {
    return (function(e) {
      me.mouseover(e, me);
    });
  })(this);

  var mousedown = (function (me) {
    return (function(e) {
      me.mousedown(e, me);
    });
  })(this);

  var mousemove = (function (me) {
    return (function(e) {
      me.mousemove(e, me);
    });
  })(this);

  var mouseup = (function (me) {
    return (function(e) {
      me.mouseup(e, me);
    });
  })(this);

  var mouseout = (function (me) {
    return (function(e) {
      me.mouseout(e, me);
    });
  })(this);

  if (this.draggable) {
    Utils.addEvent(this.el, 'mouseover', mouseover);
    Utils.addEvent(this.el, 'mousedown', mousedown);
    Utils.addEvent(this.el, 'mousemove', mousemove);
    Utils.addEvent(this.el, 'mouseup', mouseup);
    Utils.addEvent(this.el, 'mouseout', mouseout);
  }
};

Mover.prototype.mouseover = function(e) {
  this.isMouseOut = false;
  clearInterval(this.mouseOutInterval);
};

Mover.prototype.mousedown = function(e) {

  var touch, target = e.target || e.srcElement; // <= IE* uses srcElement

  if (e.changedTouches) {
    touch = e.changedTouches[0];
  }

  if (e.pageX && e.pageY) {
    this.offsetX = e.pageX - target.offsetLeft;
    this.offsetY = e.pageY - target.offsetTop;
  } else if (e.clientX && e.clientY) {
    this.offsetX = e.clientX - target.offsetLeft;
    this.offsetY = e.clientY - target.offsetTop;
  } else if (touch) {
    this.offsetX = touch.pageX - target.offsetLeft;
    this.offsetY = touch.pageY - target.offsetTop;
  }

  this.isPressed = true;
  this.isMouseOut = false;
};

/**
 * Called by a mousemove event listener.
 *
 * @param {Object} e The event object passed by the listener.
 */
Mover.prototype.mousemove = function(e) {

  var x, y, touch;

  if (this.isPressed) {

    this.isMouseOut = false;

    if (e.changedTouches) {
      touch = e.changedTouches[0];
    }

    if (e.pageX && e.pageY) {
      x = e.pageX - this.world.el.offsetLeft;
      y = e.pageY - this.world.el.offsetTop;
    } else if (e.clientX && e.clientY) {
      x = e.clientX - this.world.el.offsetLeft;
      y = e.clientY - this.world.el.offsetTop;
    } else if (touch) {
      x = touch.pageX - this.world.el.offsetLeft;
      y = touch.pageY - this.world.el.offsetTop;
    }

    if (Utils.mouseIsInsideWorld(this.world)) {
      this.location = new Burner.Vector(x, y);
    } else {
      this.isPressed = false;
    }
  }
};

/**
 * Called by a mouseup event listener.
 *
 * @param {Object} e The event object passed by the listener.
 */
Mover.prototype.mouseup = function(e) {
  this.isPressed = false;
};

/**
 * Called by a mouseout event listener.
 *
 * @param {Object} e The event object passed by the listener.
 * @param {Object} obj The object associated with the event target.
 */
Mover.prototype.mouseout = function(e, obj) {



  var me = obj, mouse = Burner.System.mouse,
      x, y;

  if (obj.isPressed) {

    obj.isMouseOut = true;

    obj.mouseOutInterval = setInterval(function () { // if mouse is too fast for block update, update via an interval until it catches up

      if (me.isPressed && me.isMouseOut) {

        x = mouse.location.x - me.world.el.offsetLeft;
        y = mouse.location.y - me.world.el.offsetTop;

        me.location = new Burner.Vector(x, y);
      }
    }, 16);
  }
};

/**
 * Calculates location via sum of acceleration + velocity.
 *
 * @returns {number} The total number of times step has been executed.
 */
Mover.prototype.step = function() {

  var friction, r, theta, x, y;

  var i, max, attractors = Burner.System._caches.Attractor,
      repellers = Burner.System._caches.Repeller,
      draggers = Burner.System._caches.Dragger;

  if (this.beforeStep) {
    this.beforeStep.apply(this);
  }

  if (!this.isStatic && !this.isPressed) {

    // start apply forces

    if (this.world.c) { // friction
      friction = Utils.clone(this.velocity);
      friction.mult(-1);
      friction.normalize();
      friction.mult(this.world.c);
      this.applyForce(friction);
    }
    this.applyForce(this.world.gravity); // gravity

    if (attractors && attractors.list.length > 0) { // attractor
      for (i = 0, max = attractors.list.length; i < max; i += 1) {
        if (this.id !== attractors.list[i].id) {
          this.applyForce(attractors.list[i].attract(this));
        }
      }
    }

    if (repellers && repellers.list.length > 0) { // repeller
      for (i = 0, max = repellers.list.length; i < max; i += 1) {
        if (this.id !== repellers.list[i].id) {
          this.applyForce(repellers.list[i].attract(this));
        }
      }
    }

    if (draggers && draggers.list.length > 0) { // liquid
      for (i = 0, max = draggers.list.length; i < max; i += 1) {
        if (this.id !== draggers.list[i].id && Utils.isInside(this, draggers.list[i])) {
          this.applyForce(draggers.list[i].drag(this));
        }
      }
    }

    if (this.applyForces) { // !! rename this
      this.applyForces();
    }

    // end apply forces

    this.velocity.add(this.acceleration); // add acceleration

    this.velocity.limit(this.maxSpeed, this.minSpeed);

    this.location.add(this.velocity); // add velocity
    if (this.pointToDirection) { // object rotates toward direction
      if (this.velocity.mag() > 0.1) {
        this.angle = Utils.radiansToDegrees(Math.atan2(this.velocity.y, this.velocity.x));
      }
    }
  }

  if (this.controlCamera) { // check camera after velocity/location calculation
    this._checkCameraEdges();
  }

  if (this.checkWorldEdges) {
    this._checkWorldEdges();
  }

  if (this.parent) { // parenting

    if (this.offsetDistance) {

      r = this.offsetDistance; // use angle to calculate x, y
      theta = Utils.degreesToRadians(this.parent.angle + this.offsetAngle);
      x = r * Math.cos(theta);
      y = r * Math.sin(theta);

      this.location.x = this.parent.location.x;
      this.location.y = this.parent.location.y;
      this.location.add(new Burner.Vector(x, y)); // position the child

      if (this.pointToParentDirection) {
        this.angle = Utils.radiansToDegrees(Math.atan2(this.parent.velocity.y, this.parent.velocity.x));
      }

    } else {
      this.location = this.parent.location;
    }
  }

  this.acceleration.mult(0);

  if (this.life < this.lifespan) {
    this.life += 1;
  } else if (this.lifespan !== -1) {
    Burner.System.destroyItem(this);
  }

  if (this.afterStep) {
    this.afterStep.apply(this);
  }
};

/**
 * Calculates a steering force to apply to an object seeking another object.
 *
 * @param {Object} target The object to seek.
 * @returns {Object} The force to apply.
 * @private
 */
/*Mover.prototype._seek = function(target) {

  var world = this.world,
    desiredVelocity = Burner.Vector.VectorSub(target.location, this.location),
    distanceToTarget = desiredVelocity.mag();

  desiredVelocity.normalize();

  if (distanceToTarget < world.bounds[1] / 2) { // slow down to arrive at target
    var m = Utils.map(distanceToTarget, 0, world.bounds[1] / 2, 0, this.maxSpeed);
    desiredVelocity.mult(m);
  } else {
    desiredVelocity.mult(this.maxSpeed);
  }

  desiredVelocity.sub(this.velocity);
  desiredVelocity.limit(this.maxSteeringForce);

  return desiredVelocity;
};*/

/**
 * Checks if object is within range of a world edge. If so, steers the object
 * in the opposite direction.
 * @private
 */
/*Mover.prototype._checkAvoidEdges = function() {

  var maxSpeed, desiredVelocity;

  if (this.location.x < this.avoidWorldEdgesStrength) {
    maxSpeed = this.maxSpeed;
  } else if (this.location.x > this.world.bounds[1] - this.avoidWorldEdgesStrength) {
    maxSpeed = -this.maxSpeed;
  }
  if (maxSpeed) {
    desiredVelocity = new Burner.Vector(maxSpeed, this.velocity.y);
    desiredVelocity.sub(this.velocity);
    desiredVelocity.limit(this.maxSteeringForce);
    this.applyForce(desiredVelocity);
  }

  if (this.location.y < this.avoidWorldEdgesStrength) {
    maxSpeed = this.maxSpeed;
  } else if (this.location.y > this.world.bounds[2] - this.avoidWorldEdgesStrength) {
    maxSpeed = -this.maxSpeed;
  }
  if (maxSpeed) {
    desiredVelocity = new Burner.Vector(this.velocity.x, maxSpeed);
    desiredVelocity.sub(this.velocity);
    desiredVelocity.limit(this.maxSteeringForce);
    this.applyForce(desiredVelocity);
  }
};*/

/**
 * Calculates a force to apply to simulate drag on an object.
 *
 * @param {Object} target The object that is applying the drag force.
 * @returns {Object} A force to apply.
 */
/*Mover.prototype._drag = function(target) {

  var speed = this.velocity.mag(),
    dragMagnitude = -1 * target.c * speed * speed, // drag magnitude
    drag = Utils.clone(this.velocity);

  drag.normalize(); // drag direction
  drag.mult(dragMagnitude);

  return drag;
};*/

/**
 * Calculates a force to apply to simulate attraction on an object.
 *
 * @param {Object} attractor The attracting object.
 * @returns {Object} A force to apply.
 */
/*Mover.prototype._attract = function(attractor) {

  var force = Burner.Vector.VectorSub(attractor.location, this.location),
    distance, strength;

  distance = force.mag();
  distance = Utils.constrain(
      distance,
      this.width * this.height,
      attractor.width * attractor.height); // min = the size of this mover; max = the size of the attractor
  force.normalize();

  // strength is proportional to the mass of the objects and their proximity to each other
  strength = (attractor.G * attractor.mass * this.mass) / (distance * distance);
  force.mult(strength);

  return force;
};*/

/**
 * Determines if this object is inside another.
 *
 * @param {Object} container The containing object.
 * @returns {boolean} Returns true if the object is inside the container.
 */
/*Mover.prototype.isInside = function(container) {

  if (container) {
    if (this.location.x + this.width / 2 > container.location.x - container.width / 2 &&
      this.location.x - this.width / 2 < container.location.x + container.width / 2 &&
      this.location.y + this.height / 2 > container.location.y - container.height / 2 &&
      this.location.y - this.height / 2 < container.location.y + container.height / 2) {
      return true;
    }
  }
  return false;
};*/
