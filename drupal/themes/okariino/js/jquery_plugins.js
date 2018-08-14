/**
 * Move pictures in a circle (no rotation)
 */
(function($) {
  "use strict";

  // Static data
  var GLOBALS = {
    // ID for currently active rotation timer
    timerId: 0,

    // Current angle of rotation
    angle: 0
  };

  /**
   * Position children of a container in a circle around the parent's center.
   *
   * The parent needs to have 'position: relative' set explicitly!
   **/
  $.fn.circularList = function(method) {
    var methods = {
      /**
       * Start animated rotation
       * @param speed Degrees per second (default: 10)
       * @param fps Animation framerate (default: 30)
       **/
      start: function(speed, fps) {
        var delay = 1000 / (fps ? fps : 30);
        var delta = delay/1000 * (speed ? speed : 10);

        if (!GLOBALS.timerId) {
          var step = 0;
          var elem = this;
          var base = GLOBALS.angle;

          var id = setInterval(
            function() {
              var angle = delta * step + base;
              GLOBALS.angle = angle;
              methods.rotate.call(elem, angle);
              step++;
            },
            delay
          );

          GLOBALS.timerId = id;
        }
      },

      /**
       * Pause animated rotation
       **/
      stop: function() {
        if (GLOBALS.timerId) {
          clearInterval(GLOBALS.timerId);
          GLOBALS.timerId = 0;
        }
      },

      /**
       * Toggle animated rotation
       **/
      toggle: function() {
        var m = GLOBALS.timerId > 0 ? 'stop' : 'start';
        methods[m].apply(this, arguments);
      },

      /**
       * Instantly rotate items given amount of degrees
       *
       * Negative numbers rotate CCW
       **/
      rotate: function(deg) {
        var parent = $(this);
        var children = parent.children();
        var total = children.length;
        var r = parent.outerHeight() / 2;
        var two_pi = Math.PI * 2;
        var rad_0 = deg ? deg/360 * two_pi : 0;

        children.each(function(i, item) {
          var rad = two_pi * i/total + rad_0;
          var x = r + Math.cos(rad) * r - $(item).outerWidth()/2;
          var y = r + Math.sin(rad) * r - $(item).outerHeight()/2;

          $(this).css({ position: 'absolute', left: x, top: y });
        });
      }
    };

    if (methods[method]) {
      var args = Array.prototype.slice.call(arguments, 1);

      return this.each(function() {
        methods[method].apply(this, args);
      });
    } else if (!method || typeof method == 'object') {
      return this.each(function(i) {
        methods.rotate.apply(this);
      });
    } else {
      console.warning("Invalid method call");
    }
  }
})(jQuery);

/**
 * JQuery plugin for generating animations from filmstrip-style images
 */
(function($) {
  var FilmStrip = (function() {
    var _defaults = {
      frames: 1,
      delay: 30,
      start: false,
      repeat: false
    };

    var foo = function(container, options) {
      this.container = $(container);
      this.timer_id = 0;

      var delay = this.container.data('delay');
      var states = this.container.data('states');
      var frames = this.container.data('frames');

      if (states && !options.states) {
        states = states.split(/\s*/);
        options.states = [];

        for (var i = 0; i < states.length; i++) {
          options.states.push(parseInt(states[i]));
        }
      }

      if (frames && !options.frames) {
        options.frames = parseInt(frames);
      }

      if (delay && !options.delay) {
        options.delay = parseInt(delay);
      }

      this.container.children('img').css('position', 'relative');
      this.options = $.extend({}, _defaults, options);

      if (this.options.states) {
        this.currentState = 0;
      } else {
        this.currentState = -1;
      }

      if (this.options.start) {
        this.start();
      }
    };

    foo.prototype.start = function(options) {
      var self = this;
      var options = $.extend({}, this.options, options);
      var i = 0;

      this.timer_id = setInterval(
        function() {
          self.frame(i++);
          i = ++i % self.options.frames;

          if (i == 0 && !self.options.repeat) {
            self.stop();
          }
        },
        this.options.delay
      );
    };

    foo.prototype.stop = function() {
      clearInterval(this.timer_id);
    };

    foo.prototype.frame = function(i) {
      var strip = this.container.children('img').first();
      var w = this.container.width();
      var h = this.container.height();
      var x = i * w * -1;

      strip.css('left', x + 'px');
    };

    foo.prototype.state = function(i) {
      if (typeof i == 'undefined') {
        return this.currentState;
      }

      var pos = 0;
      var count = 0;
      var delay = this.options.delay;

      if (i < 0 || i >= this.options.states.length) {
        return;
      }

      $(this.options.states).each(function(key, value) {
        if (key < i) {
          pos += value;
        } else if (key == i) {
          count = value;
          return false;
        }
      });

      var self = this;

      self.timer_id = setInterval(
        function() {
          if (--count <= 0) {
            self.stop();
          }
          self.frame(pos++);
        },
        self.options.delay
      );
    };

    foo.prototype.nextState = function() {
      var i = this.currentState++;
      this.state(i);
    }

    foo.prototype.reset = function() {
      this.frame(0);

      if (self.options.states) {
        this.currentState = 0;
      }
    }

    return foo;
  })();

  var funcs = {
    start: function(anim, options) {
      anim.start(options);
    },
    stop: function(anim) {
      anim.stop();
    },
    frame: function(anim) {
      var i = arguments[0];
      anim.frame(i);
    },
    state: function(anim, i) {
      return anim.state(i);
    },
    nextState : function(anim) {
      anim.nextState();
    },
    reset: function(anim) {
      anim.reset();
    }
  };

  $.fn.filmStrip = function(func, options) {
    if (arguments.length == 1 && typeof(func) == 'object') {
      options = func;
      func = false;
    }

    var value;
    var args = Array.prototype.slice.apply(arguments);

    this.each(function(i, container) {
      var $c = $(container);
      var anim = $c.data('anim');

      if (!anim) {
        opts = typeof(options) == 'object' ? options : {};
        anim = new FilmStrip(container, opts);
        $c.data('anim', anim);
      }

      args[0] = anim;

      if (func) {
        var data = funcs[func](anim, options);

        if (i == 0) {
          value = data;
        }
      }
    });

    if (typeof value == 'undefined') {
      return this;
    } else {
      return value;
    }
  };
})(jQuery);
