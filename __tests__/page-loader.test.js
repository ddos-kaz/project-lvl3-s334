import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import os from 'os';
import { promises as fsPromises } from 'fs';
import path from 'path';
import loader from '../src';

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
  });
  it('Transforming html file and downloading resources', async () => {
    const fileName = 'localhost-test.html';
    const dirName = 'localhost-test_files';
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'foo-'));
    await loader(`${host}${pathname}`, tempDir);
    const sourceImg = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/src', 'hexlet_logo.png'));
    const responseImg = await fsPromises.readFile(`${tempDir}/${dirName}/src-hexlet_logo.png`, 'utf8');
    const responseData = await fsPromises.readFile(path.resolve(tempDir, fileName), 'utf8');
    const responseScript = await fsPromises.readFile(`${tempDir}/${dirName}/src-script.js`, 'utf8');
    const responseCSS = await fsPromises.readFile(`${tempDir}/${dirName}/src-style.css`, 'utf8');
    const sourceScript = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/src', 'script.js'), 'utf8');
    const sourceCSS = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/src', 'style.css'), 'utf8');
    expect(responseData).toMatchSnapshot();
    expect(responseCSS).toBe(sourceCSS);
    expect(responseImg.toString()).toBe(sourceImg.toString());
    expect(responseScript).toBe(sourceScript);
  });

  afterAll(() => {
    nock.cleanAll();
  });
});
