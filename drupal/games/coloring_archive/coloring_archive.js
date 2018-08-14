(function($) {
  "use strict";
  
  var ColoringPicturesArchive = Okariino.Game.Base.extend({
    name: 'coloring_archive',
    actions: {
      'show': function(id) {
        this.showDrawingId(id);
      }
    },
    run: function() {
      this.loadStyle(this.name);

      var back = this.createButton(this.BACK_BUTTON).hide();
      var board = this.createBoard(this.elem.container, 'cpa-board', [back]);

      var resources = {
        templates: this.resource('templates.xml'),
//         drawings: '/games/dcp/picture#.json',
        drawings: { src: '/games/dcp/picture', type: createjs.LoadQueue.JSON },
        dca_intro: this.resource('sounds/9 Katsele lähetettyjä.ogg'),
      };

      this.load(resources, function(resources) {
        Okariino.olli.speak('dca_intro');

        var templates = this.parseTemplates(resources.templates);
        var drawings = new DrawingCollection(resources.drawings);
        var select_view = new SelectDrawingView({
          templates: templates,
          collection: drawings
        });
        var drawing_view = new DrawingView({
          templates: templates
        });

        board.append(select_view.el);
        board.append(drawing_view.el);
        select_view.render();
        drawing_view.$el.hide();

        select_view.on('drawingSelected', this.showDrawing.bind(this));

        back.on('click', function() {
          back.fadeOut();
          drawing_view.$el.fadeOut();
        });

        this.back = back;
        this.selectView = select_view;
        this.drawingView = drawing_view;
      });
    },
    showDrawing: function(drawing) {
      this.drawingView.setDrawing(drawing);
      this.drawingView.$el.fadeIn();
      this.back.fadeIn();
    },
    showDrawingId: function(id) {
      var d = this.selectView.drawing(id);
      this.showDrawing(d);
    }
  });

  var SelectDrawingView = Backbone.View.extend({
    id: 'cpa-drawings',
    className: 'game-overlay carousel slide',
    events: {
      'click #cpa-drawings-pager a': function(event) {
        var i = this.$('#cpa-drawings-pager a').index(this.$(event.currentTarget));
        this.$el.carousel(i);
      },
      'click .carousel-inner a': function(event) {
        var id = $(event.currentTarget).data('id');
        var drawing = this.drawing(id);
        this.trigger('drawingSelected', drawing);
      }
    },
    initialize: function() {
      this.template = _.template(this.options.templates.drawings);
    },
    render: function() {
      this.$el.html(this.template({
        drawings: this.collection.models,
        page_size: 6
      }));
      this.$el.carousel('pause');
      return this;
    },
    drawing: function(id) {
      return this.collection.get(id);
    }
  });

  var DrawingView = Backbone.View.extend({
    id: 'cpa-drawing',
    className: 'game-overlay',
    initialize: function() {
      this.template = _.template(this.options.templates.drawing);
    },
    render: function() {
      this.$el.html(this.template({
        drawing: this.model
      }));
      return this;
    },
    setDrawing: function(drawing) {
      this.model = drawing;
      this.render();
    }
  });

  var DrawingCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: null,
        templateId: null,
        created: null,
        source: '',
        user: {
          name: '',
          age: null
        }
      },
      created: function() {
        var d = new Date(this.attributes.created * 1000);
        return d.toLocaleDateString();
      }
    })
  });
})(jQuery);
