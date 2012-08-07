<?php 
/**
 * Begin ajax functions for map manager
 */
function get_overlay_data() {
    global $wpdb;
    
    $query = "select id, coords from wp_ligorio_data";

    if ($_GET["data"]["id"]) {
        $query .= " where id = " . $_GET["data"]["id"];
    }
    //echo $query;

    $results = $wpdb->get_results($query, ARRAY_A);
    
    // decode json field as assoc. array fore easy json manipulation
    foreach ($results as &$row) {
        $row["coords"] = json_decode($row["coords"], true);
        $row["tags"] = get_the_tags($id = $row["id"]);
        $row["categories"] = array();

        $i = 0;
        $categories = get_the_category($id = $row["id"]);
        foreach ($categories as $category) {
            $row["categories"][$i] = $category->cat_ID;
            $i++;
        }
    }

    //echo "<pre>" . print_r($results, true) . "</pre>";
    header("Content-type: application/json");
    //echo $results['coords'];
    echo json_encode(Array("overlays" => $results));
    exit;
}

function delete_post_data() {
    global $wpdb;
    $wpdb->query(
        "DELETE from wp_ligorio_data where id = 76"
    );

    exit;
}

function post_overlay_data() {
    global $wpdb;
    global $page;
    $tableName = 'wp_ligorio_data';
    //if ($_POST["data"]["overwrite"] == "true") {
    // delete rows corresponding to id from wp_ligorio_data
    $query = $wpdb->prepare("delete from " . $tableName . " where id = " . $_POST['data']['id']);
    $wpdb->query($query);
    //}
    
    $inputFormat = array(
        '%d',       // ID of article
        '%s'        // json encoded points array
    );
    if (count($_POST['data']['points']) > 0) {
        foreach($_POST['data']['points'] as $overlay) {
            $inputData = array(
                //'title' => 'Collisseum',
                'id' => $_POST['data']['id'],
                'coords' => json_encode(array("points" => $overlay))
            );
            //echo json_encode($inputData);
            $wpdb->insert($tableName, $inputData, $inputFormat);
        }
    }

    // echo a success message
    
    exit;
}

function get_post_data() {
    global $wpdb;
    //global $post;
    $post_res = get_post($_GET['id']);

    // setup the post data so we can get access to the excerpt
    setup_postdata($post_res);

    $page_data = array(
        "ID"            => $post_res->ID,
        "guid"          => $post_res->guid,
        "post_title"    => $post_res->post_title,
        "post_content"  => get_the_content("Read on.."),
        "post_excerpt"  => get_the_excerpt(),
        "permalink"     => get_permalink($post_res->ID)
    );
    header("Content-type: application/json");
    echo json_encode($page_data);

    exit;
}


// register custom ajax actions
add_action('wp_ajax_post_overlay_data', 'post_overlay_data');

add_action('wp_ajax_get_overlay_data', 'get_overlay_data');
add_action('wp_ajax_nopriv_get_overlay_data', 'get_overlay_data');

add_action('wp_ajax_get_post_data', 'get_post_data');
add_action('wp_ajax_nopriv_get_post_data', 'get_post_data');

add_action('wp_ajax_delete_post_data', 'delete_post_data');
add_action('wp_ajax_nopriv_delete_post_data', 'delete_post_data');

?>