<script lang="ts">
    import type { Host, ServerClasses, ValidationObject } from "$lib/types";
    import { DEPLOY_ADDON_AD_HOC_ROUTE } from "$lib/constants";
    import type { PageServerData } from "./$types";
    import type { Modal } from "bootstrap";
    import type * as bootstrap from "bootstrap";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import type { Server } from "http";

    //get the hosts from the db
    let { data, form }: { data: PageServerData; form: FormData } = $props();
    let hosts = $state(data.hosts);
    let visibleHosts = $state(data.hosts);

    //get the modal instance
    let hostModal: Modal = null;
    let deleteModal: Modal = null;

    //declare vars for modal
    let modalHost: Host = null;

    //used for inputs in modal
    let modalHostVal: string = $state("");
    let modalIpVal: string = $state("");
    let modalCustomerCodeVal: string = $state("");
    let modalLinuxUsernameVal: string = $state("");
    let modalLinuxPasswordVal: string = $state("");
    let modalSplunkPasswordVal: string = $state("");
    let modalSplunkHomePathVal: string = $state("");
    let modalSplunkRestartCommand: string = $state("");
    let modalSplunkManagementPort: string = $state("");
    let newHost = false;
    let searchString: string = $state("");

    //used for server class selection
    let possibleServerClasses = $state(data.allPossibleServerClasses);
    let unselectedServerClasses = $state(data.allPossibleServerClasses);
    let selectedServerClasses: ServerClasses[] = $state([]);

    //DEFAULT VALUES
    let defaultSplunkHome = "/opt/splunk/etc/apps";

    //used for validation later
    let modalValidation: ValidationObject = $state();
    let deleteHostObject: Host = $state();

    let currentPage = $state(0);
    let totalHostCount = $state(data.hostCount);
    let lastSearchParam = "";

    function sortArraysForDisplay() {
        unselectedServerClasses = unselectedServerClasses.sort((a, b) => {
            const nameA = a.name.toUpperCase(); // ignore upper and lowercase
            const nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            // names must be equal
            return 0;
        });
        selectedServerClasses = selectedServerClasses.sort((a, b) => {
            const nameA = a.name.toUpperCase(); // ignore upper and lowercase
            const nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            // names must be equal
            return 0;
        });
    }

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
        modalLinuxUsernameVal = modalHost?.linuxUsername;
        modalCustomerCodeVal = modalHost?.customerCode!;
        modalSplunkHomePathVal = modalHost?.splunkHomePath!;
        modalSplunkRestartCommand = modalHost?.splunkRestartCommand?.toString();
        modalSplunkManagementPort = modalHost?.splunkManagementPort?.toString();
        modalValidation = null;
        newHost = false;

        unselectedServerClasses = [];
        selectedServerClasses = [];

        //set the selected server classes
        for (let ps of possibleServerClasses) {
            //if the host is not in the host assigned array, add it to unselected
            if (modalHost.serverClassesAssigned.findIndex((x) => x == ps.id) === -1) {
                unselectedServerClasses.push(ps);
            } else {
                selectedServerClasses.push(ps);
            }
        }

        sortArraysForDisplay();

        showHideModal(true);
    }

    //show modal for making a new host
    function showModalNewHost() {
        //null out the values
        modalHost = null;
        modalHostVal = "";
        modalIpVal = "";
        modalCustomerCodeVal = "";
        modalLinuxUsernameVal = "";
        modalLinuxPasswordVal = "";
        modalSplunkPasswordVal = "";
        modalSplunkRestartCommand = "/opt/splunk/bin/splunk restart";
        modalSplunkManagementPort = "8089";
        modalSplunkHomePathVal = defaultSplunkHome;
        newHost = true;
        modalValidation = null;

        //show the modal
        showHideModal(true);
    }

    //get all hosts from db
    async function getHosts() {
        //check if the search parameter has changed
        if (lastSearchParam !== searchString) {
            //if it is, reset it back to the first page
            currentPage = 0;
        }
        //set it for later
        lastSearchParam = searchString;

        //buiild all the parameters
        let query = `?page=${currentPage}&search=${encodeURIComponent(searchString)}`;

        //call to get the list again
        const response = await fetch($page.url.pathname.slice(0, -1) + query, { method: "GET" });

        //get the list of hosts and total count
        let returnVal = await response.json();
        console.log(returnVal);
        hosts = returnVal.hosts;
        totalHostCount = returnVal.hostCount;
    }

    //call an api
    async function saveHostValues(selectedHost: Host) {
        //@ts-ignore
        let selectedServerClass: number[] = [...document.getElementById("selectServerClasses").children].map((x: HTMLElement) => {
            // @ts-ignore
            return x.value;
        });

        //create a new obj
        let hostForApi: Host = {
            id: modalHost?.id ?? null,
            ipAddress: modalIpVal,
            hostname: modalHostVal,
            customerCode: modalCustomerCodeVal,
            linuxUsername: modalLinuxUsernameVal,
            linuxPassword: modalLinuxPasswordVal,
            splunkPassword: modalSplunkPasswordVal,
            splunkHomePath: modalSplunkHomePathVal,
            splunkManagementPort: modalSplunkManagementPort,
            splunkRestartCommand: modalSplunkRestartCommand,
            serverClassesAssigned: selectedServerClass,
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
        deleteModal.hide();
    }

    async function redeployAddOns(selectedHost: Host) {
        //get the button that was pressed
        const buttonPressed = document.getElementById(`RedeployAddons_${selectedHost.id}`);

        //its already running
        if (buttonPressed.hasAttribute("currentlyRefreshing")) {
            return;
        }

        //its not already running, replace the icon
        buttonPressed.setAttribute("currentlyRefreshing", "true");
        buttonPressed.innerHTML = '<i class="bi bi-stopwatch"></i>';

        const response = await fetch(DEPLOY_ADDON_AD_HOC_ROUTE, { method: "POST", body: JSON.stringify(selectedHost) });
        await response.json();
        //TODO: ERROR CHECKING

        //once it completes, replace the icon
        buttonPressed.removeAttribute("currentlyRefreshing");
        buttonPressed.innerHTML = '<i class="bi bi-arrow-up-right"></i>';
    }

    async function redeployAllAddOns() {
        //get the button that was pressed
        const buttonPressed = document.getElementById(`RedeployAllAddons`);

        //its already running
        if (buttonPressed.hasAttribute("currentlyRefreshing")) {
            return;
        }

        //its not already running, replace the icon
        buttonPressed.setAttribute("currentlyRefreshing", "true");
        buttonPressed.innerHTML = '<i class="bi bi-stopwatch"></i>';

        const response = await fetch(DEPLOY_ADDON_AD_HOC_ROUTE, { method: "PATCH" });
        await response.json();

        //once it completes, replace the icon
        buttonPressed.removeAttribute("currentlyRefreshing");
        buttonPressed.innerHTML = "Deploy All";
    }

    //unselect a option in the selected select box
    function moveServerClassToLeftSelect() {
        //get the values the user selected
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        let moveServerClasses: number[] = [...document.getElementById("selectServerClasses").selectedOptions].map((x) => x.value);

        //now, search the selected hosts, and pop any movehost values and put them into unselected
        for (let msc of moveServerClasses) {
            //get the host and index first
            let sc: ServerClasses = null;
            let index: number = 0;

            for (let i = 0; i < selectedServerClasses.length; i++) {
                //if it matches
                if (selectedServerClasses[i].id == msc) {
                    //save that info
                    index = i;
                    sc = selectedServerClasses[i];
                    //and break
                    break;
                }
            }

            //if we dont find anything for some reason, ignore
            if (sc === null) {
                continue;
            }

            //remove it from selected
            selectedServerClasses.splice(index, 1);
            //add it to the unselected ones
            unselectedServerClasses.push(sc);
        }
        sortArraysForDisplay();
    }

    //select a option in the unselected select box
    function moveServerClassToRightSelect() {
        //get the values the user selected
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        let moveServerClasses: number[] = [...document.getElementById("unselectServerClasses").selectedOptions].map((x) => x.value);

        //now, search the selected hosts, and pop any movehost values and put them into unselected
        for (let msc of moveServerClasses) {
            //get the host and index first
            let sc: ServerClasses = null;
            let index: number = 0;

            for (let i = 0; i < unselectedServerClasses.length; i++) {
                //if it matches
                if (unselectedServerClasses[i].id == msc) {
                    //save that info
                    index = i;
                    sc = unselectedServerClasses[i];
                    //and break
                    break;
                }
            }

            //if we dont find anything for some reason, ignore
            if (sc === null) {
                continue;
            }

            //remove it from selected
            unselectedServerClasses.splice(index, 1);
            //add it to the unselected ones
            selectedServerClasses.push(sc);
        }
        sortArraysForDisplay();
    }

    //show the modal for deleting the host
    function confirmHostDeletion(selectedHost: Host) {
        deleteHostObject = selectedHost;

        deleteModal = new bootstrap.Modal(document.getElementById("deleteHostModal"));
        deleteModal.show();
    }

    //Add all listeners
    onMount(() => {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        // @ts-ignore
        const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));
        sortArraysForDisplay();
    });
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

