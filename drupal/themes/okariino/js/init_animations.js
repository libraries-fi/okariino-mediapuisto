(function($) {
  "use strict";
  
  $(function() {
    $('#character-tuubi-3')
      .filmStrip({
        states: [4],
        delay: 200
      })
      .click(function() {
        Okariino.sound.play('okariino/pruuts');
        $(this).filmStrip('nextState');
      });

    $('#character-tuubi-4')
      .filmStrip({
        states: [3, 3, 3, 3],
        delay: 200
      })
      .click(function() {
        var state = $(this).filmStrip('state');

        if (state == 0) {
          Okariino.sound.play('okariino/tubecap');
        } else {
          Okariino.sound.play('okariino/pruuts');
        }

        $(this).filmStrip('nextState');
      });
  });
}(jQuery));
