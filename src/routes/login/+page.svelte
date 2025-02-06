<script lang="ts">
    import { page } from "$app/stores";
    import type { LoginModel } from "$lib/types";
    import { goto } from "$app/navigation";

    let SESSION_COOKIE_NAME = "snmSessionKey";
    let username = "";
    let password = "";
    let validationMessage: string = null;

    const setCookie = (cookieKey: string, cookieValue: string, expirationDays: number) => {
        let expiryDate = "";

        if (expirationDays) {
            const date = new Date();

            date.setTime(`${date.getTime()}${expirationDays || 30 * 24 * 60 * 60 * 1000}`);

            expiryDate = `; expiryDate=" ${date.toUTCString()}`;
        }

        document.cookie = `${cookieKey}=${cookieValue || ""}${expiryDate}`;
    };

    async function attemptLogin() {
        let loginInfo: LoginModel = {
            username: username,
            password: password,
        };

        const response = await fetch($page.url.pathname, {
            method: "POST",
            body: JSON.stringify(loginInfo),
        });

        let resp = await response;
        let responseText = (await resp.json()) as string;

        if (resp.ok === false) {
            validationMessage = responseText;
            return;
        }

        validationMessage = null;
        setCookie(SESSION_COOKIE_NAME, responseText, 1);
        goto("/");
    }
</script>

<svelte:head>
    <title>Login</title>

    <style>
        .form-label {
            color: white;
        }

        .container {
            width: 30%;
        }

        .btn-green {
            background-color: rgb(23, 235, 23) !important;
            border-color: rgb(23, 235, 23) !important;
            color: darkgreen;
            font-weight: bold;
        }
    </style>
</svelte:head>

<div class="container-fluid">
    <form>
        <div class="row">
            <div class="offset-md-4 col-md-4 col-sm-12">
                <label for="inputHostname" class="form-label mat-green">Username</label>
                <input bind:value={username} type="text" required class="form-control" id="inputHostname" />
            </div>
        </div>
        <div class="row mt-3">
            <div class="offset-md-4 col-md-4 col-sm-12">
                <label for="inputHostname" class="form-label mat-green">Password</label>
                <input bind:value={password} type="password" required class="form-control" id="inputHostname" />
                <!-- <label for="inputHostname" class="form-label form-validation-message {modalValidation?.hostname == null ? 'd-none' : ''}">{modalValidation?.hostname}</label> -->
            </div>
        </div>
        <div class="row mt-5 {validationMessage == null ? 'd-none' : ''}">
            <div class="offset-md-4 col-md-4 col-sm-12">
                <label for="inputHostname" class="form-label form-validation-message">{validationMessage}</label>
            </div>
        </div>
        <div class="row mt-5">
            <div class="offset-md-4 col-md-4 col-sm-12 d-flex align-items-center justify-content-center">
                <button type="button" class="btn btn-primary btn-green col-12" onclick={() => attemptLogin()}>Login</button>
            </div>
        </div>
    </form>
</div>
