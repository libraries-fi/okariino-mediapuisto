(function($) {
  "use strict";

  var DischargingDevices = Okariino.Game.BaseExt.extend({
    name: 'discharging_devices',
    resources: {
      battery: 'images/battery.png',
      characterOneFull: 'images/character1_full.png',
      characterOneMedium: 'images/character1_medium.png',
      characterOneLow: 'images/character1_low.png',
      characterOneOff: 'images/character1_off.png',
      characterTwoFull: 'images/character2_full.png',
      characterTwoMedium: 'images/character2_medium.png',
      characterTwoLow: 'images/character2_low.png',
      characterTwoOff: 'images/character2_off.png',
      characterThreeFull: 'images/character3_full.png',
      characterThreeMedium: 'images/character3_medium.png',
      characterThreeLow: 'images/character3_low.png',
      characterThreeOff: 'images/character3_off.png',
      characterFourFull: 'images/character4_full.png',
      characterFourMedium: 'images/character4_medium.png',
      characterFourLow: 'images/character4_low.png',
      characterFourOff: 'images/character4_off.png',
      dd_intro: 'sounds/32 Ou nou medialaitteista.ogg',
    },
    init: function() {
      Okariino.olli.speak('dd_intro');

      var d = this.data;
      this.characters = new CharacterCollection;
      this.characters.add({
        width: 160,
        height: 260,
        pixmaps: {
          full: d.characterOneFull,
          medium: d.characterOneMedium,
          low: d.characterOneLow,
          off: d.characterOneOff
        }
      });
      this.characters.add({
        width: 160,
        height: 260,
        pixmaps: {
          full: d.characterTwoFull,
          medium: d.characterTwoMedium,
          low: d.characterTwoLow,
          off: d.characterTwoOff
        }
      });
      this.characters.add({
        width: 160,
        height: 260,
        pixmaps: {
          full: d.characterThreeFull,
          medium: d.characterThreeMedium,
          low: d.characterThreeLow,
          off: d.characterThreeOff
        }
      });
      this.characters.add({
        width: 160,
        height: 260,
        pixmaps: {
          full: d.characterFourFull,
          medium: d.characterFourMedium,
          low: d.characterFourLow,
          off: d.characterFourOff
        }
      });

      this.gameView = new GameView({
        width: 895,
        height: 483,
        collection: this.characters,
        pixmaps: {
          battery: d.battery
        }
      });

      this.board.append(this.gameView.el);
    },
    postInit: function() {
      this.characters.each(function(c) {
        c.on('change:state', this.gameView.updateCharacterState, this.gameView);
      }.bind(this));

      this.gameView.on('finished', function() {
        this.buttons.restart.fadeIn();
      }, this);

      this.on('restartState', this.play, this);
      this.on('closed', this.gameView.close, this.gameView);

      this.on('initReady', function() {
        this.play();
      }, this);
    },
    play: function() {
      this.buttons.restart.fadeOut();
      this.gameView.start();
    }
  });

  var GameView = Backbone.View.extend({
    id: 'dcd-game-view',
    initialize: function() {
      this.finished = false;
    },
    render: function() {
      this.score = 0;
      this.pixmaps = [];
      this.batteries = [];

      if (this.stage) {
        this.stage.destroy();
      }

      this.stage = new Kinetic.Stage({
        container: this.el,
        width: this.options.width,
        height: this.options.height
      });

      this.scoreBoard = new Kinetic.Rect({
        fill: '#019DD6',
        stroke: '#000',
        strokeWidth: 3,
        x: 370,
        y: 20,
        width: 160,
        height: 60,
        cornerRadius: 10
      });

      this.scoreText = new Kinetic.Text({
        x: 370,
        y: 20,
        width: 160,
        height: 60,
        fontSize: 50,
        padding: 10,
        align: 'right',
        fontFamily: 'Sans-Serif',
        fill: '#fff',
        text: 'Foo',
      });
      this.decorationLayer = new Kinetic.Layer;
      this.characterLayer = new Kinetic.Layer;
      this.stage.add(this.decorationLayer);
      this.stage.add(this.characterLayer);

      this.decorationLayer.add(this.scoreBoard);
      this.decorationLayer.add(this.scoreText);

      var chars = this.collection;
      var left = 60;
      var bottom = 125;

      for (var i = 0; i < chars.length; i++) {
        var c = chars.at(i);
        var w = c.get('width');
        var h = c.get('height');
        var image = new Kinetic.Image({
          image: c.getStateAnimation(),
          width: w,
          height: h,
          x: left,
          y: this.stage.getHeight() - bottom - h,
          crop: c.getAnimationCrop(this.timeStep)
        });
        this.characterLayer.add(image);

        image.on('click tap', this.rechargeCharacter.bind(this));
        this.pixmaps.push(image);

        var bpm = this.options.pixmaps.battery;
        var battery = new Kinetic.Image({
          image: bpm,
          width: bpm.width / 2,
          x: left + (w - bpm.width * .5) / 2,
          y: image.getY() + image.getHeight() + 20,
          height: bpm.height,
          crop: {
            x: 0,
            y: 0,
            width: bpm.width / 2,
            height: bpm.height
          }
        });

        var battery_level = new Kinetic.Image({
          image: bpm,
          width: bpm.width / 2,
          x: left + (w - bpm.width * .5) / 2,
          y: image.getY() + image.getHeight() + 20,
          crop: {
            x: bpm.width / 2,
            y: 0,
            width: bpm.width / 2,
            height: bpm.height
          }
        });

        this.characterLayer.add(battery);
        this.characterLayer.add(battery_level);
        this.batteries.push(battery_level);
        this.batteryHeight = bpm.height;
        left += w + 30;
      }
      this.renderCharacters();
      this.renderScore();
    },
    renderCharacters: function() {
      for (var i = 0; i < this.collection.length; i++) {
        var c = this.collection.at(i);
        var pixmap = this.pixmaps[i];
        pixmap.setCrop(c.getAnimationCrop(this.timeStep));

        var b = this.batteries[i];
        b.setHeight(this.batteryHeight * (100 - c.get('energy')) / 100);
        b.setCropHeight(b.getHeight());
      }

      this.characterLayer.draw();
    },
    renderScore: function() {
      this.scoreText.setText(this.score);
      this.decorationLayer.draw();
    },
    start: function() {
      this.finished = false;
      this.timeStep = 0;

      this.collection.each(function(char) {
        char.start();
      });

      this.timerId = setInterval(function() {
        this.timeStep++;
        this.renderCharacters();
      }.bind(this), 100);

      this.render();
    },
    stop: function() {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = 0;
      }

      this.collection.each(function(char) {
        char.stop();
      });
    },
    close: function() {
      this.stop();
    },
    rechargeCharacter: function(event) {
      var pixmap = event.targetNode;
      var i = this.pixmaps.indexOf(pixmap);
      var model = this.collection.at(i);

      if (model.recharge()) {
        this.addPoints(10);
      } else {
        this.reducePoints(5);
      }
    },
    addPoints: function(pts) {
      this.score += pts;
      this.renderScore();

      if (this.score % 50 < 10) {
        this.increaseDifficulty();
      }
    },
    reducePoints: function(pts) {
      this.score -= pts;
      this.renderScore();
    },
    updateCharacterState: function(model) {
      var i = this.collection.indexOf(model);
      this.pixmaps[i].setImage(model.getStateAnimation());

      if (model.isOff()) {
        this.finished = true;
        this.trigger('finished');
        this.stop();
      }
    },
    increaseDifficulty: function() {
      this.collection.each(function(char) {
        var c = char.consumption;
        char.consumption += 1.5 * Math.random();
      });
    }
  });

  var Character = Backbone.Model.extend({
    initialize: function() {
      this.reset();
    },
    isOff: function() {
      return this.get('state') == 'off';
    },
    getStateAnimation: function() {
      return this.get('pixmaps')[this.get('state')];
    },
    getAnimationCrop: function(step) {
      var pixmap = this.getStateAnimation();
      var w = this.get('width');
      var max_w = pixmap.width;
      var frames = Math.ceil(max_w / w);

      return {
        x: step % frames * w,
        y: 0,
        width: w,
        height: this.get('height')
      };
    },
    start: function() {
      this.reset();
      var delay = 100;
      var ms = 0;
      this.timerId = setInterval(function() {
        ms += delay;
        this.timeStep++;
        var consumed = this.consumption * delay / 1000;
        var energy = Math.max(this.get('energy') - consumed, 0);
        this.set('energy', energy);

        for (var key in this.limits) {
          if (this.limits[key] <= energy) {
            if (this.get('state') != key) {
              this.set('state', key);
            }
            break;
          }
        }

        if (energy <= 0) {
          this.set('state', 'off');
          this.stop();
        }
      }.bind(this), delay);
    },
    stop: function() {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = 0;
      }
    },
    reset: function() {
      this.stop();
      this.timerId = 0;
      this.set('state', 'full');
      this.set('energy', 100);
      this.consumption = (Math.ceil(Math.random() * 15) + 5) / 2;
      this.timeStep = 0;
      this.limits = {
        full: 80,
        medium: 50,
        low: 1
      };
    },
    recharge: function() {
      if (this.get('state') != 'low') {
        this.trigger('invalidRecharge', this);
        return false;
      }
      this.set('energy', 100);
      this.set('state', 'full');
      return true;
    }
  });

  var CharacterCollection = Backbone.Collection.extend({
    model: Character
  });
})(jQuery);
