import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import os from 'os';
import { promises as fsPromises } from 'fs';
import path from 'path';
import loader from '../src';

const host = 'http://localhost';
const pathname = '/test';
//  axios.defaults.host = host;
axios.defaults.adapter = httpAdapter;

describe('Page Loader', () => {
  beforeAll(async () => {
    const testData = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__', 'simple_page.html'), 'utf8');
    nock(host).get(pathname).reply(200, testData);
  });
  it('Simple loading page content', async () => {
    const fileName = 'localhost-test.html';
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'foo-'));
    await loader(`${host}${pathname}`, tempDir);
    const responseData = await fsPromises.readFile(path.resolve(tempDir, fileName), 'utf8');
    const sourceData = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__', 'simple_page.html'), 'utf8');
    expect(responseData).toBe(sourceData);
  });

  afterAll(() => {
    nock.cleanAll();
  });
});
