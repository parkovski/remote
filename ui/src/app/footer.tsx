import * as React from 'react';

const styles = {
  footer: {
    padding: '0.5rem',
    fontSize: '1rem',
    backgroundColor: '#1f1f1f',
    textAlign: 'center',
    color: 'white'
  }
};

interface IFooterProps {};

interface IFooterState {};

export class Footer extends React.Component<IFooterProps, IFooterState> {
  render() {
    return (
      <footer style={styles.footer}>
        <a href='https://www.google.com/search?q=fun+facts+about+poop&ie=&oe='>
          ♥♥♥ Fun facts about poop ♥♥♥
        </a>
      </footer>
    );
  }
}
