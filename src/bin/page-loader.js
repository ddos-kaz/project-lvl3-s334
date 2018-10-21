#!/usr/bin/env node
import program from 'commander';
import loadPage from '..';
import chalk from 'chalk';
import process from 'process';

program
  .version('0.0.1')
  .description('Utility for downloading particular address with packages from a web.')
  .option('-o, --output [path]', 'Output path', process.cwd())
  .arguments('<address>')
  .action(address => loadPage(address, program.output)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(chalk.red(`Page loading ended with an error. Error messsage: ${chalk.bold(err.message)}`));
      process.exit(1);
    }));

program.parse(process.argv);
