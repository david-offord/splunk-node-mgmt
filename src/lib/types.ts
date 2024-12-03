export interface ValidationObject {
    generalError?: string,
    hostname?: string,
    ipAddress?: string,
    customerCode?: string,
    ansibleName?: string | null
}

export interface Host {
    id: number,
    hostname: string,
    ipAddress: string,
    customerCode: string,
    ansibleName?: string | null

}