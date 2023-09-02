<?php
/*
Plugin Name: WP How to - get data
Description: Get data used in WP How to - video tutorials plugin.
 */

// Activation hook - register/set plugin options
if (!function_exists('wphtgd_activation')) {
    function wphtgd_activation()
    {
        // Add options
        add_option('wphtgd_restart', '0');
        add_option('wphtgd_plugins_api_execution_time', '0');
        add_option('wphtgd_array_length', '0');
        // Starting array and create final file for data combined storage
        $starting_array = array();
        $plugins_api_json_file = WP_PLUGIN_DIR . '/wp-how-to-get-data/data/plugins-api.json';
        file_put_contents($plugins_api_json_file, json_encode($starting_array));
    } 
    register_activation_hook(__FILE__, 'wphtgd_activation');
}

// Admin resources
if (!function_exists('wphtgd_admin_resources')) {
    function wphtgd_admin_resources()
    {
        wp_register_script('helper-script-js', plugin_dir_url(__FILE__) . '/helper-script.js', array('jquery'), false);
        wp_localize_script('helper-script-js', 'dataSentFromPhp', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'get_data_nonce' => wp_create_nonce('get_data_nonce'),
            'restart_cycle_nonce' => wp_create_nonce('restart_cycle_nonce'),
        ));
        wp_enqueue_script('helper-script-js');
    }
    add_action('admin_enqueue_scripts', 'wphtgd_admin_resources');
}

// Add admin submenus
if (!function_exists('wphtgd_admin_menu')) {
    function wphtgd_admin_menu()
    {
        // Submenu for plugins_api data
        add_submenu_page('options-general.php', // parent menu item - general settings in this case
            'WPHTGD - plugins_api', // page title
            'WPHTGD - plugins_api', // menu title
            'activate_plugins', // (user role) capability - restricted to admins
            'wphtgd_plugins_api', // options page slug
            'wphtgd_plugins_api' // output function
        );
    }
    add_action('admin_menu', 'wphtgd_admin_menu');
}

// Declaring a function to be used later - Convert Multi-Dimentional Object to Array
if (!function_exists('wphtgd_object_to_array')) {
    function wphtgd_object_to_array($object)
    {
        if (!is_object($object) && !is_array($object)) {
            return $object;
        }
        return array_map('wphtgd_object_to_array', (array) $object);
    }
}

