/*
 * Multi-track music song
 *
 * Plays a single song that is split to multiple tracks. The user can then
 * toggle each track on/off to hear only specific instruments play.
 */

(function($) {
  "use strict";

  var TwinkleStar = Okariino.Game.BaseExt.extend({
    name: 'twinkle_star',
    resources: {
      ts_intro: 'sounds/11 Kokeile ja kuuntele erilaisia.ogg',
      ts_tracks: {
        basso: 'sounds/rhythms/Tuiki tuiki 1 melodiapiano.ogg',
        claves: 'sounds/rhythms/Tuiki tuiki 2 piano2.ogg',
        congas: 'sounds/rhythms/Tuiki tuiki 3 oboe1.ogg',
        piano1: 'sounds/rhythms/Tuiki tuiki 4 oboe2.ogg',
        piano2: 'sounds/rhythms/Tuiki tuiki 5 kitara.ogg',
        timbas: 'sounds/rhythms/Tuiki tuiki 6 jouset.ogg',
//         tutti: 'sounds/rhythms/Tuiki tuiki_tutti.ogg',
      }
    },
    init: function() {
      Okariino.olli.speak('ts_intro');

      this.tracks = new AudioTrackCollection;

      _.each(this.resources.ts_tracks, function(file, id) {
        var model = new this.tracks.model;
        model.set('id', 'ts_tracks/' + id);
        this.tracks.add(model);
      }.bind(this));

      this.gameView = new GameView({
        soundPrefix: 'ts_tracks/',
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
    id: 'ts-game-view',
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
