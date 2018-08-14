(function($) {
  "use strict";

  var FindLibraryCard = Okariino.Game.BaseExt.extend({
    name: 'find_library_card',
    loadTemplates: false,
    actions: {
      'index': function() {
        this.callState(this, 'play');
      }
    },
    resources: {
      sprite: 'images/items.png',
      card: 'images/library_card.png',
      cardSmall: 'images/library_card_small.png',
      items: 'demo_items.json',
      flc: {
        intro: 'sounds/26a Huh huh mikä sotku.ogg',
        success: 'sounds/26b Hyvä löytyihän se sieltä.ogg',
      }
    },
    init: function() {
      Okariino.olli.speak('flc/intro');

      this.canvasView = new CanvasView({
        width: 895,
        height: 483,
        pixmaps: {
          sprite: this.data.sprite,
          card: this.data.card,
          cardSmall: this.data.cardSmall
        },
        items: this.data.items,
      });
      this.board.append(this.canvasView.el);
    },
    postInit: function() {
      this.on('initReady', this.play, this);
      this.on('restartState', this.play, this);

      this.canvasView.on('finished', function() {
        this.buttons.restart.fadeIn();

        setTimeout(function() {
          Okariino.olli.speak('flc/success');
        }, 1000);
      }, this);
    },
    play: function() {
      this.buttons.restart.fadeOut();
      this.canvasView.render();
    }
  });

  var CanvasView = Backbone.View.extend({
    id: 'flc-canvas-view',
    className: "game-overlay",
    initialize: function() {
      this.floorArea = {
        x: 145,
        y: 85,
        width: 555,
        height: 255
      };

      this.collectMargins = {
        top: 80,
        right: 80,
        bottom: 80,
        left: 80
      };

      this.clutterCount = 40;
    },
    render: function() {
      if (this.stage) {
        this.stage.destroy();
      }

      this.stage = new Kinetic.Stage({
        container: this.el,
        width: this.options.width,
        height: this.options.height
      });

      var pixmap = this.options.pixmaps.card;

      this.card = new Kinetic.Image({
        image: pixmap,
        width: 50,
        height: 32,
        shadowColor: '#000',
        shadowBlur: 10,
        rotation: Math.PI * -0.1
      });

      this.randomPosition(this.card, 40);

      this.dragLayer = new Kinetic.Layer;
      this.collectedLayer = new Kinetic.Layer({ listening: false });
      this.floorLayer = new Kinetic.Layer;
      this.floorLayer.add(this.card);
      this.stage.add(this.floorLayer);
      this.stage.add(this.collectedLayer);
      this.stage.add(this.dragLayer);
      this.stage.draw();
      this.populateClutter(this.floorLayer);
    },
    randomPoint: function(pad, grid_width) {
      if (!grid_width || grid_width < 0) {
        grid_width = 1;
      }

      if (!pad || pad < 0) {
        pad = 0;
      }

      var max_x = this.floorArea.width - pad;
      var max_y = this.floorArea.height - pad;
      var x = Math.round((Math.random() * max_x) / grid_width) * grid_width + this.floorArea.x;
      var y = Math.round((Math.random() * max_y) / grid_width) * grid_width + this.floorArea.y;

      return { x: x, y: y };
    },
    randomPosition: function(object, pad) {
      var p = this.randomPoint(pad, 60);
//       object.setPosition(p.x, p.y);
      object.move(p);
    },
    populateClutter: function(layer) {
      for (var i = 0; i < this.clutterCount; i++) {
        var specs = this.randomPixmap();
        var rect = new Kinetic.Image({
          width: specs.width,
          height: specs.height,
          rotation: Math.PI * Math.random(),
          draggable: true,
          image: this.options.pixmaps.sprite,
          crop: specs,
          shadowColow: '#000',
          shadowBlur: 10
        });

        this.randomPosition(rect);
        layer.add(rect);

        rect.on('mousedown touchstart', function(event) {
          var node = event.targetNode;
          node.moveToTop();
          node.moveTo(this.dragLayer);
          node.setAttr('origin', node.getPosition());

          this.floorLayer.draw();
          this.dragLayer.draw();
          node.startDrag();
        }.bind(this));

        rect.on('mouseup touchend', this.dropClutter.bind(this));
      }

      layer.draw();
    },
    randomPixmap: function() {
      var i = Math.floor(Math.random() * this.options.items.length);
      return this.options.items[i];
    },
    dropClutter: function(event) {
      var node = event.targetNode;
      var corners = this.rectCorners(node);
      var min_x = this.collectMargins.left;
      var max_x = this.stage.getWidth() - this.collectMargins.right;
      var min_y = this.collectMargins.top;
      var max_y = this.stage.getHeight() - this.collectMargins.bottom;

      for (var c in corners) {
        var p = corners[c];
        var side = p.x < min_x ? 'left' :
               p.x > max_x ? 'right' :
               p.y < min_y ? 'top' :
               p.y > max_y ? 'bottom' :
               null;

        if (side) {
          this.collectClutter(node, side);
        }
      }

      this.floorLayer.draw();

      if (this.isCardRevealed()) {
        this.finishGame();
      }
    },
    collectClutter: function(object, side) {
      var transition = {
        node: object,
        duration: 0.5,
        easing: Kinetic.Easings.EaseInOut
      };

      var corners = this.rectCorners(object);

      switch (side) {
        case 'left':
        case 'right':
          transition.x = corners.ne.x - corners.se.x;
          if (side == 'right') {
            transition.x += this.stage.getWidth();
          }
          break;

        case 'top':
        case 'bottom':
          transition.y = corners.ne.y - corners.se.y - object.getHeight() / 2;
          if (side == 'bottom') {
            transition.y += this.stage.getHeight();
          }
      }

      object.moveTo(this.collectedLayer);
      object.setDraggable(false);
      this.dragLayer.draw();
      new Kinetic.Tween(transition).play();
    },
    finishGame: function() {
      var layer = new Kinetic.Layer;
      var cover = new Kinetic.Rect({
        width: this.stage.getWidth(),
        height: this.stage.getHeight(),
        fill: '#000',
        opacity: 0
      });

      layer.add(cover);
      this.card.moveTo(layer);
      this.stage.add(layer);
      this.floorLayer.draw();

      var w = 300;
      var h = w * this.card.getHeight() / this.card.getWidth();
      var x = (this.stage.getWidth() - w) / 2;
      var y = (this.stage.getHeight() - h) / 2 - 20;

      new Kinetic.Tween({
        node: cover,
        opacity: 0.8,
        duration: 2,
        easing: Kinetic.Easings.EaseInOut
      }).play();

      new Kinetic.Tween({
        node: this.card,
        width: w,
        height: h,
        x: x,
        y: y,
        duration: 2,
        rotation: 0,
        shadowBlur: 30,
        easing: Kinetic.Easings.EaseInOut
      }).play();

      this.trigger('finished');
    },
    rectCorners: function(object) {
      var w = object.getWidth();
      var h = object.getHeight();
      var pos = object.getPosition();
      var r = object.getRotation();
      var d = Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));

      var swr = Math.cos(w / d);

      var corners = {
        ne: pos,
        nw: {
          x: pos.x + Math.cos(r) * w,
          y: pos.y + Math.sin(r) * w
        },
        sw: {
          // This point is not 100 % accurate for some reason
          x: pos.x + Math.cos(swr + r) * d,
          y: pos.y + Math.sin(swr + r) * d
        },
        se: {
          x: pos.x + Math.cos(r + Math.PI/2) * h,
          y: pos.y + Math.sin(r + Math.PI/2) * h
        }
      };

      return corners;
    },
    isCardRevealed: function() {
      var corners = this.rectCorners(this.card);

      for (var c in corners) {
        var ix = this.stage.getIntersection(corners[c]);

        if (ix && Object.keys(ix).length > 1) {
          return false;
        }
      }

      return true;
    }
  });
})(jQuery);
