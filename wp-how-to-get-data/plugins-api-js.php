<?php
/** Plugins_api javascript code written in php to force javascript code to execute after the button being echoed on the page in PHP */
?>
<script>
(function($) {
    // Data sent from server (wp_localize_script)
    var pluginsApiAjaxUrl = dataSentFromPhp.ajax_url;
    var pluginsApiNonce = dataSentFromPhp.get_data_nonce;
    var restartNonce = dataSentFromPhp.restart_cycle_nonce;
    // Set the default num of queries 
    var pluginsApiQueries = 42;
    var queriesInfo = 'Selected num of queries for plugins_api run: <strong>' + pluginsApiQueries + '</strong>. ';
    var selectedNumOfQueries = document.getElementById('selected-num-of-queries');
    if (selectedNumOfQueries) {
        selectedNumOfQueries.innerHTML = queriesInfo;
    }
    // Reset the num of queries on selection
    var queriesSelectionEl = document.getElementById("num-of-queries-selection");
    if (queriesSelectionEl) {
        queriesSelectionEl.addEventListener('change', function() {
            pluginsApiQueries = this.value;
            var queriesInfo = 'Selected num of queries for plugins_api run: <strong>' + pluginsApiQueries +
                '</strong>. ';
            selectedNumOfQueries.innerHTML = queriesInfo;
        });
    }
    // Set the default description options (if not previously set)
    var descriptionOption = 'short_description';
    var descriptionInfo = 'Selected description options: <strong>' + descriptionOption + '</strong>. ';
    var selectedDescriptionOption = document.getElementById('selected-description-option');
    if (selectedDescriptionOption) {
        selectedDescriptionOption.innerHTML = descriptionInfo;
    }
    // Reset the filter on selection
    var descriptionSelectionEl = document.getElementById("description-option-selection");
    if (descriptionSelectionEl) {
        descriptionSelectionEl.addEventListener('change', function() {
            descriptionOption = this.value;
            var descriptionInfo = 'Selected description options: <strong>' + descriptionOption +
                '</strong>. ';
            selectedDescriptionOption.innerHTML = descriptionInfo;
        });
    }

    // Ajax post (send) the trigger for plugins_api run (in PHP)
    $('.plugins-api .execute-plugins-api').on('click', function() {
        // Declaring plugins_api run function
        function triggerPluginsApiRun() {
            $.ajax({
                type: "POST",
                url: pluginsApiAjaxUrl,
                data: {
                    'action': 'wphtgd_run_plugins_api',
                    'get_data_nonce': pluginsApiNonce,
                    'plugins_api_queries_num': pluginsApiQueries,
                    'plugins_description_options': descriptionOption
                },
                success: function() {
                    console.log(
                        'Ajax POST successful - plugins_api run started!'
                    );
                },
                error: function(errormessage) {
                    console.log(errormessage);
                }
            });
        }
        // Run the trigger function
        triggerPluginsApiRun();
    });
    // Ajax post (send) the trigger for json files deletion (in PHP)
    $('.plugins-api-buttons .delete').on('click', function() {
        // Declaring data cycle restart function
        function triggerDataCycleRestart() {
            $.ajax({
                type: "POST",
                url: pluginsApiAjaxUrl,
                data: { // Data object
                    'action': 'wphtgd_restart_plugins_api_cycle',
                    'restart_cycle_nonce': restartNonce,
                    'restart_trigger': '0' // reset to default value
                },
                success: function() {
                    console.log(
                        'Ajax POST successful - restarting data download cycle (wait for plugins_api to run again!'
                    );
                    // Reload the page - in order to trigger the new cycle of plugins_api data download
                    location.reload();
                },
                error: function(errormessage) {
                    console.log(errormessage);
                }
            });
            // Delete localStorage
            localStorage.removeItem('youtube-api-starting-index');
        }
        // Run the trigger function
        triggerDataCycleRestart();
    });
})(jQuery);
</script>