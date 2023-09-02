<?php
// if uninstall.php is not called by WordPress, die
if (!defined('WP_UNINSTALL_PLUGIN')) {
    die;
}

// Remove plugin options on unistallation
delete_option('wphtgd_restart');
delete_option('wphtgd_plugins_api_execution_time');
delete_option('wphtgd_array_length');

