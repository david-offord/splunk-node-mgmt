<script lang="ts">
    import type { Host } from "$lib/types";
    import type { PageServerData } from "./$types";
    import { page } from "$app/stores";
    //import bootstrap from "$lib/bs5/bootstrap.bundle.min.js";

    //declare vars for modal
    let modalHost: Host = null;

    let modalHostVal: string = $state("");
    let modalIpVal: string = $state("");
    let modalCustomerCodeVal: string = $state("");
    let debug: string = $state("");

    //get the hosts from the db
    let { data }: { data: PageServerData } = $props();
    const hosts = data.hosts;

    //set listeners
    function setModalValues(hostId: number) {
        //get host
        modalHost = hosts.find((x: Host) => x.id == hostId);
        modalHostVal = modalHost?.hostname!;
        modalIpVal = modalHost?.ipAddress!;
        modalCustomerCodeVal = modalHost?.customerCode!;
    }

    function showModalNewHost() {
        //null out the values
        modalHost = null;
        modalHostVal = "";
        modalIpVal = "";
        modalCustomerCodeVal = "";

        //show the modal
        var myModal = new bootstrap.Modal(document.getElementById("hostEditModal"));
        myModal.show();
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
        const result = await response.json();
        console.log(result); // results in "test"
        debug = result;
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
                        <button aria-label="Edit Host" data-bs-toggle="modal" data-bs-target="#hostEditModal" onclick={() => setModalValues(host.id)}>
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button aria-label="Delete Host">
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
                        <input bind:value={modalHostVal} type="text" class="form-control" id="inputHostname" />
                    </div>
                    <div class="mb-3">
                        <label for="inputIpAddress" class="form-label">IP Address</label>
                        <input bind:value={modalIpVal} type="text" class="form-control" id="inputIpAddress" />
                    </div>
                    <div class="mb-3">
                        <label for="inputCustomerCode" class="form-label">Customer Code</label>
                        <input bind:value={modalCustomerCodeVal} type="text" class="form-control" id="inputCustomerCode" />
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button
                    type="button"
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
