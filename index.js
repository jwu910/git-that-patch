#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const git = require('./utils/git');
const prompts = require('prompts');

program.version('0.0.1', '-v, --version');

function checkPatchFiles(patchDir) {
  if (fs.existsSync(patchDir)) {
    fs.readdir(patchDir, (err, items) => {
      let retVal = ['Some files already exist: '];

      items.forEach(file => {
        retVal.push(chalk.yellow(file));
      });

      const msg = retVal.join('\n');
      console.log('\n' + msg);
    });
  }
}

program
  .command('create')
  .option('-n, --number <number>', 'Number of commits')
  .option('-c, --commit <commit_sha>', 'Git commit sha')
  .option('-d, --directory [directory path]', 'Path for output files')
  .on('--help', () => {
    console.log('');
    console.log('  Examples:');
    console.log('');
    console.log('  $ gtp create -n <number> -c <commit_sha>');
    console.log('  $ gtp create -n 2 -c bdb48c8');
    console.log('');
  })
  .action(async options => {
    const { commit, number, patchDir = './patch_files' } = options;

    const question = {
      type: 'confirm',
      name: 'value',
      message: chalk.yellow('Continue?'),
      initial: false,
    };

    checkPatchFiles(patchDir);

    const response = await prompts(question);

    if (response.value) {
      await git
        .createPatchFiles(number, commit, patchDir)
        .then(() => {
          console.log(chalk.green('Created patch files in ' + patchDir));
        })
        .catch(error => {
          console.log(chalk.yellow('Something went wrong!'));
          console.error(error);
        });
    } else {
      console.log('Exiting. Remove files before continuing.');
      console.log('To remove patch files, run: ' + chalk.yellow('patchup delete'));
    }
  });

program
  .command('apply')
  .on('--help', () => {
    console.log('');
    console.log('  Apply command will run ' + chalk.yellow('git am -3') + ' on your patch files')
    console.log('');
    console.log('  Examples:');
    console.log('');
    console.log('  $ gtp apply');
    console.log('');
  })
  .action(async () => {

    checkPatchFiles();

    await git.applyPatchFiles().then(() => {
      console.log('Applying patch files.')
      console.log('If there are merge conflicts, resolve and then run \n' 
        + chalk.yellow('git am --continue') + ', to continue,\n' 
        + chalk.yellow('git am --skip') + ', to skip, or\n'
        + chalk.yellow('git am --abort') + ' to abort.')
    })
  });

program
  .command('delete')
  .on('--help', () => {
    console.log('');
    console.log('  Delete will clear all files in your patch directory');
    console.log('');
    console.log('  Examples:');
    console.log('');
    console.log('  $ patchup delete');
    console.log('');
  })
  .action(async () => {
    const question = {
      type: 'confirm',
      name: 'value',
      message: chalk.yellow('Are you sure you want to delete all patch files?'),
      initial: false,
    };

    const response = await prompts(question);

    if (response.value) {
      await git.deletePatchFiles('./patch_files').then(() => {
        console.log('Deleted patch files.');
      });
    }

  })


program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
}
