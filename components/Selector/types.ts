export type phoneNumberType = {
  id: string;
  isPrimary: 0 | 1;
  label: string;
  number: string;
  type: string;
};

export type ContactInfoType = {
  contactType: "person" | any;
  firstName: string;
  id: string;
  image?: { uri: string };
  imageAvailable: boolean;
  isFavorite: boolean;
  lastName: string;
  lookupKey: string;
  name: string;
  phoneNumbers: phoneNumberType[];
};

interface SelectorPromps {
  Visibility: boolean;
  setVisibility?: any;
  Router: any;
  ContactInfo?: ContactInfoType | null;
}

export default SelectorPromps;
