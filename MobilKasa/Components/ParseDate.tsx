export function getParsedDate(strDate:Date){
    var strSplitDate = String(strDate).split(' ');
    var date = new Date(strSplitDate[0]);
    // alert(date);
    var dd:number = date.getDate();
    var mm:number = date.getMonth() + 1; //January is 0!
  
    var hh:number = date.getHours();
    var min:number= date.getMinutes();
    var ss:number =date.getMilliseconds();
  
    var yyyy = date.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    date =  dd + "." + mm + "." + yyyy+' '+ hh+':'+min;
    return date.toString();
  }