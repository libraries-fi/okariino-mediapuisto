(function($) {
  "use strict";

  var Olivia = Okariino.Game.BaseExt.extend({
    name: 'olivia',
    loadTemplates: false,
    actions: {
      jingle: function(id) {
        this.playJingle(id);
      }
    },
    jingle: function() {
      return window.location.hash.split('/').pop();
    },
    init: function() {

    },
    playJingle: function(id) {
      var sound_id = 'olivia_{0}'.format(this.jingle());
      Okariino.olivia.speak(sound_id);
    },
    _run: function() {
      Okariino.Game.BaseExt.prototype.run.apply(this, arguments);
    }
  });

  // Some bug prevents overriding run() using extend() so do it here
  Olivia.prototype.run = function() {
    if (!this.data) {
      this.data = {};
    }

    Okariino.olli.stop();

    var jingle = this.jingle();
    var sound_id = 'olivia_{0}'.format(jingle);

    if (!this.data || !(sound_id in this.data)) {
      var res = {};
      res[sound_id] = 'sounds/{0}.ogg'.format(jingle);
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
