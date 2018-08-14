(function($) {
  "use strict";

  var Cache = {
    templates: {},
    imagesUrl: ''
  };

  var StoryCreator = Okariino.Game.BaseExt.extend({
    name: 'story_creator',
    resources: {
      story: 'demo_story.json',
      sc: {
        intro: 'sounds/10 Tee oma tarina pienestä.ogg',
        title: 'sounds/1_otsikko.ogg',

        page_1: 'sounds/2_Elipä kerran.ogg',
        hedgehog: 'sounds/3_Siili.ogg',
        rabbit: 'sounds/4_Jänis.ogg',
        bird: 'sounds/5_Lintu.ogg',
        cat: 'sounds/6_Kissa.ogg',

        page_2: 'sounds/7_Joka asui vanhassa.ogg',
        shed: 'sounds/8_Vajassa.ogg',
        tree: 'sounds/9_Puussa.ogg',
        house: 'sounds/10_Talossa.ogg',
        windmill: 'sounds/11_Tuulimyllyssä.ogg',

        page_3: 'sounds/12_Eräänä päivänä se.ogg',
        bowtie: 'sounds/13_Rusetin.ogg',
        scarf: 'sounds/14_Huivin.ogg',
        cap: 'sounds/15_Lippalakin.ogg',
        hat: 'sounds/16_Hatun.ogg',

        page_4: 'sounds/17_Otti mukaansa.ogg',
        flute: 'sounds/18_Huilun.ogg',
        guitar: 'sounds/19_Kitaran.ogg',
        drum: 'sounds/20_Rummun.ogg',
        accordion: 'sounds/21_Haitarin.ogg',

        page_5: 'sounds/22_Ja lähti soittamaan.ogg',
        park: 'sounds/23_Puistoon.ogg',
        street: 'sounds/24_Kadulle.ogg',
        beach: 'sounds/25_Rannalle.ogg',
        concert: 'sounds/26_Konserttiin.ogg',

        page_6: 'sounds/27_Kaunista soittoa.ogg',
        dogs: 'sounds/28_Koiria.ogg',
        goblins: 'sounds/29_Peikkoja.ogg',
        mice: 'sounds/30_Hiiriä.ogg',
        elves: 'sounds/31_Tonttuja.ogg',

        page_7: 'sounds/32_Ja sain niiltä paljon.ogg',
        flowers: 'sounds/33_Kukkia.ogg',
        presents: 'sounds/34_Lahjoja.ogg',
        claps: 'sounds/35_Taputuksia.ogg',
        money: 'sounds/36_Rahaa.ogg',

        page_8: 'sounds/37_Olisipa vielä kaveri.ogg',
        advert: 'sounds/38_Lehti-ilmoituksella.ogg',
        bottle: 'sounds/39_Pullopostilla.ogg',
        internet: 'sounds/40_Internetistä.ogg',
        friends: 'sounds/41_Ystävien avulla.ogg',

        page_9: 'sounds/42_Vastauksia tuli niin.ogg',
        hedgehogs_sculpin: 'sounds/43_Siilin Simppu.ogg',
        rabbits_run: 'sounds/44_Jäniksen juoksu.ogg',
        birds_flight: 'sounds/45_Linnun Lento.ogg',
        cats_meow: 'sounds/46_Kissan Kirnau.ogg',

        page_10: 'sounds/47_Mitä kaikkea soittokaverukset.ogg',
      }
    },
    action: {
      index: function() {
        this.callState(this, 'play');
      }
    },
    init: function() {
      Okariino.olli.speak('sc/intro');

      Cache.templates = this.parseTemplates(this.data.templates);
      Cache.imagesUrl = this.root + '/images';

      this.book = new Book(this.data.story.pages);

      this.bookView = new BookView({
        collection: this.book
      });
      this.bookView.title = this.data.story.title;
      this.board.append(this.bookView.el);

      this.on('restartState', function() {
        this.bookView.restart();
      });

      this.initStates(this.url('index'));

      this.book.on('change:selected', function(model, name) {
        this.listenCharacter(name);
      }, this);

      this.bookView.on('pageChanged', function(i) {
        setTimeout(function() {
          this.listenPage(i);
        }.bind(this), 500);
      }, this);

      this.bookView.on('finished', function() {
        this.buttons.restart.fadeIn();
      }, this);
    },
    postInit: function() {
      this.on('initReady', this.play, this);
    },
    play: function() {
      this.bookView.show();
    },
    listenPage: function(i) {
      var instance = this.sound.only('sc/page_{0}'.format(i));

      if (instance) {
        instance.on('complete', function() {
          var character = this.book.characterForPage(i-1);
          if (character) {
            this.listenCharacter(character);
          }
        }, this);
      }
    },
    listenCharacter: function(id) {
      this.sound.only('sc/{0}'.format(id));
    }
  });

  var BookView = Okariino.Game.View.Base.extend({
    id: 'sc-book-view',
    currentPage: 0,
    z: 100,
    pages: [],
    events: {
      'click .sc-control': function(event) {
        var button = $(event.currentTarget);

        if (!button.prop('disabled')) {
          var dir = parseInt($(event.currentTarget).data('dir'));
          this.showPage(this.currentPage + dir);
        }
      },
    },
    init: function() {
      this.collection.on('change:selected', function() {
        this.$('#sc-next-page').prop('disabled', false);
      }, this);
    },
    serialize: function() {
      return {
        items: this.collection.models,
      }
    },
    afterRender: function() {
      var self = this;
      var cover = new Page({ title: this.title });
      var cover_view = new FrontCoverView({ model: cover });
      this.pages.splice(0, this.pages.length);
      this.pages.push(cover_view);

      $(this.collection.models).each(function(i, page) {
        var view = new PageView({ model: page });
        view.on('characterSelected', function(name) {
          this.trigger('characterSelected', name);
        }, this);
        self.pages.push(view);
      });

      $(this.pages).each(function(i, view) {
        self.$('#sc-book-frame').append(view.render().el);
        view.$el.css({
          left: '{0}px'.format(i * 3),
          zIndex: self.z - i
        });
      });

      this.$('.sc-page:last-child .objects').append('<a id="sc-print-story" title="Tulosta tarinasi!"><span>Print</span></a>');
      this.$('#sc-print-story').on('click', this.printBook.bind(this));

      this.showPage(this.currentPage);
      return this;
    },
    showPage: function(page) {
      var pages = this.$('#sc-book-frame').children();
      var navi = this.$('#sc-pager li');
      var z = this.z;

      if (page < 0 || page >= pages.length) {
        return false;
      }

      navi.removeClass('active');
      $(navi[page]).addClass('active');

      $(pages).each(function(i, elem) {
        var level = i < page ? i : (i > page ? -i : 100);
        $(elem).css('z-index', z + level);
      });

      var d_left = (page == 0);
      var d_right = (page == pages.length - 1) || (page > 0 && !this.collection.characterForPage(page));
      this.currentPage = page;

      this.$('#sc-prev-page').prop('disabled', d_left);
      this.$('#sc-next-page').prop('disabled', d_right);
      this.trigger('pageChanged', this.currentPage);

      if (this.currentPage == this.collection.length) {
        this.trigger('finished');
      }
    },
    restart: function() {
      $(this.collection.models).each(function(i, page) {
        page.set('selected', null);
      });

      this.showPage(0);
    },
    printBook: function() {
      $('#sc-book-frame').printElement();
    }
  });

  var PageView = Backbone.View.extend({
    className: 'sc-page',
    events: {
      'change input[name="character"]': function(event) {
        var name = $(event.currentTarget).val();
        this.model.set('selected', name);
      }
    },
    initialize: function() {
      this.storyView = new StoryView({ model: this.model });

      this.model.on('change:selected', function(model, name) {
        var items = this.$('.objects .sc-character');
        items.removeClass('active');
        this.$('input[value="{0}"]'.format(name)).parent().addClass('active');
        this.storyView.render();
      }, this);
    },
    render: function() {
      var t = _.template(Cache.templates.page);
      this.$el.html(t(this.model.attributes));
      this.$('.storyline').append(this.storyView.render().el);
      return this;
    }
  });

  var FrontCoverView = PageView.extend({
    id: 'sc-front-cover',
    render: function() {
      var t = _.template(Cache.templates.frontcover);
      this.$el.html(t({ title: this.model.get('title') }));
      return this;
    }
  });

  var StoryView = Backbone.View.extend({
    tagName: 'p',
    render: function() {
      var text = this.compileText(this.model.get('text'));
      this.$el.html(text);
      return this;
    },
    compileText: function(text) {
      var selected = this.model.get('selected');
      var value = '$1';
      if (selected) {
        value = this.model.get('characters')[selected].text;
      }
      var html = text.replace(/(_{3,})/, '<ins class="spot">{0}</ins>'.format(value));
      return html;
    }
  });

  var Navigation = Backbone.View.extend({
    tagName: 'ol',
    current: 0,
    items: 0,
    render: function() {
      for (var i = 0; i < items; i++) {
        var item = $('<li>{0}</li>'.format(i+1));
        this.$el.append(item);
        if (i == this.current) {
          item.addClass('active');
        }
      }
      return this;
    }
  });

  var Page = Backbone.Model.extend({
    defaults: {
      characters: {},
      audio: '#audio_url',
      pauses: [],
      text: '',
      title: '',
      selected: null
    },
    initialize: function() {
      _(this.get('characters')).each(function(char) {
        char.icon = '{0}/characters.jpg'.format(Cache.imagesUrl);
      });
    }
  });

  var Book = Backbone.Collection.extend({
    model: Page,
    characterForPage: function(i) {
      var page = this.at(i);
      return page ? page.get('selected') : null;
    }
  });
})(jQuery);
