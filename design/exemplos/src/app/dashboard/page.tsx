import { Orders } from "./components/orders";
import { api } from "@/services/api";
import { getCookieServer } from "@/lib/cookieServer";
import { OrderProps } from "@/lib/order_type";

async function getOrders(): Promise<OrderProps[] | []> {
    try{
        const token = await getCookieServer();

        const response = await api.get("/orders", {
            headers:{
                Authorization: `Bearer ${token}`
            }
        })

        return response.data || [];
        
    }catch(err) {
        console.log(err);
        return [];
    }
}

export default async function Dashboard(){

    const orders = await getOrders();

    return(
        <>
            <Orders orders={orders}/>
        </>
    )
}