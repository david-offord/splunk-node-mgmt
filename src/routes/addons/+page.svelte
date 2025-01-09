<script lang="ts">
    import type { ServerClasses, AddOn, ServerClassJoinAddon, AddonValidationObject } from "$lib/types";
    import type { PageServerData } from "./$types";
    import type { Modal } from "bootstrap";
    import type * as bootstrap from "bootstrap";
    import { page } from "$app/stores";
    import { onMount } from "svelte";

    //get the hosts from the db
    let { data }: { data: PageServerData; form: FormData } = $props();
    let addOns = $state(data.addons);
    let possibleServerClasses = $state(data.serverClasses);

    let unselectedServerClasses = $state(data.serverClasses);
    let selectedServerClasses: ServerClasses[] = $state([]);

    //get the modal instance
    let addonModal: Modal = null;
    let deleteAddonModal: Modal = null;
    let newAddon: boolean = false;

    //current editing server class
    let currentEditingAddon: AddOn = $state();
    let deleteAddonObj: AddOn = $state();

    //basic variables for display on webpage
    let editTitle: string = $state("");
    let newServerClassInput: string = $state("");
    let uploadedFile: File = null;

    let modalAddonDisplayName = $state("");
    let modalAddOnIgnoredPaths = $state("");
    let modalAddonAction = $state("");

    //used for validation later
    let modalValidation: AddonValidationObject = $state();

    //get all server classes
    async function loadAddons() {
        const response = await fetch($page.url.pathname, { method: "GET" });

        //load the server classes
        addOns = await response.json();
    }

    //toggle modal
    function showHideModal(show: boolean) {
        if (addonModal == null) {
            //@ts-ignore
            addonModal = new bootstrap.Modal(document.getElementById("editAddonModal"));
        }

        if (show) {
            addonModal.show();
        } else {
            addonModal.hide();
        }
    }

    //toggle modal
    function showHideDeleteModal(show: boolean, addon: AddOn) {
        deleteAddonObj = addon;

        if (deleteAddonModal == null) {
            //@ts-ignore
            deleteAddonModal = new bootstrap.Modal(document.getElementById("deleteAddonModal"));
        }

        if (show) {
            deleteAddonModal.show();
        } else {
            deleteAddonModal.hide();
        }
    }

    //open modal with existing server class
    function showModalAddon(addOn: AddOn = null) {
        //null out the arrays
        selectedServerClasses = [];
        unselectedServerClasses = [];

        //clear the file var
        uploadedFile = null;

        //clear the values for the inputs
        modalAddonDisplayName = "";
        modalAddOnIgnoredPaths = "";
        modalAddonAction = "";

        //save the class we're currrently editing for save later
        currentEditingAddon = addOn;

        //its a new addOn
        if (addOn === null) {
            unselectedServerClasses = [...possibleServerClasses];

            editTitle = "New Add-on";
            newAddon = true;
        }
        //its an exisitng one
        else {
            modalAddonDisplayName = addOn.displayName;
            modalAddOnIgnoredPaths = addOn.addonIgnoreFileOption;
            modalAddonAction = addOn.actionOnInstallation;
            modalAddonDisplayName = addOn.displayName;

            //filter out the elements in the full list into the 2 arrays
            console.log(addOn.serverClassesAssigned);
            console.log(possibleServerClasses);

            for (let ps of possibleServerClasses) {
                //if the host is not in the host assigned array, add it to unselected
                console.log(ps);
                if (addOn.serverClassesAssigned.findIndex((x) => x == ps.id) === -1) {
                    console.log("no");
                    unselectedServerClasses.push(ps);
                } else {
                    selectedServerClasses.push(ps);
                    console.log("yes");
                }
            }

            editTitle = 'Manage Add On "' + addOn.displayName + '"';
            newAddon = false;
        }

        showHideModal(true);
    }

    //save changes for current modal
    async function saveModalChanges() {
        saveAddon();
    }

    async function saveAddon() {
        //if its new
        if (currentEditingAddon === null) {
        }

        //new addon obj build
        //@ts-ignore
        let selectedServerClass: number[] = [...document.getElementById("selectedHostSelect").children].map((x: HTMLElement) => {
            // @ts-ignore
            return x.value;
        });

        let newAddon: AddOn = {
            //if its new, -1, else, the id
            id: currentEditingAddon === null ? -1 : currentEditingAddon.id,
            displayName: modalAddonDisplayName,
            addonIgnoreFileOption: modalAddOnIgnoredPaths,
            actionOnInstallation: modalAddonAction,
            addonFileLocation: "TEMP",
        };

        let formData = new FormData();
        //assign all attributes
        for (let attr in newAddon) {
            formData.append(attr, newAddon[attr as keyof AddOn].toString());
        }
        //add the array of serverClasses
        formData.append("serverClassesAssigned", JSON.stringify(selectedServerClass));

        if (uploadedFile !== null) {
            formData.append("file", uploadedFile);
        }

        //send the request
        const response = await fetch($page.url.pathname, {
            method: currentEditingAddon === null ? "POST" : "PATCH",
            body: formData,
        });

        if (response.ok) {
            await loadAddons();
            showHideModal(false);
        } else {
            modalValidation = await response.json();
        }
    }

    async function deleteAddon(addon: AddOn) {
        //send the request
        const response = await fetch($page.url.pathname, {
            method: "DELETE",
            body: JSON.stringify(addon),
        });
        await loadAddons();
        showHideDeleteModal(false, null);
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
            let h: ServerClassJoinAddon = null;
            let index: number = 0;

            for (let i = 0; i < selectedServerClasses.length; i++) {
                //if it matches
                if (selectedServerClasses[i].id == mh) {
                    //save that info
                    index = i;
                    h = selectedServerClasses[i];
                    //and break
                    break;
                }
            }

            //if we dont find anything for some reason, ignore
            if (h === null) {
                continue;
            }

            //remove it from selected
            selectedServerClasses.splice(index, 1);
            //add it to the unselected ones
            unselectedServerClasses.push(h);
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
            let h: ServerClassJoinAddon = null;
            let index: number = 0;

            for (let i = 0; i < unselectedServerClasses.length; i++) {
                //if it matches
                if (unselectedServerClasses[i].id == mh) {
                    //save that info
                    index = i;
                    h = unselectedServerClasses[i];
                    //and break
                    break;
                }
            }

            //if we dont find anything for some reason, ignore
            if (h === null) {
                continue;
            }

            //remove it from selected
            unselectedServerClasses.splice(index, 1);
            //add it to the unselected ones
            selectedServerClasses.push(h);
        }
    }

    //Add all listeners
    onMount(() => {
        const fileInput = document.getElementById("inputAddonFile");
        fileInput.addEventListener("change", async (event) => {
            uploadedFile = event.target.files[0];
        });
    });