// Plugins_api page
if (!function_exists('wphtgd_plugins_api')) {
    function wphtgd_plugins_api()
    {
        // Show if data is already stored (restart option) or not
        $restart_check = intval(get_option('wphtgd_restart'));
        if ($restart_check > 0) { // Check if data storage is already done
            // Show info about the data
            $stored_execution_time_sec = get_option('wphtgd_plugins_api_execution_time');
            echo '<b>Data already collected and stored!</b></br>';
            $stored_execution_time_min = intval($stored_execution_time_sec) / 60;
            echo '</br><b>Total Execution Time:</b> ' . $stored_execution_time_sec . ' sec (' . $stored_execution_time_min . ' min)</br>';
            $stored_data_length = get_option('wphtgd_array_length');
            echo '</br><b>Array size: </b>' . $stored_data_length;
            echo '<div class="plugins-api-buttons"><button class="delete">Restart data download cycle</button></div>';
            // Javascript code
            include_once plugin_dir_path(__FILE__) . '/plugins-api-js.php';
            // Then exit
            return;
        } else { // Otherwise provide an option to start the plugins_api data download
            echo
                "<div class='plugins-api'>
                <div class='info'>
                    <p id='selected-num-of-queries'></p>
                    <p id='selected-description-option'></p>
                </div>
                <div class='num-of-queries-selection'>
                    <label for='num-of-queries-selection'>Choose the number of plugins_api queries (x250):</label>
                    <input type='number' id='num-of-queries-selection' name='num-of-queries-selection' min='1' max='42'>
                </div>
                <div class='description-option-selection'>
                    <label for='description-option-selection'>Choose the plugin description option:</label>
                    <select name='description-option-selection' id='description-option-selection'>
                        <option value='short_description'>Short description (WP How to plugin)</option>
                        <option value='description'>Full description (How to build a website WP)</option>
                    </select>
                </div>
                <button class='execute-plugins-api'>Plugins_api Execution</button>
                <p><b>Check the console (network tab - admin-ajax.php (when it shows preview other than 0, all is sent!)</b></p>
            </div>";
            // Javascript code
            include_once plugin_dir_path(__FILE__) . '/plugins-api-js.php';
        }
    }
}

// Trigger plugins_api download
if(!function_exists('wphtgd_run_plugins_api')) {
    function wphtgd_run_plugins_api() {
        // Security check - verify set nonce
        if (!wp_verify_nonce($_POST["get_data_nonce"], "get_data_nonce")) {
            exit("No naughty business please");
        }
        // plugins_api number of queries - based on wordpress.org number of plugins divided with 250 (+1 - starting from page 1)
        $num_of_queries = $_POST["plugins_api_queries_num"];
        // Chosen short or full description
        $description_options = $_POST["plugins_description_options"];
        // Start timer for script execution
        $time_start = microtime(true);
        $plugins_api_json_file = WP_PLUGIN_DIR . '/wp-how-to-get-data/data/plugins-api.json';

        if (!function_exists('plugins_api')) {
            require_once ABSPATH . '/wp-admin/includes/plugin-install.php';
        }

        for ($num = 1; $num <= $num_of_queries; $num++) {
            if ($num == $num_of_queries) { // End the loop when all data is retrieved
                break;
            } else { // Get the data
                $full_array = array();
                // Must start with 1 (0 makes the loop repeat on first page)
                $plugins_data = plugins_api(
                    'query_plugins',
                    array(
                        'per_page' => 250, // max num
                        'page' => $num,
                        'browse' => 'popular',
                    )
                );
                $plugins_data_array = wphtgd_object_to_array($plugins_data);
                array_push($full_array, $plugins_data_array);
                // Extract only the 'plugins' array (from the original data)
                $plugins_array = array();
                for ($i = 0; $i < count($full_array); $i++) {
                    foreach ($full_array[$i]['plugins'] as $value) {
                        array_push($plugins_array, $value);
                    }
                }
                // Reduce the plugins data only to desired fields
                $reduced_array = array();
                for ($i = 0; $i < count($plugins_array); $i++) {
                    $plugin_name = $plugins_array[$i]['name'];
                    $plugin_slug = $plugins_array[$i]['slug'];
                    $plugin_description = $plugins_array[$i][$description_options];
                    array_push($reduced_array,
                        [
                            $plugin_name,
                            $plugin_slug,
                            $plugin_description,
                        ]
                    );
                }
                // Name the array keys
                $renamed_array = array();
                foreach ($reduced_array as $array) {
                    $item = [
                        "name" => $array[0],
                        "slug" => $array[1],
                        "plugin_description" => $array[2],
                    ];
                    array_push($renamed_array, $item);
                }
                // Store individual api request arrays (of 250 plugins) into separate json files
                $json_data = json_encode($renamed_array);
                $json_file_name = WP_PLUGIN_DIR . '/wp-how-to-get-data/data/array-' . strval($num) . '.json';
                file_put_contents($json_file_name, $json_data);
            }
        }
        // Merge the data
        for ($num = 1; $num <= $num_of_queries; $num++) {
            if ($num == $num_of_queries) { // End the loop when all data is stored
                break;
            } else { // Store the data
                // Get individual file data
                $json_file_name = WP_PLUGIN_DIR . '/wp-how-to-get-data/data/array-' . strval($num) . '.json';
                $individual_data = json_decode(file_get_contents($json_file_name), true);
                // Check the existing data
                $existing_data = json_decode(file_get_contents($plugins_api_json_file), true);
                // Merge the data
                $end_result = array_merge($existing_data, $individual_data);
                file_put_contents($plugins_api_json_file, json_encode($end_result));
                // Delete all the individual array files
                unlink($json_file_name);
            }
        }
        // Get the final data without duplicate values
        $full_data = array_unique(json_decode(file_get_contents($plugins_api_json_file), true), SORT_REGULAR);
        file_put_contents($plugins_api_json_file, json_encode($full_data));
        // Show the final array count
        $data_length = count($full_data);
        echo '<b>Array size: </b>' . $data_length;
        // Measure time for script execution
        $time_end = microtime(true);
        $execution_time_sec = ($time_end - $time_start);
        $execution_time_min = ($time_end - $time_start) / 60;
        echo '</br></br><b>Total Execution Time:</b> ' . $execution_time_sec . ' sec (' . $execution_time_min . ' min)';
        // Update option for info - when data is already stored (if statement)
        update_option('wphtgd_plugins_api_execution_time', strval($execution_time_sec));
        update_option('wphtgd_array_length', strval($data_length));
        update_option('wphtgd_restart', $data_length);
    }
    add_action('wp_ajax_wphtgd_run_plugins_api', 'wphtgd_run_plugins_api');
}

// Trigger restart cycle
if (!function_exists('wphtgd_restart_plugins_api_cycle')) {
    function wphtgd_restart_plugins_api_cycle()
    {
        // Security check - verify set nonce
        if (!wp_verify_nonce($_POST["restart_cycle_nonce"], "restart_cycle_nonce")) {
            exit("No naughty business please");
        }
        // Leave data in JSON format (string)
        $restart_trigger = $_POST["restart_trigger"];
        $last_data_cycle_youtube_end_index = $restart_trigger;
        // Reset option to default values - restart the data download cycle
        update_option('wphtgd_restart', $last_data_cycle_youtube_end_index);
        // Delete json files
        $plugins_api_json_file = WP_PLUGIN_DIR . '/wp-how-to-get-data/data/plugins-api.json';
        unlink($plugins_api_json_file);
        $starting_array = array();
        // Remake an empty file (avoid error)
        file_put_contents($plugins_api_json_file, json_encode($starting_array));
        wp_die();
    }
    add_action('wp_ajax_wphtgd_restart_plugins_api_cycle', 'wphtgd_restart_plugins_api_cycle');
}