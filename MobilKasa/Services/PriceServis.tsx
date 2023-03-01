import React from "react";
import { InteractionManager } from "react-native/types";
import {base_url,api_getProduct, api_addProduct, api_addPrice,api_addStock, api_paging} from "./ServisConfig"

interface IServis {
    id: string;
    barcode: string;
    product_name: string;
    price: string;
    stock: string;
  }

  type IServiss = [{
    id: string;
    barcode: string;
    product_name: string;
    price: string;
    stock: string;
}]


export function AddPrice(products_id: string, price:string): Promise<any> {
  console.log("AddPrice"+products_id+price);
  var data = fetch(base_url+api_addStock + products_id+"&price="+price, {
    method: "GET",
    headers: { "Content-type": "application/json" }
  }).then((response) => response.json()).then((json) => {
    return json;
  }).catch((error) => {
    console.log("AddPrice Service Error: " + error);
  });
  return data;
}



