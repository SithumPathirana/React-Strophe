import React, { Component } from 'react';
import { Strophe } from 'strophe.js'
import Loign from './Login'


class App extends Component {

  constructor(props){
      super(props)
      this.state={
        connection:null
      }
  }

    componentWillMount(){
      this.setState({
        connection:new window.Strophe.Connection("https://wellness.hsenidmobile.com/http-bind/")
      });
    }

  render() {
    return <div className="App">
            <Loign connection={this.state.connection} />
    </div>;
  }
}
export default App;
