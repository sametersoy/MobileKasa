export interface IBarcode {

    data: string;
    dataRaw: string;
    format?: string;
    addresses?: {
      addressesType?: 'UNKNOWN' | 'Work' | 'Home';
      addressLines?: string[];
    }[];
  
    urls?: string[];
    name?: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
      prefix?: string;
      pronounciation?: string;
      suffix?: string;
      formattedName?: string;
    };
    organization?: string;
    latitude?: number;
    longitude?: number;
    ssid?: string;
    password?: string;
    encryptionType?: string;
    title?: string;
    url?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: string;
    addressCity?: string;
    addressState?: string;
    addressStreet?: string;
    addressZip?: string;
    birthDate?: string;
    documentType?: string;
    licenseNumber?: string;
    expiryDate?: string;
    issuingDate?: string;
    issuingCountry?: string;
    eventDescription?: string;
    location?: string;
    organizer?: string;
    status?: string;
    summary?: string;
    start?: string;
    end?: string;
    phoneNumber?: string;
    message?: string;
  }