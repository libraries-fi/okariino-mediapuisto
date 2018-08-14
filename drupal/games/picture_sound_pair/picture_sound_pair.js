(function($) {
  "use strict";

  var PictureSoundPair = Okariino.Game.BaseExt.extend({
    name: 'picture_sound_pair',
    resources: {
      puzzles: 'demo_puzzles.json',
      psp_intro: 'sounds/25 Kokeile erilaisia ääniä.ogg',
      psp: {
        elephant: 'sounds/Mikä ääni_Elefanttimarssi.ogg',
        spider: 'sounds/Mikä ääni_Hämähäkki.ogg',
        rabbit: 'sounds/Mikä ääni_Jänis istui maassa.ogg',
        maija: 'sounds/Mikä ääni_Maijall oli karitsa.ogg',
        frogs: 'sounds/Mikä ääni_Pienet sammakot.ogg',
        nokipoika: 'sounds/Mikä ääni_Pieni Nokipoika.ogg',
        piiri: 'sounds/Mikä ääni_Piiri pieni pyörii.ogg',
        rulla: 'sounds/Mikä ääni_Tuu tuu tupakkarulla.ogg',
      },
      jingle_media: 'sounds/Loru_Media on sitä että.ogg',
    },
    actions: {
      index: function() {
        this.callState(this, 'play');
      }
    },
    init: function() {
      Okariino.olli.speak('psp_intro');

      this.puzzles = new PuzzleCollection(this.data.puzzles);
      this.gameView = new GameView({
        sounds: Object.keys(this.data.psp),
        collection: this.puzzles,
        res: this.resource.bind(this),
      });

      this.board.append(this.gameView.$el);
    },
    postInit: function() {
      this.on('initReady', this.play, this);
      this.on('restartState', this.play, this);

      this.gameView.on('finished', function() { this.buttons.restart.fadeIn(); }, this);

      this.gameView.on('playSound', function(id) {
        this.sound.only('psp/{0}'.format(id))
      }, this);

      this.gameView.on('success', function() {
        this.sound.only('okariino/success');
      }, this);

      this.gameView.on('failure', function() {
        this.sound.play('okariino/failure');
      }, this);
    },
    play: function() {
      this.gameView.collection = new PuzzleCollection(this.data.puzzles.shuffle());
      this.gameView.start();
    },
    note: function(name) {
      return this.resource('images/{0}.png'.format(name));
    },
    sound: function(name) {
      return this.resource('sounds/{0}'.format(name));
    }
  });

  var GameView = Okariino.Game.View.Base.extend({
    id: 'psp-game-view',
    events: {
      'change input[name="sound"]': function(event) {
        var input = $(event.currentTarget);
        var row = input.closest('li');

        if (!row.hasClass('disabled') && !this.solved) {
          this.validate(input.val());
        }
      },
      'click button.play': function(event) {
        var button = $(event.currentTarget);
        var row = button.closest('li');
        var id = button.data('id');

        if (!row.hasClass('disabled') && !this.solved) {
          row.parent().find('button').removeClass('active');
          button.addClass('active');
          this.trigger('playSound', id);
        }
      }
    },
    init: function() {
      this.current = -1;
      this.on('afterRender', function(view) {
        var row = this.$el.find('#psp-puzzles li').removeClass('active');
        $(row[this.current]).addClass('active');
      });

      this.on('success', function() {
        if (!this.isFinished()) {
          var game = this;
          setTimeout(function() {
            game.next();
          }, 2000);
        }
      });
    },
    serialize: function() {
      var notes = ['note1', 'note2', 'note3', 'note4', 'note5', 'note6',
        'note7', 'note8'].shuffle();

      var sounds = _(this.options.sounds).shuffle();

      var note_helper = function(note) {
        return this.options.res('images/{0}.png'.format(note));
      }.bind(this);

      return {
        puzzles: this.collection.models,
        puzzle: this.collection.at(this.current),
        sounds: sounds,
        notes: notes,
        noteUrl: note_helper,
      }
    },
    next: function() {
      this.solved = false;
      this.current++;
      this.render();
    },
    validate: function(id) {
      var input = this.$('input[value="{0}"]'.format(id));
      var row = input.closest('li');
      var model = this.collection.at(this.current);

      if (row.hasClass('disabled') || this.solved) {
        return false;
      }

      if (model.get('answer') == id) {
        row.addClass('correct');
        this.solved = true;
        this.trigger('success');

        if (this.isFinished()) {
          this.trigger('finished');
        }
        return true;
      } else {
        input.prop('disabled', true);
        input.prop('checked', false);
        row.addClass('disabled');
        this.trigger('failure');
        return false;
      }
    },
    start: function(id) {
      this.current = -1;
      this.next();
    },
    isFinished: function() {
      return (this.current == this.collection.length - 1) && this.solved;
    }
  });

  var SoundCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: 0,
        sound: null,
        icon: null
      }
    })
  });

  var Puzzle = Backbone.Model.extend({
    defaults: {
      id: 0,
      answer: 0,
      picture: null,
      sounds: []
    },
    constructor: function() {
      this.sounds = new SoundCollection();
      Backbone.Model.apply(this, arguments);
    },
    set: function(attrs, options) {
      Backbone.Model.prototype.set.call(this, attrs, options);
      this.sounds.reset(attrs.sounds);
    }
  });

  var PuzzleCollection = Backbone.Collection.extend({
    model: Puzzle
  });
})(jQuery);
