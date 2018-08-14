(function($) {
  "use strict";

  var MobilePhoneVideos = Okariino.Game.BaseExt.extend({
    name: "mobile_phone_videos",
    resources: {
      videos: { src: '/rest/mpv_videos', type: createjs.LoadQueue.JSON },
      mpv_intro: 'sounds/22 Katsele ja kuuntele.ogg',
    },
    actions: {
      index: function() {
        this.callState(this, 'play');
      },
      video: function(id) {
        this.callState(this, 'showVideo', this.videos.get(id));
      }
    },
    init: function() {
      Okariino.olli.speak('mpv_intro');

      this.videos = new VideoCollection(this.data.videos);
      this.videoView = new VideoView();
      this.selectVideoView = new SelectVideoView({
        url: this.url.bind(this),
        collection: this.videos
      });

      this.board.append(this.selectVideoView.$el);
      this.board.parent().append(this.videoView.$el.hide());
      this.initStates(this.url('index'));
    },
    postInit: function() {
      this.on('initReady', this.play, this);
      this.videoView.on('closed', function() {
        this.buttons.back.trigger('click');
      }, this);
    },
    play: function() {
      this.selectVideoView.show();
    },
    showVideo: function(video) {
      this.videoView.model = video;
      this.videoView.show();
    }
  });

  var SelectVideoView = Okariino.Game.View.Base.extend({
    id: 'mpv-select-video',
    overlay: true,
    serialize: function() {
      return {
        videoUrl: this.createUrlHelper('video'),
        videos: this.collection.models
      };
    },
    events: {
      'click #mpv-videos a': function(event) {
        var id = this.$(event.currentTarget).data('id');
        this.trigger('videoSelected', this.collection.get(id));
      }
    }
  });

  var VideoView = Okariino.Game.View.Base.extend({
    id: 'mpv-video',
    fullscreen: true,
    serialize: function() {
      return {
        video: this.model
      };
    },
    events: {
      'click .gb-close': function() {
        this.$el.fadeOut(function() { $(this).html(''); });
        this.trigger('closed');
      }
    }
  });

  var VideoCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: 0,
        title: null,
        embed: null,
        file: null
      }
    })
  });
})(jQuery);
