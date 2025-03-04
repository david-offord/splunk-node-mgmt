<script lang="ts">
    import { page } from "$app/stores";
    import type { AnsiblePlaybookModel, AnsiblePlaybookModelVariables, Host } from "$lib/types";
    import type { PageServerData } from "./$types";
    import { onMount } from "svelte";

    //load from server side
    let { data }: { data: PageServerData; form: FormData } = $props();
    let runPlaybook: AnsiblePlaybookModel = $state(data.playbook);
    let hosts: Host[] = $state(data.hosts);

    //ui variables
    let aceEditor: any = null;
    let formInputs: any[] = [];

    //variables for sending to backend
    let playbookOriginalContents = runPlaybook.playbookContents;
    let selectedHosts: Host[] = $state([]);
    let currentlySendingToBackend = $state(false);

    //validation messages
    let hostsValidationMessage = $state("");
    let varsValidationMessage = $state("");

    let playbookVariableMatches = runPlaybook.playbookContents.matchAll(/\$\((?<variablename>.*?)\)/g);

    //first thing is to build the inputs on the right from the contents of the playbook
    for (const match of playbookVariableMatches) {
        let matchText = match.groups.variablename;

        //if it didnt match, skip
        if (!matchText) {
            continue;
        }

        //split by ;
        let splitMatches = matchText.split(";");

        //if it is a hosts variable, skip
        if (splitMatches[0].trim().toLowerCase() === "hosts") {
            continue;
        }

        //create an object for input definition
        let newFormInput = {
            inputName: splitMatches[0],
            optional: false,
            defaultValue: "",
        };

        //for each split from the split(;)
        for (let sm of splitMatches) {
            //if it is optional
            if (sm.trim().toLowerCase() === "required") {
                newFormInput.optional = true;
            }
            //if there is a default value
            if (sm.trim().toLowerCase().indexOf("default=") === 0) {
                newFormInput.defaultValue = sm.slice(8);
            }
        }

        //add it into the array for inputs later on
        formInputs.push(newFormInput);
    }

    function initializeAceEditor() {
        //@ts-ignore
        aceEditor = ace.edit("aceReadonlyEditor", {});
        aceEditor.setTheme("ace/theme/monokai");
        aceEditor.session.setMode("ace/mode/yaml");
        aceEditor.setValue(runPlaybook.playbookContents, -1);
        aceEditor.setOption("useWrapMode", true);
        aceEditor.setReadOnly(true);
    }

    //TODO: Implement this
    function toggleAllHosts() {}

    function toggleHost(host: Host) {
        if (selectedHosts.indexOf(host) === -1) {
            selectedHosts.push(host);
        } else {
            selectedHosts.filter((x) => x !== host);
        }
        updatePlaybookView();
    }

    //update any variable changes in the view on the left
    function updatePlaybookView() {
        let newContents = playbookOriginalContents;

        //do all the non host inputs
        let allInputs = [...document.getElementsByClassName("playbook-input")];
        for (let input of allInputs) {
            //slice off "input"
            let inputName = input.id.slice(5);
            //oh typescript, my love
            let inputValue = (input as HTMLInputElement).value;

            if (inputValue === "") {
                continue;
            }

            //get the start of the section
            let regex = new RegExp("\\$\\((" + inputName + ".*?)\\)");
            newContents = newContents.replace(regex, inputValue);
        }

        //do the hosts now
        let hostString = "";
        for (let host of selectedHosts) {
            hostString += host.ansibleName + ", ";
        }
        if (hostString.length !== 0) {
            //get rid of the comma
            hostString = hostString.slice(0, -2);
            newContents = newContents.replace(/\$\((hosts.*?)\)/, hostString);
        }

        aceEditor.setValue(newContents, -1);
    }

    //send to backend
    async function sendPlaybookToBackend() {
        //if its already sending, dont do it again
        if (currentlySendingToBackend) {
            return;
        }

        let error = false;
        //check that at least 1 host is selected
        if ([...document.querySelectorAll(".host-selection-checkbox:checked")].length === 0) {
            hostsValidationMessage = "Please select at least one host";
            error = true;
        }

        //check that all required fields have a value
        let allRequiredInputs = [...document.getElementsByClassName("required")];
        for (let input of allRequiredInputs) {
            if ((input as HTMLInputElement).value === "") {
                varsValidationMessage = "Please fill in all required fields";
                error = true;
            }
        }

        // if either of the above have an issue, dont run
        if (error) {
            return;
        }

        //set a thing to stop it from rerunning
        currentlySendingToBackend = true;

        let sendToApi: AnsiblePlaybookModelVariables = runPlaybook;
        sendToApi.hosts = [];
        sendToApi.variables = [];

        //do all the non host inputs
        let allInputs = [...document.getElementsByClassName("playbook-input")];
        for (let input of allInputs) {
            //slice off "input"
            let inputName = input.id.slice(5);
            //oh typescript, my love
            let inputValue = (input as HTMLInputElement).value;

            sendToApi.variables.push({ variableName: inputName, variableValue: inputValue });
        }

        //all the host checkboxes now
        let hostCheckboxes = [...document.querySelectorAll(".host-selection-checkbox:checked")];
        for (let hc of hostCheckboxes) {
            //slice off "input"
            let hostId = parseInt(hc.id.slice(12));
            let host = hosts.find((x) => x.id === hostId);

            sendToApi.hosts.push(host);
        }

        const response = await fetch($page.url.pathname, { method: "POST", body: JSON.stringify(sendToApi) });

        if (response.ok) {
        } else {
        }
    }

    //Add all listeners
    onMount(() => {
        initializeAceEditor();
    });
