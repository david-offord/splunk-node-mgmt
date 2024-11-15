<script lang="ts">
    import type { PageServerData } from "./$types";

    //get the hosts from the db
    let { data }: { data: PageServerData } = $props();
    const hosts = data.hosts;

    //set listeners
    function setModalValues(hostId: number) {
        console.log("fuck");
    }
</script>

<svelte:head>
    <title>All Hosts</title>
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
                        <input type="text" class="form-control" id="inputHostname" />
                    </div>
                    <div class="mb-3">
                        <label for="inputIpAddress" class="form-label">IP Address</label>
                        <input type="text" class="form-control" id="inputIpAddress" />
                    </div>
                    <div class="mb-3">
                        <label for="inputCustomerCode" class="form-label">Customer Code</label>
                        <input type="text" class="form-control" id="inputCustomerCode" />
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Save changes</button>
            </div>
        </div>
    </div>
</div>
