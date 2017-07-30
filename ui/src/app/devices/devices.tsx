import * as React from 'react';
import axios from 'axios';

import {CommandsComponent, IGrid, IGridItem} from './commands';
import {ILayoutMap, IGroup, ICommandResponse} from '../../../../server/lirctypes';

const styles = {
  container: {
    margin: '1rem'
  } as React.CSSProperties,
  h2: {
    fontWeight: 300,
    fontSize: '1.5rem'
  } as React.CSSProperties,
  techs: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  } as React.CSSProperties,
  title: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#cf4646',
    color: 'white'
  } as React.CSSProperties,
};

interface IDevicesProps {};

interface IDevicesState {
  selectedRemote: number;
  remotes: string[];
  commands?: ICommandResponse;
};

export class Devices extends React.Component<IDevicesProps, IDevicesState> {
  initialRemoteName: string|null;

  constructor() {
    super();
    this.initialRemoteName = document.cookie.replace(/(?:^|.*;\s*)remote\s*\=\s*([^;]*).*$/, "$1");
    this.state = {selectedRemote: -1, remotes: []};
  }

  componentDidMount() {
    const err = () => this.setState({
      remotes: ['Error'],
      commands: {
        "groups": [{"title": "Couldn't load remotes", "commands": []}]
      },
      selectedRemote: 0,
    });

    axios
      .get('/remotes')
      .then(res => {
        if (res.data.length) {
          const index = (res.data as string[]).indexOf(this.initialRemoteName);
          this.initialRemoteName = null;
          this.setState({remotes: res.data});
          if (index !== -1) {
            this.selectRemote(index);
          } else {
            this.selectRemote(0);
          }
        } else {
          err();
        }
      })
      .catch(err);
  }

  selectRemote(index: number) {
    if (this.initialRemoteName !== null || index == this.state.selectedRemote || index < 0) {
      return;
    }
    axios
      .get(`/remotes/${this.state.remotes[index]}/commands`)
      .then(res => {
        let expires = new Date();
        expires.setDate(expires.getDate() + 3);
        document.cookie = `remote=${this.state.remotes[index]};expires=${expires.toUTCString()}`;
        this.setState({ selectedRemote: index, commands: res.data });
      });
  }

  makeDefaultGrids() {
    let commands = this.state.commands as string[];
    let grids: IGrid[] = [];
    for (let i = 0; i < commands.length; i += 9) {
      const gridIndex = (i / 9) | 0;
      grids[gridIndex] = { title: this.state.remotes[this.state.selectedRemote], items: [] };
      for (let j = i; j < i + 9 && j < commands.length; j++) {
        grids[gridIndex].items.push({ name: commands[j] });
      }
    }
    return grids;
  }

  makeGrids() {
    let layout = this.state.commands as ILayoutMap;
    if (!layout) {
      return [];
    }
    if (!layout.groups) {
      return this.makeDefaultGrids();
    }
    let grids: IGrid[] = [];
    layout.groups.forEach(group => {
      let grid: IGrid = { title: group.title, items: [] };
      group.commands.forEach(cmd => {
        let item: IGridItem = { name: cmd };
        if (layout.labels && layout.labels[cmd]) {
          item.alias = layout.labels[cmd];
        }
        if (layout.styles && (layout.styles[cmd] || layout.styles.default)) {
          item.style = {};
          if (layout.styles.default) {
            Object.assign(item.style, layout.styles.default);
          }
          if (layout.styles[cmd]) {
            Object.assign(item.style, layout.styles[cmd]);
          }
        }
        grid.items.push(item);
      });
      grids.push(grid);
    });
    return grids;
  }

  render() {
    return (
      <div>
        <div style={styles.title}>
          <h2 style={styles.h2}>
            Things: &nbsp;
            <select style={styles.h2} onChange={x => this.selectRemote(x.target.selectedIndex)} value={this.state.selectedRemote}>
              {this.state.remotes.map((name, i) => <option value={i} key={i}>{name}</option>)}
            </select>
          </h2>
        </div>
        <div style={styles.container}>
          <div style={styles.techs}>
            {
                this.makeGrids().map(grid =>
                  <CommandsComponent device={this.state.remotes[this.state.selectedRemote]} grid={grid} />
                )
            }
          </div>
        </div>
      </div>
    );
  }
}
