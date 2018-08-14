(function($) {
  "use strict";

  var WhoseRingtone = Okariino.Game.BaseExt.extend({
    name: 'whose_ringtone',
    resources: {
      wrt_intro: 'sounds/24 Kenelle soittoääni kuuluu.ogg',
      wrt: {
        elephant: 'sounds/Kenen kännykkä_Elefantti.ogg',
        rabbit: 'sounds/Kenen kännykkä_Jänis.ogg',
        boy: 'sounds/Kenen kännykkä_Nokipoika.ogg',
        grandpa: 'sounds/Kenen kännykkä_Vaari.ogg',
        maija: 'sounds/Kenen kännykkä_Maija.ogg',
        frog: 'sounds/Kenen kännykkä_Sammakko.ogg',
      }
    },
    init: function() {
      Okariino.olli.speak('wrt_intro');

      this.gameView = new GameView({
        collection: new CharacterCollection([
          {
            id: 'frog',
            picture: 'frog.png',
            sound: 'sound/frog'
          },
          {
            id: 'rabbit',
            picture: 'rabbit.png',
            sound: 'sound/rabbit'
          },
          {
            id: 'boy',
            picture: 'boy.png',
            sound: 'sound/boy'
          },
          {
            id: 'grandpa',
            picture: 'grandpa.png',
            sound: 'sound/grandpa'
          },
          {
            id: 'maija',
            picture: 'maija.png',
            sound: 'sound/maija'
          },
          {
            id: 'elephant',
            picture: 'elephant.png',
            sound: 'sound/elephant'
          }
        ])
      });
      this.board.append(this.gameView.el);

      this.gameView.on('finished', function() {
        this.buttons.restart.fadeIn();
      }, this);
      this.gameView.on('phoneSelected', this.playSound, this);
      this.gameView.on('success', function() {
        this.sound.only('okariino/success');
      }, this);
      this.gameView.on('failure', function() {
        this.sound.only('okariino/failure');
      }, this);
    },
    postInit: function() {
      this.on('initReady', this.play, this);
      this.on('restartState', this.play, this);
    },
    play: function() {
      this.buttons.restart.fadeOut();
      this.gameView.render();
    },
    playSound: function(id) {
      this.sound.stopAll();
      this.sound.play('wrt/' + id);
    }
  });

  var GameView = Okariino.Game.View.Base.extend({
    id: 'wrt-game-view',
    overlay: true,
    events: {
      'change .character input': function(event) {
        this.clearErrors();
        this.trigger('characterSelected', $(event.currentTarget).val());
        this.validateSelection();
      },
      'change .phone input': function(event) {
        this.clearErrors();
        this.trigger('phoneSelected', $(event.currentTarget).val());
        this.validateSelection();
      }
    },
    serialize: function() {
      var phones = _(this.collection.phones()).shuffle();

      var img = function(name) {
        return '/sites/default/games/whose_ringtone/images/' + name;
      };

      return {
        img: img,
        characters: this.collection.shuffle(),
        phones: phones,
      };
    },
    validateSelection: function() {
      if (!this.locked) {
        var character = this.$('[name="character"]:checked');
        var phone = this.$('[name="phone"]:checked');

        if (phone.length && character.length) {
          if (phone.val() == character.val()) {
            this.found(character, phone);

            if (this.isFinished()) {
              this.trigger('finished');
            }
          } else {
            this.error(character, phone);
          }
        }
      }
    },
    found: function(character, phone) {
      character.prop('disabled', true).prop('checked', false);
      phone.prop('disabled', true).prop('checked', false);
      this.trigger('success');
    },
    error: function(character, phone) {
      character.parent().addClass('error');
      phone.parent().addClass('error');
      this.trigger('failure');

      setTimeout(this.clearErrors.bind(this), 2000);
    },
    clearErrors: function() {
      this.$('.character.error > input').prop('checked', false).parent().removeClass('error');
      this.$('.phone.error > input').prop('checked', false).parent().removeClass('error');
    },
    uncheck: function() {
      var char_id = this.currentCharacter;
      var phone_id = this.currentPhone;

      this.currentCharacter = null;
      this.currentPhone = null;
      this.locked = true;
      var self = this;

      setTimeout(function() {
        $('.wrt-item.character[data-id="{0}"], .wrt-item.phone[data-id="{1}"]'.format(char_id, phone_id)).removeClass('checked');
        self.locked = false;
      }, 1500);
    },
    isFinished: function() {
      return this.$('input').not(':disabled').length == 0;
    }
  });

  var CharacterCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: null,
        picture: '',
        sound: '',
        checked: false,
      }
    }),
    phones: function() {
      var phones = [];
      _(this.models).each(function(char) {
        phones.push({
          id: char.id,
          sound: char.get('sound'),
          picture: ''
        });
      });
      return phones;
    },
  });
})(jQuery);
