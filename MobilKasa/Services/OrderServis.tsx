import React from "react";
import { InteractionManager } from "react-native/types";
import {base_url,api_addOrder,api_GetOrder, api_addOrderDetails, api_getOrderDetail, api_deleteOrderDetail} from "./ServisConfig"

export interface IOrderDetail {
  order_id:number
  product_id:number
  price:number

}

export function GetOrder(): Promise<any> {
    var data = fetch(base_url+api_GetOrder, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      return json;
    }).catch((error) => {
      console.log("GetOrder Service Error: " + error);
    });
    return data;
  }

export function AddOrder(price: number, piece:number): Promise<any> {
    console.log("AddOrder"+price+price);
    var data = fetch(base_url+api_addOrder + price+"&piece="+piece, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      return json;
    }).catch((error) => {
      console.log("AddOrder Service Error: " + error);
    });
    return data;
  }

  export function AddOrderDetails(orderDetails:IOrderDetail[]): Promise<any> {
    console.log("AddOrderDetails servis"+api_addOrderDetails);
    var data = fetch(base_url+api_addOrderDetails, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify(orderDetails),
      }).then((response) => response.json()).then((json) => {
      return json;
    }).catch((error) => {
      console.log("AddOrderDetails Service Error: " + error);
    });
    return data;
  }

  export function GetOrderDetail(orderId:string): Promise<any> {
    console.log("GetOrderDetail servis"+api_getOrderDetail);
    var data = fetch(base_url+api_getOrderDetail + orderId, {
      method: "GET",
      headers: { "Content-type": "application/json" },
      }).then((response) => response.json()).then((json) => {
      return json;
    }).catch((error) => {
      console.log("GetOrderDetail Service Error: " + error);
    });
    return data;
  }

  export function DeleteOrderDetail(orderDetailId:string): Promise<any> {
    console.log("DeleteOrderDetail servis"+api_deleteOrderDetail);
    var data = fetch(base_url+api_deleteOrderDetail + orderDetailId, {
      method: "GET",
      headers: { "Content-type": "application/json" },
      }).then((response) => response.json()).then((json) => {
      return json;
    }).catch((error) => {
      console.log("DeleteOrderDetail Service Error: " + error);
    });
    return data;
  }