import * as express from 'express';
import * as fs from 'fs';
import {default as LircFile, hold, stopHold} from './lirc';
import * as child_process from 'child_process';

const lircDir = process.env.LIRC_DIR || '/etc/lirc/lircd.conf.d/';
let lircFiles: {[_:string]:LircFile} = {};

try {
  let files = fs.readdirSync(lircDir);
  for (const file of files) {
    if (!file.match(/\.conf$/)) {
      continue;
    }
    try {
      let text = fs.readFileSync(lircDir + file, 'utf8');
      let l = new LircFile(text);
      console.log('Loaded remote file ' + file);
      lircFiles[l.name] = l;
    } catch (e) {
      console.log(e);
    }
  }
} catch (e) {
  console.log(e);
  process.exit(1);
}

if (!fs.existsSync(__dirname + '/layouts')) {
  fs.mkdirSync(__dirname + '/layouts');
  console.log(`Put layouts in ${__dirname + '/layouts'} - see lirc.ts: ILayoutMap.`);
}

const app = express();
app.get('/remotes', (req, res) => {
  res.type('json');
  res.end(JSON.stringify(Object.keys(lircFiles)));
});
app.get('/remotes/:device/commands', (req, res) => {
  const file = lircFiles[req.params.device];
  if (file == null) {
    res.status(404);
    res.end('nope dawg');
    return;
  }
  file.sendCommands(res);
});
app.post('/remotes/:device/send/:command', (req, res) => {
  const device = lircFiles[req.params.device];
  const command = req.params.command;
  if (device == null || device.commands[command] == null) {
    res.status(404);
    res.end('nope dawg');
    return;
  }
  stopHold();
  device.run(command, res);
});
app.post('/remotes/:device/hold/:command', (req, res) => {
  const device = lircFiles[req.params.device];
  const command = req.params.command;
  if (device == null || device.commands[command] == null) {
    res.status(404);
    res.end('nope dawg');
    return;
  }
  hold(req.params.device, device.commands[command]);
  res.type('text');
  res.end('');
});
app.post('/stophold', (req, res) => {
  stopHold();
  res.type('text');
  res.end('');
});
app.post('/selfupdate', (req, res) => {
  res.type('text');
  let fileInfo = {
    counter: 0,
  };
  const statFiles = ['server.zip', 'main.js', 'ui.zip', 'ui/index.html', 'selfupdate.js'];
  const requiredFiles = ['main.js', 'ui/index.html', 'selfupdate.js'];
  
  function makeCallback(prop: string) {
    return function(err: NodeJS.ErrnoException, info: fs.Stats) {
      if (!err) {
        fileInfo[prop] = info.ctime;
      }
      if (++fileInfo.counter < statFiles.length) {
        return;
      }

      for (let f of requiredFiles) {
        if (!fileInfo[f]) {
          res.end(`Couldn't stat ${f}, won't update.`);
          return;
        }
      }

      let updateServer = true;
      let updateUi = true;
      if (!fileInfo['server.zip'] || fileInfo['server.zip'] < fileInfo['main.js']) {
        updateServer = false;
      }
      if (!fileInfo['ui.zip'] || fileInfo['ui.zip'] < fileInfo['ui/index.html']) {
        updateUi = false;
      }

      if (!updateServer && !updateUi) {
        res.end('No updates available.');
        return;
      }
      if (!updateServer) {
        res.write('server.zip is old, skipping.\n');
      }
      if (!updateUi) {
        res.write('ui.zip is old, skipping.\n');
      }

      let args = [__dirname + '/selfupdate.js'];
      if (updateServer) {
        args.push('-server');
      }
      if (updateUi) {
        args.push('-ui');
      }
      child_process.spawn('node', args).on('exit', code => {
        if (code === 0) {
          res.end('Success, exiting - hope you have auto-restarting set up.');
          process.nextTick(() => process.exit(0));
        } else {
          res.end('Error running selfupdate.js.');
        }
      })
    }
  }

  for (let file of statFiles) {
    fs.stat(__dirname + '/' + file, makeCallback(file));
  }
});
app.get('/', (req, res) => res.sendFile(__dirname + '/ui/index.html'));
app.use(express.static(__dirname + '/ui'));
const port = process.env.PORT || 8080;
console.log(`Starting server on port ${port}`)
app.listen(port);