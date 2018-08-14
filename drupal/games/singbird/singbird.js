(function($) {
  "use strict";

  var Bird = Okariino.Game.BaseExt.extend({
    name: 'singbird',
    loadTemplates: false,
    actions: {
      song: function(id) {
        this.playSong(id);
      }
    },
    song: function() {
      return window.location.hash.split('/').pop();
    },
    init: function() {
      this.board.addClass('song-' + this.song());
    },
    playSong: function(id) {
      var player = this.sound;
      var sound_id = 'bird_' + this.song();
      var sound = this.sound.play(sound_id);
    },
    _run: function() {
      Okariino.Game.BaseExt.prototype.run.apply(this, arguments);
    }
  });

  // Some bug prevents overriding run() using extend() so do it here
  Bird.prototype.run = function() {
    if (!this.data) {
      this.data = {};
    }
    Okariino.olli.stop();

    var song = this.song();
    var sound_id = 'bird_{0}'.format(song);

    if (!this.data || !(sound_id in this.data)) {
      var res = {};
      res[sound_id] = 'sounds/{0}.ogg'.format(song);
      res = this.preProcessResources(res);

      this.load(res, function(data) {
        this.data[sound_id] = data[sound_id];
        this._run();
      });
    } else {
      this._run();
    }
  }
}(jQuery));
