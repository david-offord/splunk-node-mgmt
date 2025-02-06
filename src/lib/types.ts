export interface ValidationObject {
    generalError?: string,
    hostname?: string,
    ipAddress?: string,
    customerCode?: string,
    linuxUsername?: string,
    linuxPassword?: string,
    splunkPassword?: string,
    splunkHomePath?: string,
    ansibleName?: string | null,
    splunkRestartCommand?: string | null,
    splunkManagementPort?: string | null,
}

export interface AddonValidationObject {
    addonName?: string,
    ignoredFiles?: string,
    actionOnInstallation?: string,
    addOnFileError?: string,
}

export interface Host {
    id: number,
    hostname?: string,
    ipAddress?: string,
    customerCode?: string,
    splunkHomePath?: string
    linuxUsername?: string,
    linuxPassword?: string,
    splunkPassword?: string,
    ansibleName?: string | null,
    splunkRestartCommand?: string | null,
    splunkManagementPort?: string | null,
    serverClassesAssigned?: Array<number>,
}

export interface HostJoinServerClass extends Host {
    serverClassId: number
}


export interface ServerClassJoinAddon extends ServerClasses {
    addonId: number
}

export interface AddonJoinServerClass extends AddOn {
    serverClassId: number
}

export interface ServerClasses {
    id: number,
    name: string,
    hostsAssigned?: Array<Host>,
    addonsAssigned?: Array<number>,
}

export interface AddOn {
    id: number,
    displayName: string,
    addonFileLocation?: string,
    addonIgnoreFileOption?: string,
    actionOnInstallation?: string,
    serverClassesAssigned?: Array<number>,
    addonFolderName?: string
}




export interface AnsibleVariableFile {
    ansible_user: string,
    ansible_password: string,
    ansible_become_password: string,
    ansible_splunk_password: string,
}

export interface LoginModel {
    username: string,
    password: string
}