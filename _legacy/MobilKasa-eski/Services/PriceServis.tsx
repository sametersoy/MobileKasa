import React from "react";
import { InteractionManager } from "react-native/types";
import {base_url,api_getProduct, api_addProduct, api_addPrice,api_addStock, api_paging, api_getPrice} from "./ServisConfig"



export function GetPrices(products_id: string): Promise<any> {
  console.log("GetPrices"+products_id);
  var data = fetch(base_url+ api_getPrice + products_id, {
    method: "GET",
    headers: { "Content-type": "application/json" }
  }).then((response) => response.json()).then((json) => {
    return json;
  }).catch((error) => {
    console.log("GetPrices Service Error: " + error);
  });
  return data;
}

export function AddPrice(products_id: string, price:string): Promise<any> {
  console.log("AddPrice"+products_id+price);
  var data = fetch(base_url+api_addPrice + products_id+"&price="+price, {
    method: "GET",
    headers: { "Content-type": "application/json" }
  }).then((response) => response.json()).then((json) => {
    return json;
  }).catch((error) => {
    console.log("AddPrice Service Error: " + error);
  });
  return data;
}



