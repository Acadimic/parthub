import { API } from '../enums';
import { callAuthApi } from './http.service';

class MaterialService {
  getMaterials = async () => {
    return await callAuthApi('material', API.GET);
  };
}

export default new MaterialService();
