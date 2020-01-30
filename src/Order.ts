import { Status } from "./Status";

export interface Order {
    id: number
    title: string
    status: Status
}