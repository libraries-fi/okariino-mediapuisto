/*
* Region for placing the books:
*  (124, 481), (380, 366), (734, 400), (734, 481)
*  (2, 117), (256, 0), (610, 30), (612, 117)
*
* Books:
*  Red:  0-36-51-59-72     [72x100+0+300]
*  Green:  72-101-111-123-136  [64x74+72+326]
*  Blue:   136-168-175-186-195 [59x77+136+323]
*  Yellow: 195-232-241-249-263 [68x80+195+320]
*/

(function($) {
  "use strict";
  
  var ColorBookShelves = Okariino.Game.BaseExt.extend({
    name: 'color_bookshelves',
    resources: {
      tiles: 'images/book-tiles.png',
      cb_intro: 'sounds/12 Voi ei Osku kissa on.ogg',
    },
    actions: {
      index: function() {
        this.callState(this, 'play');
      }
    },
    init: function() {
      Okariino.olli.speak('cb_intro');

      this.gameView = new GameView({
        width: 895,
        height: 483,
        templates: this.data.templates,
        tiles: this.data.tiles,
        bookCount: 16,
        colors: {
          red : '#f00',
          green: '#0f0',
          blue: '#00f',
          yellow: '#ff0'
        }
      });

      this.board.append(this.gameView.el);

      this.gameView.on('bookShelved', function(count) {
        if (this.gameView.isFinished()) {
          this.buttons.restart.fadeIn();
          this.sound.only('okariino/success');
        }
      }, this);

      this.initStates(this.url('index'));
    },
    postInit: function() {
      this.on('restartState', this.play, this);
      this.on('initReady', this.play, this);
    },
    play: function() {
      this.gameView.show();
      this.buttons.restart.fadeOut();
    }
  });

//   var GameView = Backbone.View.extend({
  var GameView = Okariino.Game.View.Base.extend({
    template: _.template(''),
    init: function() {
      var options = this.options;

      // Shelf definitions
      // Points: shelf region where game accepts a book
      // Books: width, height, x, y = image file definitions for books in a shelf
      // Books -> points: image map defitions for a single book in a shelf
      // Books -> origin: x, y = game board positions for an image
      this.shelfSpecs = [
        {
          points: [108,134,104,192,354,118,355,65],
          name: 'red',
          books: {
            image: options.tiles,
            width: 81,
            height: 77,
            x: 0,
            y: 215,
            points: [36, 48, 63, 80],
            origin: {
              x: 118,
              y: 109
            }
          }
        },
        {
          points: [107,208,104,261,350,185,352,131],
          name: 'green',
          books: {
            image: options.tiles,
            width: 79,
            height: 71,
            x: 150,
            y: 215,
            points: [188, 201, 216, 227],
            origin: {
              x: 230,
              y: 147
            }
          }
        },
        {
          points: [108,278,103,329,353,246,353,196],
          name: 'blue',
          books: {
            image: options.tiles,
            width: 100,
            height: 67,
            x: 300,
            y: 215,
            points: [336, 350, 365, 399],
            origin: {
              x: 208,
              y: 221
            }
          }
        },
        {
          points: [106,344,102,395,352,306,355,256],
          name: 'yellow',
          books: {
            image: options.tiles,
            width: 76,
            height: 68,
            x: 450,
            y: 215,
            points: [480, 492, 509, 525],
            origin: {
              x: 244,
              y: 270
            }
          }
        }
      ];

      // Book graphics definitions
      this.bookSpecs = {
        red: [
          {
            image: options.tiles,
            width: 46,
            height: 70,
            x: 0,
            y: 0
          },
          {
            image: options.tiles,
            width: 92,
            height: 70,
            x: 53,
            y: 0
          },
          {
            image: options.tiles,
            width: 46,
            height: 73,
            x: 0,
            y: 75
          },
          {
            image: options.tiles,
            width: 92,
            height: 65,
            x: 53,
            y: 75
          }
        ],
        green: [
          {
            image: options.tiles,
            width: 46,
            height: 70,
            x: 150,
            y: 0
          },
          {
            image: options.tiles,
            width: 92,
            height: 70,
            x: 201,
            y: 0
          },
          {
            image: options.tiles,
            width: 46,
            height: 73,
            x: 150,
            y: 75
          },
          {
            image: options.tiles,
            width: 92,
            height: 65,
            x: 201,
            y: 75
          }
        ],
        blue: [
          {
            image: options.tiles,
            width: 46,
            height: 70,
            x: 300,
            y: 0
          },
          {
            image: options.tiles,
            width: 92,
            height: 70,
            x: 351,
            y: 0
          },
          {
            image: options.tiles,
            width: 46,
            height: 73,
            x: 300,
            y: 75
          },
          {
            image: options.tiles,
            width: 92,
            height: 65,
            x: 351,
            y: 75
          }
        ],
        yellow: [
          {
            image: options.tiles,
            width: 46,
            height: 70,
            x: 450,
            y: 0
          },
          {
            image: options.tiles,
            width: 92,
            height: 70,
            x: 501,
            y: 0
          },
          {
            image: options.tiles,
            width: 46,
            height: 73,
            x: 450,
            y: 75
          },
          {
            image: options.tiles,
            width: 92,
            height: 65,
            x: 501,
            y: 75
          }
        ]
      }
    },
    getCenter: function(node) {
      var pos = node.getPosition();
      var rad = node.getRotation();
      var w = node.getWidth() / 2;
      var h = node.getHeight() / 2;
    },
    afterRender: function() {
      var options = this.options;

      /*
       * Initialize shelves
       */

      this.stage = new Kinetic.Stage({
        container: this.el,
        width: options.width,
        height: options.height
      });

      var self = this;
      var shelves = this.shelfSpecs;
      var shelf_layer = new Kinetic.Layer();

      for (var i = 0; i < shelves.length; i++) {
        var data = shelves[i];
        var shelf = new Kinetic.Polygon({
          points: data.points,
          bookCount: 0,
          dataColor: data.name,
          markerConf: data.books
        });
        shelf_layer.add(shelf);
      }

      this.stage.add(shelf_layer);

      var drop_book = function() {
        var color = this.getAttrs().dataColor;
        var pos = this.getPosition();
//         pos.x += 30;
//         pos.y += 30;
        var is = shelf_layer.getAllIntersections(pos);
        for (var i = 0; i < is.length; i++) {
          var shelf = is[i];
          var attrs = shelf.getAttrs();
          if (attrs.dataColor == color) {
            var conf = attrs.markerConf;
            attrs.marker ? attrs.marker.destroy() : null;

            var width = conf.points[attrs.bookCount] - conf.x;
            var height = conf.height;

            attrs.marker = new Kinetic.Image({
              image: conf.image,
              x: conf.origin.x,
              y: conf.origin.y,
              width: width,
              height: height,
              crop: {
                x: conf.x,
                y: conf.y,
                width: width,
                height: height
              }
            });

            attrs.bookCount++;
            shelf_layer.add(attrs.marker);
            this.destroy();
            self.stage.draw();
            self.trigger('bookShelved', self.options.bookCount - book_layer.getChildren().length);

            return true;
          }
        };

        new Kinetic.Tween({
          node: this,
          x: this.getAttrs().origin.x,
          y: this.getAttrs().origin.y,
          duration: 0.5,
          easing: Kinetic.Easings.EaseInOut
        }).play();

        return false;
      };

      /*
      * Initialize stuff
      */

      var misc_layer = new Kinetic.Layer({
        id: 'misc-layer'
      });

      // Region that limits the initial placement of the books
      var books_area = new Kinetic.Polygon({
        id: 'book-floor-area',
        points: [124, 461, 380, 366, 734, 400, 734, 461],
      });

      misc_layer.add(books_area);
      this.stage.add(misc_layer);

      /*
      * Initialize books
      */
      var books = this.books();

      var book_layer = new Kinetic.Layer({
        id: 'book-layer'
      });

      this.stage.add(book_layer);

      _(books).each(function(book, i) {
        var book_specs = self.bookSpecs[book.colorName];
        var j = Math.floor(Math.random() * book_specs.length);
        var specs = book_specs[j];

        var book = new Kinetic.Image({
          name: 'book',
          x: book.x,
          y: book.y,
          draggable: true,
          width: specs.width,
          height: specs.height,
          offset: [specs.width/2, specs.height/2],
          rotationDeg: book.rotation,
          dataColor: book.colorName,
          image: specs.image,
          crop: {
            x: specs.x,
            y: specs.y,
            width: specs.width,
            height: specs.height
          }
        });

        book_layer.add(book);
        book.on('dragend', drop_book);
        book.on('dragstart', function() {
          this.setAttr('origin', this.getPosition());
        });
      });

      var drag_layer = new Kinetic.Layer();
      this.stage.add(drag_layer);

      book_layer.draw();

      var pos = book_layer.getChildren()[0].getPosition();

      var cat = new Kinetic.Image({
        image: this.options.tiles,
        x: pos.x - 30,
        y: pos.y - 30,
        width: 86,
        height: 44,
        crop: {
          x: 0,
          y: 152,
          width: 86,
          height: 44
        }
      });

      misc_layer.add(cat);
      misc_layer.draw();
    },
    isFinished: function() {
      return this.stage.get('#book-layer')[0].getChildren().length == 0;
    },
    restart: function() {
      this.stage.remove();
      this.initialize(this.options);
      this.render();
    },
    books: function() {
      var books = [];
      var points = this.randomPoints();
      var count = this.options.bookCount;
      var colors = Object.keys(this.options.colors);

      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var c = colors[i % colors.length];
        var color = this.options.colors[c];
        var rotate = Math.round(Math.random() * 360);
        books.push({
          x: p.x,
          y: p.y,
          rotation: rotate,
          color: color,
          colorName: c
        });
      }
      return books;
    },
    randomPoints: function() {
      var bbox = this.boundingBox();
      var polygon = this.stage.get('#book-floor-area')[0];
      var count = this.options.bookCount;
      var points = [];

      for (var i = 0; i < this.options.bookCount; i++) {
        var found = false;

        while (!found) {
          var x = Math.round((Math.random() * bbox.width + bbox.x) / 40) * 40;
          var y = Math.round((Math.random() * bbox.height + bbox.y) / 40) * 40;
          var is = this.stage.getAllIntersections({ x: x, y: y });

          for (var j = 0; j < is.length; j++) {
            if (is[j] == polygon) {
              points.push({ x: x, y: y});
              found = true;
              break;
            }
          }
        }
      }

      return points;
    },
    boundingBox: function() {
      var data = this.stage.get('#book-floor-area')[0].getPoints();
      var points = [9999, 0, 9999, 0];

      _(data).each(function(p, i) {
        if (p.x < points[0]) {
          points[0] = p.x;
        }

        if (p.x > points[1]) {
          points[1] = p.x;
        }

        if (p.y < points[2]) {
          points[2] = p.y;
        }

        if (p.y > points[3]) {
          points[3] = p.y;
        }
      });

      var rect = {
        x: points[0],
        y: points[2],
        width: points[1] - points[0],
        height: points[3] - points[2]
      };

      return rect;
    }
  });
})(jQuery);
