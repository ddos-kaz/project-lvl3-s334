import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import path from 'path';

export default (address, dir = './') => {
  const { hostname, pathname } = url.parse(address);
  const fileName = `${path.join(hostname.split('.').join('/'), pathname).split('/').join('-')}.html`;
  return axios.get(address)
    .then(response => fs.appendFile(path.resolve(dir, fileName), response.data))
    .catch(err => console.log(err));
};
