(function($, Okariino) {
  "use strict";
  $(function() {
    var carousel = $('#action-screens').carousel({
      interval: 0
    });

    carousel.on('slide', function() {
      var items = carousel.find('.item');
      var prev = carousel.find('.item.active');
      var next = carousel.find('.item.next');
      var pi = items.index(prev);
      var ni = items.index(next);
    });

    Okariino.router.on('route:gamescreen1', function() {
      Okariino.olli.stop();
      Okariino.olli.speakOnce('olli/screen1');
      $('#action-screens').carousel(0);
      $('#action-screens > .carousel-control.left').addClass('disabled');
      $('#action-screens > .carousel-control.right').removeClass('disabled');
    });

    Okariino.router.on('route:gamescreen2', function() {
      Okariino.olli.stop();
      Okariino.olli.speakOnce('olli/screen2');
      $('#action-screens').carousel(1);
      $('#action-screens > .carousel-control.left').removeClass('disabled');
      $('#action-screens > .carousel-control.right').removeClass('disabled');
    });

    Okariino.router.on('route:gamescreen3', function() {
      Okariino.olli.stop();
      Okariino.olli.speakOnce('olli/screen3');
      $('#action-screens').carousel(2);
      $('#action-screens > .carousel-control.left').removeClass('disabled');
      $('#action-screens > .carousel-control.right').addClass('disabled');
    });

    Okariino.router.on('route:launchgame', Okariino.loadGame.bind(Okariino));

    $('#action-screens > .carousel-control').click(function(event) {
      event.preventDefault();

      var to_left = $(this).hasClass('left');
      var screens = $('#action-screens > .carousel-inner > .item');
      var current = screens.filter('.active').first();
      var current_i = screens.index(current);
      var next_i = to_left ? Math.max(current_i-1, 0) : Math.min(current_i+1, screens.length-1);
      var route = $(screens[next_i]).data('route');

      Okariino.router.navigate(route, { trigger: true });
    });

    if (window.location.hash.length == 0) {
      window.location.hash = 'center';
    }

    Backbone.history.start();

    $('#action-screens').hammer({ drag: false, swipe_max_touches: 3, swipe_velocity: 0.1 })
      .on('swiperight', function() {
        $(this).children('.carousel-control').first().click();
      }).on('swipeleft', function() {
        $(this).children('.carousel-control').last().click();
      });

    document.addEventListener('ontouchstart', function(e) { e.preventDefault(); }, false );
    document.addEventListener('ontouchmove', function(e) { e.preventDefault(); }, false );

    Okariino.sound.registerSound('/sites/default/sounds/Oikein_äänimerkki.ogg',  'okariino/success');
    Okariino.sound.registerSound('/sites/default/sounds/Väärin_äänimerkki.ogg', 'okariino/failure');
    Okariino.sound.registerSound('/sites/default/sounds/Väärin2_äänimerkki.ogg', 'okariino/failure2');
    Okariino.sound.registerSound('/sites/default/sounds/Maalin pruuts.ogg', 'okariino/pruuts');
    Okariino.sound.registerSound('/sites/default/sounds/Maalipurkin korkki.ogg', 'okariino/tubecap');

    Okariino.sound.registerSound('/sites/default/sounds/olli/13 Kiva kun löysit tänne.ogg', 'olli/screen1');
    Okariino.sound.registerSound('/sites/default/sounds/olli/1 Hei minä olen Olli.ogg', 'olli/screen2');
    Okariino.sound.registerSound('/sites/default/sounds/olli/28 Moikka taas.ogg', 'olli/screen3');

    Okariino.sound.addEventListener('fileload', function(event) {
      if (event.id == 'olli/screen1' && window.location.hash == '#left') {
        Okariino.olli.speak('olli/screen1');
      }

      if (event.id == 'olli/screen2' && window.location.hash == '#center') {
        Okariino.olli.speak('olli/screen2');
      }

      if (event.id == 'olli/screen3' && window.location.hash == '#right') {
        Okariino.olli.speak('olli/screen3');
      }
    });

    $('#toolbar .checkable').on('click', function() {
      $(this).toggleClass('checked');
    });

    $('#toolbar-toggle-help').on('click', function() {
      Okariino.toggleHelp();
    });

    $('#toolbar-toggle-sound').on('click', function() {
      Okariino.toggleMute();
    });

    if (Okariino.cookie('muted')) {
      Okariino.enableMute();
      $('#toolbar-toggle-sound').addClass('checked');
    }
  });
}(jQuery, Okariino));
