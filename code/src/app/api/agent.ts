import axios, { AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { router } from "../router/Routes";
import { PaginatedResponse } from "../models/pagination";
import { store } from "../store/configureStore";



if (process.env.NODE_ENV === 'production') {
    axios.defaults.baseURL = process.env.REACT_APP_BASE_URL;
  }

const responseBody = (response: AxiosResponse) => response.data;

axios.interceptors.request.use(config => {
    const token = store.getState().account.user?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
})

axios.interceptors.response.use(response => {
    const pagination = response.headers['pagination'];
    if(pagination){
        response.data = new PaginatedResponse(response.data,JSON.parse(pagination));
        return response;
    }
    return response
}, (error: AxiosError) => {
    const {data, status} = error.response as AxiosResponse;
    switch (status) {
        case 400:
            if (data.errors) {
                const modelStateErrors: string[] = [];
                for (const key in data.errors) {
                    if (data.errors[key]) {
                        modelStateErrors.push(data.errors[key])
                    }
                }
                throw modelStateErrors.flat();
            }
            toast.error(data.title || '400 bad request');
            break;
        case 401:
            toast.error(data.title || 'Unauthorised');
            break;
        case 500:
            router.navigate('/server-error', {state: {error: data}});
            break;
        default:
            break;
    }

    return Promise.reject(error.response);
})


const requests = {
    get: (url: string, params?: URLSearchParams) => axios.get(url,{params}).then(responseBody),
    post: (url: string, body: {}) => axios.post(url, body).then(responseBody),
    put: (url: string, body: {}) => axios.put(url, body).then(responseBody),
    del: (url: string) => axios.delete(url).then(responseBody)
}

const Catalog = {
    list: (params: URLSearchParams) => requests.get(process.env.REACT_APP_PRODUCT_LIST || "",params),
    details: (id: string) => requests.get(process.env.REACT_APP_PRODUCT_DETAILS+id || ""),
    fetchFilters: () => requests.get(process.env.REACT_APP_PRODUCT_FETCHFILTERS || "")
}

const Basket = {
    get: () => requests.get(process.env.REACT_APP_BASKET_GET || ""),
    addItem: (productId: string) => requests.post(process.env.REACT_APP_BASKET_ADDITEM || "", {pId : productId}),
    removeItem: (cartId: string) => requests.del(process.env.REACT_APP_BASKET_REMOVEITEM + cartId || ""),
    reduceQuantity: (cartId: string) => requests.del(process.env.REACT_APP_BASKET_REDUCEQUANTITY + cartId || ""),
    clearCart: () => requests.del(process.env.REACT_APP_BASKET_CLEARCART || "")
}

const Account = {
    login: (values: any) => requests.post(process.env.REACT_APP_ACCOUNT_LOGIN || "", values),
    register: (values: any) => requests.post(process.env.REACT_APP_ACCOUNT_REGISTER || "", values),
    currentUser: () => requests.get(process.env.REACT_APP_ACCOUNT_CURRENTUSER || "")
}

const Orders = {
    list : () => requests.get(process.env.REACT_APP_ORDERS_LIST  || ""),
    create: (values: any) => requests.post(process.env.REACT_APP_ORDERS_CREATE  || "", values)
}


const agent ={
    Catalog,
    Basket,
    Account,
    Orders
}

export default agent;