import React from "react";
import { InteractionManager } from "react-native/types";
import {base_url,api_addOrder,api_GetOrder} from "./ServisConfig"

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