</script>

<svelte:head>
    <title>Add-on Manager</title>

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
    <h1 class="mat-green">Add-ons</h1>
    <table class="table">
        <thead>
            <tr>
                <th>Name</th>
                <th>File Name</th>
                <th># Server Classes Including This</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {#each addOns as addon}
                <tr>
                    <td> {addon.displayName} </td>
                    <td> {addon.appFolderName} </td>
                    <td> {addon.serverClassesAssigned?.length} </td>
                    <td>
                        <button
                            class="ms-1 table-button"
                            onclick={() => {
                                showModalAddon(addon);
                            }}
                            aria-label="Edit Add-On"
                        >
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button
                            class="ms-3 table-button"
                            onclick={() => {
                                showHideDeleteModal(true, addon);
                            }}
                            aria-label="Delete Add-On"
                        >
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<!--Edit modal-->
<div class="modal fade" id="editAddonModal" tabindex="-1" aria-labelledby="editAddonModal" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">{editTitle}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="row">
                        <div class="col-sm-12 col-lg-6">
                            <label for="inputAddonName" class="form-label">Add-on Name</label>
                            <input bind:value={modalAddonDisplayName} type="text" required class="form-control" id="inputAddonName" />
                            <label for="inputAddonName" class="form-label form-validation-message {modalValidation == null ? 'd-none' : ''}">{modalValidation?.addonName}</label>
                        </div>
                        <div class="col-sm-12 col-lg-6">
                            <label for="inputAddonFile" class="form-label">Add-on File (Do not upload to retain current)</label>
                            <input type="file" accept=".tar.gz,.tar,.spl,.gz" required class="form-control" id="inputAddonFile" />
                            <label for="" class="form-label">{currentEditingAddon == null ? "" : "Current File: " + currentEditingAddon?.addonFileLocation}</label>
                            <label for="inputAddonFile" class="form-label form-validation-message {modalValidation == null ? 'd-none' : ''}">{modalValidation?.addOnFileError}</label>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-sm-12 col-lg-6">
                            <label for="inputIgnoredFiles" class="form-label">Ignored Files/Paths</label>
                            <input bind:value={modalAddOnIgnoredPaths} type="text" required class="form-control" id="inputIgnoredFiles" />
                            <label for="inputIgnoredFiles" class="form-label form-validation-message {modalValidation == null ? 'd-none' : ''}">{modalValidation?.ignoredFiles}</label>
                        </div>
                        <div class="col-sm-12 col-lg-6">
                            <label for="inputActionOnInstallation" class="form-label">Action on Installation</label>
                            <select bind:value={modalAddonAction} class="form-control" id="inputActionOnInstallation">
                                <option value="nothing">Nothing</option>
                                <option value="debugrefresh">Debug Refresh</option>
                                <option value="restart">Restart</option>
                            </select>
                            <label for="inputActionOnInstallation" class="form-label form-validation-message {modalValidation == null ? 'd-none' : ''}">{modalValidation?.actionOnInstallation}</label>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <h3 class="d-flex justify-content-center">Server Classes</h3>
                        </div>
                    </div>
                    <div class="row mt-1">
                        <div class="col-5">
                            <select id="unselectedHostSelect" multiple style="height: 30em; width: 100%">
                                {#each unselectedServerClasses as ps}
                                    <option value={ps.id}>{ps.name}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="col-2 d-flex align-items-center justify-content-center">
                            <button
                                type="button"
                                onclick={() => {
                                    moveHostToLeftModal();
                                }}>&lt;</button
                            >
                            <br />
                            <button
                                type="button"
                                onclick={() => {
                                    moveHostToRightModal();
                                }}>&gt;</button
                            >
                        </div>
                        <div class="col-5">
                            <select id="selectedHostSelect" multiple style="height: 30em;  width: 100%">
                                {#each selectedServerClasses as ps}
                                    <option value={ps.id}>{ps.name}</option>
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

<div class="modal fade" id="deleteAddonModal" tabindex="-1" aria-labelledby="deleteAddonModal" aria-hidden="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-body">
                <h5 class="modal-title" id="exampleModalLabel">Confirm Deletion of<br />"{deleteAddonObj?.displayName}"</h5>
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
                                    deleteAddon(deleteAddonObj);
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
            showModalAddon();
        }}>Add</button
    >
</span>
