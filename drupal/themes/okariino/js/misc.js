(function($) {
  "use strict";

  $(function() {

    // Toggle sounds and the sound icon
    $('#toolbar-toggle-sound').click(function() {
      var button = $(this);

      if (Okariino.isMuted) {
        button.removeClass('muted');
      } else {
        button.addClass('muted');
      }

      Okariino.isMuted = !Okariino.isMuted;
    });
  });
})(jQuery);
