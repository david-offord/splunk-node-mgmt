<script lang="ts">
    import type { Host, ValidationObject } from "$lib/types";
    import type { PageServerData } from "./$types";
    import type { Modal } from "bootstrap";
    import type * as bootstrap from "bootstrap";
    import { page } from "$app/stores";
    import { redirect } from "@sveltejs/kit";

    //get the hosts from the db
    let { data, form }: { data: PageServerData; form: FormData } = $props();
    let hosts = $state(data.hosts);

    //get the modal instance
    let hostModal: Modal = null;

    //declare vars for modal
    let modalHost: Host = null;

    //used for inputs in modal
    let modalHostVal: string = $state("");
    let modalIpVal: string = $state("");
    let modalCustomerCodeVal: string = $state("");

    //used for validation later
    let modalValidation: ValidationObject = $state();

    //toggle modal
    function showHideModal(show: boolean) {
        if (hostModal == null) {
            hostModal = new bootstrap.Modal(document.getElementById("hostEditModal"));
        }

        if (show) {
            hostModal.show();
        } else {
            hostModal.hide();
        }
    }
    //set listeners
    function setModalValues(hostId: number) {
        //get host
        modalHost = hosts.find((x: Host) => x.id == hostId);
        modalHostVal = modalHost?.hostname!;
        modalIpVal = modalHost?.ipAddress!;
        modalCustomerCodeVal = modalHost?.customerCode!;
        showHideModal(true);
    }

    //show modal for making a new host
    function showModalNewHost() {
        //null out the values
        modalHost = null;
        modalHostVal = "";
        modalIpVal = "";
        modalCustomerCodeVal = "";

        //show the modal
        showHideModal(true);
    }

    //get all hosts from db
    async function getHosts() {
        const response = await fetch($page.url.pathname, { method: "GET" });
        hosts = await response.json();
    }

    //call an api
    async function saveHostValues(selectedHost: Host) {
        //create a new obj
        let hostForApi: Host = {
            id: modalHost?.id ?? null,
            ipAddress: modalIpVal,
            hostname: modalHostVal,
            customerCode: modalCustomerCodeVal,
        };

        const response = await fetch($page.url.pathname, { method: "POST", body: JSON.stringify(hostForApi) });

        //if the call was 200
        if (response.ok) {
            //get an updated list of hosts
            showHideModal(false);
            await getHosts();
            modalValidation = null;
        } else {
            modalValidation = await response.json();
        }
    }

    //delete a host from db
    async function deleteHost(selectedHost: Host) {
        const response = await fetch($page.url.pathname, { method: "DELETE", body: JSON.stringify(selectedHost) });
        await response.json();
        await getHosts();
    }
</script>

<svelte:head>
    <title>All Hosts</title>

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
                <th>Hostname</th>
                <th>Ip Address</th>
                <th>Customer Code</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {#each hosts as host}
                <tr>
                    <th>{host.hostname}</th>
                    <th>{host.ipAddress}</th>
                    <th>{host.customerCode}</th>
                    <th>
                        <button aria-label="Edit Host" onclick={() => setModalValues(host.id)}>
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button aria-label="Delete Host" onclick={() => deleteHost(host)}>
                            <i class="bi bi-trash"></i>
                        </button>
                    </th>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<!--Edit modal-->
<div class="modal fade" id="hostEditModal" tabindex="-1" aria-labelledby="hostEditModal" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="mb-3">
                        <label for="inputHostname" class="form-label">Hostname</label>
                        <input bind:value={modalHostVal} type="text" required class="form-control" id="inputHostname" />
                        <label for="inputHostname" class="form-label form-validation-message">{modalValidation?.hostname}</label>
                    </div>
                    <div class="mb-3">
                        <label for="inputIpAddress" class="form-label">IP Address</label>
                        <input bind:value={modalIpVal} type="text" required class="form-control" id="inputIpAddress" />
                        <label for="inputHostname" class="form-label form-validation-message">{modalValidation?.ipAddress}</label>
                    </div>
                    <div class="mb-3">
                        <label for="inputCustomerCode" class="form-label">Customer Code</label>
                        <input bind:value={modalCustomerCodeVal} type="text" required class="form-control" id="inputCustomerCode" />
                        <label for="inputHostname" class="form-label form-validation-message">{modalValidation?.customerCode}</label>
                    </div>
                    <p class="form-label form-validation-message">{modalValidation?.generalError}</p>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button
                    type="submit"
                    class="btn btn-primary"
                    onclick={() => {
                        saveHostValues(null);
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
            showModalNewHost();
        }}>Add</button
    >
</span>
