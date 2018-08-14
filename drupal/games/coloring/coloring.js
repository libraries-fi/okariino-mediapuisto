
(function($) {
  "use strict";
  
  var ColoringGame = Okariino.Game.Base.extend({
    name: 'coloring',
    ajaxUrl: '/games/dcp',
    run: function() {
      this.loadStyle(this.name);

      var back = this.createButton(this.BACK_BUTTON).hide();
      var restart = this.createButton(this.RESTART_BUTTON).hide();
      var board = this.createBoard(this.elem.container, 'dcp-board', [back, restart]);

      var colors = [
        '#FFFFFF', // valkea
        '#D2D5D2', // harmaa
        '#222222', // musta

        '#FFBA98', // pinkki
        '#BF32D4', // violetti
        '#FF0000', // punainen

        '#B3FF40', // lime
        '#0D5700', // tummanvihreä
        '#00FF00', // vihreä

        '#91BABE', // vaaleansininen
        '#203D82', // tummansininen
        '#0000FF', // sininen

        '#FF970E', // oranssi
        '#C05800', // ruskea
        '#FFFF00', // keltainen
      ];

      var resources = {
        'templates': this.resource('templates.xml'),
//         'pictures': '/games/dcp/template#.json',
        'pictures': { src: '/games/dcp/template', type: createjs.LoadQueue.JSON },
        'dcp-intro': this.resource('sounds/7 Taiteile sinäkin.ogg'),
        'dcp-tutorial': this.resource('sounds/8 Valitse väri ja sen.ogg'),
      };

      this.load(resources, function(resources) {
        Okariino.olli.speak('dcp-intro');

        var templates = this.parseTemplates(resources.templates);
        var pictures = new PictureCollection(resources.pictures);
        var select_view = new SelectPictureView({
          templates: templates,
          collection: pictures
        });
        var color_picker = new ColorPicker({
          templates: templates,
          colors: colors
        });
        var paint_area = new PaintArea({
          templates: templates
        });
        var paint_view = new PaintView({
          templates: templates,
          colorPicker: color_picker,
          paintArea: paint_area
        });
        var submit_dialog = new SubmitDialog({
          templates: templates
        });

        var drawing = null;

        board.append(paint_view.render().el);
        board.append(select_view.render().el);
        $('body').append(submit_dialog.el);

        select_view.on('pictureSelected', function(picture) {
          Okariino.olli.speakOnce('dcp-tutorial');
          back.fadeIn();
          select_view.$el.fadeOut();
          paint_view.showPicture(picture);
        });

        paint_view.on('drawingSubmitted', function(d) {
          drawing = d.clone();
          submit_dialog.render().$el.modal();
        });

        submit_dialog.on('accepted', function(data) {
          drawing.attributes.user.name = data.name;
          drawing.attributes.user.age = data.age;

          drawing.save();

          submit_dialog.$el.modal('hide');
        });

        back.on('click', function() {
          back.fadeOut();
          select_view.$el.fadeIn();
        });
      });
    }
  });

  var SelectPictureView = Backbone.View.extend({
    id: 'dcp-select-picture',
    className: 'game-overlay carousel slide',
    events: {
      'click #dcp-pictures-pager a': function(event) {
        var i = this.$('#dcp-pictures-pager a').index(this.$(event.currentTarget));
        this.$el.carousel(i);
      },
      'click #dcp-pictures a': function(event) {
        var id = $(event.currentTarget).data('id');
        var pic = this.collection.get(id);
        this.trigger('pictureSelected', pic);
      }
    },
    initialize: function() {
      this.template = _.template(this.options.templates.selectpicture);
      this.collection.on('sync', this.render.bind(this));
    },
    render: function() {
      this.$el.html(this.template({
        pictures: this.collection.models,
        page_size: 6
      }));
      this.$el.carousel('pause');
      return this;
    }
  });

  var PaintView = Backbone.View.extend({
    id: 'dcp-paint-view',
    className: 'game-overlay',
    events: {
      'click #dcp-send': function(event) {
        var drawing = new Drawing({
          templateId: this.model.get('id'),
          data: this.paintArea.toSvg()
        });
        this.trigger('drawingSubmitted', drawing);
      },
      'click #dcp-print': function(event) {
        var svg = this.paintArea.toSvg();
        $(svg).printElement();
      }
    },
    initialize: function() {
      this.template = _.template(this.options.templates.paintview);
      this.colorPicker = this.options.colorPicker;
      this.paintArea = this.options.paintArea;

      var pa = this.paintArea;
      this.colorPicker.on('colorSelected', function(color) {
        pa.options.currentColor = color;
      });
    },
    render: function() {
      this.$el.html(this.template());
      this.$el.append(this.colorPicker.render().el);
      this.$el.append(this.paintArea.render().el);
      return this;
    },
    showPicture: function(picture) {
      this.model = picture;
      this.paintArea.setPicture(picture);
    }
  });

  var ColorPicker = Backbone.View.extend({
    id: 'dcp-color-picker',
    events: {
      'click li': function(event) {
        var color = $(event.currentTarget).css('background-color');
        this.trigger('colorSelected', color);

        $(event.currentTarget).addClass('active')
          .siblings().removeClass('active');

        this.$('#dcp-current-color').css({
          'background': color
        });
      }
    },
    initialize: function() {
      this.template = _.template(this.options.templates.colorpicker);
    },
    render: function() {
      this.$el.html(this.template({
        colors: this.options.colors
      }));
      return this;
    }
  });

  var PaintArea = Backbone.View.extend({
    id: 'dcp-paint-area',
    initialize: function() {
      this.template = _.template(this.options.templates.paintarea);
    },
    render: function() {
      var options = this.options;

      this.$el.html(this.template());
      var paper = Raphael(this.el, 540, 413);
      this.paper = paper;
      this.$el.children('svg').click(function(event) {
        var color = options.currentColor;
        var x = event.pageX - $('body').scrollLeft();
        var y = event.pageY - $('body').scrollTop();
        var elem = paper.getElementByPoint(x, y);

        if (elem) {
          elem.attr('fill', color);
        }
      });
      return this;
    },
    setPicture: function(picture) {
      this.model = picture;
      this.paper.clear();
      this.paper.importURL(this.model.get('src'), false);
    },
    toSvg: function() {
      return this.paper.toSVG();
    }
  });

  var SubmitDialog = Backbone.View.extend({
    id: 'dcp-submit-dialog',
    className: 'modal fade',
    tagName: 'form',
    events: {
      'submit': function(event) {
        event.preventDefault();
        var data = this.data();
        this.options.formData = data;
        this.trigger('accepted', data);
      }
    },
    initialize: function() {
      this.template = _.template(this.options.templates.submitdialog);
      this.options.formData = {
        name: '',
        age: ''
      };
    },
    render: function() {
      this.$el.html(this.template(this.options.formData));
      return this;
    },
    data: function() {
      return {
        name: this.$('[name="name"]').val(),
        age: this.$('[name="age"]').val()
      };
    }
  });

  var PictureCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: null,
        created: null,
        src: null
      }
    }),
    url: '/games/dcp/template'
  });

  var Drawing = Backbone.Model.extend({
    defaults: {
      id: null,
      templateId: null,
      created: null,
      data: '',
      user: {
        name: '',
        age: null
      }
    },
    url: '/games/dcp/picture'
  });
})(jQuery);
