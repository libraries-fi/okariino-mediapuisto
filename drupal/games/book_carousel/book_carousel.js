/**
 * Book Carousel reworked
 */
(function($) {
  "use strict";

  var BookCarousel = Okariino.Game.Base.extend({
    allowCaching: true,
    name: 'book_carousel',
    actions: {
      'archive': function(id) {
        if (id) {
          this.trigger('showBook', id);
        } else {
          this.trigger('showArchive');
        }
      }
    },
    run: function() {
      this.loadStyle(this.name);

      var back = this.createButton(this.BACK_BUTTON).hide();
      var archive = this.createButton(this.ARCHIVE_BUTTON);
      var board = this.createBoard(this.elem.container, 'bc-board', [back]);

      archive.attr('href', '#game/book_carousel/archive');

      var animals = [
        'elephant',
        'pig',
        'bee',
        'lion',
        'octopussy',
        'pig-2',
        'bunny',
        'beaver',
        'elephant-2',
        'chick',
        'rat',
        'seal'
      ];

      var resources = {
        'templates': this.resource('templates.xml'),
//         'books': '/rest/bc_books#.json',
        'books': { src: '/rest/bc_books', type: createjs.LoadQueue.JSON },
        'bc-intro': this.resource('sounds/2 Tervetuloa kirjakaruselliin.ogg'),
        'jingle_book_riddle': this.resource('sounds/Loru_Kirja-arvoitus.ogg'),
      };

      this.load(resources, function(resources) {
        Okariino.olli.speak('bc-intro');

        this.resources = resources;
        var templates = this.parseTemplates(resources.templates);
        var books = new BookCollection(resources.books);

        _.each(books.models, function(book, i) {
          book.set('animal', animals[i % animals.length]);
        });

        var carousel_view = new CarouselView({
          templates: templates,
          collection: books,
          itemsVisible: 3
        });

        var book_view = new BookView({
          templates: templates
        });

        var media_view = new MediaView({
          templates: templates
        });

        var archive_view = new ArchiveView({
          templates: templates,
          collection: books
        });

        board.append(carousel_view.render().el);
        board.append(archive_view.$el.hide());
        board.append(book_view.$el.hide());
        board.append(media_view.$el.hide());

        carousel_view.on('bookSelected', function(book) {
          back.fadeIn();
          book_view.$el.fadeIn();
          book_view.showBook(book);
        });

        archive_view.on('bookSelected', function(book) {
          back.fadeIn();
          book_view.$el.fadeIn();
          book_view.showBook(book);
        });

        book_view.on('mediaSelected', function(media) {
          media_view.$el.fadeIn();
          media_view.showMedia(media);
        });

        back.on('click', function() {
          if (media_view.$el.is(':visible')) {
            media_view.fadeOut();
          } else if (book_view.$el.is(':visible')) {
            book_view.$el.fadeOut();

            if (!archive_view.$el.is(':visible')) {
              back.fadeOut();
            }
          } else if (archive_view.$el.is(':visible')) {
            back.fadeOut();
            archive.fadeIn();
            archive_view.$el.fadeOut();
            window.location.hash = '#game/book_carousel';
          }
        });

        this.on('showArchive', function() {
          archive.fadeOut();
          back.fadeIn();
          archive_view.render().$el.fadeIn();
        });
      }.bind(this));
    }
  });

  var CarouselView = Backbone.View.extend({
    id: 'bc-carousel',
    className: 'game-overlay',
    events: {
      'click #bc-toggle-slider': function() {
        this.slider().carousel('next');
      },
      'click .item a': function(event) {
        var i = $(event.currentTarget).data('id');
        var book = this.collection.at(i);
        this.trigger('bookSelected', book);
      }
    },
    initialize: function() {
      this.template = _.template(this.options.templates.carousel);
    },
    render: function() {
      this.$el.html(this.template({
        books: this.collection.models,
        itemVisible: this.options.itemsVisible
      }));

      this.slider().find('.item').first().addClass('active');
      this.slider().carousel('pause');

      return this;
    },
    slider: function() {
      return this.$('#bc-slider');
    }
  });

  var BookView = Backbone.View.extend({
    id: 'bc-book-view',
    className: 'game-overlay',
    events: {
      'click #bc-media a': function(event) {
        var i = $(event.currentTarget).data('id');
        var media = this.model.sources.at(i);
        this.trigger('mediaSelected', media);
      }
    },
    initialize: function() {
      this.template = _.template(this.options.templates.book);
    },
    render: function() {
      this.$el.html(this.template({
        book: this.model
      }));
      return this;
    },
    showBook: function(book) {
      this.model = book;
      this.render();
    }
  });

  var MediaView = Backbone.View.extend({
    id: 'bc-media-view',
    className: 'game-overlay',
    initialize: function() {
      this.template = _.template(this.options.templates.media);
      this.media = null;
    },
    render: function() {
      this.$el.html(this.template({ media: this.media }));
      return this;
    },
    showMedia: function(media) {
      this.media = media;
      this.render();
    },
    fadeOut: function() {
      // Empty content to unload any embedded stuff
      this.$el.html('');
      this.$el.fadeOut.apply(this.$el, arguments);
    }
  });

  var ArchiveView = Backbone.View.extend({
    id: 'bc-archive-view',
    className: 'game-overlay carousel',
    events: {
      'click .game-pager a': function(event) {
        var i = this.$('.game-pager a').index(this.$(event.currentTarget));
        this.$('.game-slider').carousel(i);
      },
      'click .item a': function(event) {
        var i = this.$(event.currentTarget).data('id');
        var book = this.collection.get(i);
        this.trigger('bookSelected', book);
      }
    },
    initialize: function() {
      this.template = _.template(this.options.templates.archive);
    },
    render: function() {
      this.$el.html(this.template({
        books: this.collection.models,
        pageSize: 10
      }));
      this.$('.game-pager a').addClass('active');
      this.slider().carousel('pause');
      return this;
    },
    slider: function() {
      return this.$('#bc-archive-slider');
    }
  });

  var BookCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: '',
        title: '',
        description: '',
        cover: null,
        source: []
      },
      hasMedia: function() {
        return this.sources.length > 0;
      },
      constructor: function(data) {
        Backbone.Model.apply(this, arguments);
        this.sources = this.parseSources(data.source);

        // console.log("SOURCES", this.get('title'), this.sources);
      },
      parseSources: function(raw_list) {
        var items = [];
        for (var i = 0; i < raw_list.length; i++) {
          items.push(this.parseSource(raw_list[i]));
        }
        return new SourceCollection(items);
      },
      parseSource: function(raw) {
        var item = {
          id: raw.id,
          category: this.sourceValue(raw.field_category),
          embed: this.sourceValue(raw.field_embed),
          url: this.sourceValue(raw.field_url),
          title: this.sourceValue(raw.field_title)
        };
        return item;
      },
      sourceValue: function(src) {
        return src.und[0] ? src.und[0].value : null;
      }
    })
  });

  var SourceCollection = Backbone.Collection.extend({
    model: Backbone.Model.extend({
      defaults: {
        id: '',
        title: '',
        embed: '',
        url: '',
      }
    })
  });

})(jQuery);
