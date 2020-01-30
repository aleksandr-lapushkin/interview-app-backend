import { Status } from "./Status";
import { Order } from "./Order";
import { Request, Response } from "express";
import cors from "cors";

const express = require('express')
const app = express()
const port = 4000

// const corsConfig = {
//     origin: 'https://codesandbox.io'
// }

const orders: Order[] = [
    {id: 0, title: "First order", status: Status.PROCESSING},
    {id: 1, title: "Second order", status: Status.IN_TRANSIT}
]
const byId = new Map(orders.map(o => [o.id, o]))
let idCounter = 2;

app.use(cors());
app.use(express.json());

app.get("/api/orders", (req: Request, res: Response) => {
    res.send(orders)
});

app.get("/api/orders/:id", (req: Request<{id: string}>, res: Response) => {
    const idAsNum: number = Number.parseInt(req.params.id)
    const order = byId.get(idAsNum)
    if (order) {
        res.send(order)
    } else {
        res.status(404).send({error: "Not Found"})
    }
})

type OrderPayload = Omit<Order, "id">
interface OrderUpdatePayload {
    title?: string
    status?: Status
}

app.post("/api/orders", (req: Request, res: Response) => {
    const payload: unknown = req.body
    if (isOrderPayload(payload)) {
        
        const order: Order = {
            ...sanitizeOrder(payload),
            id: idCounter++
        }

        orders.push(order)
        byId.set(order.id, order)
        res.status(201).send(order)
    } else {
        res.status(400).send({error: "Invalid Payload"})
    }
})

app.put("/api/orders/:id", (req: Request<{id: string}>, res: Response) => {
    const payload: unknown = req.body
    const idAsNum: number = Number.parseInt(req.params.id)
    const existingOrder = byId.get(idAsNum)
    const existingIndex = orders.findIndex(o => o.id === idAsNum)
    if (existingOrder && existingIndex > -1) {
        if (isOrderUpdatePayload(payload)) {
            const order: Order = {
                ...existingOrder
            }

            const cleanPayload = sanitizeOrderUpdate(payload)
            if (cleanPayload.title) order.title = cleanPayload.title
            if (cleanPayload.status) order.status = cleanPayload.status

            orders[existingIndex] = order
            byId.set(existingOrder.id, order)
            res.status(200).send(order)
        } else {
            res.status(400).send({error: "Invalid Payload"})
        }   
    } else {
        res.status(404).send({error: "Not Found"})
    }
})

const isOrderPayload = (it: unknown): it is OrderPayload => {
    if (it !== null && typeof it === "object") {
        //@ts-ignore
        return it.hasOwnProperty("title") && it.hasOwnProperty("status") && isValidStatusEnum(it["status"])
    }
    return false
}

const isOrderUpdatePayload = (it: unknown): it is OrderUpdatePayload => {
    if (it !== null && typeof it === "object") {
        //@ts-ignore
        return it.hasOwnProperty("title") || (it.hasOwnProperty("status") && isValidStatusEnum(it["status"]))
    }
    return false
}

const isValidStatusEnum = (it: unknown): it is Status => {
    if (it !== null) {
        //@ts-ignore
        return Object.values(Status).includes(it)
    }
    return false;
}

const sanitizeOrder = (it: OrderPayload): OrderPayload => {
    return {
        title: it.title,
        status: it.status
    }
}

const sanitizeOrderUpdate = (it: OrderUpdatePayload): OrderUpdatePayload => {
    return {
        title: it.title,
        status: it.status
    }
}

app.listen(port, () => console.log("Server running"));