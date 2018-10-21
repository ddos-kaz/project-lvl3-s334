import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import _ from 'lodash';
import path from 'path';
import cheerio from 'cheerio';
import isUrl from 'is-url';
import debug from 'debug';

const mainDebug = debug('page-loader:main');
const errorDebug = debug('page-loader:error');

const transformName = nameList => _.join(_.compact(nameList), '-');

const parseAddress = (address) => {
  const { hostname, pathname } = url.parse(address);
  return [..._.split(hostname, '.'), ..._.split(pathname, '/')];
};

const handleError = (err) => {
  errorDebug(`Failed with following error code : ${err.code} and message: ${err.message}`);
  switch (err.code) {
    case 'ENOENT':
      return new Error(`Passed '${err.path}' does not exist!`);
    case 'EACCES':
      return new Error(`For passed ${err.path} no valid access!`);
    case 'EISDIR':
      return new Error(`${err.path} is directory, no write operation can be performed!`);
    default:
      return err;
  }
};

const checkExistanceDirectory = directory => fs.access(directory, fs.constants.F_OK)
  .then(() => mainDebug(`Directory: ${directory} exists`));
  // .catch(err => Promise.reject(new Error(`Test: ${err.message}`)));

const addDirectory = directory => fs.mkdir(directory)
  .then(() => mainDebug(`${directory} was added`));
  // .catch(err => handleError(err));

const writeToFile = (directory, data) => fs.writeFile(directory, data)
  .then(() => mainDebug(`Data was successfully saved in '${directory}'`));

const processResponse = (data, status, address) => {
  mainDebug(`Processing response from '${address}'`);
  if (status === 200) {
    mainDebug(`Data from '${address}' successfully loaded`);
    return Promise.resolve(data);
  }
  return Promise.reject(new Error(`Expected response code '200', but current code is '${status}' for '${address}'`));
};

const loadData = address => axios.get(address)
  .then(({ data, status }) => processResponse(data, status, address));

const loadResources = (address, dirName) => {
  mainDebug(`Processing ${address} of ${dirName}`);
  return axios.get(address, { responseType: 'arraybuffer' })
    .then(({ data, status }) => processResponse(data, status, address))
    .then(responseData => writeToFile(dirName, responseData))
    .catch((err) => {
      errorDebug(`Error with downloading page from '${address}' to '${dirName}'`);
      return new Error(`Error with downloading page from ${address} with following error message: ${err.message}`);
    });
};

const genResourceName = (resourcePath) => {
  const { dir, name, ext } = path.parse(resourcePath);
  const resourceName = isUrl(resourcePath) ? parseAddress(url.resolve(dir, name)) : _.split(path.resolve(dir, name), '/');
  return `${transformName(resourceName)}${ext}`;
};

const processUrl = (address) => {
  const { protocol } = url.parse(address);
  return protocol ? address : `http:${address}`;
};

const processResources = (links, address, dir) => {
  const promises = links.map((link) => {
    const resourceAddress = isUrl(link) ? processUrl(link) : `${address}${link}`;
    // const resourceAddress = isUrl(link) ? url.format(link) : `${address}${link}`;
    const resourceDirectory = path.normalize(path.format({ dir, base: genResourceName(link) }));
    return loadResources(resourceAddress, _.replace(resourceDirectory, /\s/g, '_'));
  });
  return Promise.all(promises)
    .then(() => mainDebug(`Resources successfully was saved in following directory: ${dir}`));
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
      const formattedAttr = `${dirName}/${genResourceName(resourcePath)}`;
      $(links[i]).attr(tag.tagSrc, _.replace(formattedAttr, /\s/g, '_'));
      return resourcePath;
    });
    return [...acc, ...mappedLinks];
  }, []);
  return Promise.resolve({ formattedData: $.html(), resourceLinks: _.compact(resourceLinks) });
};

export default (address, directory) => {
  const name = transformName(parseAddress(address));
  const fileName = `${name}.html`;
  const directoryName = `${name}_files`;
  const resourceDirectory = path.resolve(directory, directoryName);
  const htmlDirectory = path.resolve(directory, fileName);
  return checkExistanceDirectory(directory)
    .then(() => addDirectory(resourceDirectory))
    .then(() => loadData(address))
    .then(data => transformData(data, directoryName))
    .then(({ formattedData, resourceLinks }) => writeToFile(htmlDirectory, formattedData)
      .then(() => processResources(resourceLinks, address, resourceDirectory)))
    .catch(err => Promise.reject(handleError(err)));
};
