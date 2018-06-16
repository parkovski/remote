import * as React from 'react';
import axios from 'axios';

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

interface IFooterState {
  linkText: string;
};

export class Footer extends React.Component<IFooterProps, IFooterState> {
  constructor() {
    super();
    this.state = {linkText: '♥♥♥ Press for good luck! ♥♥♥'};
  }
  render() {
    return (
      <footer style={styles.footer}>
        <a href='#' onClick={e => this.goodLuckButton(e)}>
          {this.state.linkText}
        </a>
      </footer>
    );
  }
  goodLuckButton(e:React.MouseEvent<HTMLElement>) {
    const err = () => this.setState({ linkText: 'Oh no! All my luck has run out!' });
    axios
      .post('/goodluck')
      .then(() => this.setState({linkText: '♥♥♥ Good job! You are winner! ♥♥♥'}))
      .catch(err);
    e.preventDefault();
  }
}
