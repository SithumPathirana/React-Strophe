import React, { Component } from 'react';
import { $msg } from 'strophe.js'
import './resources/chatview.css'
import { Strophe } from 'strophe.js'

class ChatView extends Component {

   constructor(props) {
        super(props)
        this.state = {
            connection: this.props.connection,
            messageContent: "",
            toJid: "",
            messageList: [],
            messageReceived: false
        }
    }

    componentWillMount(){
        Strophe.addConnectionPlugin()
    }


    setMessageContent = (event) => {
        this.setState({
            messageContent: event.target.value
        });
    }

    setToJid = (event) => {
        this.setState({
            toJid: event.target.value
        });
    }

    sendMessage = () => {
        var connection = this.state.connection
        var message = $msg({
            to: this.state.toJid,
            from: this.props.jid,
            type: 'chat',

        }).c("body").t(this.state.messageContent)
        connection.send(message)
        this.updateTable(this.props.jid, this.state.messageContent)
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

    render() {
        return <div>
                <div> Hello,Welcome to Strophe Web Client  </div>
                <br />
                Jid  <input type="text"  value={this.state.jid} onChange={this.setJid} /> &nbsp;
        Password  <input type="password" value={this.state.password} onChange={this.setPassword} />
                <br /> <br />
                <input type="button" value="Log In" onClick={this.connect} />
            </div>;
    }

}

export default ChatView