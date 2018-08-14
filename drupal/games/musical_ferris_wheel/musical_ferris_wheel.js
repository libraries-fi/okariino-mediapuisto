/**
 * Musical Ferris Wheel
 *
 * The Ferris Wheel displays cover art of various music albums. The albums
 * can then be selected for previewing.
 **/

(function($) {
  "use strict";

  var game_name = 'musical_ferris_wheel';

  // Global helper
  var Cache = {};

  var MusicalFerrisWheel = (function() {
    var self;

    var foo = function(settings, container) {
      self = this;

      foo.prototype.constructor.apply(this, [game_name, settings, container]);
      self.loadStyle(game_name);
    };

    foo.prototype = Object.create(Okariino.Game.Base.prototype);

    foo.prototype.run = function() {
      var back = self.createButton(self.BACK_BUTTON).hide();
      var board = self.createBoard(self.elem.container, 'mfw-board', [back]);

      var resources = {
        albums: { src: '/rest/mfw_albums#.json', type: createjs.LoadQueue.JSON },
        mfw_intro: this.resource('sounds/3 Kiva kun tulit musiikki.ogg'),
        templates: this.resource('templates.xml'),
        jingle_bookfun: this.resource('sounds/Loru_Kirjahuvia.ogg'),
      };

      this.load(resources, function(resources) {
        Okariino.olli.speak('mfw_intro');
        Cache.templates = this.parseTemplates(resources.templates);
        var album_collection = new AlbumList(resources.albums);

        var main_view = new FerrisWheelView({
          collection: album_collection,
        });
        var info_view = new AlbumInfoView();

        var archive_view = new ArchiveView({
          templates: Cache.templates,
          collection: album_collection
        });

        var media_view = new MediaView({
          templates: Cache.templates
        });

        main_view.albumList = new AlbumListView();
        board.append(main_view.render().el);
        board.append(archive_view.render().$el.hide());
        board.append(info_view.$el.hide());
        board.append(media_view.$el.hide());

        main_view.postRender();

        back.click(function() {
          if (info_view.$el.is(':visible')) {
            info_view.$el.fadeOut();

            if (archive_view.$el.is(':visible')) {
              return;
            }
          } else if (archive_view.$el.is(':visible')) {
            archive_view.$el.fadeOut();
          }
          back.fadeOut();
        });

        main_view.$('#mfw-launch-archive').on('click', function() {
          archive_view.$el.fadeIn();
          back.fadeIn();
        });

        main_view.albumList.on('albumSelected', function(album) {
          info_view.model = album;
          info_view.render().$el.fadeIn();
          back.fadeIn();
        });

        archive_view.on('albumSelected', function(album) {
          info_view.model = album;
          info_view.render().$el.fadeIn();
          back.fadeIn();
        });

        info_view.on('mediaSelected', function(media) {
          media_view.$el.fadeIn();
          media_view.showMedia(media);
        });
      });
    };

    return foo;
  })();

  var FerrisWheelView = Backbone.View.extend({
    id: 'mfw-ferriswheel-view',
    className: 'game-overlay',
    albumList: null,
    render: function() {
      this.albumList.collection = this.collection;
      var t = _.template(Cache.templates['ferris-wheel-view']);
      this.$el.append(t({albums: this.collection.toJSON()}));
      this.$('#mfw-wheel').append(this.albumList.render().el);

      return this;
    },
    postRender: function() {
      this.albumList.postRender();
    }
  });

  var AlbumListView = Backbone.View.extend({
    id: 'mfw-albums',
    tagName: 'ul',
    render: function() {
      var self = this;

      this.collection.each(function(album) {
        var item = new AlbumView({model: album});
        item.on('albumSelected', self.setCurrentAlbum, self);
        self.$el.append(item.render().el);
      });

      return this;
    },
    // The wheel widget has to be initialized after parent widget is rendered
    postRender: function() {
      var self = this;

      self.$el.circularList();

      $('#mfw-toggle-scroll').click(function() {
        $('#mfw-toggle-scroll-device').attr('src','/sites/default/games/musical_ferris_wheel/images/kampi-action.gif');
        if ($(this).hasClass('checked')) {
          $(this).removeClass('checked');
        } else {
          $(this).addClass('checked');
        }

        self.$el.circularList('toggle', 10, 30);
      });

      return this;
    },
    setCurrentAlbum: function(album) {
      var self = this;
      var view = $('#mfw-current-album');
      view.html((new CurrentAlbumView({model: album})).render().el);

      view.on('click', function() {
        self.trigger('albumSelected', album);
      });

      return this;
    }
  });

  var AlbumView = Backbone.View.extend({
    tagName: 'li',
    events: {
      'click img': 'select'
    },
    render: function() {
      var t = _.template(Cache.templates['album-view']);
      this.$el.append(t({ album: this.model }));
      return this;
    },
    select: function() {
      this.trigger('albumSelected', this.model);
      return this;
    },
  });

  var CurrentAlbumView = Backbone.View.extend({
    render: function() {
      var t = _.template(Cache.templates['album-view']);
      this.$el.html(t({ album: this.model }));
      return this;
    }
  });

  var AlbumInfoView = Backbone.View.extend({
    id: 'mfw-album-info-view',
    className: 'game-overlay',
    events: {
      'click #mfw-media a': function(event) {
        var i = $(event.currentTarget).data('id');
        var media = this.model.sources.at(i);
        this.trigger('mediaSelected', media);
      }
    },
    render: function() {
      var t = _.template(Cache.templates['album-info-view']);
      this.$el.html(t({ album: this.model }));
      return this;
    }
  });

  var MediaView = Backbone.View.extend({
    id: 'mfw-media-view',
    className: 'game-overlay',
    initialize: function() {
      this.template = _.template(this.options.templates.media);
      this.media = null;
    },
    render: function() {
      this.$el.html(this.template({ media: this.media }));

      if (this.media.get('embed').length > 0) {
        this.$el.append(this.media.get('embed'));
      }

      return this;
    },
    showMedia: function(media) {
      this.media = media;
      this.render();
    },
    fadeOut: function() {
      // Empty content to unload any embedded stuff
      this.$el.html('');
      this.$el.fadeOut.apply(this.$el, arguments);
    }
  });

  var ArchiveView = Backbone.View.extend({
    id: 'mfw-archive-view',
    className: 'game-overlay carousel',
    events: {
      'click .game-pager a': function(event) {
        var i = this.$('.game-pager a').index(this.$(event.currentTarget));
        this.$('.game-slider').carousel(i);
      },
      'click .item a': function(event) {
        var i = this.$(event.currentTarget).data('id');
        var album = this.collection.get(i);
        this.trigger('albumSelected', album);
      }
    },
    initialize: function() {
      this.template = _.template(this.options.templates.archive);
    },
    render: function() {
      this.$el.html(this.template({
        albums: this.collection.models,
        pageSize: 10
      }));
      this.$('.game-pager a').addClass('active');
      this.slider().carousel('pause');
      return this;
    },
    slider: function() {
      return this.$('#mfw-archive-slider');
    }
  });

  var Album = Backbone.Model.extend({
    defaults: {
      name: '',
      cover: '',
      multimedia: {}
    }
  });

  var AlbumList = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: '',
        name: '',
        description: '',
        cover: null,
        source: []
      },
      constructor: function(data) {
        Backbone.Model.apply(this, arguments);
        this.sources = this.parseSources(data.source);
      },
      parseSources: function(raw_list) {
        var items = [];
        for (var i = 0; i < raw_list.length; i++) {
          items.push(this.parseSource(raw_list[i]));
        }
        return new SourceCollection(items);
      },
      parseSource: function(raw) {
        var item = {
          id: raw.id,
          category: this.sourceValue(raw.field_category),
          embed: this.sourceValue(raw.field_embed),
          url: this.sourceValue(raw.field_url),
          title: this.sourceValue(raw.field_title)
        };
        return item;
      },
      sourceValue: function(src) {
        return src.und[0] ? src.und[0].value : null;
      }
    })
  });

  var SourceCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: '',
        title: '',
        embed: '',
        url: '',
      }
    })
  });

  Okariino.Game[game_name] = MusicalFerrisWheel;
})(jQuery);
