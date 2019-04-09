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
            <div>
                Send messages to your clients from here
               <br />  <br />
                Client Jid : <input type="text" value={this.state.toJid} onChange={this.setToJid} />

                <br />  <br />

                Message : <textarea value={this.state.messageContent} onChange={this.setMessageContent} />

                <br /> <br />
                <input type="button" value="Send Message" onClick={this.sendMessage} />

            </div>
            <br /> <br />
            <div className="message-list">

                <table id="messages-table">
                    <thead>
                        <tr>
                            <th> Message  </th>
                            <th>  Sent By  </th>
                        </tr>
                    </thead>

                    <tbody>
                        {this.state.messageList.map((message) => (
                            <tr key={message.body}>
                                <td> {message.body} </td>
                                <td> {message.sentBy}  </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>

        </div>;
    }

}

export default ChatView