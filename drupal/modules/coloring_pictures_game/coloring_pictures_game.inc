<?php

function dcp_extract_template_fields($template) {
    $src = $template->dcp_field_template['und'][0]['uri'];
    $src = file_create_url($src);

    return array(
        'id' => $template->nid,
        'created' => $template->created,
        'src' => $src,
    );
}

function dcp_extract_picture_fields($picture) {
    $name = $picture->dcp_picture_user['und'][0]['value'];
    $age = $picture->dcp_picture_age['und'][0]['value'];
    $file = file_create_url($picture->dcp_picture_file['und'][0]['uri']);

    return array(
        'id' => $picture->nid,
        'created' => $picture->created,
        'url' => $file,
        'user' => array(
            'name' => $name,
            'age' => $age,
        ),
    );
}

function _dcp_template_index($page, $parameters) {
    $q = new EntityFieldQuery();
    $q->entityCondition('entity_type', 'node');
    $q->propertyCondition('status', 1);
    $q->propertyCondition('type', 'dcp_template');
    $q->propertyOrderBy('changed', 'asc');

    try {
        $r = $q->execute();
    } catch (Exception $e) {
        return $e->getMessage();
    }

    if (empty($r['node'])) {
        return array();
    }

    $data = node_load_multiple(array_keys($r['node']));
    $templates = array_map('dcp_extract_template_fields', $data);

    usort($templates, function($a, $b) {
        return $b['created'] - $a['created'];
    });

    return $templates;
}

function _dcp_template_retrieve($id) {
    $node = node_load($id);

    if ($node && $node->type == 'dcp_template') {
        $data = dcp_extract_template_fields($node);
        return $data;
    } else {
        return null;
    }
}

function _dcp_picture_retrieve($id) {
    $node = node_load($id);

    if ($node && $node->type == 'dcp_picture') {
        $data = dcp_extract_picture_fields($node);
        return $data;
    } else {
        return null;
    }
}

function _dcp_picture_create($data) {
    $title = t('DCP drawing sent by @name, @age years old', array(
        '@name' => $data['user']['name'],
        '@age' => $data['user']['age'],
    ));

    $picture = new stdClass();
    $picture->type = 'dcp_picture';
    $picture->language = 'und';
    $picture->status = 1;
    $picture->title = $title;
    $picture->dcp_picture_user['und'][0]['value'] = $data['user']['name'];
    $picture->dcp_picture_age['und'][0]['value'] = $data['user']['age'];

    try {
        $path = sprintf('public://dcp/drawing_%s.svg', uniqid(true));
        $file = file_save_data($data['data'], $path);
        $file->description = '';
        $file->display = 1;

        $picture->dcp_picture_file['und'][0] = (array)$file;
        node_save($picture);
        return 'OK';
    } catch (Exception $e) {
        return $e->getMessage();
    }
}

function _dcp_picture_index($page, $parameters) {
    $q = new EntityFieldQuery();
    $q->entityCondition('entity_type', 'node');
    $q->propertyCondition('status', 1);
    $q->propertyCondition('type', 'dcp_picture');
    $q->propertyOrderBy('changed', 'desc');

    $r = $q->execute();

    if (empty($r['node'])) {
        return array();
    }

    $data = node_load_multiple(array_keys($r['node']));
    $pictures = array_map('dcp_extract_picture_fields', $data);

    usort($pictures, function($a, $b) {
        return $b['created'] - $a['created'];
    });

    return $pictures;
}

function _dcp_template_access() {
    return true;
}

function _dcp_picture_access($op, $args) {
    return true;
}
