import React from "react";
import { InteractionManager } from "react-native/types";
import {base_url,api_getProduct} from "./ServisConfig"

interface IServis {
    id: string;
    barcode: string;
    product_name: string;
    price: string;
    stock: string;
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