<script lang="ts">
    import type { Host, ServerClasses, ValidationObject } from "$lib/types";
    import type { PageServerData } from "./$types";
    import type { Modal } from "bootstrap";
    import type * as bootstrap from "bootstrap";
    import { page } from "$app/stores";
    import { redirect } from "@sveltejs/kit";

    //get the hosts from the db
    let { data, form }: { data: PageServerData; form: FormData } = $props();
    let serverClasses = $state(data.serverClasses);
    let possibleHosts = $state(data.hosts);
    let unselectedHosts = $state(data.hosts);
    let selectedHosts: Host[] = $state([]);

    //get the modal instance
    let hostModal: Modal = null;

    //current editing server class
    let currentEditingServerClass: ServerClasses = null;

    //basic variables for display on webpage
    let editTitle: string = $state("");

    //get all server classes
    async function loadServerClasses() {
        const response = await fetch($page.url.pathname, { method: "GET" });

        console.log(response);

        //load the server classes
        serverClasses = await response.json();
        console.log(serverClasses);
    }

    //toggle modal
    function showHideModal(show: boolean) {
        if (hostModal == null) {
            hostModal = new bootstrap.Modal(document.getElementById("serverClassModal"));
        }

        if (show) {
            hostModal.show();
        } else {
            hostModal.hide();
        }
    }

    function showModalHostNewServerClass() {
        showHideModal(true);
    }

    //open modal with existing server class
    function showModalHostExistingServerClass(serverClass: ServerClasses) {
        //null out the arrays
        selectedHosts = [];
        unselectedHosts = [];

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

        editTitle = "Manage Server Class " + serverClass.name + "'s hosts";
        showHideModal(true);
    }

    //save changes for current modal
    async function saveModalChanges() {
        //get selected values
        // @ts-ignore
        let selectedHosts: Host[] = [...document.getElementById("selectedHostSelect").children].map((x: HTMLElement) => {
            return { id: x.value };
        });

        //build serverClass for api
        let serverClassForApi: ServerClasses = {
            id: currentEditingServerClass.id,
            name: currentEditingServerClass.name,
            hostsAssigned: selectedHosts,
        };

        //send the request
        const response = await fetch($page.url.pathname, {
            method: "PATCH",
            body: JSON.stringify({
                serverClass: serverClassForApi,
                updateWhich: "hosts",
            }),
        });

        await loadServerClasses();
        showHideModal(false);
    }

    //unselect a option in the selected select box
    function moveHostToLeftModal() {
        //get the values the user selected
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        let moveHosts: number[] = [...document.getElementById("selectedHostSelect").selectedOptions].map((x) => x.value);

        //now, search the selected hosts, and pop any movehost values and put them into unselected
        for (let mh of moveHosts) {
            //get the host and index first
            let h: Host = null;
            let index: number = 0;

            for (let i = 0; i < selectedHosts.length; i++) {
                //if it matches
                if (selectedHosts[i].id == mh) {
                    //save that info
                    index = i;
                    h = selectedHosts[i];
                    //and break
                    break;
                }
            }

            //if we dont find anything for some reason, ignore
            if (h === null) {
                continue;
            }

            //remove it from selected
            selectedHosts.splice(index, 1);
            //add it to the unselected ones
            unselectedHosts.push(h);
        }
    }

    //select a option in the unselected select box
    function moveHostToRightModal() {
        //get the values the user selected
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        let moveHosts: number[] = [...document.getElementById("unselectedHostSelect").selectedOptions].map((x) => x.value);

        //now, search the selected hosts, and pop any movehost values and put them into unselected
        for (let mh of moveHosts) {
            //get the host and index first
            let h: Host = null;
            let index: number = 0;

            for (let i = 0; i < unselectedHosts.length; i++) {
                //if it matches
                if (unselectedHosts[i].id == mh) {
                    //save that info
                    index = i;
                    h = unselectedHosts[i];
                    //and break
                    break;
                }
            }

            //if we dont find anything for some reason, ignore
            if (h === null) {
                continue;
            }

            //remove it from selected
            unselectedHosts.splice(index, 1);
            //add it to the unselected ones
            selectedHosts.push(h);
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
            </tr>
        </thead>
        <tbody>
            {#each serverClasses as serverclass}
                <tr>
                    <th>
                        {serverclass.name}
                        <button class="ms-3" aria-label="Delete Host">
                            <i class="bi bi-trash"></i>
                        </button>
                    </th>
                    <th>
                        {serverclass.hostsAssigned.length}
                        <button
                            class="ms-3"
                            aria-label="Edit Assigned Hosts"
                            onclick={() => {
                                showModalHostExistingServerClass(serverclass);
                            }}
                        >
                            <i class="bi bi-pencil"></i>
                        </button>
                    </th>
                    <th>
                        2
                        <button class="ms-3" aria-label="Edit Assigned Hosts">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </th>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<!--Edit modal-->
<div class="modal fade" id="serverClassModal" tabindex="-1" aria-labelledby="serverClassModal" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">{editTitle}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="row">
                        <div class="col-5">
                            <select id="unselectedHostSelect" multiple style="height: 30em; width: 100%">
                                {#each unselectedHosts as ps}
                                    <option value={ps.id}>{ps.hostname}</option>
                                {/each}
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
                                {#each selectedHosts as ps}
                                    <option value={ps.id}>{ps.hostname}</option>
                                {/each}
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

<span id="TestFloatingAdd">
    <button
        class="btn btn-success btn-lg"
        type="button"
        onclick={() => {
            showModalHostNewServerClass();
        }}>Add</button
    >
</span>
