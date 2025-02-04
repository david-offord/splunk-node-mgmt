<script lang="ts">
    let username = "";
    let password = "";
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

<div class="container">
    <form>
        <div class="row">
            <div class="col-12">
                <label for="inputHostname" class="form-label mat-green">Username</label>
                <input bind:value={username} type="text" required class="form-control" id="inputHostname" />
            </div>
        </div>
        <div class="row mt-5">
            <div class="col-12">
                <label for="inputHostname" class="form-label mat-green">Password</label>
                <input bind:value={password} type="password" required class="form-control" id="inputHostname" />
                <!-- <label for="inputHostname" class="form-label form-validation-message {modalValidation?.hostname == null ? 'd-none' : ''}">{modalValidation?.hostname}</label> -->
            </div>
        </div>
        <div class="row mt-5">
            <div class="col-12 d-flex align-items-center justify-content-center">
                <button type="submit" class="btn btn-primary w-100 btn-green">Login</button>
            </div>
        </div>
    </form>
</div>
