<?php

$image = function($name) use ($base_path, $directory) {
  $root = $base_path . $directory;
  return htmlspecialchars($root . '/' . $name);
};

?>

<noscript>
  <p style="border: 5px solid red; background: white; padding: 10px; font-size: large">
    Okariino-leikkipuisto on interaktiivinen pelipaikka pienille lapsille.
    Okariinon käyttäminen vaatii selaimeltasi javascript-tuen. Jos haluat kokeilla
    leikkipuistoa, salli javascript tällä sivulla.
  </p>
</noscript>

<div id="l-wrap">
  <div id="logo">
    <img src="<?= $image('images/okariino-logo.png') ?>" alt="Okariino" />
  </div>
  <div id="viewport">
    <div id="character-guide" class="okariino-character">
      <img src="<?= $image('images/olli.png') ?>" usemap="#olli2map" alt="the_guide"/>
      <img id="olli-bubble" src="<?= $image('images/olli_bubble.png') ?>" alt="olli bubble"/>
    </div>
    <div id="main-content">
      <div id="pager">
        <div id="pager-grain"></div>
        <ul>
          <li data-target="#action-screens" data-slide-to="0">
            <img src="<?= $image("images/pager/screen2.jpeg") ?>" alt="screen 2"/>
          </li>
          <li data-target="#action-screens" data-slide-to="1">
            <img src="<?= $image("images/pager/screen1.jpeg") ?>" alt="screen 1"/>
          </li>
          <li data-target="#action-screens" data-slide-to="2">
            <img src="<?= $image("images/pager/screen3.jpeg") ?>" alt="screen 3"/>
          </li>
        </ul>
      </div>
      <div id="action-screens" class="carousel slide" data-interval="0">
        <a class="carousel-control left" href="#action-screens"><span>&lsaquo;</span></a>
        <a class="carousel-control right" href="#action-screens"><span>&rsaquo;</span></a>
        <ul class="carousel-inner">
          <li id="screen-1" class="item" data-route="left"></li>
          <li id="screen-2" class="item active" data-route="center"></li>
          <li id="screen-3" class="item" data-route="right"></li>
        </ul>
      </div>
    </div>
  </div>
  <div id="toolbar">
    <ul class="pull-left">
      <li>
        <a id="toolbar-toggle-help" class="checkable" title="<?= t('Näytä aputila') ?>">
          <img class="state-on" id="toolbar-icon-help-on" src="<?= $image('images/link-help-on.png') ?>" alt="help_is_on"/>
          <img class="state-off" id="toolbar-icon-help-off" src="<?= $image('images/link-help-off.png') ?>" alt="help_is_off"/>
        </a>
      </li>
      <li>
        <a id="toolbar-toggle-sound" class="checkable" title="<?= t('Aseta äänet päälle tai pois päältä') ?>">
          <img class="state-on" src="<?= $image('images/link-sound-on.png') ?>" alt="sound_is_on"/>
          <img class="state-off" src="<?= $image('images/link-sound-off.png') ?>" alt="sound_is_off"/>
        </a>
      </li>
    </ul>
    <ul class="pull-right">
      <li id="toolbar-parents">
        <a href="<?= url('parents') ?>" title="<?= t('Tietoa ja ohjeita aikuisille') ?>">
          <img src="<?= $image('images/link-aikuisille.png') ?>" alt="parents_info"/>
        </a>
      </li>
      <li id="toolbar-contact">
        <a href="<?= url('contact') ?>" title="<?= t('Ota yhteyttä ylläpitoon') ?>">
          <img src="<?= $image('images/link-email.png') ?>" alt="send_email"/>
        </a>
      </li>
      <li id="toolbar-aparaattisaari">
        <a href="http://www.aparaattisaari.fi" title="<?= t('Aparaattisaari.fi') ?>">
          <img src="<?= $image('images/link-aparaattisaari.png') ?>" alt="Aparaattisaari.fi"/>
        </a>
      </li>
    </ul>
  </div>
  <map name="olli2map" id="olli2map">
    <area shape="poly" coords="53,201,127,202,126,184,149,183,149,119,112,90,132,39,92,4,34,13,4,44,18,89,46,106,12,123,28,156,59,143,47,177" href="#olli" alt="guide_map" />
  </map>
</div>

<div id="ie-warning">
  <p>
    Okariino-leikkipuisto ei toimi käyttämälläsi versiolla Internet Explorer -selaimesta.
    Mikäli haluat kokeilla Okariinoa, vaihda uudempaan selaimeen.
  </p>
  <p>
    Tuetut selaimet ovat Mozilla Firefox, Google Chrome, Internet Explorer 9+ sekä Apple Safari (Mac).
  </p>
  <p>
    Voit käyttää Okariinoa myös mobiiliselaimilla, mutta toimivuutta vanhimmilla laitteilla emme voi luvata.
  </p>
  <ul>
    <li><a href="http://www.mozilla.org">Mozilla Firefox</a></li>
    <li><a href="http://www.google.com/chrome">Google Chrome</a></li>
    <li><a href="http://windows.microsoft.com/fi-fi/internet-explorer/download-ie">Internet Explorer</a></li>
  </ul>
</div>
