import * as React from 'react';
import {Header} from './header';
import {Devices} from './devices/devices';
import {Footer} from './footer';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%'
  } as React.CSSProperties,
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  } as React.CSSProperties
};

interface IMainProps {};

interface IMainState {};

export class Main extends React.Component<IMainProps, IMainState> {
  render() {
    return (
      <div style={styles.container}>
        <Header/>
        <main style={styles.main}>
          <Devices/>
        </main>
        <Footer/>
      </div>
    );
  }
}
