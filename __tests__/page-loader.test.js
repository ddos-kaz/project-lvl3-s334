import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import os from 'os';
import fs from 'mz/fs';
import path from 'path';
import loader from '../src';

describe('Page Loader', () => {
  const host = 'http://localhost';
  const pathname = '/test/second';
  axios.defaults.host = host;
  axios.defaults.adapter = httpAdapter;
  beforeAll(async () => {
    const testData = await fs.readFile(path.resolve(__dirname, '__fixtures__', 'simple_page.html'), 'utf8');
    nock(host).get(pathname).reply(200, testData);
  });
  it('Simple loading page content', async () => {
    const fileName = 'localhost-test-second.html';
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'foo-'));
    await loader(`${host}${pathname}`, tempDir);
    const responseData = await fs.readFile(path.resolve(tempDir, fileName), 'utf8');
    axios.get(`${host}${pathname}`).then((res) => {
      expect(responseData).toEqual(res.data);
    }).catch(err => console.log(err));
  });
});
