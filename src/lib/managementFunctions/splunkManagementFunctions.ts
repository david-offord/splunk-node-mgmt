import type { Host } from "$lib/types";
import { logDebug } from "$lib/utils";
import { getSplunkAdminPassword } from "$lib/workingDirectoryFunctions/ansibleInventoryManagementFunctions";
import { log } from "console";
import * as https from 'https';
import fetch from 'node-fetch';

const DEBUG_REFRESH_LINKS = [
    "admin/conf-times", "data/ui/manager", "data/ui/nav", "data/ui/views", "admin/alert_actions", "admin/bookmarks-mc",
    "admin/clusterconfig", "admin/collections-conf", "admin/commandsconf", "admin/conf-checklist", "admin/conf-deploymentclient", "admin/conf-inputs",
    "admin/conf-times", "admin/conf-wmi", "admin/config_tracker", "admin/cooked", "admin/crl", "admin/datalake-index", "admin/datamodel-files", "admin/datamodelacceleration",
    "admin/datamodeledit", "admin/dataset_consolidation_datamodeledit", "admin/deploymentserver", "admin/distsearch-peer", "admin/eventtypes", "admin/externalconfig",
    "admin/federated-index", "admin/federated-provider", "admin/federated-settings", "admin/fieldaliases", "admin/fieldfilters", "admin/fields", "admin/fifo",
    "admin/fvtags", "admin/global-banner", "admin/health-report-config", "admin/http", "admin/index-archiver", "admin/indexer-discovery-config", "admin/indexes",
    "admin/ingest-rfs-destinations", "admin/instance_id_modular_input", "admin/journald", "admin/kvstorecache", "admin/limits", "admin/livetail", "admin/local_proxy",
    "admin/localapps", "admin/logd", "admin/lookup-table-files", "admin/macros", "admin/manager", "admin/messages-conf", "admin/metric-schema", "admin/metric-schema-reload",
    "admin/metric_alerts", "admin/metrics-reload", "admin/metricstore_rollup", "admin/modalerts", "admin/monitor", "admin/nav", "admin/noah-config", "admin/panels",
    "admin/passwords", "admin/pools", "admin/props-eval", "admin/props-extract", "admin/props-lookup", "admin/proxysettings", "admin/raw", "admin/remote_eventlogs",
    "admin/remote_monitor", "admin/remote_perfmon", "admin/remote_raw", "admin/remote_script", "admin/remote_udp", "admin/ruleset-deployment", "admin/savedsearch",
    "admin/scheduledviews", "admin/script", "admin/search-head-bundles", "admin/secure_gateway_modular_input", "admin/selfupdate_modular_input", "admin/serverclasses",
    "admin/shclusterconfig", "admin/sourcetype-rename", "admin/sourcetypes", "admin/splunk-audit", "admin/splunktcptoken", "admin/ssg_alerts_ttl_modular_input",
    "admin/ssg_deep_link_dashboard_modular_input", "admin/ssg_delete_tokens_modular_input", "admin/ssg_device_role_modular_input", "admin/ssg_enable_modular_input",
    "admin/ssg_metrics_modular_input", "admin/ssg_registered_devices_modular_input", "admin/ssg_registered_users_list_modular_input",
    "admin/ssg_subscription_clean_up_modular_input", "admin/ssg_subscription_modular_input", "admin/ssl", "admin/supervisor_modular_input", "admin/syslog", "admin/tags",
    "admin/tcpout-default", "admin/tcpout-group", "admin/tcpout-server", "admin/telemetry", "admin/transforms-extract", "admin/transforms-lookup", "admin/transforms-reload",
    "admin/transforms-statsd", "admin/udp", "admin/ui-tour", "admin/uiassets_modular_input", "admin/views", "admin/viewstates", "admin/visualizations", "admin/vix-indexes",
    "admin/vix-providers", "admin/web-features", "admin/workflow-actions", "admin/workload-policy", "admin/xrdr-config"
];


export const debugRefreshSplunk = async (host: Host) => {
    //prepare base splunk url for splunk instance
    let baseSplunkUrl = `https://${host.ipAddress}:${host.splunkManagementPort}`;

    //get the password
    let splunkAdminPassword = await getSplunkAdminPassword(host);
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
    });

    logDebug(`Refreshing Splunk for host ${host.hostname}...`);
    let successes = 0
    let failures = 0

    for (let link of DEBUG_REFRESH_LINKS) {
        let fullLink = `${baseSplunkUrl}/servicesNS/-/-/${link}/_reload`;

        //do the requests, only wait like 10 seconds. shouldnt ever take longer than that
        let response = await fetch(fullLink, {
            method: 'GET',
            agent: httpsAgent,
            signal: AbortSignal.timeout(10000),
            headers: {
                'Authorization': `Basic ${Buffer.from(`admin:${splunkAdminPassword}`).toString('base64')}`
            }
        });

        //record any failures/successes
        if (response.ok) {
            successes++;
        }
        else {
            failures++;
        }
    }


    logDebug(`Completed refresh for ${host.hostname}. Successes: ${successes}, Failures: ${failures}`);

}