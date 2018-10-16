#!/usr/bin/env node
import program from 'commander';
import loader from '..';

program
  .version('0.0.1')
  .description('Utility for downloading particular address with packages from a web.')
  .option('-o, --output [path]', 'Output path')
  .arguments('<address>')
  .action(address => loader(address, program.output));

program.parse(process.argv);
