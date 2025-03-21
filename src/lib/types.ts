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
    addonsAssigned?: Array<AddOn>,
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


export interface AnsiblePlaybookModel {
    id: number,
    playbookName: string,
    playbookNotes?: string,
    playbookContents?: string,
    createdBy?: string
    createdByName?: string
}


export interface AnsiblePlaybookModelVariables extends AnsiblePlaybookModel {
    variables?: AnsiblePlaybookVariables[],
    hosts?: Host[],
}

export interface AnsiblePlaybookVariables {
    variableName: string,
    variableValue: string,
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

export interface JobsModel {
    id: number,
    jobDescription: string,
    startedBy: string,
    createdOn: Date,
    completed: boolean,
    completedOn: Date,
    startedByName?: string,
}

export interface UserWithPermissions {
    addonDeployments?: number,
    addonManagement?: number,
    admin?: number,
    createdAt?: Date,
    disabled?: number,
    email?: string,
    hashedPassword?: string,
    hostManagement?: number,
    id?: string,
    jobViewing?: number,
    name?: string,
    playbookManagement?: number,
    playbookRunning?: number,
    serverClassManagement?: number,
    updatedAt?: Date,
    userId?: string,
    userManagement?: number,
}