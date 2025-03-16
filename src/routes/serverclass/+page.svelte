<script lang="ts">
    import type { AddOn, Host, ServerClasses, UserWithPermissions, ValidationObject } from "$lib/types";
    import type { PageServerData } from "./$types";
    import type { Modal } from "bootstrap";
    import type * as bootstrap from "bootstrap";
    import { page } from "$app/stores";
    import { redirect } from "@sveltejs/kit";
    import type { Server } from "http";
    import { ServerClassManagementPermissions } from "$lib/enums";

    //get the hosts from the db
    let { data, form }: { data: PageServerData; form: FormData } = $props();
    let permissions: UserWithPermissions = data.parent.permissions;
    let serverClasses = $state(data.serverClasses);

    //for modal addon/host selection
    let possibleHosts = $state(data.hosts);
    let unselectedHosts = $state(data.hosts);
    let selectedHosts: Host[] = $state([]);
    let possibleAddons = $state(data.addons);
    let unselectedAddons = $state(data.addons);
    let selectedAddons: AddOn[] = $state([]);

    //get the modal instance
    let hostModal: Modal = null;
    let newServerClassModal: Modal = null;
    let deleteServerClassModal: Modal = null;
    let editingHosts = $state(true);

    //current editing server class
    let currentEditingServerClass: ServerClasses = $state();
    let deleteServerClassObject: ServerClasses = $state();

    //basic variables for display on webpage
    let editTitle: string = $state("");
    let newServerClassInput: string = $state("");

    //get all server classes
    async function loadServerClasses() {
        const response = await fetch($page.url.pathname, { method: "GET" });

        //load the server classes
        serverClasses = await response.json();
    }

    //toggle modal
    function showHideModal(show: boolean) {
        if (hostModal == null) {
            // @ts-ignore
            hostModal = new bootstrap.Modal(document.getElementById("serverClassModal"));
        }

        if (show) {
            hostModal.show();
        } else {
            hostModal.hide();
        }
    }

    //toggle modal
    function showHideNewModal(show: boolean) {
        if (newServerClassModal == null) {
            // @ts-ignore
            newServerClassModal = new bootstrap.Modal(document.getElementById("newServerClassModal"));
        }

        if (show) {
            newServerClassModal.show();
        } else {
            newServerClassModal.hide();
        }
    }

    //toggle modal
    function showHideDeleteModal(show: boolean, serverClass: ServerClasses) {
        deleteServerClassObject = serverClass;

        if (deleteServerClassModal == null) {
            // @ts-ignore
            deleteServerClassModal = new bootstrap.Modal(document.getElementById("deleteServerClassModal"));
        }

        if (show) {
            deleteServerClassModal.show();
        } else {
            deleteServerClassModal.hide();
        }
    }

    //Show new server class simple modal
    function showModalHostNewServerClass() {
        newServerClassInput = "";
        showHideNewModal(true);
    }

    //open modal with existing server class
    function showModalHostExistingServerClass(serverClass: ServerClasses, forHosts = true) {
        //set which set we are editing
        editingHosts = forHosts;

        //null out the arrays
        selectedHosts = [];
        unselectedHosts = [];
        selectedAddons = [];
        unselectedAddons = [];

        //save the class we're currrently editing for save later
        currentEditingServerClass = serverClass;

        //filter out the elements in the full list into the 2 arrays
        for (let ps of possibleHosts) {
            //if the host is not in the host assigned array, add it to unselected
            if (serverClass.hostsAssigned.findIndex((x) => x.id == ps.id) === -1) {
                unselectedHosts.push(ps);
            } else {
                selectedHosts.push(ps);
            }
        }

        //filter out the elements in the full list into the 2 arrays
        for (let pa of possibleAddons) {
            //if the host is not in the host assigned array, add it to unselected
            if (serverClass.addonsAssigned.findIndex((x) => x.id == pa.id) === -1) {
                unselectedAddons.push(pa);
            } else {
                selectedAddons.push(pa);
            }
        }

        editTitle = "Manage Server Class " + serverClass.name + "'s " + (forHosts ? "Hosts" : "Addons");
        showHideModal(true);
    }

    //save changes for current modal
    async function saveModalChanges() {
        //get selected values
        // @ts-ignore
        let selectedEntries: any[] = [...document.getElementById("selectedHostSelect").children].map((x: HTMLElement) => {
            // @ts-ignore
            return { id: x.value };
        });

        //build serverClass for api
        let serverClassForApi: ServerClasses = {
            id: currentEditingServerClass.id,
            name: currentEditingServerClass.name,
            hostsAssigned: editingHosts ? selectedEntries : null,
            addonsAssigned: editingHosts ? null : selectedEntries,
        };

        //send the request
        const response = await fetch($page.url.pathname, {
            method: "PATCH",
            body: JSON.stringify(serverClassForApi),
        });

        await loadServerClasses();
        showHideModal(false);
    }

    async function saveNewServerClass() {
        //send the request
        const response = await fetch($page.url.pathname, {
            method: "POST",
            body: JSON.stringify(newServerClassInput),
        });

        await loadServerClasses();
        showHideNewModal(false);
    }

    async function deleteServerClass(serverClass: ServerClasses) {
        //send the request
        const response = await fetch($page.url.pathname, {
            method: "DELETE",
            body: JSON.stringify(serverClass),
        });

        await loadServerClasses();
        showHideDeleteModal(false, null);
    }

    //unselect a option in the selected select box
    function moveHostToLeftModal() {
        //get the values the user selected
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        let moveItems: number[] = [...document.getElementById("selectedHostSelect").selectedOptions].map((x) => x.value);

        //now, search the selected hosts, and pop any movehost values and put them into unselected
        for (let mi of moveItems) {
            //get the host and index first
            let h: any = null;
            let index: number = 0;

            let selectedItems: any = [];
            let unselectedItems: any = [];

            //depending on what we are editing, reference that array here
            if (editingHosts) {
                selectedItems = selectedHosts;
                unselectedItems = unselectedHosts;
            } else {
                selectedItems = selectedAddons;
                unselectedItems = unselectedAddons;
            }

            for (let i = 0; i < selectedItems.length; i++) {
                //if it matches
                if (selectedItems[i].id == mi) {
                    //save that info
                    index = i;
                    h = selectedItems[i];
                    //and break
                    break;
                }
            }

            //if we dont find anything for some reason, ignore
            if (h === null) {
                continue;
            }

            //remove it from selected
            selectedItems.splice(index, 1);
            //add it to the unselected ones
            unselectedItems.push(h);
        }
    }

    //select a option in the unselected select box
    function moveHostToRightModal() {
        //get the values the user selected
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        let moveItems: number[] = [...document.getElementById("unselectedHostSelect").selectedOptions].map((x) => x.value);

        //now, search the selected hosts, and pop any movehost values and put them into unselected
        for (let mi of moveItems) {
            //get the host and index first
            let h: any = null;
            let index: number = 0;

            let selectedItems: any = [];
            let unselectedItems: any = [];

            //depending on what we are editing, reference that array here
            if (editingHosts) {
                selectedItems = selectedHosts;
                unselectedItems = unselectedHosts;
            } else {
                selectedItems = selectedAddons;
                unselectedItems = unselectedAddons;
            }

            //for all unselected items...
            for (let i = 0; i < unselectedItems.length; i++) {
                //if it matches
                if (unselectedItems[i].id == mi) {
                    //save that info
                    index = i;
                    h = unselectedItems[i];
                    //and break
                    break;
                }
            }

            //if we dont find anything for some reason, ignore
            if (h === null) {
                continue;
            }

            //remove it from selected
            unselectedItems.splice(index, 1);
            //add it to the unselected ones
            selectedItems.push(h);
        }
    }
