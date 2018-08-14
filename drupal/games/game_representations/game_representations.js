(function($) {
  "use strict";
  var GameRepresentations = Okariino.Game.BaseExt.extend({
  name: 'game_representations',
  resources: {
//     games: '/rest/grt_games#.json',
    games: { src: '/rest/grt_games', type: createjs.LoadQueue.JSON },
    gr_intro: 'sounds/34 Onpa pelejä monenlaisia.ogg',
    jingle_game: 'sounds/Loru_Peli.ogg',
  },
  actions: {
    index: function() {
      this.callState(this, 'play');
    },
    game: function(id) {
      var game = this.games.get(id);
      this.callState(this, 'showGame', game);
    },
    media: function(game_id, media_id) {
      var media = this.games.get(game_id).media.get(media_id);
      this.actions.game(game_id);
      this.callState(this, 'showMedia', media);
    },
    archive: function() {
      this.callState(this, 'archive');
    }
  },
  init: function() {
    Okariino.olli.speak('gr_intro');

    this.games = new GameCollection(this.data.games);
    this.gamesView = new GamesView({
      count: 4,
      collection: this.games,
      url: this.url.bind(this)
    });
    this.gamePreview = new GamePreview({
      url: this.url.bind(this)
    });
    this.archiveView = new ArchiveView({
      collection: this.games,
      url: this.url.bind(this)
    });

    this.board.append(this.gamePreview.el, this.archiveView.el, this.gamesView.el);
    this.initStates(this.url('index'));
  },
  postInit: function() {
    this.on('initReady', this.play, this);
  },
  play: function() {
    this.gamesView.show();
  },
  showGame: function(game) {
    this.gamePreview.model = game;
    this.gamePreview.show();
  },
  archive: function() {
    this.archiveView.show();
  }
  });

  var GamesView = Okariino.Game.View.Base.extend({
    id: 'grt-games-view',
    overlay: true,
    serialize: function() {
      return {
        gameUrl: this.createUrlHelper('game'),
        archiveUrl: this.createUrlHelper('archive'),
        games: this.collection.models.slice(0, this.options.count)
      }
    }
  });

  var GamePreview = Okariino.Game.View.Base.extend({
    id: 'grt-game-preview',
    overlay: true,
    serialize: function() {
      return {
        mediaUrl: this.createUrlHelper('media'),
        game: this.model
      }
    }
  });

  var ArchiveThumbView = Okariino.Game.View.Base.extend({
    template: _.template('<img src="<%= cover %>" alt="<%= name %>"/>'),
    tagName: 'a',
    init: function() {
      this.$el.attr('href', this.url('game', this.model.id))
    },
    serialize: function() {
      return this.model.attributes
    }
  });

  var ArchiveView = Okariino.Game.View.Slider.extend({
    id: 'grt-archive-view',
    overlay: true,
    pageSize: 10,
    itemView: ArchiveThumbView,
    init: function() {
      this.itemView.prototype.url = this.options.url;
    }
  });

  var GameCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      constructor: function(data, options) {
      Backbone.Model.apply(this, arguments);
      this.media = new Backbone.Collection(data.media);
      }
    })
  });
}(jQuery));
