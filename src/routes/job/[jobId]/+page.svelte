<script lang="ts">
    import type { AnsiblePlaybookModel, JobsModel } from "$lib/types";
    import type { Modal } from "bootstrap";
    import type { PageServerData } from "./$types";
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { LogLevel } from "$lib/enums";

    //load from server side
    let { data }: { data: PageServerData; form: FormData } = $props();
    let job: JobsModel = $state(data.job);
    let logs: any[] = $state(data.jobLogs);
</script>

<svelte:head>
    <title>Job Logs</title>

    <style type="text/css" media="screen">
        #TestFloatingAdd {
            position: fixed;
            right: 20px;
            bottom: 20px;
        }

        .form-validation-message {
            color: red;
        }

        #editor {
            width: 100%;
            height: 100%;
        }

        .job-log-header {
            color: #bdf4bd;
        }

        .not-completed {
            color: #db4242;
        }
    </style>

    <script type="text/javascript" src="/src/js/ace/ace.js"></script>
</svelte:head>

<div class="container-fluid mt-2">
    <div class="row">
        <div class="col-12">
            <div class="row">
                <div class="col-4">
                    <h3 class="job-log-header">Job:</h3>
                </div>
                <div class="col-4">
                    <h3 class="job-log-header">{job.jobDescription}</h3>
                </div>
            </div>
            <div class="row">
                <div class="col-4">
                    <h3 class="job-log-header">Started By:</h3>
                </div>
                <div class="col-4">
                    <h3 class="job-log-header">{job.startedByName}</h3>
                </div>
            </div>
            <div class="row">
                <div class="col-4">
                    <h3 class="job-log-header">Completed:</h3>
                </div>
                <div class="col-4">
                    <h3 class="job-log-header {job.completed ? '' : 'not-completed'}">{job.completed ? "Yes" : "No"}</h3>
                </div>
            </div>
            {#if job.completed}
                <div class="row">
                    <div class="col-4">
                        <h3 class="job-log-header">Completed At:</h3>
                    </div>
                    <div class="col-4">
                        <h3 class="job-log-header">{job.completedOn.toUTCString()}</h3>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>Level</th>
                <th>Message</th>
            </tr>
        </thead>
        <tbody>
            {#each logs as log}
                <tr>
                    <td>{log.createdOn.toUTCString()}</td>
                    <!--VS Code will NOT format this in any decent way-->
                    <td
                        >{// @ts-ignore
                        LogLevel[log.logLevel]}
                    </td>
                    <td>{@html log.log.trim().replaceAll("\n", "<br>")}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
