(function($) {
  "use strict";

  var MovieRepresentations = Okariino.Game.BaseExt.extend({
    name: "movie_representations",
    resources: {
//       movies: '/rest/mvr_movies#.json',
      movies: { src: '/rest/mvr_movies', type: createjs.LoadQueue.JSON },
      mr_intro: 'sounds/23 Tutustu lastenelokuviin.ogg',
      jingle_photo: 'sounds/Loru_Muikku tai cheese.ogg',
    },
    actions: {
      index: function() {
        this.callState(this, 'selectMovie');
      },
      movie: function(id) {
        var movie = this.movies.get(id);
        this.callState(this, 'showMovie', movie);
      },
      media: function(movie_id, media_id) {
        var movie = this.movies.get(movie_id);
        var media = movie.sources.get(media_id);
        this.callState(this, 'showMedia', media);
      },
      archive: function() {
        this.callState(this, 'archive');
      }
    },
    init: function() {
      Okariino.olli.speak('mr_intro');

      this.movies = new MovieCollection(this.data.movies);
      this.selectMovieView = new SelectMovieView({
        collection: this.movies,
        gameRoot: this.root,
        url: this.url.bind(this)
      });
      this.movieView = new MovieView({
        url: this.url.bind(this)
      });
      this.mediaView = new MediaView;
      this.archiveView = new ArchiveView({
        collection: this.movies,
        url: this.url.bind(this)
      });

      this.board.append(this.mediaView.el, this.movieView.el, this.archiveView.el, this.selectMovieView.el);
      this.initStates(this.url('index'));
    },
    postInit: function() {
      this.on('initReady', this.selectMovie, this);
    },
    selectMovie: function() {
      this.selectMovieView.show();
    },
    showMovie: function(movie) {
      this.movieView.model = movie;
      this.movieView.show();
    },
    showMedia: function(media) {
      this.mediaView.model = media;
      this.mediaView.show();
    },
    archive: function() {
      this.archiveView.show();
    }
  });

  var SelectMovieView = Okariino.Game.View.Base.extend({
    id: 'mr-select-movie',
    overlay: true,
    serialize: function() {
      var movieUrl = function(i) {
        var id = this.collection.at(i).get('id');
        return this.options.url('movie', id);
      }.bind(this);

      return {
        movies: this.collection.models,
        baseUrl: this.options.gameRoot + '/images',
        archiveUrl: this.createUrlHelper('archive'),
        movieUrl: movieUrl
      };
    },
    events: {
      'hover #mr-decoration-items area': function(event) {
        $(event.currentTarget).closest('li').find('img').css('opacity', 0.5);
      },
      'mouseout #mr-decoration-items area': function(event) {
        $(event.currentTarget).closest('li').find('img').css('opacity', 1.0);
      },
    }
  });

  var MovieView = Okariino.Game.View.Base.extend({
    id: 'mr-movie',
    overlay: true,
    serialize: function() {
      var mediaUrl = function(media_id) {
        var movie_id = this.model.get('id');
        return this.options.url('media', movie_id, media_id);
      }.bind(this);

      return {
        movie: this.model,
        mediaUrl: mediaUrl
      };
    }
  });

  var MediaView = Okariino.Game.View.Base.extend({
    id: 'mr-media',
    overlay: true,
    serialize: function() {
      return {
        media: this.model
      };
    }
  });

  var ArchiveThumbView = Okariino.Game.View.Base.extend({
    template: _.template('<img src="<%= cover %>" alt="<%= name %>"/>'),
    tagName: 'a',
    init: function() {
      this.$el.attr('href', this.url('movie', this.model.id))
    },
    serialize: function() {
      return this.model.attributes
    }
  });

  var ArchiveView = Okariino.Game.View.Slider.extend({
    id: 'mvr-archive-view',
    overlay: true,
    pageSize: 8,
    itemView: ArchiveThumbView,
    init: function() {
      this.itemView.prototype.url = this.options.url;
    }
  });

  var MovieCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: '',
        name: '',
        description: '',
        cover: null,
        source: []
      },
      hasMedia: function() {
        return this.sources.length > 0;
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
}(jQuery));
