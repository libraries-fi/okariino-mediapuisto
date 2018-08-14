
var Racer = null;

(function($) {
  "use strict";

  var LibraryRacing = Okariino.Game.BaseExt.extend({
    name: 'library_racing',
    actions: {
      index: function() {
        this.callState(this, 'play');
      },
      track: function(id) {
        var track = this.data.tracks[id];
        this.callState(this, 'loadTrack', track);
      }
    },
    resources: {
      tracks: 'demo_tracks.json',
      sprites: 'images/sprites.png',
      lr: {
        intro: 'sounds/36 Ohjaa auto perille.ogg',
        success: 'sounds/37 Hienoa pääsit perille.ogg',
      }
    },
    init: function() {
      Okariino.olli.speak('lr/intro');

      this.gameView = new RacingView({
        width: 895,
        height: 483,
        sprites: this.data.sprites,
      });

      this.tracksView = new ChooseTrackView({
        tracks: this.data.tracks,
        url: this.url.bind(this),
      });

      this.board.append(this.gameView.el, this.tracksView.el);
      this.initStates(this.url('index'));

      this.gameView.on('finished', function(state) {
        this.buttons.restart.fadeIn();

        if (state) {
          Okariino.olli.speak('lr/success');
        }
      }, this);
    },
    postInit: function() {
      this.on('initReady', this.play, this);
      this.on('trackLoaded', this.playTrack, this);

      this.on('restartState', function() {
        this.buttons.restart.fadeOut();
        this.gameView.render();
      }, this);

      this.on('closed', function() {
        if (this.gameView) {
          this.gameView.clear();
        }
      });
    },
    play: function() {
      this.tracksView.show();
      this.gameView.clear();
    },
    playTrack: function(track, pixmaps) {
      this.tracksView.$el.fadeOut();
      this.gameView.track = track;
      this.gameView.options.pixmaps = pixmaps;
      this.gameView.render();
      this.gameView.$el.fadeIn();
    },
    loadTrack: function(track) {
      var base_url = '{0}/images'.format(this.root);
      var game = this;
      var data = {};
      var resources = track.pixmaps;

      for (var key in resources) {
        var image = new Image;
        var url = '{0}/{1}'.format(base_url, resources[key]);

        image.dataset.key = key;
        image.src = url;
        image.onload = function() {
          data[this.dataset.key] = this;

          if (Object.keys(data).length == Object.keys(resources).length) {
            game.trigger('trackLoaded', track, data);
          }
        }
      }
    }
  });

  var RacingView = Backbone.View.extend({
    id: 'lbr-racing-view',
    className: 'game-overlay',
    render: function() {
      if (this.racer) {
        this.clear();
      }

      this.racer = new Racer({
        container: this.el.id,
        width: this.options.width,
        height: this.options.height,
        pixmaps: this.options.pixmaps,
        sprites: this.options.sprites,
        start: {
          x: this.track.start.x,
          y: this.track.start.y,
        }
      });

      var game = this.racer;
      var start = $('<a id="lbr-start"></a>');
      this.$el.append('<input id="lbr-fps" type="text"/>');
      this.$el.append(start);

      start.click(function() {
        $(this).fadeOut(function() {
          game.start();
        });
      });

      game.finishCallback = function(state) {
        this.trigger('finished', state);
      }.bind(this);
    },
    clear: function() {
      this.$el.html('');

      if (this.racer) {
        this.racer.destroy();
        delete this.racer;
      }
    }
  });

  var ChooseTrackView = Okariino.Game.View.Base.extend({
    id: 'lbr-tracks-view',
    overlay: true,
    serialize: function() {
      return {
        tracks: this.options.tracks,
        track: this.createUrlHelper('track'),
      }
    }
  });
})(jQuery);

