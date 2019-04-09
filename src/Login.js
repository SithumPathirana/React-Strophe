import React, { Component } from 'react';
import { Strophe } from 'strophe.js'
import ChatView from './ChatView';


class Login extends Component {

    constructor(props) {
        super(props)
        this.state = {
            jid: "",
            password: "",
            connection: this.props.connection,
            connectedSuccessfully: true,

        }
    }

    
    setJid = (event) => {
        this.setState({
            jid: event.target.value
        });
    }

    setPassword = (event) => {
        this.setState({
            password: event.target.value
        });
    }

    updateTable = (sentBy, body) => {
        var rows = this.state.messageList
        var message = {
            sentBy: sentBy,
            body: body
        }
        rows.push(message)
        this.setState({
            messageList: rows
        });
    }


    onMessage=(msg)=>{
         console.log("Received a message")
         var to = msg.getAttribute('to');
         var from = msg.getAttribute('from');
         var type = msg.getAttribute('type');
         var elems = msg.getElementsByTagName('body');

         if (type === "chat" && elems.length > 0) {
            var body = elems[0];
            console.log('Strophe Test: I got a message from ' + from + ': ' +
                Strophe.getText(body));
            
            
        }
        return true;
    }

    connect = () => {
        console.log("Connecting to XMPP server")
        var jid = this.state.jid;
        var password = this.state.password;
        var connection = this.state.connection
        connection.rawInput = connection.rawOutput = console.log;
        connection.connect(jid, password, function (status) {
            if (status === Strophe.Status.CONNECTED) {
                console.log(" Strophe is Connected")
            } else {
                console.log("Strophe is not connected")
            }
        })
        connection.addHandler(this.onMessage, null, 'message', null, null, null)
        this.setState({
            connectedSuccessfully: false
        });
        
    }

    render() {
        if (this.state.connectedSuccessfully) {
            return <div>
                <div> Hello,Welcome to Strophe Web Client  </div>
                <br />
                Jid  <input type="text" value={this.state.jid} onChange={this.setJid} /> &nbsp;
        Password  <input type="password" value={this.state.password} onChange={this.setPassword} />
                <br /> <br />
                <input type="button" value="Log In" onClick={this.connect} />
            </div>;

        } else {
            return <div>
                 <ChatView connection={this.state.connection} jid={this.state.jid}   />
            </div>;
        }

    }

}

export default Login