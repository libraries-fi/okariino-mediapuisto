/**
* Memory Game
*
* Displays a set of pairs of identical pictures that must then be found.
**/

(function($) {
  "use strict";

  var game_name = "memory_game";
  var Cache = {};

  var load_cards = function(callback) {
    var url = '/sites/default/games/memory_game/demo_cards.json';
    var rq = $.ajax({ url: url, cache: false });

    rq.done(function(albums) { callback(albums); });
    rq.fail(function(error) { callback(null, error); });
  };

  var MemoryGame = (function() {
    var self;

    var foo = function(settings, container) {
      self = this;
      foo.prototype.constructor.apply(this, [game_name, settings, container]);
      self.loadStyle(game_name);
    };

    foo.prototype = Object.create(Okariino.Game.Base.prototype);

    foo.prototype.run = function() {
      var back = self.createButton(self.BACK_BUTTON).hide();
      var restart = self.createButton(self.RESTART_BUTTON).hide();
      var board = self.createBoard(self.elem.container, 'mg-board', [restart, back]);

      var level_view = new ChooseLevelView();
      var game_view = new MemoryGameView();

      back.click(function() {
        game_view.$el.fadeOut();
        level_view.$el.fadeIn();
        restart.fadeOut();
        back.fadeOut();
      });

      restart.click(function() {
        restart.fadeOut();
        level_view.trigger('levelSelected', game_view.level);
      });

      game_view.on('gameFinished', function() {
        this.sound.only('okariino/success');
        restart.fadeIn();
      }, this);

      var resources = {
        'templates': this.resource('templates.xml'),
        'cards': this.resource('demo_cards.json'),
        'mg-intro': this.resource('sounds/5a Hienoa löysit muistipelin.ogg'),
        'mg-tutorial': this.resource('sounds/5b Käännä kortteja kunnes.ogg'),
      };

//       load_cards(function(cards, error) {
      this.load(resources, function(resources) {
        Cache.templates = self.parseTemplates(resources.templates);
        board.append(level_view.render().el);
        board.append(game_view.el);
        Okariino.olli.speak('mg-intro');

        level_view.on('levelSelected', function(level) {
          Okariino.olli.speakOnce('mg-tutorial');

          var deck = init_deck(resources.cards, level);
          var model = new CardList(deck);

          game_view.reset();
          game_view.level = level;
          game_view.collection = model;

          level_view.$el.fadeOut('fast', function() {
            back.show();
            game_view.render().$el.fadeIn();
          });
        });
      });
    };

    var init_deck = function(cards, pairs) {
      var swap = function(data, a, b) {
        var tmp = data[a];
        data[a] = data[b];
        data[b] = tmp;
      };

      pairs = Math.min(cards.length, pairs);
      cards = cards.slice();

      var deck = new Array();

      while (pairs-- > 0) {
        var i = Math.ceil(Math.random() * cards.length - 1);
        var card = cards.splice(i, 1)[0];

        deck.push(card);
        deck.push(card);
      }

      deck.shuffle();

      return deck;
    };

    return foo;
  })();

  var Card = Backbone.Model.extend({
    defaults: {
      name: "",
      image: "",
    }
  });

  var CardList = Backbone.Collection.extend({
    model: Card
  });

  var ChooseLevelView = Backbone.View.extend({
    id: 'mg-levels',
    tagName: 'ul',

    events: {
      'click a': function(e) {
        this.trigger('levelSelected', $(e.currentTarget).data('pairs'));
      }
    },

    render: function(e) {
      var t = _.template(Cache.templates['choose-level-view']);
      this.$el.html(t({levels: [4, 9, 12]}));

      return this;
    }
  });

  var MemoryGameView = Backbone.View.extend({
    tagName: 'ul',
    id: 'mg-cards',
    events: {
      'click #mg-cards a': function(e) {
        var i = this.$('#mg-cards').children().index($(e.currentTarget).closest('li'));
        this.activateCard(this.cards[i]);
      }
    },
    initialize: function() {
      this.activeCard = null;
      this.level = 0;
      this.cards = [];
      this.reset();
    },
    render: function() {
      var self = this;
      var pairs = this.collection.length / 2;

      this.$el.attr('class', 'pairs-{0}'.format(pairs));
      this.$el.html('');

      $(this.collection.models).each(function(i, card) {
        var v = new CardView({model: card, index: i});
        self.cards.push(v);
        self.$el.append(v.render().el);

        v.$el.on('click', function() {
          self.activateCard(v);
        });
      });

      return this;
    },
    reset: function() {
      this.locked = false;
      this.foundCards = 0;
    },
    activateCard: function(card) {
      if (card == this.activeCard || this.locked || card.isLocked()) {
        return;
      }

      var self = this;
      var active = this.activeCard;

      if (active) {
        var current_name = card.model.get('name');
        var active_name = active.model.get('name');

        if (current_name == active_name) {
          active.setFound(true).setLocked(true);
          card.setFound(true).setLocked(true);

          self.foundCards += 2;

          if (self.foundCards == self.collection.length) {
            self.trigger('gameFinished');
          }
        } else {
          active.setFailed(true);
          card.setFailed(true);
        }

        self.activeCard = null;
        self.locked = true;

        setTimeout(function() {
          self.locked = false;
        }, 500);

        setTimeout(function() {
          active.reset();
          card.reset();
        }, 1500);
      } else {
        this.activeCard = card;
        card.setActive(true);
      }
    }
  });

  var CardView = Backbone.View.extend({
    tagName: 'li',

    render: function() {
      var t = _.template(Cache.templates['card-view']);

      this.$el.html(t(this.model.toJSON()));

      return this;
    },

    reset: function() {
      return this.setActive(false).setFailed(false).setFound(false);
    },

    setActive: function(state) {
      return this.setProperty('active', state);
    },

    setFound: function(state) {
      return this.setProperty('success', state);
    },

    setLocked: function(state) {
      return this.setProperty('locked', state);
    },

    isLocked: function() {
      return this.getProperty('locked');
    },

    setFailed: function(state) {
      return this.setProperty('error', state);
    },

    setProperty: function(name, state) {
      var f = state ? 'addClass' : 'removeClass';
      this.$el[f](name);

      return this;
    },

    getProperty: function(name) {
      return this.$el.hasClass(name);
    }
  });

  Okariino.Game[game_name] = MemoryGame;

})(jQuery);
