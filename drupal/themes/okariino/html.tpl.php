<?php

/*header('Content-Type: application/xhtml+xml; charset=UTF-8');
print '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL*/;

?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="fi">
<head>
  <title>Okariino.fi</title>
  <!-- <meta name="viewport" content="width=1060, height=540, initial-scale=device-width, user-scalable=1"> -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />

  <!--[if lt IE 9]>
  <style type="text/css">
    #ie-warning { display: block; }
    #l-wrap { display: none; }
  </style>
  <![endif]-->

  <![if gt IE 8]>
  <?= $styles ?>

  <style>
  html, body {
    overflow: hidden;
  }
  </style>
  <?= $scripts ?>

  <script type="text/javascript">
    function tr(str, args) { return Drupal.t(str, args); }

    Okariino.settings.debug = true;
    Okariino.settings.paths.global.root = '<?= '' //$base_path ?>';
    Okariino.settings.paths.theme.root = '<?= $directory ?>';
    Okariino.settings.paths.games.root = 'sites/default/games';
  </script>
  <![endif]>
</head>
<body class="<?= $classes ?>" <?= $attributes ?>>
  <?= $page_top ?>
  <?= $page ?>
  <?= $page_bottom ?>

  <script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){ (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o), m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m) })(window,document,'script','//www.google-analytics.com/analytics.js','ga'); ga('create', 'UA-707659-40', 'auto'); ga('send', 'pageview'); </script>
</body>
</html>
