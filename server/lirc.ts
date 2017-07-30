import {spawn} from 'child_process';
import {Response} from 'express';
import * as fs from 'fs';

import {ICommandResponse, IGroup, ILayoutMap} from './lirctypes';

const maxHoldRenews = 6;
let holdingDevice: string|null = null;
let holdingCommand: string|null = null;
let holdTimer: any;
let holdRenews: number;
let renewHold: boolean;

export function hold(device: string, command: string) {
  if (device === holdingDevice && command === holdingCommand && holdRenews < maxHoldRenews) {
    renewHold = true;
    return;
  } else if (holdingDevice != null || holdingCommand != null) {
    stopHold();
    return;
  }

  holdRenews = 0;
  renewHold = false;
  holdingDevice = device;
  holdingCommand = command;
  spawn('irsend', ['SEND_START', device, command]);
  holdTimer = setInterval(() => {
    if (!renewHold || ++holdRenews >= maxHoldRenews) {
      stopHold();
      return;
    }
    renewHold = false;
  }, 450);
}

export function stopHold() {
  if (holdingDevice == null && holdingCommand == null) {
    return;
  }
  clearInterval(holdTimer);
  spawn('irsend', ['SEND_STOP', holdingDevice, holdingCommand]);
  holdingDevice = null;
  holdingCommand = null;
}

export default class LircFile {
  public name: string;
  commands: {[_:string]:string} = {};
  holdTimer: any;
  holdRenews: number;
  renewHold: boolean;

  constructor(text: string) {
    this.name = '<unknown>';
    this.commands = {};

    const lines = text.split('\n');
    let inCodes = false;
    for (const line of lines) {
      if (inCodes) {
        const codeMatch = /^\s*([^\s]+)\s+(?:0[Xx])?[a-zA-Z0-9]+/.exec(line);
        if (/^\s*end codes\s*$/.test(line)) {
          inCodes = false;
        }
        else if (codeMatch !== null) {
          this.commands[convertName(codeMatch[1])] = codeMatch[1];
        }
        continue;
      }
      if (/^\s*begin codes\s*$/.test(line)) {
        inCodes = true;
        continue;
      }
      const nameMatch = /^\s*name\s+([^\s]+)\s*$/.exec(line);
      if (nameMatch !== null) {
        this.name = nameMatch[1];
        continue;
      }
    }
  }

  sendCommands(res: Response) {
    let commands = Object.keys(this.commands);
    let defaultStyle = null;
    let cr: ICommandResponse;
    fs.readFile(__dirname + '/layouts/default-styles.json', 'utf8', (err, data) => {
      if (!err) {
        try {
          defaultStyle = JSON.parse(data);
        } catch (e) {
          console.log(`Parse error for ${__dirname}/layouts/default-styles.json.`);
        }
      }
      fs.readFile(__dirname + '/layouts/' + this.name + '.json', 'utf8', (err, data) => {
        try {
          if (!err) {
            cr = JSON.parse(data);
            if (defaultStyle) {
              (cr as ILayoutMap).styles = (cr as ILayoutMap).styles || {};
              (cr as ILayoutMap).styles.default = defaultStyle;
            }
          } else {
            cr = commands;
          }
        } catch (e) {
          console.log(`Parse error for ${__dirname}/layouts/${this.name}.json.`);
          cr = commands;
        }
        finally {
          res.type('json');
          res.end(JSON.stringify(cr));
        }
      });
    });
  }

  run(command: string, res: Response) {
    const process = spawn('irsend', ['SEND_ONCE', this.name, this.commands[command]]);
    process.stderr.on('data', chunk => res && res.write(chunk));
    process.stdout.on('data', chunk => res && res.write(chunk));
    const timeout = setTimeout(() => {
      process.kill();
      res.end('\nProcess timed out.');
    }, 3000);
    process.on('exit', () => {
      clearTimeout(timeout);
      res.end();
    });
  }
}

function convertName(name: string): string {
  // "KEY_BLAHBLAH" => "Blahblah"
  if (name.substr(0, 4).toLowerCase() === 'key_') {
    return name[4].toUpperCase() + name.substr(5).toLowerCase();
  } else {
    return name[0].toUpperCase() + name.substr(1).toLowerCase();
  }
}
