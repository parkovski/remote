import * as React from 'react';

const colors = [
  'aquamarine', 'crimson', 'hotpink', 'lightSalmon', 'tomato', 'plum',
  'chartreuse', 'lawnGreen', 'deepSkyBlue', 'greenYellow', 'yellow',
  'darkViolet', 'powderBlue', 'slateBlue', 'turquoise',
  'orangeRed', 'darkOrange', 'fireBrick', 'snow', 'lightCoral', 'lemonChiffon',
];

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#1f1f1f'
  } as React.CSSProperties,
  title: {
    flex: 1,
    fontSize: '1.5rem',
    margin: '1rem',
    color: colors[Math.floor(Math.random() * colors.length)],
  } as React.CSSProperties,
  date: {
    flex: 1,
    textAlign: 'right',
    margin: '1rem',
    color: 'white'
  } as React.CSSProperties
};

class Time {
  month: string;
  day: number|string;
  year: number;
  hours: number;
  minutes: number;
  maxMinutes: number;
  seconds: number;
  maxSeconds: number;
  speedMode: boolean;
};

const months = ['Janrurary', 'Besebber', 'Lunch', 'Chinese New Year', 'Lyin\' Sam',
  'Beat bop solo', 'Last Tuesday', '\'Murica', 'of of of', 'The twelfth',
  '???????', '[Time machine error]', 'Hunting wabbits', 'Punkin pahhh', 'Pweenurtsnah',
  'Owie darnders', 'Drabol eeds', 'Clown carz'
];

function getTime(): Time {
  const maxMinutes = Math.floor(Math.random() * 10) + 5;
  const maxSeconds = Math.floor(Math.random() * 60) + 15;
  let day: string|number = Math.floor(Math.random() * 40) - 3;
  let month = months[Math.floor(Math.random() * months.length)];
  if (day === 8) { month = 'Days a week'; }
  else if (day === 12) { month = 'Never'; }
  else if (day === 29) { month = 'February'; }

  if (day >= 1 && day <= 13 && Math.floor(Math.random() * 6) === 2) {
    day = ['Ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'Jack', 'Queen', 'King'][day - 1];
    month = ['♠', '♥', '♦', '♣'][Math.floor(Math.random() * 4)];
  }

  if (day === 15) { day = 'The ides'; }

  return {
    month,
    day,
    year: Math.floor(Math.random() * 300) + 1750,
    hours: Math.floor(Math.random() * 12) + 1,
    minutes: Math.floor(Math.random() * maxMinutes),
    maxMinutes,
    seconds: Math.floor(Math.random() * maxSeconds),
    maxSeconds,
    speedMode: false,
  };
}

function updateTime(time: Time) {
  /// Sometimes skip a second or go backwards by one.
  const glitch = Math.floor(Math.random() * 35);
  if (glitch === 15) {
    time.seconds -= 2;
  } else if (glitch === 20) {
    ++time.seconds;
  }

  if (Math.floor(Math.random() * 150) == 75) {
    time.speedMode = true;
    setTimeout(() => time.speedMode = false, Math.random() * 5000 + 500);
  }

  if (++time.seconds >= time.maxSeconds) {
    time.seconds = 0;
    if (++time.minutes >= time.maxMinutes) {
      time.minutes = 0;
      ++time.hours;
    }
  }
}

function dateToString(t: Time): string {
  return `${t.day} of ${t.month}, ${t.year}`;
}

function timeToString(t: Time): string {
  let minutes: string|number = t.minutes;
  let seconds: string|number = t.seconds;
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  return `${t.hours}:${minutes}:${seconds} FM`;
}

interface IHeaderProps {};

interface IHeaderState {
  time: Time;
  timer: any;
  smiley: string;
};

const smileys = [
  '8-)', 'o.O', '^_^', ':^()', '(o)v(o)', '8^(|)', 'q(o\\_/O)p',
  'X_X', '*_v_*', '=%-)', '"8-{|)>', '-_v_-', '~8^)-|<', '(o<°>o)'
];

export class Header extends React.Component<IHeaderProps, IHeaderState> {
  render() {
    return (
      <header style={styles.header}>
        <p>
          <a style={styles.title} href='https://www.youtube.com/watch?v=dQw4w9WgXcQ'>
            {this.state.smiley}
          </a>
        </p>
        <p style={styles.date}>
          {dateToString(this.state.time)}<br/>
          {timeToString(this.state.time)}
        </p>
      </header>
    );
  }

  componentWillMount() {
    this.setState({ time: getTime(), smiley: smileys[Math.floor(Math.random() * smileys.length)] });
    let f = () => {
      let interval = (Math.random() * 1000) + 500;
      if (this.state && this.state.time.speedMode) {
        interval /= 10;
      }
      this.setState({
        timer: setTimeout(() => {
          updateTime(this.state.time);
          this.setState(this.state);
          f();
        }, interval),
      });
    };
    f();
  }

  componentWillUnmount() {
    clearTimeout(this.state.timer);
  }
}
