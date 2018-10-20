import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import _ from 'lodash';
import path from 'path';
import cheerio from 'cheerio';
import isUrl from 'is-url';

const transformName = nameList => _.join(_.compact(nameList), '-');

const parseAddress = (address) => {
  const { hostname, pathname } = url.parse(address);
  return [..._.split(hostname, '.'), ..._.split(pathname, '/')];
};

const loadData = address => axios.get(address)
  .then(response => response.data)
  .catch(err => Promise.reject(new Error(`Error in laoding html : ${err}, from url: ${address}`)));

const loadResources = (address, dirName) => axios.get(address, { responseType: 'arraybuffer' })
  .then(response => fs.writeFile(dirName, response.data))
  .catch(err => Promise
    .reject(new Error(`Error in loading resources: ${err}, from url: ${address}`)));

const genResourceName = (resourcePath) => {
  const { dir, name, ext } = path.parse(resourcePath);
  const resourceName = isUrl(resourcePath) ? parseAddress(url.resolve(dir, name)) : _.split(path.resolve(dir, name), '/');
  return `${transformName(resourceName)}${ext}`;
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
      $(links[i]).attr(tag.tagSrc, `${dirName}/${genResourceName(resourcePath)}`);
      return resourcePath;
    });
    return [...acc, ...mappedLinks];
  }, []);
  return Promise.resolve({ formattedData: $.html(), resourceLinks: _.compact(resourceLinks) });
};


const processResources = (links, address, dir) => {
  const promises = links.map((link) => {
    const resourceAddress = isUrl(link) ? link : `${address}${link}`;
    const resourceDirectory = path.normalize(path.format({ dir, base: genResourceName(link) }));
    return loadResources(resourceAddress, resourceDirectory);
  });
  return Promise.all(promises)
    .catch(err => Promise.reject(new Error(err)));
};

export default (address, dir) => {
  const name = transformName(parseAddress(address));
  const fileName = `${name}.html`;
  const dirName = `${name}_files`;
  const resourceDirectory = path.resolve(dir, dirName);
  const htmlDirectory = path.resolve(dir, fileName);
  return fs.access(dir, fs.constants.F_OK)
    .then(() => fs.mkdir(resourceDirectory))
    .then(() => loadData(address))
    .then(data => transformData(data, dirName))
    .then(({
      formattedData, resourceLinks,
    }) => fs.writeFile(htmlDirectory, formattedData)
      .then(() => processResources(resourceLinks, address, resourceDirectory)))
    .catch(err => Promise.reject(new Error(err)));
};
