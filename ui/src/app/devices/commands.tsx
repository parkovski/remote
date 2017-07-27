import * as React from 'react';
import axios from 'axios';

const styles = {
  tech: {
    height: '15rem',
    width: '15rem',
    border: '1px solid lightgray',
    borderRadius: '1rem',
    margin: '1rem',
    padding: '1rem'
  },
  h3: {
    fontSize: '1.5rem',
    margin: '0 0 2rem 0'
  },
  button: {
    fontSize: '1rem',
    padding: '1rem .05rem',
    width: '100%',
    height: '100%',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    MsUserSelect: 'none',
  },
  error: {
    color: 'goldenrod',
  }
};

export interface IGrid {
  title: string;
  items: IGridItem[];
}

export interface IGridItem {
  style?: any;
  name: string;
  alias?: string;
}

interface ICommandsProps {
  device: string;
  grid: IGrid;
};

interface ICommandsState {
  errorMessage?: string;
};

const maxHoldRenews = 15;

export class CommandsComponent extends React.Component<ICommandsProps, ICommandsState> {
  static propTypes = {
    device: React.PropTypes.string.isRequired,
    grid: React.PropTypes.object.isRequired,
  };

  startHoldTimer: any;
  keepHoldTimer: any;
  holdRenews: number;
  holding: boolean;
  waitingToHold: boolean;

  constructor() {
    super();
    this.state = {};
    this.startHoldTimer = null;
    this.keepHoldTimer = null;
    this.holding = false;
    this.waitingToHold = false;
  }

  run(command: string) {
    axios
      .post(`/remotes/${this.props.device}/send/${command}`)
      .then(res => {
        this.setState({ errorMessage: res.data.toString() });
      });
  }

  hold(command: string) {
    axios.post(`/remotes/${this.props.device}/hold/${command}`);
  }

  stopHold() {
    if (this.holding) {
      axios.post(`/stophold`);
    }
    clearInterval(this.keepHoldTimer);
    clearTimeout(this.startHoldTimer);
    this.keepHoldTimer = null;
    this.startHoldTimer = null;
    this.holding = false;
    this.waitingToHold = false;
  }

  mouseDown(command: string, e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) {
    if (this.holding || this.waitingToHold) {
      return;
    }

    this.waitingToHold = true;
    this.startHoldTimer = setTimeout(() => {
      this.startHoldTimer = null;
      this.waitingToHold = false;
      this.holding = true;
      this.hold(command);
      this.holdRenews = 0;
      this.keepHoldTimer = setInterval(() => {
        if (++this.holdRenews >= maxHoldRenews) {
          this.stopHold();
        } else {
          this.hold(command);
        }
      }, 100);
    }, 300);
    e.preventDefault();
  }

  mouseUp(command: string, e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) {
    if (this.holding) {
      this.stopHold();
    } else if (this.waitingToHold) {
      this.stopHold();
      this.run(command);
    }
    e.preventDefault();
  }

  gridCell(i: number) {
    if (i >= this.props.grid.items.length) {
      return null;
    }
    let item = this.props.grid.items[i];
    let style = {};
    Object.assign(style, styles.button);
    if (item.style) {
      Object.assign(style, item.style);
    }

    return (
      <div style={{flex: '33.333%'}}>
        <button
          style={style}
          onMouseDown={e => this.mouseDown(item.name, e)}
          onMouseUp={e => this.mouseUp(item.name, e)}
          onTouchStart={e => this.mouseDown(item.name, e)}
          onTouchEnd={e => this.mouseUp(item.name, e)}
          >
          {item.alias || item.name}
        </button>
      </div>
    );
  }

  render() {
    return (
      <div style={styles.tech}>
        {
          (this.props.grid.title.length > 0) &&
            <h3 style={styles.h3}>
              {this.props.grid.title}
            </h3>
        }
        {
          this.state.errorMessage &&
            <div style={styles.error}>
              <a href="#" onClick={e => { this.setState({errorMessage: null}); e.preventDefault(); }}>❌</a>
              &nbsp;
              {this.state.errorMessage}
            </div>
        }
        {
          this.props.grid.items.map((_, i) => {
            if (i % 3 === 0) {
              return (
                <div style={{display: 'flex', justifyContent: 'center'}}>
                  {this.gridCell(i)}
                  {this.gridCell(i + 1)}
                  {this.gridCell(i + 2)}
                </div>
              );
            } else {
              return null;
            }
          })
        }
      </div>
    );
  }
}
