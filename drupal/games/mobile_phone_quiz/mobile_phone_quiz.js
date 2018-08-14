(function($) {
  "use strict";

  var MobilePhoneQuiz = Okariino.Game.BaseExt.extend({
    name: 'mobile_phone_quiz',
    resources: {
      questions: 'demo_questions.json',
      characters: 'images/characters.png',
      answers: [
        'images/answers/angrily.png',
        'images/answers/beach.png',
        'images/answers/bicycling.png',
        'images/answers/bus.png',
        'images/answers/car.png',
        'images/answers/cheerfully.png',
        'images/answers/church.png',
        'images/answers/courtyard.png',
        'images/answers/elevator.png',
        'images/answers/fishing.png',
        'images/answers/forest.png',
        'images/answers/home.png',
        'images/answers/hospital.png',
        'images/answers/kindergarten.png',
        'images/answers/kino.png',
        'images/answers/library.png',
        'images/answers/park.png',
        'images/answers/pickingmushroom.png',
        'images/answers/plane.png',
        'images/answers/raking.png',
        'images/answers/restaurant.png',
        'images/answers/riding.png',
        'images/answers/skating.png',
        'images/answers/skiing.png',
        'images/answers/skippingsquares.png',
        'images/answers/sleeping.png',
        'images/answers/street.png',
        'images/answers/swimming.png',
        'images/answers/theater.png',
        'images/answers/themepark.png',
        'images/answers/tiredly.png',
        'images/answers/toilet.png',
        'images/answers/train.png',
        'images/answers/watchingtv.png',
        'images/answers/zebracrossing.png',
      ],
      mpq: {
        intro: 'sounds/27 Kysytäänpä mitä Olivia.ogg',
        success_1: 'sounds/27b Hienoa sinä tiesit.ogg',
        success_2: 'sounds/27c Aivan oikein.ogg',
      },
      mpq_quiz: {
        quietly: 'sounds/quiz/VISA_Missä puhut hiljaa.ogg',
        turnoff: 'sounds/quiz/VISA_Missä suljet kännykän.ogg',
        notalk: 'sounds/quiz/VISA_Milloin kännykällä ei saa soittaa.ogg',
        silent: 'sounds/quiz/VISA_Missä äänettömälle tai värinä.ogg',
        turnoff2: 'sounds/quiz/VISA_Missä näistä paikoista suljet.ogg',
        answer: 'sounds/quiz/VISA_Miten vastaat kännykkään.ogg',
        loudspeaker: 'sounds/quiz/VISA_Missä voit käyttää kaiutinta.ogg',
      },
      mpq_answer: {
        q1_theater: 'sounds/answers/VISA01_Olivia_Teatterissa.ogg',
        q1_bus: 'sounds/answers/VISA01_Taiteilija_Bussissa.ogg',
        q1_toilet: 'sounds/answers/VISA01_Samu_Vessassa.ogg',

        q2_street: 'sounds/answers/VISA02_Olivia_Kadulla.ogg',
        q2_outside: 'sounds/answers/VISA02_Samu_Pihalla.ogg',
        q2_library: 'sounds/answers/VISA02_Taiteilija_Kirjastossa.ogg',

        q3_circus: 'sounds/answers/VISA03_Olivia_Huvipuistossa.ogg',
        q3_train: 'sounds/answers/VISA03_Samu_Junassa.ogg',
        q3_forest: 'sounds/answers/VISA03_Taiteilija_Metsässä.ogg',

        q4_tired: 'sounds/answers/VISA04_Olivia_Väsyneesti.ogg',
        q4_happy: 'sounds/answers/VISA04_Samu_Iloisesti.ogg',
        q4_angry: 'sounds/answers/VISA04_Taiteilija_Vihaisesti.ogg',

        q5_movies: 'sounds/answers/VISA05_Olivia_Elokuvateatterissa.ogg',
        q5_beach: 'sounds/answers/VISA05_Samu_Uimarannalla.ogg',
        q5_park: 'sounds/answers/VISA05_Taiteilija_Leikkipuistossa.ogg',

        q6_home: 'sounds/answers/VISA06_Olivia_Kotona.ogg',
        q6_airplane: 'sounds/answers/VISA06_Taiteilija_Lentokoneessa.ogg',
        q6_street: 'sounds/answers/VISA06_Samu_Kadulla.ogg',

        q7_restaurant: 'sounds/answers/VISA07_Taiteilija_Ravintolassa.ogg',
        q7_library: 'sounds/answers/VISA07_Olivia_Kirjastossa.ogg',
        q7_outside: 'sounds/answers/VISA07_Samu_Pihalla.ogg',

        q8_hospital: 'sounds/answers/VISA08_Taiteilija_Sairaalassa.ogg',
        q8_car: 'sounds/answers/VISA08_Samu_Autossa.ogg',
        q8_elevator: 'sounds/answers/VISA08_Olivia_Hississä.ogg',

        q9_squares: 'sounds/answers/VISA09_Olivia_Ruutuhyppelyssä.ogg',
        q9_cycling: 'sounds/answers/VISA09_Samu_Pyöräillessä.ogg',
        q9_skating: 'sounds/answers/VISA09_Taiteilija_Luistellessa.ogg',

        q10_church: 'sounds/answers/VISA10_Samu_Kirkossa.ogg',
        q10_park: 'sounds/answers/VISA10_Olivia_Puistossa.ogg',
        q10_elevator: 'sounds/answers/VISA10_Taiteilija_Hississä.ogg',

        q11_crossing: '',
        q11_tv: '',
        q11_sleeping: '',

        q12_fishing: 'sounds/answers/VISA12_Olivia_Onkiessa.ogg',
        q12_raking: 'sounds/answers/VISA12_Samu_Haravoidessa.ogg',
        q12_riding: 'sounds/answers/VISA12_Taiteilija_Ratsastaessa.ogg',
      }
    },
    actions: {
      index: function() {
        this.callState(this, 'play');
      }
    },
    init: function() {
      Okariino.olli.speak('mpq/intro');

      this.arenaView = new ArenaView({
        gameRoot: this.root
      });
      this.board.append(this.arenaView.$el);

      this.arenaView.on('finished', function() {
        this.buttons.restart.fadeIn();
      }, this);

      this.arenaView.on('success', this.success, this);
      this.arenaView.on('failure', this.failure, this);

      this.arenaView.on('questionChanged', this.readQuestion, this);
      this.arenaView.on('showAnswer', this.readAnswer, this);
    },
    postInit: function() {
      this.on('initReady', this.play, this);
      this.on('restartState', this.play, this);
      this.on('closed', function() {
        this.arenaView.stop();
      }, this);
    },
    play: function() {
      var questions = _(this.data.questions).shuffle().slice(0, 6);
      this.arenaView.collection = new QuestionCollection(questions);
      this.arenaView.reset();
      this.arenaView.render();
      this.arenaView.flashStartButton();
    },
    readQuestion: function(question) {
      Okariino.olli.stop();
      var sound_id = 'mpq_quiz/' + question.get('question').sound;
      var sound = this.sound;
      var instance = this.sound.only(sound_id);

      instance.on('complete', this.arenaView.cycleAnswers, this.arenaView, true);
    },
    readAnswer: function(answer, i, last) {
      var sound_id = 'mpq_answer/' + answer.sound;
      var instance = this.sound.only(sound_id);
    },
    success: function() {
      var i = Math.round(Math.random()) + 1;
      var sound = 'mpq/success_{0}'.format(i);
      Okariino.olli.speak(sound);
    },
    failure: function() {
      this.sound.only('okariino/failure2');
    }
  });

  var ArenaView = Okariino.Game.View.Base.extend({
    id: 'mpq-arena-view',
    overlay: true,
    current: 0,
    locked: true,
    events: {
      'click #mpq-start-quiz': function(event) {
        this.stopFlash = true;
        $(event.currentTarget).fadeOut();
        this.trigger('questionChanged', this.collection.at(this.current));
      },
      'click #mpq-characters li': function(event) {
        if (this.locked) {
          return;
        }

        var t = $(event.currentTarget);
        var i = t.parent().children().index(t);
        var a = this.collection.at(this.current).get('answers')[i];

        if (a.correct) {
          t.addClass('animated');
          this.stop();
          this.trigger('success');
          this.roundId = setTimeout(this.nextQuestion.bind(this), 3000);
        } else {
          this.trigger('error');
          this.wrongAnswer(i);
        }
      }
    },
    flashStartButton: function() {
      var self = this;
      if (!self.stopFlash) {
        this.$('#mpq-start-quiz span').fadeOut(1500, function() {
          $(this).fadeIn(1500, function() {
            self.flashStartButton();
          });
        });
      }
    },
    serialize: function() {
      return {
        current: this.current,
        questions: this.collection.models,
        question: this.collection.at(this.current)
      }
    },
    isFinished: function() {
      return this.current >= this.collection.length;
    },
    cycleAnswers: function() {
      var self = this;
      var i = 0;
      var answers = this.collection.at(this.current).get('answers');
      var bubble = $('<img class="mpq-bubble" alt="bubble"/>').hide();
      bubble.appendTo(this.$el);
      var base_url = this.options.gameRoot + '/images';

      this.cycleId = setInterval(function() {
        if (i == answers.length) {
          bubble.fadeOut('fast', function() { $(this).remove(); });
          self.$('#mpq-characters li').removeClass('animated');
          self.locked = false;
          self.$('#mpq-start-quiz').fadeIn();
          self.stop();
          return;
        }

        var char = self.$('#mpq-characters li')[i];
        var pos = $(char).position();
        var text = answers[i].text;
        var foo = {
          top: pos.top - bubble.height() + ($(char).height() - $(char).find('a').height()),
          left: pos.left
        };

        $(char).addClass('animated').siblings().removeClass('animated');
        bubble.attr('src', '{0}/{1}'.format(base_url, answers[i].image));
        bubble.css(foo);
        bubble.show();
        self.trigger('showAnswer', answers[i]);
        i++;
      }, 3000);
    },
    nextQuestion: function() {
      this.current++;
      this.locked = true;

      if (this.isFinished()) {
        this.finish();
      } else {
        this.render().done(function() {
          var question = this.collection.at(this.current);
          this.trigger('questionChanged', question);
        });
      }
    },
    wrongAnswer: function(i) {
      $(this.$('#mpq-characters li')[i]).addClass('invalid');
      this.trigger('failure');
    },
    reset: function() {
      this.current = 0;
    },
    finish: function() {
      var src = '/sites/default/games/mobile_phone_quiz/images/prize.png';
      this.$('#mpq-question').html('<img src="{0}" alt="prize"/>'.format(src));
      this.trigger('finished');
    },
    stop: function() {
      if (this.cycleId) {
        clearInterval(this.cycleId);
        this.cycleId = 0;
      }

      if (this.roundId) {
        clearTimeout(this.roundId);
        this.roundId = 0;
      }
    }
  });

  var QuestionCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      id: 0,
      question: {},
      answers: []
    }),
    random: function(max) {
      var chosen = [];
    }
  });
})(jQuery);
