<script lang="ts">
    import type { AnsiblePlaybookModel, JobsModel } from "$lib/types";
    import type { Modal } from "bootstrap";
    import type { PageServerData } from "./$types";
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    //load from server side
    let { data }: { data: PageServerData; form: FormData } = $props();
    let jobs: JobsModel[] = $state(data.jobs);
</script>

<svelte:head>
    <title>Jobs</title>

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
    </style>

    <script type="text/javascript" src="/src/js/ace/ace.js"></script>
</svelte:head>

<div class="container-fluid mt-2">
    <table class="table">
        <thead>
            <tr>
                <th>Job ID</th>
                <th>Job Title</th>
                <th>Started By</th>
                <th>Started On</th>
                <th>Completed</th>
                <th>Completed On</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {#each jobs as job}
                <tr>
                    <td>{job.id}</td>
                    <td>{job.jobDescription}</td>
                    <td>{job.startedBy}</td>
                    <td>{job.createdOn?.toUTCString()}</td>
                    <td>{job.completed ? "Yes" : "No"}</td>
                    <td>{job.completedOn?.toUTCString()}</td>
                    <td><a href="/job/{job.id}">View Logs</a></td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
