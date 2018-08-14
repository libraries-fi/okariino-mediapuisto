(function($) {
  "use strict";

  jQuery.fn.addCharacter = function(id, character) {
    var board = this;

    return this.each(function() {
      var image_file = character.image ? character.image : (id + '.png');
      var image_src = Okariino.dir('theme.images') + '/' + image_file;

      var map_id = 'map-' + id;
      var img_id = 'img-' + id;

      var char = $('<div/>')
        .addClass('okariino-character')
        .attr('id', 'character-' + id);

      var img = $('<img/>')
        .attr('src', image_src)
        .attr('alt', 'character_' + id)
        .attr('usemap', '#' + map_id)
        .attr('id', img_id)
        .addClass('base');

      var map = $('<map/>')
        .attr('id', map_id)
        .attr('name', map_id);

      var area = $('<area/>')
        .attr('shape', 'poly')
        .attr('coords', character.map.coords);

      map.append(area);
      char.append(map);
      char.append(img);
      board.append(char);

      if (character.game) {
        char.addClass('game-' + character.game);
        var href = '#game/{0}'.format(character.game);

        if (character.action) {
          href += '/{0}'.format(character.action);

          if (character.params) {
            for (var i = 0; i < character.params.length; i++) {
              href += '/{0}'.format(character.params[i]);
            }
          }
        }

        area.attr('href', href);
      } else {
        area.attr('href', '#foobar');
      }

      if (character.hover) {
        var hover = $('<img/>')
          .attr('src', image_src.replace(/(\.\w+)$/, '-hover$1'))
          .attr('alt', 'character-hover-' + id)
          .attr('usemap', '#' + map_id)
          .addClass('hover');

        char.append(hover);

        map.on('mouseover', function() {
          $(this).siblings('.base').hide().siblings('.hover').show();
        });

        map.on('mouseout', function() {
          $(this).siblings('.hover').hide().siblings('.base').show();
        });
      }

      // Prevent animations from altering hash.
      area.click(function(event) {
        if ($(this).attr('href') == '#foobar') {
          event.preventDefault();
        }
      });
    });
  };

  $(function() {
    var js_root = Okariino.dir('theme.scripts');
    var characters_path = '{0}/characters.json'.format(js_root);
    $.get(characters_path, function(characters) {
      Okariino.characters = characters;

      for (var i = 0; i < characters.length; i++) {
        var nr = parseInt(i) + 1;
        var screen = $('#screen-{0}'.format(nr));

        for (var id in characters[i]) {
          var char = characters[i][id];
          if (!char.image) {
            char.image = 'screen_{0}/{1}.png'.format(nr, id);
          }
          screen.addCharacter(id, char);
        }
      }

      $('#olli2map').click(function(e) {
        e.preventDefault();
        Okariino.olli.repeat();
      });

      $.getScript('{0}/init_animations.js'.format(js_root));
    });
  });

  $(function() {
    $(document).on('click', 'img.jingle', function(event) {
      var elem = $(this);
      var sound_id = elem.data('jingle');
      var bubble_pos = elem.data('bubble') || 'left';

      Okariino.olivia.speak('jingle_' + sound_id);
    });
  });
})(jQuery);
