import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import _ from 'lodash';
import path from 'path';

export default (address, dir) => {
  const { hostname, pathname } = url.parse(address);
  const fileName = `${_.join(_.compact(_.concat(_.split(hostname, '.'), _.split(pathname, '/'))), '-')}.html`;
  return axios.get(address)
    .then(response => fs.writeFile(path.resolve(dir, fileName), response.data))
    .catch(err => err);
};