</script>

<svelte:head>
    <title>Server Classes</title>

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
    <table class="table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Number of Hosts Assigned</th>
                <th>Add-ons Assigned</th>
                {#if permissions.serverClassManagement === ServerClassManagementPermissions.CanEdit}
                    <th>Actions</th>
                {/if}
            </tr>
        </thead>
        <tbody>
            {#each serverClasses as serverclass}
                <tr>
                    <td>
                        {serverclass.name}
                    </td>
                    <td>
                        {serverclass.hostsAssigned.length}
                        {#if permissions.serverClassManagement === ServerClassManagementPermissions.CanEdit}
                            <button
                                class="btn btn-table-action ms-2"
                                aria-label="Edit Assigned Hosts"
                                onclick={() => {
                                    showModalHostExistingServerClass(serverclass);
                                }}
                            >
                                <i class="bi bi-pencil"></i>
                            </button>
                        {/if}
                    </td>
                    <td>
                        {serverclass.addonsAssigned.length}

                        {#if permissions.serverClassManagement === ServerClassManagementPermissions.CanEdit}
                            <button
                                class="btn btn-table-action ms-2"
                                aria-label="Edit Assigned Hosts"
                                onclick={() => {
                                    showModalHostExistingServerClass(serverclass, false);
                                }}
                            >
                                <i class="bi bi-pencil"></i>
                            </button>
                        {/if}
                    </td>
                    {#if permissions.serverClassManagement === ServerClassManagementPermissions.CanEdit}
                        <td>
                            <button class="btn btn-table-action me-2" aria-label="Refresh Hosts">
                                <i class="bi bi-arrow-counterclockwise"></i>
                            </button>
                            <button
                                class="btn btn-table-action me-2"
                                onclick={() => {
                                    showHideDeleteModal(true, serverclass);
                                }}
                                aria-label="Delete Host"
                            >
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    {/if}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

{#if permissions.serverClassManagement === ServerClassManagementPermissions.CanEdit}
    <!--Edit modal-->
    <div class="modal fade" id="serverClassModal" tabindex="-1" aria-labelledby="serverClassModal" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Manage Server Class {currentEditingServerClass?.name}'s {editingHosts ? "Hosts" : "Addons"}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="row">
                            <div class="col-5">
                                <select id="unselectedHostSelect" multiple style="height: 30em; width: 100%">
                                    {#if editingHosts}
                                        {#each unselectedHosts as ps}
                                            <option value={ps.id}>{ps.hostname}</option>
                                        {/each}
                                    {:else}
                                        {#each unselectedAddons as as}
                                            <option value={as.id}>{as.displayName}</option>
                                        {/each}
                                    {/if}
                                </select>
                            </div>
                            <div class="col-2 d-flex align-items-center justify-content-center">
                                <button
                                    onclick={() => {
                                        moveHostToLeftModal();
                                    }}>&lt;</button
                                >
                                <br />
                                <button
                                    onclick={() => {
                                        moveHostToRightModal();
                                    }}>&gt;</button
                                >
                            </div>
                            <div class="col-5">
                                <select id="selectedHostSelect" multiple style="height: 30em;  width: 100%">
                                    {#if editingHosts}
                                        {#each selectedHosts as ps}
                                            <option value={ps.id}>{ps.hostname}</option>
                                        {/each}
                                    {:else}
                                        {#each selectedAddons as as}
                                            <option value={as.id}>{as.displayName}</option>
                                        {/each}
                                    {/if}
                                </select>
                            </div>
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

    <div class="modal fade" id="newServerClassModal" tabindex="-1" aria-labelledby="newServerClassModal" aria-hidden="true">
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Create Server Class</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="row">
                            <div class="col-12">
                                <div class="mb-3">
                                    <label for="newServerClassName" class="form-label">Server Class Name</label>
                                    <input bind:value={newServerClassInput} class="form-control" id="newServerClassName" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        onclick={() => {
                            saveNewServerClass();
                        }}>Save New Server Class</button
                    >
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="deleteServerClassModal" tabindex="-1" aria-labelledby="deleteServerClassModal" aria-hidden="true">
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Confirm Deletion of {deleteServerClassObject?.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
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
                                        deleteServerClass(deleteServerClassObject);
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
                showModalHostNewServerClass();
            }}>Add</button
        >
    </span>
{/if}
