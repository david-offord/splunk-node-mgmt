export interface ValidationObject {
    generalError?: string,
    hostname?: string,
    ipAddress?: string,
    customerCode?: string,
    linuxUsername?: string,
    linuxPassword?: string,
    splunkPassword?: string,
    splunkHomePath?: string,
    ansibleName?: string | null
}

export interface Host {
    id: number,
    hostname: string,
    ipAddress: string,
    customerCode: string,
    splunkHomePath: string
    linuxUsername?: string,
    linuxPassword?: string,
    splunkPassword?: string,
    ansibleName?: string | null

}

export interface AnsibleVariableFile {
    ansible_user: string,
    ansible_password: string,
    ansible_become_password: string,
    ansible_splunk_password: string,
}