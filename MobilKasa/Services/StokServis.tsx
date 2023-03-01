import React from "react";
import { InteractionManager } from "react-native/types";
import {base_url,api_addStock} from "./ServisConfig"

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


export function AddStock(products_id: string, piece:string): Promise<any> {
  console.log("AddStock"+products_id+piece);
  var data = fetch(base_url+api_addStock + products_id+"&piece="+piece, {
    method: "GET",
    headers: { "Content-type": "application/json" }
  }).then((response) => response.json()).then((json) => {
    return json;
  }).catch((error) => {
    console.log("AddStock Service Error: " + error);
  });
  return data;
}