<script lang="ts">
    import { page } from "$app/stores";

    let successfullyChanged = $state(false);

    let currentPassword = $state("");
    let newPassword1 = $state("");
    let newPassword2 = $state("");
    let validationMessage = $state("");

    async function submitPassword() {
        //they didnt fill out both password inputs
        if (newPassword1 === "" || newPassword2 === "") {
            validationMessage = "Both password entries must be filled out.";
            return;
        }

        //if the 2 passwords do not match
        if (newPassword1 !== newPassword2) {
            validationMessage = "Passwords do not match.";
            return;
        }

        let toApi = {
            currentPassword: currentPassword,
            newPassword: newPassword1,
        };
        const response = await fetch($page.url.pathname, { method: "PATCH", body: JSON.stringify(toApi) });

        if (response.ok) {
            successfullyChanged = true;
            validationMessage = "";
        } else {
            successfullyChanged = false;
            validationMessage = await response.json();
        }
    }
</script>

<svelte:head>
    <title>Change Password</title>
    <style>
        .success-message {
            color: #35dc57;
        }
    </style>
</svelte:head>
<div class="container">
    <div class="row">
        <div class="col-12">
            <h3 class="section-header">Change Password</h3>
        </div>

        <div class="col-12 mt-4">
            <label for="currentPasswordInput" class="form-label light-label">Current Password</label>
            <input bind:value={currentPassword} type="password" required class="form-control" id="currentPasswordInput" />
        </div>
        <div class="col-12 mt-2">
            <label for="newPassword1" class="form-label light-label">New Password</label>
            <input bind:value={newPassword1} type="password" required class="form-control" id="newPassword1" />
        </div>
        <div class="col-12 mt-2">
            <label for="newPassword2" class="form-label light-label">Confirm New Password</label>
            <input bind:value={newPassword2} type="password" required class="form-control" id="newPassword2" />
        </div>

        {#if validationMessage !== ""}
            <div class="col-12 mt-2">
                <label for="" class="text-danger">{validationMessage}</label>
            </div>
        {/if}

        <div class="col-12 mt-4">
            <button onclick={() => submitPassword()} class="btn btn-success col-12">Confirm Password Change</button>
        </div>

        {#if successfullyChanged}
            <div class="col-12 mt-4 d-flex justify-content-center">
                <h2 class="success-message">Successfully changed password.</h2>
            </div>
        {/if}
    </div>
</div>