Racer = function(options) {
  this.options = options;
  this.pixmaps = options.pixmaps;
  this.sprites = options.sprites;
  this.stateCache = {};
  this.defs = {
    scale: {
      track: 0.5,
      map: 0.25,
    },
    lives: 3,
    turnSpeed: 800,
    turnAcceleration: 1.3,
    speed: {
      track: 130,
      grass: 80,
    },
    track: {
      width: 300,
      segmentHeight: 40,
      segmentBlock: 10,
    },
    car: {
      width: 60,
      height: 100,
      distance: 40,
      turnMax: Math.PI/8,
    },
    effect: {
      fadeLayers: 133,
    },
    sprites: {
      car: {
        x: 160,
        y: 0,
      },
      carDamage: {
        x: 220,
        y: 0,
      },
      buttonLeft: {
        width: 80,
        height: 100,
        x: 0,
        y: 0,
      },
      buttonRight: {
        x: 80,
        y: 0,
      },
      life: {
        width: 50,
        height: 25,
        x: 280,
        y: 0,
      },
      lifeGone: {
        width: 50,
        height: 25,
        x: 280,
        y: 25,
      }
    }
  };

  this.keyPressListener = function(e) {
    var keymap = {};

    keymap[Racer.Key.Left] = 'turnLeft';
    keymap[Racer.Key.Right] = 'turnRight';
    keymap[Racer.Key.Pause] = 'togglePause';

    var key = e.keyCode;

    if (!keymap[key]) {
      return true;
    }

    e.preventDefault();
    var func = keymap[key];
    this[func].apply(this);
  }.bind(this);

  this.keyReleaseListener = function(e) {
    this.resetTurn();
  }.bind(this);

  document.addEventListener('keydown', this.keyPressListener);
  document.addEventListener('keyup', this.keyReleaseListener);

  delete options.pixmaps;
  this.init();
};

Racer.Curve = {
  Easy: 20,
  Medium: 45,
  Hard: 90,
};

Racer.Key = {
  Left: 37,  // Left arrow
  Right: 39, // Right arrow
  Pause: 80, // P
};

/*
 * States need to be defined in prioritized order because they are iterated
 * as a list of values
 */
Racer.CarState = {
  Crashed: 50,
  Finished: 200,
  Out: 220,
  Normal: 255,
};

