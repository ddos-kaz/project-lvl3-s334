#!/usr/bin/env node
import program from 'commander';
import loadPage from '..';

program
  .version('0.0.1')
  .description('Utility for downloading particular address with packages from a web.')
  .option('-o, --output [path]', 'Output path', process.cwd())
  .arguments('<address>')
  .action(address => loadPage(address, program.output));

program.parse(process.argv);
