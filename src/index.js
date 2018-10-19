import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import _ from 'lodash';
import path from 'path';
import cheerio from 'cheerio';

const generateName = nameList => _.join(_.compact(nameList), '-');

const loadData = address => axios.get(address)
  .then(response => response.data)
  .catch(err => Promise.reject(new Error(`Error in laoding html : ${err}, from url: ${address}`)));

const loadResources = (address, dirName) => axios.get(address, { responseType: 'arraybuffer' })
  .then(response => fs.writeFile(dirName, response.data))
  .catch(err => Promise.reject(new Error(`Error in loading resources: ${err}, from url: ${address}`)));

const generateResourceName = (resourcePath) => {
  const { dir, name, ext } = path.parse(resourcePath);
  return `${generateName(_.split(path.resolve(dir, name), '/'))}${ext}`;
};

const transformData = (data, dirName) => {
  const $ = cheerio.load(data);
  const tags = [
    { tagName: 'script', tagSrc: 'src' },
    { tagName: 'img', tagSrc: 'src' },
    { tagName: 'link', tagSrc: 'href' },
  ];
  const resourceLinks = tags.reduce((acc, tag) => {
    const links = $('html').find(tag.tagName);
    const mappedLinks = links.map((i) => {
      if (!$(links[i]).attr(tag.tagSrc)) {
        return '';
      }
      const resourcePath = $(links[i]).attr(tag.tagSrc);
      $(links[i]).attr(tag.tagSrc, `${dirName}/${generateResourceName(resourcePath)}`);
      return resourcePath;
    });
    return [...acc, ...mappedLinks];
  }, []);
  return Promise.resolve({ formattedData: $.html(), resourceLinks: _.compact(resourceLinks) });
};

const generateResourceDirName = (dir, base) => path.normalize(path.format({ dir, base }));

export default (address, dir) => {
  const { hostname, pathname } = url.parse(address);
  const name = generateName([..._.split(hostname, '.'), ..._.split(pathname, '/')]);
  const fileName = `${name}.html`;
  const dirName = `${name}_files`;
  return fs.access(dir, fs.constants.F_OK)
    .then(() => fs.mkdir(path.resolve(dir, dirName)))
    .then(() => loadData(address))
    .then(data => transformData(data, dirName))
    .then(({ formattedData, resourceLinks }) => {
      const resourcePromises = resourceLinks.map(item => loadResources(`${address}${item}`, generateResourceDirName(path.resolve(dir, dirName), generateResourceName(item))));
      return Promise.all(resourcePromises)
        .then(() => fs.writeFile(path.resolve(dir, fileName), formattedData));
    })
    .catch(err => Promise.reject(new Error(err)));
};
