import React from "react";
import { InteractionManager } from "react-native/types";
import { IProduct } from "../Models/IProduct";
import {base_url,api_getProduct, api_addProduct, api_addPrice, api_paging, api_getProductId, api_getProductDetail, api_updateProduct, api_productSearch} from "./ServisConfig"




  export function GetPaging(page_count: number): Promise<IProduct[]> {
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

  export function GetProductSearch(search: string): Promise<IProduct[]> {
    var data = fetch(base_url+api_productSearch + search, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      return json;
    }).catch((error) => {
      console.log("GetProductSearch Service Error: " + error);
    });
    return data;
  }

  export function GetProduct(barcode: string): Promise<IProduct> {
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

  export function GetProductDetail(productId: string): Promise<IProduct> {
    var data = fetch(base_url+api_getProductDetail + productId, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      return json;
    }).catch((error) => {
      console.log("GetProduct Service Error: " + error);
    });
    return data;
  }

  export function GetProductId(productId: string): Promise<IProduct> {
    var data = fetch(base_url+api_getProductId + productId, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      return json[0];
    }).catch((error) => {
      console.log("GetProductId Service Error: " + error);
    });
    return data;
  }

  export function UpdateProduct(product:IProduct): Promise<any> {
    console.log("UpdateProduct servis"+api_updateProduct);
    var data = fetch(base_url+api_updateProduct, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify(product),
      }).then((response) => response.json()).then((json) => {
      return json;
    }).catch((error) => {
      console.log("UpdateProduct Service Error: " + error);
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

