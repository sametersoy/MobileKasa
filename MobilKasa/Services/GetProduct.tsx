import React from "react";
import { InteractionManager } from "react-native/types";

interface IServis {
    id: string;
    barcode: string;
    product_name: string;
    price: string;
    stock: string;
  }
export function GetProduct(barcode: string): Promise<IServis> {
    var data = fetch('http://192.168.1.155:5001/Product/GetProducts?barcode=' + barcode, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      return json[0];
    }).catch((error) => {
      console.log("GetProduct Service Error: " + error);
    });
    return data;
  }