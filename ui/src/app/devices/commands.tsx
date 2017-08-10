import * as React from 'react';
import axios from 'axios';

const styles = {
  tech: {
    minHeight: '15rem',
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
    width: '100%',
    height: '100%',
  },
  error: {
    color: 'maroon',
    backgroundColor: 'lightyellow',
    border: '1px solid goldenrod',
    borderRadius: '5px',
    padding: '5px',
    marginBottom: '5px',
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

const maxHoldRenews = 40;
const touchMoveThreshold = 10;

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
  touchCoords?: [number, number];
  cancelMouseEvents: boolean;

  constructor() {
    super();
    this.state = {};
    this.startHoldTimer = null;
    this.keepHoldTimer = null;
    this.holding = false;
    this.waitingToHold = false;
    this.cancelMouseEvents = false;
  }

  run(command: string) {
    axios
      .post(`/remotes/${this.props.device}/send/${command}`)
      .then(res => {
        const error = res.data.toString();
        if (error) {
          this.setState({ errorMessage: error });
        }
      });
  }

  hold(command: string) {
    if (this.waitingToHold) {
      return;
    } else if (this.holding) {
      axios
        .post(`/remotes/${this.props.device}/hold/${command}`)
        .then(res => {
          const error = res.data.toString();
          if (error) {
            this.setState({ errorMessage: error });
          }
        });
    } else {
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
    }
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
    this.touchCoords = null;
  }

  mouseDown(command: string) {
    if (this.holding || this.waitingToHold || this.cancelMouseEvents) {
      return;
    }
    this.hold(command);
  }

  mouseUp(command: string) {
    if (this.cancelMouseEvents) {
      setTimeout(() => this.cancelMouseEvents = false, 500);
      return;
    }
    this.endInput(command);
  }

  touchEnd(command: string) {
    this.endInput(command);
  }

  endInput(command: string) {
    if (this.holding) {
      this.stopHold();
    } else if (this.waitingToHold) {
      this.stopHold();
      this.run(command);
    }
  }

  touchStart(command: string, e: React.TouchEvent<HTMLButtonElement>) {
    this.cancelMouseEvents = true;
    if (e.touches.length === 1) {
      this.touchCoords = [e.touches[0].screenX, e.touches[0].screenY];
      this.hold(command);
    } else {
      this.stopHold();
    }
  }

  touchMove(e: React.TouchEvent<HTMLButtonElement>) {
    if (!this.waitingToHold && !this.holding) {
      return;
    }
    if (e.touches.length > 1) {
      this.stopHold();
      return;
    }
    const dx = e.touches[0].screenX - this.touchCoords[0];
    const dy = e.touches[0].screenY - this.touchCoords[1];
    const delta = Math.sqrt(dx * dx + dy * dy);
    if (delta > touchMoveThreshold) {
      this.stopHold();
    }
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
          onMouseDown={() => this.mouseDown(item.name)}
          onMouseUp={() => this.mouseUp(item.name)}
          onTouchStart={e => this.touchStart(item.name, e)}
          onTouchMove={e => this.touchMove(e)}
          onTouchEnd={() => this.touchEnd(item.name)}
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
              <a style={styles.error} href="#" onClick={e => { this.setState({errorMessage: null}); e.preventDefault(); }}>❌</a>
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
