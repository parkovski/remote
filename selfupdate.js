const fs = require('fs');
const spawnSync = require('child_process').spawnSync;

let updateServer = false;
let updateUi = false;
process.argv.forEach(a => {
  if (a == '-server') updateServer = true;
  if (a == '-ui') updateUi = true;
});

if (updateServer) {
  const files = fs.readdirSync(__dirname);
  files.forEach(f => {
    if (!/\.js$/.test(f) || f === 'selfupdate.js') {
      return;
    }
    fs.unlinkSync(__dirname + '/' + f);
  })
  let result = spawnSync('unzip', ['-o', __dirname + '/server.zip', '-d', __dirname]);
  if (result.status !== 0) {
    process.exit(1);
  }
}

if (updateUi) {
  const files = fs.readdirSync(__dirname + '/ui');
  files.forEach(f => fs.unlinkSync(__dirname + '/ui/' + f));
  let result = spawnSync('unzip', ['-o', __dirname + '/ui.zip', '-d', __dirname + '/ui']);
  if (result.status !== 0) {
    process.exit(1);
  }
}

fs.writeFileSync('lastupdate.txt', Date.now().toLocaleString(), { encoding: 'utf8' });