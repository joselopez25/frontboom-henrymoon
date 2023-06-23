import {RAE} from 'rae-api'

const rae = new RAE();
export const pet = async ()=>{
  try {
    const search = await rae.searchWord('jose');
    console.log(search.results[0].header);
  } catch (error) {
    console.log('error');
  }
}