<div class="container mt-2">
    <div class="row">
        <div class="col-12">
            <div class="float-end">
                <label for="searchTextBox" class="col-form-label mat-green">Search:</label>
                <input
                    id="searchTextBox"
                    class="form-control"
                    onchange={() => {
                        getHosts();
                    }}
                    bind:value={searchString}
                />
            </div>
        </div>
        <div class="col-12">
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
                            <td>{host.hostname}</td>
                            <td>{host.ipAddress}</td>
                            <td>{host.customerCode}</td>
                            <td>
                                <button aria-label="Edit Host" data-bs-toggle="tooltip" data-placement="top" title="Edit Host" onclick={() => setModalValues(host.id)}>
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button id="RedeployAddons_{host.id}" aria-label="Redeploy Add-ons" data-bs-toggle="tooltip" data-placement="top" title="Redeploy Add-ons" onclick={() => redeployAddOns(host)}>
                                    <i class="bi bi-arrow-up-right"></i>
                                </button>
                                <button aria-label="Delete Host" data-bs-toggle="tooltip" data-placement="top" title="Delete Host" onclick={() => confirmHostDeletion(host)}>
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="col-md-4 offset-md-8 col-sm-12">
            <button
                class="btn btn-link mat-green float-end"
                onclick={async () => {
                    currentPage++;
                    if (currentPage > Math.ceil(totalHostCount / 10) - 1) {
                        currentPage = Math.ceil(totalHostCount / 10) - 1;
                    }
                    await getHosts();
                }}>&gt;</button
            >
            <button class="btn btn-link mat-green float-end">{currentPage + 1} of {Math.ceil(totalHostCount / 10)}</button>
            <button
                class="btn btn-link mat-green float-end"
                onclick={async () => {
                    currentPage--;
                    if (currentPage < 0) {
                        currentPage = 0;
                    }

                    await getHosts();
                }}>&lt;</button
            >
        </div>
    </div>
