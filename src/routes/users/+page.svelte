<script lang="ts">
    import type { PageServerData } from "./$types";
    import type { Modal } from "bootstrap";
    import type * as bootstrap from "bootstrap";
    import { HostManagementPermissions, ServerClassManagementPermissions, AddOnManagementPermissions, PlaybookManagementPermissions, UserManagementPermissions, PlaybookRunPermissions, AddonDeploymentPermissions, JobViewPermissions } from "$lib/enums";
    import { page } from "$app/stores";
    import type { UserWithPermissions } from "$lib/types";

    //get the hosts from the db
    let { data }: { data: PageServerData; form: FormData } = $props();
    //permissions
    let permissions: UserWithPermissions = data.parent.permissions;
    let users: UserWithPermissions[] = $state(data.users);

    //ui variables
    let userModal: Modal = null;
    let deleteModal: Modal = null;
    let currentlyEditingUser: UserWithPermissions = $state(null);

    //variables for binding
    let usernameModalVar: string = $state("");
    let displayNameModalVar: string = $state("");
    let hostManagementModalVar: number = $state(0);
    let serverclassManagementModalVars: number = $state(0);
    let addonManagementModalVars: number = $state(0);
    let playbookManagementModalVar: number = $state(0);
    let userManagementModalVar: number = $state(0);
    let jobViewModalVar: number = $state(0);
    let playbookRunningModalVar: number = $state(0);
    let addonDeploymentModalVar: number = $state(0);
    let isAdminDeploymentModalVar: number = $state(0);
    let newUserPassword: string = $state("");

    //toggle modal
    function showModalUser(show: boolean, user: UserWithPermissions = null) {
        if (userModal == null) {
            //@ts-ignore
            userModal = new bootstrap.Modal(document.getElementById("editUserModal"));
        }

        //null out variables
        usernameModalVar = "";
        displayNameModalVar = "";
        hostManagementModalVar = 0;
        serverclassManagementModalVars = 0;
        addonManagementModalVars = 0;
        playbookManagementModalVar = 0;
        userManagementModalVar = 0;
        jobViewModalVar = 0;
        playbookRunningModalVar = 0;
        addonDeploymentModalVar = 0;
        isAdminDeploymentModalVar = 0;
        currentlyEditingUser = user;

        //if we are showing the modal
        if (show) {
            userModal.show();
            usernameModalVar = user?.email ?? "";
            displayNameModalVar = user?.name ?? "";
            hostManagementModalVar = user?.hostManagement ?? 0;
            serverclassManagementModalVars = user?.serverClassManagement ?? 0;
            addonManagementModalVars = user?.addonManagement ?? 0;
            playbookManagementModalVar = user?.playbookManagement ?? 0;
            userManagementModalVar = user?.userManagement ?? 0;
            jobViewModalVar = user?.jobViewing ?? 0;
            playbookRunningModalVar = user?.playbookRunning ?? 0;
            addonDeploymentModalVar = user?.addonDeployments ?? 0;
            isAdminDeploymentModalVar = user?.admin ?? 0;
        } else {
            userModal.hide();
        }
    }

    //save user
    async function saveModalChanges() {
        let user: UserWithPermissions = {
            id: currentlyEditingUser?.userId,
            email: usernameModalVar,
            name: displayNameModalVar,
            hostManagement: hostManagementModalVar,
            serverClassManagement: serverclassManagementModalVars,
            addonManagement: addonManagementModalVars,
            playbookManagement: playbookManagementModalVar,
            userManagement: userManagementModalVar,
            jobViewing: jobViewModalVar,
            playbookRunning: playbookRunningModalVar,
            addonDeployments: addonDeploymentModalVar,
            admin: isAdminDeploymentModalVar,
            hashedPassword: currentlyEditingUser === null ? newUserPassword : null,
        };

        //its a new user
        if (currentlyEditingUser == null) {
            await createUsers(user);
        } else {
            await updateUsers(user);
        }
        await getUsers();

        showModalUser(false);
    }

    function showHideDeleteModal(show: boolean, user: UserWithPermissions) {
        currentlyEditingUser = user;

        if (deleteModal == null) {
            //@ts-ignore
            deleteModal = new bootstrap.Modal(document.getElementById("deleteUserModal"));
        }
        if (show) {
            deleteModal.show();
        } else {
            deleteModal.hide();
        }
    }

    async function deleteUser(user: any) {
        const response = await fetch($page.url.pathname, { method: "DELETE", body: JSON.stringify(user) });
        //refresh users
        await getUsers();
        deleteModal.hide();
    }

    //Sends host to backend to update
    async function updateUsers(user: any) {
        const response = await fetch($page.url.pathname, { method: "PATCH", body: JSON.stringify(user) });
        //TODO: VERIFY IT WAS A SUCCESS
    }

    //Sends host to backend to create a new user
    async function createUsers(user: any) {
        const response = await fetch($page.url.pathname, { method: "POST", body: JSON.stringify(user) });

        //TODO: VERIFY IT WAS A SUCCESS
    }

    async function getUsers() {
        const response = await fetch($page.url.pathname, { method: "GET" });
        let data = await response.json();
        users = data.users;
    }
