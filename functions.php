<?php

require ('includes/map-manager-ajax.php');
require ('includes/mce-hooks.php');
require_once ( 'includes/theme-options.php');

function vor_get_require($filename) {
    ob_start();
    require($filename);
    return ob_get_clean();
}

function vor_theme_setup() {
    // override excerpt functionality from parent theme
    remove_filter('get_the_excerpt', 'responsive_custom_excerpt_more');
    remove_filter('excerpt_more', 'responsive_auto_excerpt_more');
    add_filter('excerpt_more', 'vor_excerpt_more');

    // override the default gallery shortcode from wordpress
    // allows us to use rotator w/ lightboxing effect
    remove_shortcode('gallery', 'gallery_shortcode');
    add_shortcode('gallery', 'vor_gallery_shortcode');

    // add image sizes to be used in the custom gallery
    add_image_size('gallery-big', 600, 320, false);
    add_image_size('gallery-lightbox', null, 500, false);
}
add_action('after_setup_theme', 'vor_theme_setup');

function vor_trash_post_hook($pid) {
    global $wpdb;
    if ($wpdb->get_var($wpdb->prepare('SELECT id FROM wp_ligorio_data WHERE id = %d', $pid))) {
        return $wpdb->query($wpdb->prepare('DELETE FROM wp_ligorio_data WHERE id = %d', $pid));
    }
    return true;
}
add_action('trash_post', 'vor_trash_post_hook');


wp_register_script('seadragon', get_stylesheet_directory_uri() . '/js/seadragon-min.js', array());
wp_register_script('raphael', get_stylesheet_directory_uri() . '/js/raphael-min.js', array());
wp_register_script('seajax', get_stylesheet_directory_uri() . '/js/seajax-utils.js', array('seadragon', 'raphael'));
wp_register_script('map-manager', get_stylesheet_directory_uri() . '/js/map-manager.js', array('jquery', 'seajax'));
wp_register_script('slides', get_stylesheet_directory_uri() . '/js/slides.js', array('jquery'));
wp_register_script('lightbox', get_stylesheet_directory_uri() . '/js/lightbox.js', array('jquery'));


/**
 * @deprecated
 */
function get_excluded_pages($as_string = false) {
    $excluded_ids = Array(
        9,          // Article List
        25,         // About Us
        123,        // Recent Articles
        127,        // Sitemap
        83,        // Map Manager
    );
    
    if ($as_string)
        return implode(",", $excluded_ids);
    return $excluded_ids;
}

// custom gallery shortcode
function vor_gallery_shortcode($attr) {
    global $post;
    
    $output = vor_get_require('includes/template-slider.php');
    
    return $output;
}

function vor_excerpt_more($more) {
    global $id;
    return ' <a href="' . get_permalink($id) . '">' . __('<div class="read-more">Read more &#8250;</div><!-- end of .read-more -->', 'responsive') . '</a>';
}

function vor_get_images($size = 'thumbnail') {
    global $post;
    
    $photos = get_children( array(
        'post_parent'       => $post->ID, 
        'post_status'       => 'inherit', 
        'post_type'         => 'attachment', 
        'post_mime_type'    => 'image', 
        'order'             => 'ASC', 
        'orderby'           => 'menu_order ID') );
    
    $results = array();

    if ($photos) {
        foreach ($photos as $photo) {
            // get the correct image html for the selected size
            $results[] = wp_get_attachment_image($photo->ID, $size);
        }
    }

    return $results;
}

function vor_get_post_image($size = 'thumbnail') {
    global $post;

    $photos = get_children( array('post_parent' => $post->ID, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => 'ASC', 'orderby' => 'menu_order ID') );
    
    if ($photos) {
        $photo = array_shift($photos);
        return wp_get_attachment_image($photo->ID, $size);
    }
    
    return false;
}


if (!function_exists('disableAdminBar')) {
    function disableAdminBar() {
        remove_action('wp_head', '_admin_bar_bump_cb');
        wp_deregister_script('admin-bar');
        wp_deregister_style('admin-bar');
        remove_action('wp_footer','wp_admin_bar_render',1000);    
    }
}

/*
 * Adds capability for contributor to upload files
 *
 */
if ( current_user_can('contributor') && !current_user_can('upload_files') )
    add_action('admin_init', 'allow_contributor_uploads');

function allow_contributor_uploads() {
    $contributor = get_role('contributor');
    $contributor->add_cap('upload_files');
}

/*
 * Wrapper for wls_log
 *
 */
function logit($level, $text) {
    // for development side only. 
    // used to log messages instead of having to use print statements
    if(function_exists('wls_log')) {
        $current_user = wp_get_current_user();
        wls_log('testing', $text, $current_user->ID, null, null, $level);
    }
}

?>
