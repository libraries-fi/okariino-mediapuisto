(function() {
  "use strict";

  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
    });
  };

  String.prototype.pad = function(len, pad, dir) {
    var str = this;
    var STR_PAD_LEFT  = 1;
    var STR_PAD_RIGHT = 2;

    if (typeof(len) == "undefined") { var len = 0; }
    if (typeof(pad) == "undefined") { var pad = ' '; }
    if (typeof(dir) == "undefined") { var dir = STR_PAD_RIGHT; }

    if (len + 1 >= str.length) {
      switch (dir) {
        case STR_PAD_LEFT:
          str = Array(len + 1 - str.length).join(pad) + str;
          break;

        default:
          str = str + Array(len + 1 - str.length).join(pad);
      }
    }

    return str;
  };

  Math.randomInt = function(min, max) {
    var r = Math.random();
    var range = max - (min ? min : 0);

    if (max) {
      r *= range;
    }

    if (min) {
      r += min;
    }

    return Math.round(r);
  };

  Object.defineProperty(Array.prototype, 'shuffle', {
    value: function() {
      for (var i = 0; i < this.length; i++) {
        var a = Math.ceil(Math.random() * this.length - 1);
        this.swap(a, i);
      }
      return this;
    }
  });

  Object.defineProperty(Array.prototype, 'swap', {
    value: function (a, b) {
      var tmp = this[a];
      this[a] = this[b]
      this[b] = tmp;
    }
  });
}());