</script>

<svelte:head>
    <title>Run Playbook</title>

    <style type="text/css" media="screen">
        #TestFloatingAdd {
            position: fixed;
            right: 20px;
            bottom: 20px;
        }

        .form-validation-message {
            color: red;
        }

        #aceReadonlyEditor {
            min-height: 40rem;
            height: 100%;
            width: 100%;
        }

        #HostSelectionDropdown {
            min-height: 20rem;
            width: 100%;
        }
    </style>

    <script type="text/javascript" src="/src/js/ace/ace.js"></script>
</svelte:head>

<div class="container mt-2">
    <div class="row">
        <div class="col-6">
            <div id="aceReadonlyEditor"></div>
        </div>
        <div class="col-6">
            <div class="row">
                <div class="col-12"><h3 class="section-header">Host Selection</h3></div>
                <div class="col-12" style="max-height: 20rem; overflow:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th><input class="form-check-input" type="checkbox" value="" id="flexCheckDefault" /></th>
                                <th>Host</th>
                                <th>Customer Code</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each hosts as host}
                                <tr>
                                    <td><input id="hostCheckbox{host.id}" class="form-check-input host-selection-checkbox" type="checkbox" value={host.id} onchange={() => toggleHost(host)} /></td>
                                    <td>{host.hostname}</td>
                                    <td>{host.customerCode}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                <div class="col-12">
                    <h4 class="text-danger {hostsValidationMessage === '' || hostsValidationMessage == null ? 'd-none' : ''}">{hostsValidationMessage}</h4>
                </div>
            </div>
            {#if formInputs.length > 0}
                <div class="row mt-3">
                    <div class="col-12"><h3 class="section-header">Playbook Variables</h3></div>
                    <div class="col-12">
                        <form>
                            {#each formInputs as input}
                                <div class="row mt-2">
                                    <div class="col-12">
                                        {#if input.optional === false}<label for="input{input.inputName}" class="required-star">*</label>{/if}
                                        <label for="input{input.inputName}" class="form-label light-label">{input.inputName}</label>
                                        <input type="text" required value={input.defaultValue} class="form-control playbook-input {input.optional ? '' : 'required'}" id="input{input.inputName}" oninput={() => updatePlaybookView()} />
                                    </div>
                                </div>
                            {/each}
                            <div class="row mt-2 {varsValidationMessage === '' || varsValidationMessage == null ? 'd-none' : ''}">
                                <div class="col-12">
                                    <h4 class="text-danger">{varsValidationMessage}</h4>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="col-12 mt-4">
                        <button type="button" class="btn btn-success col-12" onclick={() => sendPlaybookToBackend()}
                            >{#if currentlySendingToBackend}<i class="bi bi-clock"></i>{:else}Send{/if}</button
                        >
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