</script>

<svelte:head>
    <title>User Management</title>

    <style>
        #TestFloatingAdd {
            position: absolute;
            right: 20px;
            bottom: 20px;
        }

        .form-validation-message {
            color: red;
        }
    </style>
</svelte:head>
<div class="container">
    <h1 class="mat-green">Users</h1>
    <table class="table">
        <thead>
            <tr>
                <th>Login</th>
                <th>Display Name</th>
                <th>Disabled</th>
                <th>Is Admin</th>
                {#if permissions.userManagement === UserManagementPermissions.CanEdit}
                    <th>Actions</th>
                {/if}
            </tr>
        </thead>
        <tbody>
            {#each users as user}
                <tr>
                    <td> {user.email} </td>
                    <td> {user.name} </td>
                    <td> {user.disabled === 1 ? "Yes" : "No"} </td>
                    <td> {user.admin == 1 ? "Yes" : "No"} </td>
                    {#if permissions.userManagement === UserManagementPermissions.CanEdit}
                        <td>
                            {#if user.disabled !== 1}
                                <button
                                    class="ms-1 table-button"
                                    onclick={() => {
                                        showModalUser(true, user);
                                    }}
                                    aria-label="Edit Add-On"
                                >
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button
                                    class="ms-3 table-button"
                                    onclick={() => {
                                        showHideDeleteModal(true, user);
                                    }}
                                    aria-label="Delete Add-On"
                                >
                                    <i class="bi bi-trash"></i>
                                </button>
                            {/if}
                        </td>
                    {/if}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

{#if permissions.userManagement === UserManagementPermissions.CanEdit}
    <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModal" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Edit User {"TODO"}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="row">
                            <div class="col-sm-12 col-lg-12">
                                <span class="required-star">*</span>
                                <label for="inputUserName" class="form-label">Display Name</label>
                                <input bind:value={displayNameModalVar} type="text" required class="form-control" id="displayModalInput" />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-12 col-lg-6 mt-4">
                                <span class="required-star">*</span>
                                <label for="inputUserName" class="form-label">Username</label>
                                <input bind:value={usernameModalVar} type="text" required class="form-control" id="usernameModalInput" />
                            </div>
                            <div class="col-sm-12 col-lg-6 mt-4">
                                <span class="required-star">*</span>
                                <label for="adminManagementPermissionsModalInput" class="form-label">Is Admin</label>
                                <select bind:value={isAdminDeploymentModalVar} required class="form-control" id="adminManagementPermissionsModalInput">
                                    <option value={0}>No</option>
                                    <option value={1}>Yes</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-12 col-lg-6">
                                <span class="required-star">*</span>
                                <label for="hostManagementPermissionsModalInput" class="form-label">Host Management Permissions</label>
                                <select bind:value={hostManagementModalVar} class="form-control" id="hostManagementPermissionsModalInput">
                                    {#each Object.entries(HostManagementPermissions) as hp}
                                        {#if isNaN(parseInt(hp[0])) === true}
                                            <option value={hp[1]}>{HostManagementPermissions[hp[1]]}</option>
                                        {/if}
                                    {/each}
                                </select>
                            </div>
                            <div class="col-sm-12 col-lg-6">
                                <span class="required-star">*</span>
                                <label for="serverClassManagementPermissionsModalInput" class="form-label">Server Class Management Permissions</label>
                                <select bind:value={serverclassManagementModalVars} class="form-control" id="serverClassManagementPermissionsModalInput">
                                    {#each Object.entries(ServerClassManagementPermissions) as sm}
                                        {#if isNaN(parseInt(sm[0])) === true}
                                            <option value={sm[1]}>{ServerClassManagementPermissions[sm[1]]}</option>
                                        {/if}
                                    {/each}
                                </select>
                            </div>
                        </div>
                        <div class="row mt-4">
                            <div class="col-sm-12 col-lg-6">
                                <span class="required-star">*</span>
                                <label for="addonManagementPermissionsModalInput" class="form-label">Add-On Management Permissions</label>
                                <select bind:value={addonManagementModalVars} class="form-control" id="addonManagementPermissionsModalInput">
                                    {#each Object.entries(AddOnManagementPermissions) as amp}
                                        {#if isNaN(parseInt(amp[0])) === true}
                                            <option value={amp[1]}>{AddOnManagementPermissions[amp[1]]}</option>
                                        {/if}
                                    {/each}
                                </select>
                            </div>
                            <div class="col-sm-12 col-lg-6">
                                <span class="required-star">*</span>
                                <label for="playbookManagementPermissionsModalInput" class="form-label">Playbook Management Permissions</label>
                                <select bind:value={playbookManagementModalVar} class="form-control" id="playbookManagementPermissionsModalInput">
                                    {#each Object.entries(PlaybookManagementPermissions) as sm}
                                        {#if isNaN(parseInt(sm[0])) === true}
                                            <option value={sm[1]}>{PlaybookManagementPermissions[sm[1]]}</option>
                                        {/if}
                                    {/each}
                                </select>
                            </div>
                        </div>
                        <div class="row mt-4">
                            <div class="col-sm-12 col-lg-6">
                                <span class="required-star">*</span>
                                <label for="userManagementPermissionsModalInput" class="form-label">User Management Permissions</label>
                                <select bind:value={userManagementModalVar} class="form-control" id="userManagementPermissionsModalInput">
                                    {#each Object.entries(UserManagementPermissions) as sm}
                                        {#if isNaN(parseInt(sm[0])) === true}
                                            <option value={sm[1]}>{UserManagementPermissions[sm[1]]}</option>
                                        {/if}
                                    {/each}
                                </select>
                            </div>
                            <div class="col-sm-12 col-lg-6">
                                <span class="required-star">*</span>
                                <label for="jobManagementPermissionsModalInput" class="form-label">Job View Permissions</label>
                                <select bind:value={jobViewModalVar} class="form-control" id="jobManagementPermissionsModalInput">
                                    {#each Object.entries(JobViewPermissions) as amp}
                                        {#if isNaN(parseInt(amp[0])) === true}
                                            <option value={amp[1]}>{JobViewPermissions[amp[1]]}</option>
                                        {/if}
                                    {/each}
                                </select>
                            </div>
                        </div>
                        <div class="row mt-4">
                            <div class="col-sm-12 col-lg-6">
                                <span class="required-star">*</span>
                                <label for="playbookRunPermissionsModalInput" class="form-label">Playbook Running Permissions</label>
                                <select bind:value={playbookRunningModalVar} class="form-control" id="playbookRunPermissionsModalInput">
                                    {#each Object.entries(PlaybookRunPermissions) as amp}
                                        {#if isNaN(parseInt(amp[0])) === true}
                                            <option value={amp[1]}>{PlaybookRunPermissions[amp[1]]}</option>
                                        {/if}
                                    {/each}
                                </select>
                            </div>
                            <div class="col-sm-12 col-lg-6">
                                <span class="required-star">*</span>
                                <label for="addonDeploymentPermissionsModalInput" class="form-label">Add-On Deployment Permissions</label>
                                <select bind:value={addonDeploymentModalVar} class="form-control" id="addonDeploymentPermissionsModalInput">
                                    {#each Object.entries(AddonDeploymentPermissions) as sm}
                                        {#if isNaN(parseInt(sm[0])) === true}
                                            <option value={sm[1]}>{AddonDeploymentPermissions[sm[1]]}</option>
                                        {/if}
                                    {/each}
                                </select>
                            </div>
                            {#if currentlyEditingUser == null}
                                <div class="col-sm-12">
                                    <span class="required-star">*</span>
                                    <label for="newUserPassword" class="form-label">Password</label>
                                    <input bind:value={newUserPassword} class="form-control" id="newUserPassword" />
                                </div>
                            {/if}
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        onclick={() => {
                            saveModalChanges();
                        }}>Save changes</button
                    >
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="deleteUserModal" tabindex="-1" aria-labelledby="deleteUserModal" aria-hidden="true">
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-body">
                    <h5 class="modal-title" id="exampleModalLabel">Confirm Deletion of user<br />"{currentlyEditingUser?.email}"</h5>
                </div>
                <div class="modal-footer">
                    <form>
                        <div class="row">
                            <div class="col-6">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            </div>
                            <div class="col-6">
                                <button
                                    type="submit"
                                    class="btn btn-danger"
                                    onclick={() => {
                                        deleteUser(currentlyEditingUser);
                                    }}>Confirm</button
                                >
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <span id="TestFloatingAdd">
        <button
            class="btn btn-success btn-lg"
            type="button"
            onclick={() => {
                showModalUser(true);
            }}>Add</button
        >
    </span>
{/if}
