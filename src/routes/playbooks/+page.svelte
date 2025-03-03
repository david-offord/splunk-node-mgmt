<script lang="ts">
    import type { AnsiblePlaybookModel } from "$lib/types";
    import type { Modal } from "bootstrap";
    import type { PageServerData } from "./$types";
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    //load from server side
    let { data }: { data: PageServerData; form: FormData } = $props();
    let allPlaybooks: AnsiblePlaybookModel[] = $state(data.playbooks);

    //all variables used for editing and deleting
    let currentlyEditingPlaybook: AnsiblePlaybookModel = $state(null);
    let editPlaybookName = $state("");
    let editPlaybookDescription = $state("");
    let editPlaybookContents = $state("");

    //UI variables
    let deleteModal: Modal = null;
    let editModal: Modal = null;
    let aceEditor: any = null;

    async function getAllPlaybooks() {
        const response = await fetch($page.url.pathname, { method: "GET" });
        if (response.ok) {
            allPlaybooks = (await response.json()).playbooks;
        } else {
            console.log("Error occurred getting playbooks.");
        }
    }

    function addNewPlaybookModal() {
        currentlyEditingPlaybook = null;
        editPlaybookName = "";
        editPlaybookDescription = "";

        if (aceEditor === null) {
            initializeAceEditor();
        }

        aceEditor.setValue("", 1);
        showHideEditModal(true);
    }

    function editPlaybookModal(editPlaybook: AnsiblePlaybookModel) {
        currentlyEditingPlaybook = editPlaybook;
        editPlaybookName = editPlaybook.playbookName;
        editPlaybookDescription = editPlaybook.playbookNotes;

        if (aceEditor === null) {
            initializeAceEditor();
        }

        aceEditor.setValue(editPlaybook.playbookContents, 1);
        showHideEditModal(true);
    }

    /**
     * Actually shows and hides the delete modal
     * @param show
     */
    function showHideEditModal(show = true) {
        if (editModal == null) {
            //@ts-ignore
            editModal = new bootstrap.Modal(document.getElementById("playbookEditModal"));
        }

        if (show) {
            editModal.show();
        } else {
            editModal.hide();
        }
    }

    async function savePlaybook() {
        //if its a new one
        if (currentlyEditingPlaybook === null) {
            createPlaybook();
        }
        //otherwise its an existing one
        else {
            updatePlaybook();
        }
    }

    async function createPlaybook() {
        let updatePlaybook: AnsiblePlaybookModel = {
            id: -1,
            playbookName: editPlaybookName,
            playbookNotes: editPlaybookDescription,
            playbookContents: aceEditor.getValue(),
        };
        const response = await fetch($page.url.pathname, { method: "POST", body: JSON.stringify(updatePlaybook) });

        if (response.ok) {
            showHideEditModal(false);
            getAllPlaybooks();
        } else {
            //TODO: ADD VALIDATION HERE
        }
    }

    async function updatePlaybook() {
        let updatePlaybook: AnsiblePlaybookModel = {
            id: currentlyEditingPlaybook.id,
            playbookName: editPlaybookName,
            playbookNotes: editPlaybookDescription,
            playbookContents: aceEditor.getValue(),
        };
        const response = await fetch($page.url.pathname, { method: "PATCH", body: JSON.stringify(updatePlaybook) });

        if (response.ok) {
            showHideEditModal(false);
            getAllPlaybooks();
        } else {
            //TODO: ADD VALIDATION HERE
        }
    }

    /**
     * Shows modal to confirm deletion of a playbook
     * @param deletePlaybook
     */
    function confirmPlaybookDeletion(deletePlaybook: AnsiblePlaybookModel) {
        currentlyEditingPlaybook = deletePlaybook;
        showHideDeleteModal(true);
    }

    /**
     * Actually shows and hides the delete modal
     * @param show
     */
    function showHideDeleteModal(show = true) {
        if (deleteModal == null) {
            //@ts-ignore
            deleteModal = new bootstrap.Modal(document.getElementById("deletePlaybookModal"));
        }

        if (show) {
            deleteModal.show();
        } else {
            deleteModal.hide();
        }
    }

    async function deletePlaybook() {
        const response = await fetch($page.url.pathname, { method: "DELETE", body: JSON.stringify(currentlyEditingPlaybook) });

        if (response.ok) {
            await getAllPlaybooks();
            showHideDeleteModal(false);
        } else {
            console.log(response);
        }
    }

    function initializeAceEditor() {
        //@ts-ignore
        aceEditor = ace.edit("editor", {});
        aceEditor.setTheme("ace/theme/monokai");
        aceEditor.session.setMode("ace/mode/yaml");
    }

    //Add all listeners
    onMount(() => {
        window.addEventListener("load", (event) => {
            //@ts-ignore
            initializeAceEditor();
        });
    });
