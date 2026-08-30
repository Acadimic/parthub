export interface IPresignedPutUrlRequest {
  key: string;
  fileType: string;
  isPublic?: boolean;
}

export interface IPresignedPutUrlsRequest {
  keys: IPresignedPutUrlRequest[];
}
