export const base_url = 'http://market.yonetimim.com'

//export const base_url = 'http://192.168.1.155:5001';

export const api_getProduct = '/Product/GetProducts?barcode=';

export const api_getProductId = '/Product/GetProducts?productId=';

export const api_getProductDetail = '/Product_Details/GetProduct_Details?productID=';

export const api_addProduct = '/Product/AddProducts?barcode=';

export const api_updateProduct = '/Product/UpdateProducts';

export const api_paging = '/Product/GetProducts_Paging?page_count=';


export const api_addPrice = '/Price/AddPrices?products_id=';

export const api_getPrice = '/Price/GetPrice?product_id=';

export const api_addStock = '/Stock/AddStock?product_id=';


export const api_GetOrder = '/Order/GetOrder';

export const api_addOrder = '/Order/AddOrder?price=';

export const api_addOrderDetails = '/OrderDetail/AddOrderDetail';

export const api_getOrderDetail = '/OrderDetail/GetOrderDetail?orderId=';

export const api_deleteOrderDetail = '/OrderDetail/DeleteOrderDetail?order_detail_id=';