</script>

<svelte:head>
    <title>Ansible Playbooks</title>

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

<div class="container mt-2">
    <table class="table">
        <thead>
            <tr>
                <th>Playbook Name</th>
                <th>Playbook Notes</th>
                <th>Created By</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {#each allPlaybooks as playbook}
                <tr>
                    <td>{playbook.playbookName}</td>
                    <td>{playbook.playbookNotes?.length > 30 ? playbook.playbookNotes?.slice(0, 30) + "..." : playbook?.playbookNotes}</td>
                    <td>{playbook.createdByName}</td>
                    <td>
                        <button aria-label="Edit Playbook" class="btn btn btn-table-action" data-bs-toggle="tooltip" data-placement="top" title="Edit Playbook" onclick={() => editPlaybookModal(playbook)}>
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button aria-label="Delete Playbook" class="btn btn-table-action" data-bs-toggle="tooltip" data-placement="top" title="Delete Playbook" onclick={() => confirmPlaybookDeletion(playbook)}>
                            <i class="bi bi-trash"></i>
                        </button>
                        <a aria-label="Run Playbook" class="btn btn btn-table-action" data-bs-toggle="tooltip" data-placement="top" title="Run Playbook" href="/playbooks/run/{playbook.id}">
                            <i class="bi bi-play-fill"></i>
                        </a>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<!--Edit modal-->
<div class="modal fade" id="playbookEditModal" tabindex="-1" aria-labelledby="playbookEditModal" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">{currentlyEditingPlaybook === null ? "Create New Playbook" : `Editing ${currentlyEditingPlaybook.playbookName}`}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="row">
                        <div class="col-12">
                            <label for="inputPlaybookname" class="form-label">Playbook Name</label>
                            <input bind:value={editPlaybookName} type="text" required class="form-control" id="inputPlaybookname" />
                            <!-- <label for="inputPlaybookname" class="form-label form-validation-message {modalValidation?.playbookname == null ? 'd-none' : ''}">{modalValidation?.playbookname}</label> -->
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <label for="inputIpAddress" class="form-label">Playbook Description</label>
                            <textarea bind:value={editPlaybookDescription} required class="form-control" id="inputIpAddress" style="resize: none; height:8em;"></textarea>
                            <!-- <label for="inputPlaybookname" class="form-label form-validation-message {modalValidation?.ipAddress == null ? 'd-none' : ''}">{modalValidation?.ipAddress}</label> -->
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <label for="inputIpAddress" class="form-label">Playbook Contents</label>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <div style="height:40rem;">
                                <div id="editor"></div>
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
                        savePlaybook();
                    }}>Save changes</button
                >
            </div>
        </div>
    </div>
</div>

<!--Confirm deletion of a playbook modal-->
<div class="modal fade" id="deletePlaybookModal" tabindex="-1" aria-labelledby="deletePlaybookModal" aria-hidden="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Confirm Deletion of {currentlyEditingPlaybook?.playbookName}</h5>
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
                                    deletePlaybook();
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
            addNewPlaybookModal();
        }}>Add</button
    >
</span>
