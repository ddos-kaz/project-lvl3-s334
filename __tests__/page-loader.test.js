import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import os from 'os';
import { promises as fsPromises } from 'fs';
import path from 'path';
import loadPage from '../src';

const host = 'http://localhost';
const pathname = '/test';
axios.defaults.adapter = httpAdapter;

describe('Page Loader', () => {
  beforeAll(async () => {
    const sourceHTML = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__', 'source.html'), 'utf8');
    const sourceImg = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/src', 'hexlet_logo.png'));
    const sourceScript = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/src', 'script.js'), 'utf8');
    const sourceCSS = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/src', 'style.css'), 'utf8');
    nock(host)
      .get(pathname)
      .reply(200, sourceHTML)
      .get(`${pathname}/src/hexlet_logo.png`)
      .reply(200, sourceImg)
      .get(`${pathname}/src/script.js`)
      .reply(200, sourceScript)
      .get(`${pathname}/src/style.css`)
      .reply(200, sourceCSS);

    nock(host)
      .get('/second')
      .reply(201, 'Website was permanently moved to another location');
  });

  it('Wrong output directory', async () => {
    const directory = '/var/tmp/test';
    /* try {
      await loadPage('https://nemo.kz', directory);
    } catch (error) {
      expect(error.message).toBe(`Passed '${directory}' does not exist!`);
    } */
    await expect(loadPage('https://nemo.kz', directory)).rejects.toThrowErrorMatchingSnapshot();
  });

  it('Status code is not 201', async () => {
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'foo-'));
    /* try {
      await loadPage(`${host}/second`, tempDir);
    } catch (error) {
      expect(error.message).toBe(`Expected response code '200',
      but current code is '201' for '${host}/second'`);
    } */
    await expect(loadPage(`${host}/second`, tempDir)).rejects.toThrowErrorMatchingSnapshot();
  });

  it('Transforming html file and downloading resources', async () => {
    const fileName = 'localhost-test.html';
    const dirName = 'localhost-test_files';
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'foo-'));
    await loadPage(`${host}${pathname}`, tempDir);
    const responseData = await fsPromises.readFile(path.resolve(tempDir, fileName), 'utf8');
    const sourceImg = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/src', 'hexlet_logo.png'));
    const responseImg = await fsPromises.readFile(`${tempDir}/${dirName}/src-hexlet_logo.png`, 'utf8');
    const responseScript = await fsPromises.readFile(`${tempDir}/${dirName}/src-script.js`, 'utf8');
    const responseCSS = await fsPromises.readFile(`${tempDir}/${dirName}/src-style.css`, 'utf8');
    const sourceScript = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/src', 'script.js'), 'utf8');
    const sourceCSS = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/src', 'style.css'), 'utf8');
    expect(responseData).toMatchSnapshot();
    expect(responseCSS).toBe(sourceCSS);
    expect(responseImg.toString()).toBe(sourceImg.toString());
    expect(responseScript).toEqual(sourceScript);
  });

  afterAll(() => {
    nock.cleanAll();
  });
});
