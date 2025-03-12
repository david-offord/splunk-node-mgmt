<script lang="ts">
    import { AddOnManagementPermissions, HostManagementPermissions, PlaybookManagementPermissions, ServerClassManagementPermissions, UserManagementPermissions } from "$lib/enums";
    import type { UserWithPermissions } from "$lib/types.js";

    let { data, children } = $props();

    let username = data.user.userName;
    let permissions: UserWithPermissions = data.permissions;
</script>

<nav class="navbar navbar-expand-lg navbar">
    <div class="container-fluid">
        <a class="navbar-brand" href="/">Splunk Node Manager</a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
                {#if permissions !== null && permissions.hostManagement !== HostManagementPermissions.None}
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="/">Host Manager</a>
                    </li>
                {/if}
                {#if permissions !== null && permissions.serverClassManagement !== ServerClassManagementPermissions.None}
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="/serverclass">Server Classes</a>
                    </li>
                {/if}
                {#if permissions !== null && permissions.addonManagement !== AddOnManagementPermissions.None}
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="/addons">Add-on Manager</a>
                    </li>
                {/if}
                {#if permissions !== null && permissions.playbookManagement !== PlaybookManagementPermissions.None}
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="/playbooks">Playbook Manager</a>
                    </li>
                {/if}
                {#if permissions !== null && permissions.userManagement !== UserManagementPermissions.None}
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="/jobs">Jobs</a>
                    </li>
                {/if}
                {#if permissions !== null && permissions.userManagement !== UserManagementPermissions.None}
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="/users">User Management</a>
                    </li>
                {/if}
            </ul>
        </div>

        <div style="">
            <div class="d-flex justify-content-end">
                <h4 class="nav-link">{username}</h4>
            </div>
        </div>
    </div>
</nav>

{@render children()}