</div>

<!--Edit modal-->
<div class="modal fade" id="hostEditModal" tabindex="-1" aria-labelledby="hostEditModal" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="row">
                        <div class="col-6">
                            <label for="inputHostname" class="form-label">Hostname</label>
                            <input bind:value={modalHostVal} type="text" required class="form-control" id="inputHostname" />
                            <label for="inputHostname" class="form-label form-validation-message {modalValidation?.hostname == null ? 'd-none' : ''}">{modalValidation?.hostname}</label>
                        </div>
                        <div class="col-6">
                            <label for="inputIpAddress" class="form-label">IP Address</label>
                            <input bind:value={modalIpVal} type="text" required class="form-control" id="inputIpAddress" />
                            <label for="inputHostname" class="form-label form-validation-message {modalValidation?.ipAddress == null ? 'd-none' : ''}">{modalValidation?.ipAddress}</label>
                        </div>
                    </div>
                    <div class="row mt-4">
                        <div class="col-6">
                            <label for="inputLinuxUsername" class="form-label">Linux Username</label>
                            <input bind:value={modalLinuxUsernameVal} id="inputLinuxUsername" type="text" required class="form-control" />
                            <label for="inputHostname" class="form-label form-validation-message {modalValidation?.linuxUsername == null ? 'd-none' : ''}">{modalValidation?.linuxUsername}</label>
                        </div>
                        <div class="col-6">
                            <label for="inputCustomerCode" class="form-label">Customer Code</label>
                            <input bind:value={modalCustomerCodeVal} type="text" required class="form-control" id="inputCustomerCode" />
                            <label for="inputHostname" class="form-label form-validation-message {modalValidation?.customerCode == null ? 'd-none' : ''}">{modalValidation?.customerCode}</label>
                        </div>
                    </div>
                    <div class="row mt-4">
                        <div class="col-6">
                            <label for="inputLinuxPassword" class="form-label">Linux Password</label>
                            <input bind:value={modalLinuxPasswordVal} type="text" id="inputLinuxPassword" class="form-control" aria-describedby="linuxPasswordHelpBlock" />
                            <div id="linuxPasswordHelpBlock" class="form-text">Leave empty to keep current value.</div>
                            <label for="inputHostname" class="form-label form-validation-message {modalValidation?.linuxPassword == null ? 'd-none' : ''}">{modalValidation?.linuxPassword}</label>
                        </div>
                        <div class="col-6">
                            <label for="inputSplunkPassword" class="form-label">Splunk Password</label>
                            <input bind:value={modalSplunkPasswordVal} id="inputSplunkPassword" type="text" class="form-control" aria-describedby="splunkPasswordHelpBlock" />
                            <div id="splunkPasswordHelpBlock" class="form-text">Leave empty to keep current value.</div>
                            <label for="inputSplunkPassword" class="form-label form-validation-message {modalValidation?.splunkPassword == null ? 'd-none' : ''}">{modalValidation?.splunkPassword}</label>
                        </div>
                    </div>
                    <div class="row mt-4">
                        <div class="col-12">
                            <label for="inputSplunkhomePath" class="form-label">SPLUNK_HOME/etc/apps path</label>
                            <input bind:value={modalSplunkHomePathVal} id="inputSplunkhomePath" type="text" class="form-control" aria-describedby="splunkHomePathHelp" />
                            <div id="splunkHomePathHelp" class="form-text">The equivalent of "/opt/splunk/etc/apps" in a standard installation of splunk.</div>
                            <label for="inputSplunkhomePath" class="form-label form-validation-message {modalValidation?.splunkHomePath == null ? 'd-none' : ''}">{modalValidation?.splunkHomePath}</label>
                        </div>
                    </div>
                    <div class="row mt-4">
                        <div class="col-6">
                            <label for="inputSplunkRestartCommandHelp" class="form-label">Splunk Restart Command</label>
                            <input bind:value={modalSplunkRestartCommand} id="inputSplunkRestartCommand" type="text" class="form-control" aria-describedby="splunkHomePathHelp" />
                            <div id="inputSplunkRestartCommandHelp" class="form-text">The equivalent of "/opt/splunk/bin/splunk restart" in a standard installation of Splunk.</div>
                            <label for="inputSplunkRestartCommandHelp" class="form-label form-validation-message {modalValidation?.splunkRestartCommand == null ? 'd-none' : ''}">{modalValidation?.splunkRestartCommand}</label>
                        </div>
                        <div class="col-6">
                            <label for="inputSplunkManagementPort" class="form-label">Splunk Management Port</label>
                            <input bind:value={modalSplunkManagementPort} id="inputSplunkManagementPort" type="text" class="form-control" aria-describedby="splunkHomePathHelp" />
                            <div id="inputSplunkManagementPortHelp" class="form-text">Typically 8089.</div>
                            <label for="inputSplunkManagementPortHelp" class="form-label form-validation-message {modalValidation?.splunkManagementPort == null ? 'd-none' : ''}">{modalValidation?.splunkManagementPort}</label>
                        </div>
                    </div>
                    <p class="form-label form-validation-message">{modalValidation?.generalError}</p>
                    <hr class="mt-3" />
                    <div class="row mt-2">
                        <div class="col-12 d-flex justify-content-center align-items-center">
                            <h5 class="">Server Classes</h5>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-5">
                            <select id="unselectServerClasses" multiple style="height: 30em; width: 100%">
                                {#each unselectedServerClasses as sc}
                                    <option value={sc.id}>{sc.name}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="col-2 d-flex align-items-center justify-content-center">
                            <button
                                onclick={() => {
                                    moveServerClassToLeftSelect();
                                }}>&lt;</button
                            >
                            <br />
                            <button
                                onclick={() => {
                                    moveServerClassToRightSelect();
                                }}>&gt;</button
                            >
                        </div>
                        <div class="col-5">
                            <select id="selectServerClasses" multiple style="height: 30em;  width: 100%">
                                {#each selectedServerClasses as sc}
                                    <option value={sc.id}>{sc.name}</option>
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
                        saveHostValues(null);
                    }}>Save changes</button
                >
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="deleteHostModal" tabindex="-1" aria-labelledby="deleteHostModal" aria-hidden="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Confirm Deletion of {deleteHostObject?.hostname}</h5>
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
                                    deleteHost(deleteHostObject);
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
        id="RedeployAllAddons"
        class="btn btn-success btn-lg"
        type="button"
        onclick={() => {
            redeployAllAddOns();
        }}>Deploy All</button
    >
    <button
        class="btn btn-success btn-lg"
        type="button"
        onclick={() => {
            showModalNewHost();
        }}>Add</button
    >
</span>
