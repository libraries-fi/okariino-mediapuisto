/*
 * Multi-track music song
 *
 * Plays a single song that is split to multiple tracks. The user can then
 * toggle each track on/off to hear only specific instruments play.
 */

(function($) {
  "use strict";

  var RhythmFlower = Okariino.Game.BaseExt.extend({
    name: 'rhythm_flower',
    resources: {
      rf_intro: 'sounds/11 Kokeile ja kuuntele erilaisia.ogg',
      rf_tracks: {
        basso: 'sounds/rhythms/Rytmikukka_basso.ogg',
        claves: 'sounds/rhythms/Rytmikukka_claves.ogg',
        congas: 'sounds/rhythms/Rytmikukka_congas.ogg',
        piano1: 'sounds/rhythms/Rytmikukka_piano1.ogg',
        piano2: 'sounds/rhythms/Rytmikukka_piano2.ogg',
        timbas: 'sounds/rhythms/Rytmikukka_timbacongas.ogg',
//         tutti: 'sounds/rhythms/Rytmikukka_tutti.ogg',
      }
    },
    init: function() {
      Okariino.olli.speak('rf_intro');

      this.tracks = new AudioTrackCollection;

      _.each(this.resources.rf_tracks, function(file, id) {
        var model = new this.tracks.model;
        model.set('id', 'rf_tracks/' + id);
        this.tracks.add(model);
      }.bind(this));

      this.gameView = new GameView({
        soundPrefix: 'rf_tracks/',
        collection: this.tracks
      });

      this.board.append(this.gameView.el);
      this.tracks.on('change', function(model, value) {
        this.sound.mute(model.id, model.get('muted'));
      }, this);

      this.tracks.at(0).on('complete', function() {
        this.gameView.$('[name="toggle-play"]').prop('checked', false);
      }.bind(this));

      this.tracks.at(0).on('succeeded', function() {
        this.gameView.$('[name="toggle-play"]').prop('checked', true);
      }.bind(this));

      this.gameView.on('togglePlayback', function(state) {
        var player = this.sound;
        this.tracks.each(function(model) {
          player[state ? 'play' : 'stop'](model.id, true);
        });
      }, this);
    },
    postInit: function() {
      this.on('initReady', function() {
        this.gameView.render();
      }, this);
    },
  });

  var GameView = Okariino.Game.View.Base.extend({
    id: 'rf-game-view',
    events: {
      'click a.sound': function(event) {
        var elem = this.$(event.currentTarget);
        var sound_id = elem.data('track');
        var sound = this.collection.get(sound_id);
        sound.set('muted', !elem.hasClass('muted'));

        if (sound.get('muted')) {
          elem.addClass('muted');
        } else {
          elem.removeClass('muted');
        }
      },
      'change [name="toggle-play"]': function(event) {
        // Checked: play, unchecked: pause
        var elem = $(event.currentTarget);
        var state = elem.prop('checked');
        elem.parent()[state ? 'addClass' : 'removeClass']('pressed');
        this.trigger('togglePlayback', state);
      }
    },
    serialize: function() {
      return {
        prefix: this.options.prefix,
        tracks: this.collection
      }
    },
    afterRender: function() {
      var prefix = this.options.soundPrefix;
      var player = this.options.player;

      this.$('a.sound').each(function() {
        if (Math.randomInt(0, 1) == 0) {
          $(this).trigger('click');
        }
      });
    },
  });

  var AudioTrackCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: null,
        muted: false,
      }
    })
  });
}(jQuery));
