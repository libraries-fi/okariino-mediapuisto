
createjs.Sound.alternateExtensions = ["mp3"];
// createjs.Sound.registerPlugins([createjs.HtmlAudioPlugin, createjs.WebAudioPlugin]);

/**
 * Defines Okariino namespace
 */
var Okariino;

(function($) {
  "use strict";

  Okariino = {
    cookie: function(key, value) {
      var cname = 'okariino-js';

      try {
        var data = JSON.parse($.cookie(cname));

        if (arguments.length == 1) {
          return data[key];
        } else {
          data[key] = value;
          $.cookie(cname, JSON.stringify(data));
          return this;
        }
      } catch (e) {
        $.cookie(cname, JSON.stringify({}));
        return this.cookie.apply(this, arguments);
      }
    },

    /**
    * Contains shared settings
    */
    settings: {
      debug: false,
      muted: false,

      paths: {
        global: {
          root: ''
        },

        theme: {
          root: '',
          images: 'images',
          scripts: 'js'
        },

        games: {
          root: ''
        }
      }
    },

    /**
    * Cached data about the player
    */
    player: {
      age: 0,
      name: null,
    },

    /**
    * Shared instance of a SoundJS player for Okariino
    */
    sound: createjs.Sound,

    /**
    * Namespace for Okariino games
    */
    Game: {},

    /**
    * Namespace for utility classes
    */
    Util: {},
    gameCache: {},

    showHelp: function() {
      $('body').addClass('help-state');
    },
    hideHelp: function() {
      $('body').removeClass('help-state');
    },
    toggleHelp: function() {
      if ($('body').hasClass('help-state')) {
        this.hideHelp();
      } else {
        this.showHelp();
      }
    },
    enableMute: function() {
      $('body').addClass('muted-state');
      this.cookie('muted', true);
      this.sound.setMute(true);
    },
    disableMute: function() {
      $('body').removeClass('muted-state');
      this.cookie('muted', false);
      this.sound.setMute(false);
    },
    toggleMute: function() {
      var muted = this.cookie('muted');
      if (muted) {
        this.disableMute();
      } else {
        this.enableMute();
      }
    },

    /**
    * Loads a game's script and launches it.
    */
    loadGame: function(name, action, id) {
      if (!name) {
        console.warning('No game defined');
        return;
      }

      if (!this.loadScreen) {
        this.loadScreen = new Okariino.Game.LoadScreen(Okariino, $('#viewport'));
      }

      var args = Array.prototype.slice.call(arguments, 1);

      if (this.gameCache[name]) {
        var game = this.gameCache[name];
        args.unshift(game);
        this.runGame.apply(this, args);
      } else {
        var script = "{0}/{1}/{2}.js".format(this.dir('games.root'), name, name);
        this.loadScreen.start();

        var updateLoadProgress = function(e) {
          $('#ls-progress').css('width', (e.loaded * 100) + '%');
        };

        $.getScript(script, function() {
          var game = new Okariino.Game[name](Okariino, $('#viewport'));

          this.loadScreen.on('userClosed', function() {
            game.exit();
            game.queue.off('progress', updateLoadProgress);
          }, this);

          if (game.init) {
            game.queue.on('progress', updateLoadProgress, this);
            game.once('initReady', function() {
              this.loadScreen.exit();
              game.queue.off('progress', updateLoadProgress);
            }, this);
          } else {
            this.loadScreen.exit();
          }

          args.unshift(game);
          this.runGame.apply(this, args);

          // Older games were not designed to be ran multiple times without
          // reloading the whole script. Then again some other games require
          // this functionality so they must be cached.
          if (game.allowCaching) {
            this.gameCache[name] = game;
          }
        }.bind(this));
      }
    },
    runGame: function(game, action, id, f1, f2, f3) {
      Okariino.olli.context = game;
      Okariino.olivia.context = game;

      var args = Array.prototype.slice.call(arguments, 2);

      if (this.activeGame == game.name) {
        if (action && game.actions[action]) {
          game.actions[action].apply(game, args);
        }
        return;
      }

      var self = this;

      if (action && action in game.actions) {
        var signal = game.supportsInitReady ? 'initReady' : 'ready';
        game.once(signal, function() {
          game.actions[action].apply(game, args);
        });
      }

      game.once('started', function() {
        $('body').addClass('game-mode');
      });

      game.once('closed', function() {
        $('body').removeClass('game-mode');
        var current_url = window.location.hash;
        var route = (function() {
          // This is probably really slow but should work...

          var characters = $('.okariino-character');

          for (var i = 0; i < characters.length; i++) {
            var char = $(characters[i]);
            var url = char.find('area').attr('href');

            if (url && current_url.substring(0, url.length) == url) {
              return char.closest('li.item').data('route');
            }
          }
        }());

        if (!route) {
          route = $('#action-screens > .carousel-inner > .item.active').data('route');
        }

        Okariino.router.navigate(route, { trigger: true });
        self.activeGame = null;
      }, this);

      game.start();
      this.activeGame = game.name;
    },

    /**
    * Return path to the named directory
    */
    dir: function(key) {
      var parts = key.split('.');
      var paths = this.settings.paths;

      var dir = paths.global.root + '/';
      dir += paths[parts[0]].root;

      if (parts[1] != 'root') {
        dir += '/' + paths[parts[0]][parts[1]];
      }

      return dir;
    },
  };

  Okariino.Object = (function() {
    var Base = function() {
      this.listeners = {};

      if (this.initialize) {
        this.initialize();
      }
    };

    Base.prototype.on = function(event, callback, context, single_shot) {
      if (!this.listeners) {
        this.listeners = {};
      }

      var listeners = this.listeners;

      if (!context) {
        context = this;
      }

      if (!listeners[event]) {
        listeners[event] = [];
      }

      listeners[event].push({
        callback: callback,
        context: context,
        singleShot: single_shot,
      });

      return this;
    };

    Base.prototype.once = function(event, callback, context) {
      this.on(event, callback, context, true);
    };

    Base.prototype.off = function(event, callback) {
      var listeners = this.listeners;

      if (!callback) {
        delete listeners[event];
      } else if (listeners[event]) {
        var events = listeners[event];

        for (var i = events.length - 1; i >= 0; i--) {
          if (events[i].callback == callback) {
            events.splice(i, 1);
          }
        }

      }

      return this;
    };

    Base.prototype.trigger = function(event) {
      // For some reason this.listeners sometimes undefined
      var listeners = this.listeners || {};

      if (!(event in listeners)) {
        return;
      }

      var args = Array.prototype.slice.call(arguments, 1);

      for (var i = listeners[event].length - 1; i >= 0; i--) {
        var item = listeners[event][i];

        if (typeof item == 'undefined') {
          listeners[event].splice(i, 1);
          continue;
        }

        if (item.singleShot) {
          listeners[event].splice(i, 1);
        }

        item.callback.apply(item.context, args);
      }

      return this;
    };

    Base.extend = Backbone.Model.extend;

    return Base;
  }());


  /**
  * Base class for Okariino games.
  *
  * All games have to inherit from this class!
  */
  Okariino.Game.Base = (function() {
    var $ = jQuery;
  //   var foo = function() { };
    var foo = Okariino.Object.extend({});

    /**
    * Static method that initializes a new game class and returns it.
    *
    * The newly-created class is registered automaticly by Okariino game
    * manager to support launching it from the characters view.
    */
    foo.extend = function(options) {
      var game_name = options.name;
      var foo2 = function(Okariino, container) {
        foo2.prototype.constructor.call(this, game_name, Okariino, container);

        if (this.initialize) {
          this.initialize(options);
        }
      };

      foo2.prototype = Object.create(Okariino.Game.Base.prototype);
      foo2.extend = foo.extend;

      if (options.actions) {
        foo2.prototype.actions = options.actions;
        delete options.actions;
      }

      if (options.run) {
        foo2.prototype.run = options.run;
        delete options['run'];
      }

      if (options.preload) {
        foo2.prototype.preload = options.preload;
        delete options['preload'];
      }

      if (options.initialize) {
        foo2.prototype.initialize = options.initialize;
        delete options['initialize'];
      }

      if (options.allowCaching) {
        foo2.prototype.allowCaching = options.allowCaching;
        delete options['allowCaching'];
      }

      if (options.supportsInitReady) {
        foo2.prototype.supportsInitReady = options.supportsInitReady;
        delete options['supportsInitReady'];
      }

      for (var key in options) {
        if (typeof options[key] == 'function') {
          foo2.prototype[key] = options[key];
          delete options[key];
        }
      }

      Okariino.Game[game_name] = foo2;
      return foo2;
    };

    foo.prototype = Object.create(Okariino.Object.prototype);
    foo.prototype.super = foo.prototype.constructor;

    foo.prototype.constructor = function(name, settings, container) {
      foo.prototype.super.call(this);

      this.elem = {};
      this.views = {};
      this.closed = false;
      this.muted = false;
      this.elem.container = container;
      this.settings = settings;
      this.name = name;
      this.root = '{0}/{1}'.format(settings.dir('games.root'), this.name);

      this.BACK_BUTTON = 1;
      this.CLOSE_BUTTON = 2;
      this.RESTART_BUTTON = 4;
      this.ARCHIVE_BUTTON = 8;

      this.sound = new Okariino.Util.Sound;
      this.on('closed', this.sound.stopAll, this.sound);

      this.queue = new createjs.LoadQueue(true);
    };

    foo.prototype.start = function() {
      this.closed = false;
      this.trigger('started');
      this.run();
    };

    foo.prototype.exit = function() {
      if ('layer' in this.elem) {
        this.elem.layer.fadeOut(function() {
          $(this).remove();
        });
      }

      this.closed = true;
      this.trigger('closed');
    };

    foo.prototype.run = function() {
      /*
      * Reimplement this function and put initialization code here.
      */

      alert("Function 'run' not implemented!");
    };

    foo.prototype.createBoard = function(container, id, buttons) {
      var container = $(container);
      var board = $('<div id="{0}" class="game-board game-overlay"/>'.format(id));
      var toolbar = $('<div class="game-toolbar"/>');
      var close = this.createButton(this.CLOSE_BUTTON);
      var game_container = $('<div class="game-container game-{0}"/>'.format(this.name));

      if (buttons) {
        $(buttons).each(function() {
          toolbar.append(this);
        })
      }

      if (this.buttons) {
        this.buttons.close = close;
      } else {
        this.buttons = {
          close: close
        };
      }

      toolbar.append(close);
      container.append(game_container);
      game_container.append(toolbar);
      game_container.append(board);
      board.fadeIn();

      this.elem.container = container;
      this.elem.layer = game_container;
      this.elem.board = board;
  //     this.buttons.close.click(this.exit.bind(this));
      this.buttons.close.on('click', this.exit.bind(this));

      return board;
    };

    foo.prototype.createButton = function(id, label) {
      var std_buttons = {};
      std_buttons[this.BACK_BUTTON] = 'game-button gb-back';
      std_buttons[this.CLOSE_BUTTON] = 'game-button gb-close';
      std_buttons[this.RESTART_BUTTON] = 'game-button gb-restart';
      std_buttons[this.ARCHIVE_BUTTON] = 'game-button gb-archive';

      var b = $('<a></a>'.format(label));

      if (std_buttons[id]) {
        b.attr('class', std_buttons[id] ? std_buttons[id] : id);
      }

      if (label) {
        b.append('<span>{0}</span>'.format(label));
      }

      return b;
    };

    foo.prototype.loadStyle = function(file) {
      if (this.styleLoaded) {
        return;
      }

      this.styleLoaded = true;
      var style_root = this.root;
      var style_url = '{0}/{1}.less'.format(style_root, file);
      var style_id = 'css-game-{0}'.format(this.name);

      if (this.settings.settings.debug) {
        style_url += '?' + (new Date()).getTime();
      }

      // Overwrite the sheets array so that refresh() would not reload all sheets.
      less.sheets = [$('<link href="{0}" type="text/less"/>'.format(style_url))[0]];
      less.refresh();
    };

    /**
    * Load an XML file that contains Underscore.js templates
    *
    * Suffix .xml is automaticly appended and the file is looked up in the
    * game's own directory.
    *
    * @deprecated Use this.load() and this.parseTemplates()
    *
    * @param file Basename of the template file (ie. 'templates')
    * @param callback Function to be called after templates are loaded
    * @return Map containing the templates
    */
    foo.prototype.loadTemplates = function(file, callback) {
      var self = this;

      var url = '{0}/{1}.xml'.format(self.root, file);
      var rq = $.ajax({
        url: url,
        dataType: 'xml',
        cache: !self.settings.settings.debug
      });

      rq.done(function(data) {
        var templates = self.parseTemplates(data);
        callback.call(self, templates);
      });

      rq.fail(function(error) { callback.call(self, null, error); });
    };

    foo.prototype.parseTemplates = function(data) {
      var templates = {};

      $('template', data).each(function() {
        var e = $(this);
        templates[e.attr('id')] = e.text();
      });

      return templates;
    };

    foo.prototype.load = function(resources, callback) {
      var queue = this.queue;
      queue.installPlugin(Okariino.sound);

      queue.on('complete', function() {
        var items = {};
        for (var key in resources) {
          items[key] = queue.getResult(key);
        }
        callback.call(this, items);
        this.trigger('ready');
      }, this, true);

      var files = [];
      for (var key in resources) {
        if (resources[key].src) {
          var d = {};
          for (var x in resources[key]) {
            d[x] = resources[key][x];
          }
          d.id = key;
          files.push(d);
        } else {
          files.push({ id: key, src: resources[key] });
        }
      }
      queue.loadManifest(files);
    };

    foo.prototype.resource = function(basename) {
      var url = '{0}/{1}'.format(this.root, basename);
      return url;
    };

    return foo;
  }());

  Okariino.Util.Sound = Okariino.Object.extend({
    initialize: function() {
      this.sounds = {};
    },
    play: function(id, loop) {
      this._forceStop = false;
      this.register(id);
      loop = loop ? -1 : 0;
      var instance = this.sounds[id];

      if (instance) {
        var retry = function() {
          setTimeout(function() {
            if (!this._forceStop) {
              instance.play(createjs.Sound.INTERRUPT_ANY, 0, 0, loop);
            } else {
              instance.off('failed', retry);
            }
          }, 2000);
        };

        instance.on('failed', retry);

        instance.on('succeeded', function() {
          instance.off('failed', retry);
        });

        instance.play(createjs.Sound.INTERRUPT_ANY, 10, 0, loop);
        return instance;
      } else {
        return null;
      }
    },
    only: function(id, loop) {
      this.stopAll();
      return this.play(id, loop);
    },
    stop: function(id) {
      if (id in this.sounds) {
        this.sounds[id].stop();
      }
    },
    mute: function(id, state) {
      this.register(id);

      if (id in this.sounds) {
        this.sounds[id].setMute(state);
      }
    },
    stopAll: function() {
      this._forceStop = true;
      for (var id in this.sounds) {
        this.sounds[id].stop();
        this.sounds[id].setMute(false);
      }
    },
    register: function(id) {
      if (!(id in this.sounds)) {
        var instance = Okariino.sound.createInstance(id);

        if ('on' in instance) {
          this.sounds[id] = instance;
        }
      }

      return id in this.sounds;
    },
    instance: function(id) {
      if (this.register(id)) {
        return this.sounds[id];
      } else {
        return null;
      }
    }
  });

  /**
  * Sound file loader class
  */
  Okariino.Util.SoundLoader = Okariino.Object.extend({
    load: function(files, root) {
      this.files = files;
      this.player = Okariino.sound;
      this.loaded = 0;

      this.player.addEventListener('fileload', this.notify.bind(this));

      if (root) {
        root += '/';
      } else {
        root = '';
      }

      for (var name in files) {
        var file = files[name];
        var path = root + file.replace('|', '|' + root);
        this.player.registerSound(path, name, 3);

        if (this.player.loadComplete(path)) {
          this.notify({ id: name });
        }
      }
    },
    notify: function(data) {
      // Filter events from the global Sound instance
      if (!this.files[data.id]) {
        return;
      }

      var keys = Object.keys(this.files);

      this.loaded++;
      this.trigger('loadProgress', this.loaded, keys.length);

      if (this.loaded == keys.length) {
        this.trigger('loadComplete', keys);
      }
    }
  });

  /**
  * Global event notifier
  */
  Okariino.events = new Okariino.Object();

  /**
  * Route manager
  */
  Okariino.router = new Backbone.Router({
    routes: {
      'left': 'gamescreen1',
      'center': 'gamescreen2',
      'right': 'gamescreen3',
      'game/:game_id(/:action)(/:id1)(/:id2)': 'launchgame',
    }
  });

  Okariino.Game.MusicPlayer = Okariino.Game.Base.extend({
    run: function() {
      var image_src = this.resource(this.options.image);
      var audio_src = this.resource(this.options.audio);
      var board = this.createBoard(this.elem.container, 'mp-board');
      var image = $('<img alt="music player background"/>').attr('src', image_src);
      var loader = new Okariino.Util.SoundLoader();
      var date = new Date();
      var song_id = 'mp' + date.getMilliseconds();
      var audios = [audio_src];

      board.append(image);

      this.on('closed', function() {
        this.sound.stopAll();
        board.remove();
      });

      if (song_id in this.sound.sounds) {
        this.sound.play(song_id);
      } else {
        loader.on('loadComplete', function() {
          var instance = this.sound.play(song_id);
          instance.setMute(false);
        }.bind(this));

        var queue = {};
        queue[song_id] = audios.join('|');
        loader.load(queue);
      }
    },
    launch: function() {
      Okariino.runGame(this);
    }
  });

  Okariino.Game.MusicPlayer.prototype._constructor = Okariino.Game.MusicPlayer.prototype.constructor;
  Okariino.Game.MusicPlayer.prototype.constructor = function(foo, options) {
    Okariino.Game.MusicPlayer.prototype._constructor.call(this, 'music_player', Okariino, '#viewport');
    this.options = options;
  }

  Okariino.Game.View = {};

  Okariino.Game.View.Base = Backbone.Layout.extend({
    sounds: {},
    initialize: function(options) {
      if (this.template) {
        if (typeof this.template == 'string') {
          this.template = _.template(this.template);
        }
      } else {
        var templateId = this.templateId ? this.templateId : this.id;
        this.template = _.template(Backbone.Layout.cache(templateId));
      }

      if (this.overlay) {
        this.$el.addClass('game-overlay');
      } else if (this.fullscreen) {
        this.$el.addClass('game-fullscreen');
      }

      if (this.init) {
        this.init();
      }

    },
    show: function() {
      // Will cycle through game's layers and hide active layer's siblings

      var layers = this.$el.parent().children();
      for (var i = layers.index(this.$el) + 1; i < layers.length; i++) {
        // Clear contents to erase flash players and such
        $(layers[i]).fadeOut('fast', function() {
          $(this).html('');
        });
      }

      this.$el.fadeIn();

      setTimeout(function() {
        this.render();
      }.bind(this), 300);
    },
    createUrlHelper: function() {
      if (!this.options.url) {
        console.warning('Base URL helper not injected into the view!');
        return false;
      }

      var base = this.options.url;
      var fixed_args = Array.prototype.slice.call(arguments);
      var helper = function() {
        var args = [];

        for (var i = 0; i < fixed_args.length; i++) {
          args.push(fixed_args[i]);
        }

        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }

        return base.apply(this, args);
      }

      return helper.bind(this);
    }
  });

  Okariino.Game.View.Slider = Okariino.Game.View.Base.extend({
    itemView: null,
    pageSize: 6,
    serialize: function() {
      return {
        items: this.collection.models,
        pageSize: this.pageSize,
        id: this.id
      }
    },
    afterRender: function() {
      if (!this.itemView) {
        console.warning('Slider: no item view set!');
        return;
      }

      var pages = Math.ceil(this.collection.length / this.pageSize);
      for (var i = 0; i < pages; i++) {
        var sliderItem = $('<li class="item"></li>');
        var j = i * this.pageSize;
        var max = Math.min(j + this.pageSize, this.collection.length);
        for (; j < max; j++) {
          var view = new this.itemView({ model: this.collection.at(j) });
          sliderItem.append(view.$el);
          view.render();
        }
        this.$('.carousel-inner').append(sliderItem);
      }
      this.$('.carousel-inner > li').first().addClass('active');
      this.$el.carousel('pause');

      // The carousel restarts sliding interval each time a slide button is clicked.
      this.$el.on('slid', function() {
        $(this).carousel('pause');
      });
    },
    className: 'carousel slide',
    attributes: {
      'data-interval': '0'
    },
    template: _.template(' \
      <% if (items.length == 0) { %> \
        <p>Ei kohteita</p> \
      <% } else { %> \
        <div class="game-pager"> \
          <% _.each(_.range(Math.ceil(items.length / pageSize)), function(i) { %> \
            <li> \
              <a data-target="#<%= id %>" data-slide-to="<%= i %>"><%= i+1 %></a> \
            </li> \
          <% }) %> \
        </div> \
        <div class="game-arrows"> \
          <a class="carousel-control left" data-slide="prev" href="#<%= id %>">&lsaquo;</a> \
          <a class="carousel-control right" data-slide="next" href="#<%= id %>">&rsaquo;</a> \
        </div> \
        <ul class="game-slider carousel-inner slide"> \
          <!-- Set itemView property to render items! --> \
        </ul> \
      <% } %> \
    ')
  });

  Okariino.Game.BaseExt = Okariino.Game.Base.extend({
    supportsInitReady: true,
    allowCaching: true,
    id: function() {
      return this.name
        .split('_')
        .map(function(p) { return p.substring(0, 1); })
        .join('');
    },
    okariino: function() {
      return this.settings;
    },
    run: function() {
      this.loadStyle(this.name);
      this.buttons = {
        'back': this.createButton(this.BACK_BUTTON).hide(),
        'restart': this.createButton(this.RESTART_BUTTON).hide()
      };
      var board_id = '{0}-board'.format(this.id());
      var buttons = this.buttons;

      var res = this.resources || {};

      if (this.loadTemplates !== false) {
        res = res ? res : {};
        res.templates = this.resource('templates.xml');
      }

      buttons.back.on('click', function() {
        this.buttons.restart.fadeOut();
        this.trigger('previousState', buttons.back);
      }.bind(this));
      buttons.restart.on('click', function() {
        this.buttons.restart.fadeOut();
        this.trigger('restartState', buttons.restart);
      }.bind(this));

      this.on('previousState', function() {
        var cur = this._states.pop();
        var prev = this._states.pop();

        if (prev) {
          window.location.hash = prev;
        }

        if (this._states.length == 0) {
          this.buttons.back.fadeOut();
        }

      }, this);

      var initBoard = function() {
        this.board = this.createBoard(this.elem.container, board_id, [buttons.back, buttons.restart]);
      }.bind(this);

      this.once('closed', function() {
        this.initStates([]);
      }, this);

      var postLoad = function() {
        this.init();
        if (this.postInit && !('postInitRanOnce' in this)) {
          this.postInitRanOnce = true;
          this.postInit();
        }
        this.trigger('initReady');
      }.bind(this);

      if (Object.keys(res).length && !this.data) {
        res = this.preProcessResources(res);

        this.load(res, function(resources) {
          if (resources.templates) {
            this.cacheTemplates(resources.templates);
          }
          this.data = this.explodeResources(resources);

          setTimeout(function() {
            if (!this.closed) {
              initBoard();
              postLoad();
            }
          }.bind(this), 3000);
        }.bind(this));
      } else {
        if (!this.closed) {
          initBoard();
          postLoad();
        }
      }
    },
    cacheTemplates: function(templates) {
      $('template', templates).each(function() {
        var item = $(this);
        Backbone.Layout.cache(item.attr('id'), item.text());
      });
    },
    state: function(sender, signal, receiver, slot) {
      if (!this._states) {
        this._states = [];
      }

      sender.on(signal, function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(slot);
        args.unshift(receiver);
        this.callState.apply(this, args);
      }, this);
    },
    callState: function(receiver, slot) {
      var args = Array.prototype.slice.call(arguments, 2);
      if (this._states.length) {
        this.buttons.back.fadeIn();
      }

      var url = window.location.hash;
      if (this._states.indexOf(url) == -1) {
        this._states.push(url);
      }
      receiver[slot].apply(receiver, args);
    },
    url: function() {
      var url = '#game/' + this.name;
      for (var i = 0; i < arguments.length; i++) {
        url += '/{0}'.format(arguments[i]);
      }
      return url;
    },
    urlHelper: function() {
      return this.url.bind(this);
    },
    initStates: function(first) {
      this._states = [first];
    },
    preProcessResources: function(resources) {
      var flat = this.flattenResources(resources);

  //     for (var key in flat) {
  //       var path = flat[key];
  //       if (path[0] != '/' && path.substring(0, 4) != 'http') {
  //         flat[key] = this.root + '/' + path;
  //       }
  //     }

      for (var key in flat) {
        var defs = flat;
        var path = defs[key];

        if (path.src) {
          defs = path;
          path = defs.src;
        }
        if (path[0] != '/' && path.substring(0, 4) != 'http') {
          defs[key] = this.root + '/' + path;
        }
      }
      return flat;
    },
    flattenResources: function(resources, prefix) {
      var flat = {};
      prefix = prefix ? prefix + '/' : '';

      for (var key in resources) {
        var r = resources[key];

        if (r instanceof Object && !('src' in r)) {
          var tmp = this.flattenResources(r, prefix + key);

          for (var k in tmp) {
            flat[k] = tmp[k];
          }
        } else {
          flat[prefix + key] = r;
        }
      }

      return flat;
    },
    explodeResources: function(resources) {
      var tree = {};

      for (var key in resources) {
        var branch = tree;
        var parts = key.split('/');

        while (parts.length) {
          var k = parts.shift();

          if (parts.length) {
            if (!branch[k]) {
              branch[k] = Number(parts[0]) == NaN ? {} : [];
            }
            branch = branch[k];
          } else {
            branch[k] = resources[key];
          }
        }
      }

      return tree;
    }
  });

  Okariino.Game.BaseExt.extend = function(options) {
    var foo = Okariino.Game.Base.extend(options);
    var base = Okariino.Game.BaseExt.prototype;

    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        foo.prototype[key] = options[key];
      }
    }

    for (var key in base) {
      if (base.hasOwnProperty(key)) {
        foo.prototype[key] = base[key];
      }
    }

    return foo;
  };

  Okariino.Game.LoadScreen = Okariino.Game.BaseExt.extend({
    name: 'load_screen',
    loadTemplates: false,
    init: function() {
      var throbber = '/sites/default/themes/okariino/images/ajax-loader.gif';
      var View = Okariino.Game.View.Base.extend({
        template: '<img src="{0}" alt="Loading game ..."/><div id="ls-progress-bar"><div id="ls-progress"></div></div>'.format(throbber),
        overlay: true,
      });

      this.view = new View;
      this.view.$el.appendTo(this.board);
      this.view.render();

      this.buttons.close.on('click', function() {
        this.trigger('userClosed');
      }.bind(this));
    },
    loadStyle: function() { }
  });

  Okariino.BaseCharacter = Okariino.Object.extend({
    _context: null,
    _once: [],
    soundInstance: null,
    speak: function(sound_id) {
      this.stop();
      this.select(sound_id);
      this.repeat();
    },
    speakOnce: function(sound_id) {
      this.select(sound_id);

      if (this._once.indexOf(sound_id) == -1) {
        this._once.push(sound_id);
        this.repeat();
      }
    },
    repeat: function() {
      if (this.soundInstance) {
        this.soundInstance.play();
      }
    },
    stop: function() {
      if (this.soundInstance) {
        if (this.soundInstance.playState == Okariino.sound.PLAY_SUCCEEDED) {
          this.soundInstance.stop();
        }
        this.trigger('speakFinished', this.soundInstance);
      }
    },
    select: function(sound_id) {
      this.soundInstance = Okariino.sound.createInstance(sound_id);

      if ('on' in this.soundInstance) {
        this.soundInstance.on('complete', this.stop, this);

        this.soundInstance.on('succeeded', function() {
          this.trigger('speakStarted', this.soundInstance);
        }, this);
      }
    }
  });

  Object.defineProperty(Okariino.BaseCharacter.prototype, 'context', {
    get: function() {
      return this._context;
    },
    set: function(context) {
      this._context = context;
      this._once = [];

      if (context) {
        context.once('closed', this.stop, this);
      }
    }
  });

  Okariino.Olli = Okariino.BaseCharacter.extend({
    id: 'olli',
    initialize: function() {
  //     this.elem = $('character-guide');

      this.on('speakStarted', function() {
        $('#character-guide').addClass('speaking');
      });

      this.on('speakFinished', function() {
        $('#character-guide').removeClass('speaking');
      });
    }
  });

  /**
  * Shared object
  */
  Okariino.olli = new Okariino.Olli;
  Okariino.olivia = new Okariino.BaseCharacter;
}(jQuery));
