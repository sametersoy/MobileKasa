import React from "react";
import { InteractionManager } from "react-native/types";
import {base_url,api_getProduct, api_addProduct, api_addPrice, api_paging} from "./ServisConfig"

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


  export function GetPaging(page_count: number): Promise<IServiss> {
    var data = fetch(base_url+api_paging + page_count, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      return json;
    }).catch((error) => {
      console.log("GetPaging Service Error: " + error);
    });
    return data;
  }

  export function GetProduct(barcode: string): Promise<IServis> {
    var data = fetch(base_url+api_getProduct + barcode, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      return json[0];
    }).catch((error) => {
      console.log("GetProduct Service Error: " + error);
    });
    return data;
  }

  export function ProductAdd(barcode: string, product_name:string): Promise<any> {
    console.log("AddProduct"+barcode+product_name);
    var data = fetch(base_url+api_addProduct + barcode +"&product_name="+product_name, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      console.log("AddProduct"+json);
      return json;
    }).catch((error) => {
      console.log("AddProduct Service Error: " + error);
    });
    return data;
  }