Racer.prototype = {
  timer: {
    // Cache timer IDs here
  },
  destroy: function() {
    this.stop();
    document.removeEventListener('keydown', this.keyPressListener);
    document.removeEventListener('keyup', this.keyReleaseListener);
  },
  init: function() {
    this.reset();
    this.render();
  },
  start: function() {
    this.run();
    this.updateLives();
    var foo = new Date().valueOf();

//     this.timer.fpsCounter = setInterval(function() {
//       var foo2 = new Date().valueOf();
//       var secs = (foo2 - foo) / 1000;
//       var fps = Math.round(this.frames/ secs);
//       this.frames = 0;
//       foo = foo2;
//
//       jQuery('#lbr-fps').val(fps);
//     }.bind(this), 1000);
  },
  run: function() {
    if (!this.running) {
      this.running = true;
      this.aborted = false;
      this.time = new Date().valueOf();
      this.timer.core = setInterval(this.render.bind(this), 1);
    }
  },
  stop: function() {
    if (this.running) {
      this.running = false;
      this.clearTimers();
    }
  },
  abort: function() {
    this.stop();
    this.aborted = true;
  },
  clearTimers: function() {
    for (var key in this.timer) {
      clearInterval(this.timer[key]);
    }

    this.timer = {};
  },
  clearTimer: function(id) {
    clearInterval(this.timer[id]);
    delete this.timer[id];
  },
  togglePause: function() {
    if (this.aborted && !this.running) {
      return false;
    }

    if (this.running) {
      this.stop();
    } else {
      this.run();
    }

    this.showPausedNotification(!this.running);
  },
  render: function() {
    var time = new Date().valueOf();
    var diff = (time - this.time) / 1000;

    this.time = time;
    this.updateTrack(diff);
    this.updateCar(diff);
    this.verifyCarState();
    this.sceneLayer.draw();

    // Frame counter for FPS stats
    this.frames++;
  },
  reset: function() {
    if (this.stage) {
      this.stage.destroy();
    }

    this.lifeCount = this.defs.lives;
    this.time = new Date().valueOf();
    this.running = false;
    this.turn = 0;
    this.x = 0;
    this.y = 0;
    this.rad = 0;
    this.frames = 0;

    this.createStageMap();

    this.stage = new Kinetic.Stage({
      container: this.options.container,
      width: this.options.width,
      height: this.options.height
    });

    this.sceneLayer = new Kinetic.Layer;

    this.car = new Kinetic.Image({
      x: (this.options.width) / 2,
      y: this.options.height - this.defs.car.height - this.defs.car.distance,
      width: this.defs.car.width,
      height: this.defs.car.height,
      image: this.sprites,
      crop: {
        x: this.defs.sprites.car.x,
        y: this.defs.sprites.car.y,
        width: this.defs.car.width,
        height: this.defs.car.height,
      },
      offset: {
        x: this.defs.car.width/2,
        y: this.defs.car.height/3
      },
    });

    this.buttonLeft = new Kinetic.Image({
      width: this.defs.sprites.buttonLeft.width,
      height: this.defs.sprites.buttonLeft.height,
      x: 30,
      y: this.stage.getHeight() / 2 - 60,
      image: this.sprites,
      crop: this.defs.sprites.buttonLeft,
    });

    this.buttonRight = this.buttonLeft.clone();
    this.buttonRight.setX(this.stage.getWidth() - this.buttonRight.getWidth() - 30);
    this.buttonRight.setCropX(this.defs.sprites.buttonRight.x);
    this.buttonRight.setCropY(this.defs.sprites.buttonRight.y);

    this.track = new Kinetic.Image({
      width: this.pixmaps.track.width * (1 / this.defs.scale.track),
      height: this.pixmaps.track.height * (1 / this.defs.scale.track),
      image: this.pixmaps.track,
      x: this.car.getX(),
      y: this.car.getY(),
    });

    this.track.setOffset({
      x: this.options.start.x,
      y: this.options.start.y,
    });

    this.lives = new Kinetic.Group({
      x: 10,
      y: 10,
    });

    this.stage.add(this.sceneLayer);
    this.sceneLayer.add(this.track);
    this.sceneLayer.add(this.car);
    this.sceneLayer.add(this.buttonLeft);
    this.sceneLayer.add(this.buttonRight);
    this.sceneLayer.add(this.lives);

    this.buttonLeft.on('mousedown touchstart', this.turnLeft.bind(this));
    this.buttonLeft.on('mouseup touchend', this.resetTurn.bind(this));
    this.buttonRight.on('mousedown touchstart', this.turnRight.bind(this));
    this.buttonRight.on('mouseup touchend', this.resetTurn.bind(this));
  },
  updateTrack: function(time_delta) {
//     var speed = this.defs.speed.track;
    var on_grass = this.carState == Racer.CarState.Out;
    var speed = this.defs.speed[on_grass ? 'grass' : 'track'];
    var cos = Math.cos;
    var sin = Math.sin;
    var distance = speed * time_delta;
    var r_delta = this.defs.car.turnMax * time_delta / this.defs.turnSpeed * 1000;

    if (this.turn) {
//       this.track.getLayer().clear();
      this.track.rotate(-1 * this.turn * r_delta);
      distance *= this.defs.turnAcceleration;
    }

    var p = this.track.getOffset();
    var a = this.track.getRotation();
    var x = sin(-a) * distance;
    var y = cos(-a) * distance;

    this.track.setOffset(p.x + x ,p.y - y);
  },
  updateCar: function(time_delta) {
//     this.car.moveToTop();
  },
  updateLives: function() {
    this.lives.destroyChildren();

    var x = 0;
    for (var i = 0; i < this.defs.lives; i++) {

      var crop = this.defs.sprites[i < this.lifeCount ? 'life' : 'lifeGone'];
      var life = new Kinetic.Image({
        x: x,
        y: 0,
        width: this.defs.sprites.life.width,
        height: this.defs.sprites.life.height,
        image: this.sprites,
        crop: crop,
      });

      this.lives.add(life);
      x += this.defs.sprites.life.width + 10;
    }
  },
  rotateCar: function(dir) {
    new Kinetic.Tween({
      node: this.car,
      rotation: Math.PI/16 * dir,
      duration: 0.15,
      easing: Kinetic.Easings.EaseInOut
    }).play();
  },
  turnLeft: function() {
    this.turn = -1;
    this.rotateCar(this.turn);
  },
  turnRight: function() {
    this.turn = 1;
    this.rotateCar(this.turn);
  },
  resetTurn: function() {
    this.turn = 0;
    this.rotateCar(this.turn);
  },
  getCarState: function() {
    var p = this.track.getOffset();
    var a = this.track.getRotation();
    var w = this.car.getWidth() / 2;
    var h = this.car.getHeight() / 3;
    var sin = Math.sin;
    var cos = Math.cos;
    var r = Math.round;

    var fl = {
      x: r((p.x - w * cos(a) - sin(a) * h) * this.defs.scale.map),
      y: r((p.y - h * cos(a) - cos(a + Math.PI/2) * w) * this.defs.scale.map),
    };

    var fr = {
      x: r((p.x + w * cos(a) - sin(a) * h)  * this.defs.scale.map),
      y: r((p.y - h * cos(a) + cos(a + Math.PI/2) * w)  * this.defs.scale.map),
    };

    var max_x = this.pixmaps.map.width;

    var fl_pixel = this.map[fl.y * max_x + fl.x];
    var fr_pixel = this.map[fr.y * max_x + fr.x];

    var states = Object.keys(Racer.CarState);
    var car_state = Racer.CarState.Normal;

    for (var key in states) {
      var state = states[key];
      var code = Racer.CarState[state];

      if (fl_pixel == code || fr_pixel == code) {
        car_state = code;
        break;
      }
    }

    // There is a possibility of rounding errors between changing states, so
    // let's interpret it in favour of the player.
    return car_state;
  },
  createStageMap: function() {
    var canvas = document.createElement('canvas');
    canvas.width = this.pixmaps.map.width;
    canvas.height = this.pixmaps.map.height;

    var ctx = canvas.getContext('2d');
    ctx.drawImage(this.pixmaps.map, 0, 0);

    // Contains RGBA data in a serialized array
    var image_data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var bytemap = [];

    for (var i = 0; i < image_data.length; i += 4) {
      var value = image_data[i];
      var alpha = image_data[i + 3];
      bytemap[i / 4] = alpha ? value : Racer.CarState.Out;
    }

    this.map = bytemap;
  },
  verifyCarState: function() {
    var state = this.getCarState();

    switch (state) {
      case Racer.CarState.Crashed:
        this.carCrashed();
        break;

      case Racer.CarState.Finished:
        this.carFinished();
        break;

      case Racer.CarState.Out:
        this.carOnGrass();
        break;

      case Racer.CarState.Normal:
        // reset warnings
        this.carNormal();
        break;
    }
  },
  carCrashed: function() {
    if (this.carState == Racer.CarState.Crashed) {
      return;
    }

    if (!this.damageProtection) {
      this.carState = Racer.CarState.Crashed;
      this.paintDamage();
      this.takeLife();
    }
  },
  carFinished: function() {
//     this.abort();
    this.finishGame(true);
  },
  carOnGrass: function() {
    if (this.carState == Racer.CarState.Out) {
      return;
    }
    this.carState = Racer.CarState.Out;
    this.paintDamage();
    this.timer.grass = setInterval(this.takeLife.bind(this), 5000);
  },
  carNormal: function() {
    if (this.carState == Racer.CarState.Normal) {
      return;
    }

    this.clearTimer('grass');
    this.carOnDamage = false;
    this.car.setCrop(this.stateCache.carCrop);
    this.carState = Racer.CarState.Normal;
  },
  paintDamage: function() {
    if (!this.carOnDamage) {
      this.carOnDamage = true;
      this.stateCache.carCrop = this.car.getCrop();
      this.car.setCropX(this.defs.sprites.carDamage.x);
      this.car.setCropY(this.defs.sprites.carDamage.y);
    }
  },
  takeLife: function() {
    this.lifeCount = Math.max(this.lifeCount - 1, 0);
    this.updateLives();
    this.protect();

    if (!this.lifeCount) {
      this.finishGame(false);
    }

    return this.lifeCount;
  },
  protect: function(ms) {
    if (!ms) {
      ms = 500;
    }

    this.damageProtection = true;

    setTimeout(function() {
      this.damageProtection = false;
    }.bind(this), ms);
  },
  showPausedNotification: function(state) {
    if (!state) {
      if (this.pausedNotification) {
        var layer = this.pausedNotification;
        this.pausedNotification = null;

        new Kinetic.Tween({
          node: layer,
          opacity: 0,
          duration: this.defs.effect.fadeLayers/ 1000,
          easing: Kinetic.Easings.FadeInOut,
        }).play();

        setTimeout(function() {
          layer.destroy();
        }, this.defs.effect.fadeLayers + 300);
      }
      return;
    }

    var rect = new Kinetic.Rect({
      width: this.stage.getWidth(),
      height: this.stage.getHeight(),
      fill: '#aaa',
      opacity: 0
    });

    this.pausedNotification = new Kinetic.Layer;
    this.pausedNotification.add(rect);
    this.stage.add(this.pausedNotification);
    this.pausedNotification.draw();

    new Kinetic.Tween({
      node: rect,
      opacity: 0.5,
      duration: this.defs.effect.fadeLayers/1000,
      easing: Kinetic.Easings.FadeInOut,
    }).play();
  },
  finishGame: function(success) {
    var rect = new Kinetic.Rect({
      width: this.stage.getWidth(),
      height: this.stage.getHeight(),
      opacity: 0,
    });

    rect.setFill(success ? '#00ff00' : '#ff0000');

    var layer = new Kinetic.Layer;
    layer.add(rect);
    this.stage.add(layer);

    new Kinetic.Tween({
      node: rect,
      opacity: 0.5,
      duration: 0.5,
      easing: Kinetic.Easings.EaseInOut,
    }).play();

    setTimeout(function() {
      this.abort();
    }.bind(this), 500);

    if (this.finishCallback) {
      this.finishCallback(success);
    }
  }
};
