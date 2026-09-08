export interface ISelectItem {
  label: string;
  value: string;
  description?: string;
  group?: string;
  color?: string;
  icon?: unknown;
}

export interface IDynamicObject {
  [key: string]: number;
}

export interface IPresignedPutUrlRequest {
  key: string;
  fileType: string;
  isPublic?: boolean;
}

export interface IPresignedPutUrlsRequest {
  keys: IPresignedPutUrlRequest[];
}

export interface IStandardSubjectQuery {
  standard: string;
  subject: string;
}
