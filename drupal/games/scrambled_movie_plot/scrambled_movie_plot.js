(function($) {
  "use strict";

  var ScrambledMoviePlot = Okariino.Game.BaseExt.extend({
    name: 'scrambled_movie_plot',
    resources: {
      stories: 'demo_scenes.json',
      smp_intro: 'sounds/15 Laita tarinanpalat järj.ogg',
      smp: {
        s1: 'sounds/16 Pomppu pupulla on.ogg',
        s2: 'sounds/17 Sinähän keksit.ogg',
        s3: 'sounds/18 Pomppu pupun tarina on.ogg',
        s4: 'sounds/19 Olivia tykkää maalata.ogg',
        s5: 'sounds/20 Sinähän keksit Olivia.ogg',
        s6: 'sounds/21 Nyt Olivian tarina on.ogg',
      }
    },
    actions: {
      index: function() {
        this.callState(this, 'play');
      },
      story: function(i) {
        var story = this.stories.at(i);
        this.callState(this, 'showStory', story);
      }
    },
    init: function() {
      Okariino.olli.speak('smp_intro');

      this.stories = new StoryList(this.data.stories);
      var templates = this.parseTemplates(this.data.templates)

      this.selectView = new SelectStoryView({
        templates: templates,
        collection: this.stories,
        url: this.url.bind(this),
      });

      this.storyView = new StoryView({
        templates: templates
      });

      this.board.append(this.selectView.el, this.storyView.el);

      this.initStates(this.url('index'));
    },
    postInit: function() {
      this.on('initReady', this.play, this);
      this.on('restartState', this.restart, this);
      this.storyView.on('finished', this.finished, this);
    },
    play: function() {
      this.selectView.show();
    },
    restart: function() {
      this.storyView.show();
    },
    showStory: function(story) {
      this.storyView.model = story;
      this.restart();

      Okariino.olli.speak(story.get('sounds').intro);
    },
    finished: function(state) {
      this.buttons.restart.fadeIn();

      var sound_id = this.storyView.model.get('sounds')[state ? 'success' : 'error'];
      Okariino.olli.speak(sound_id);
    }
  });

//   var SelectStoryView = Backbone.View.extend({
  var SelectStoryView = Okariino.Game.View.Base.extend({
    id: 'smp-select-story-view',
    className: 'game-overlay',
    events: {
      'click li': function(event) {
        var i = $(event.currentTarget).data('story-id');
        var story = this.collection.at(i);
        this.trigger('selected', story);
      }
    },
    serialize: function() {
      return {
        stories: this.collection.models,
        storyUrl: this.createUrlHelper('story'),
      };
    }
  });

//   var StoryView = Backbone.View.extend({
  var StoryView = Okariino.Game.View.Base.extend({
    id: 'smp-story-view',
    className: 'game-overlay',
    init: function(options) {
      this.on('dropped', this.handleDrop);
    },
    serialize: function() {
      return {
        scenes: this.model.scenes,
      }
    },
    afterRender: function() {
      var self = this;
      var $ = this.$.bind(this);

      $('.smp-drag img').hammer({ drag_block_vertical: true, drag_max_touches: 3 })
        .on('drag', function(e) {
          if ($(this).parent().hasClass('smp-drop')) {
            return false;
          }

          e.preventDefault();
          e.gesture.srcEvent.preventDefault();

          var g = e.gesture;

          $(this).css({
            marginLeft: g.deltaX,
            marginTop: g.deltaY
          });
        })
        .on('dragend', function(e) {
          if ($(this).parent().hasClass('smp-drop')) {
            return false;
          }

          var block = $(this);
          var g = e.gesture;
          var center = g.center;
          var found = false;

          $('.smp-drop').each(function(i) {
            if ($(this).children().length == 0) {
              var offset = $(this).offset();
              offset.left += $(this).width() / 2;
              offset.top += $(this).height() / 2;
              var dist = Math.sqrt(Math.pow(center.pageX - offset.left, 2) + Math.pow(center.pageY - offset.top, 2));

              if (dist < 50) {
                block.css({ marginLeft: 0, marginTop: 0 });
                block.appendTo(this);
                found = true;

                if ($('.smp-drag img').length == 0) {
                  self.trigger('finished', self.validate());
                }

                return false;
              }
            }
          });

          if (!found) {
            $(this).animate({
              marginLeft: 0,
              marginTop: 0,
            });
          }
        });

      return this;
    },
    restart: function() {
      this.render();
    },
    validate: function() {
      var valid = true;

      this.slots().each(function(i, item) {
        var $e = $(item);
        var $d = $e.children('img').first();
        var answer = $e.data('answer');
        var value = $d.data('value');

        if (answer != value) {
          $e.addClass('error');
          $d.css('opacity', 0.8);
          valid = false;
        } else {
          $e.addClass('correct');
        }
      });

      return valid;
    },
    handleDrop: function(item, slot) {
      var filled = 0;
      var slots = this.slots();

      slots.each(function(i, item) {
        if ($(item).data('value') != null) {
          filled++;
        }
      });

      if (filled == slots.length) {
        var ok = this.validate();
        this.trigger('finished', ok);
      }
    },
    slots: function() {
      return this.$('#smp-drops li');
    }
  });

  var StoryList = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        name: '',
        cover: '',
        scenes: []
      },
      constructor: function() {
        Backbone.Model.prototype.constructor.apply(this, arguments);
        this.scenes = new SceneList(this.get('scenes'));
      }
    }),
  });

  var SceneList = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: null,
        image: '',
        audio: '',
      }
    })
  });
})(jQuery);
