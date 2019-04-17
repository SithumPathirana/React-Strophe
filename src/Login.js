import React, { Component } from 'react';
import { Strophe } from 'strophe.js'
import ChatView from './ChatView';
import { $msg } from 'strophe.js';


class Login extends Component {

    constructor(props) {
        super(props)
        this.state = {
            jid: "",
            password: "",
            connection: this.props.connection,
            connectedSuccessfully: false,
            messageContent: "",
            toJid: "",
            messageList: [],
            fileSelected: '',
            sid: null,
            chucksize: null,
            data: null,
            file: null,
            aFileParts: null,
            mimeFile: null,
            fileName: null


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


    onMessage = (msg) => {
        console.log("Received a message")
        var to = msg.getAttribute('to');
        var from = msg.getAttribute('from');
        var type = msg.getAttribute('type');
        var elems = msg.getElementsByTagName('body');

        if (type === "chat" && elems.length > 0) {
            var body = elems[0];
            console.log('Strophe Test: I got a message from ' + from + ': ' +
                Strophe.getText(body));
            console.log("Message type is : " + type)
            this.updateTable(from, Strophe.getText(body))
        }
        return true;
    }



    sendMessage = () => {
        var connection = this.state.connection
        var message = $msg({
            to: this.state.toJid,
            from: this.props.jid,
            type: 'chat',

        }).c("body").t(this.state.messageContent)
        connection.send(message)
        this.updateTable(this.state.toJid, this.state.messageContent)
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
        connection.addHandler(this.onMessage, null, 'message', null, null, null);
        connection.si_filetransfer.addFileHandler(this.fileHandler);
        connection.ibb.addIBBHandler(this.ibbHandler);
        this.setState({
            connectedSuccessfully: true
        });

    }


    /* Receive and handle incomming file requests  */
    fileHandler = (from, sid, filename, size, mime) => {
        // received a stream initiation
        // save to data and be prepared to receive the file.
        console.log("fileHandler: from=" + from + ", file=" + filename + ", size=" + size + ", mime=" + mime);
        this.setState({
            mimeFile: mime,
            filename: filename
        });
        return true;
    }

    /* Handle byte streams */
    ibbHandler = (type, from, sid, data, seq) => {
        console.log("ibbHandler: type=" + type + ", from=" + from);

        switch (type) {
            case "open":
                // New file,only metadata
                this.setState({
                    aFileParts: []
                });
                break;

            case "data": console.log("	>seq=" + seq);
                console.log("	>data=" + data);
                var fileParts = this.state.aFileParts;
                fileParts.push(data)
                this.setState({
                    aFileParts: fileParts
                });
                // data
                break;

            case "close":
                var data = "data:" + this.state.mimeFile + ";base64,";
                var fileParts = this.state.aFileParts;
                for (var i = 0; i < fileParts.length; i++) {
                    data += fileParts[i].split(",")[1];
                }
                console.log("	>data=" + data);
                console.log("	>data.len=" + data.length);

                // Create a download link here 

                break;

            default: throw new Error("Should not be here");
        }
        return true;
    }

    /* Handle file select input */
    handleFileSelect = (evt) => {
        var files = evt.target.files; // FileList object
        this.setState({
            file: files[0]
        });
    }


    /* Handle Send File Button */
    handleSendFileClick = () => {
        console.log("Send file called")
        this.sendFile(this.state.file)

        this.readAll(this.state.file, function (data) {
            console.log("handleFileSelect:");
            console.log("	>data=" + data);
            console.log("	>data.len=" + data.length);
        });

    }

    /* Send the file to a client */
    sendFile = (file) => {
        var connection = this.state.connection;
        var to = this.state.toJid;
        var fileName = file.name;
        var fileSize = file.size;
        var mime = file.type;
        var chucksize = fileSize;
        var sid = connection._proto.sid;

        console.log("File to be sent is to " + to + " fileName " + fileName + " filesize " + fileSize + " mime " + mime);

        connection.si_filetransfer.send(to, sid, fileName, fileSize, mime, (error) => {
            console.log("fileTransferHandler: err=" + error);
            if (error) {
                return console.log(error);
            }
            chucksize = 20 * 1024;
            connection.ibb.open(to, sid, chucksize, (error) => {
                console.log("ibb.open: err=" + error);
                if (error) {
                    return console.log(error);
                }
                this.readChuncks(file, (data, seq) => {
                    this.sendData(to, seq, data);
                });
            });

        });


    }

    /* Read file data */
    readAll = (file, cb) => {
        var reader = new FileReader();

        reader.onloadend = function (evt) {
            if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                cb(evt.target.result);
            }
        };

        reader.readAsDataURL(file)
    }

    /*   */
    readChuncks = (file, callback) => {
        console.log("Reading the chuncks");

        var fileSize = file.size;
        var chunkSize = 20 * 1024; // bytes
        var offset = 0;
        var block = null;
        var seq = 0;

        var foo = function (evt) {
            if (evt.target.error === null) {
                offset += chunkSize;  //evt.target.result.length;
                seq++;
                callback(evt.target.result, seq); // callback for handling read chunk

            } else {
                console.log("Read Error : " + evt.target.error);
                return;
            }

            if (offset >= fileSize) {
                console.log("Done Reading File");
                return;
            }
            block(offset, chunkSize, file)
        }

        block = function (_offset, length, _file) {
            console.log("_block: length=" + length + ", _offset=" + _offset);
            var r = new FileReader();
            var blob = _file.slice(_offset, length + _offset);
            r.onload = foo;
            r.readAsDataURL(blob);
        }

        block(offset, chunkSize, file);
    }

    sendData = (to, seq, data) => {
        // stream is open, start sending chunks of data
        console.log("Stream is open to send data");

    }




    render() {
        if (this.state.connectedSuccessfully) {
            return <div>
                <div>
                    Send messages to your clients from here
               <br />  <br />
                    Client Jid : <input type="text" value={this.state.toJid} onChange={this.setToJid} />

                    <br />  <br />

                    Message : <textarea value={this.state.messageContent} onChange={this.setMessageContent} />

                    <br /> <br />
                    <input type="button" value="Send Message" onClick={this.sendMessage} />
                    &nbsp;
                    <input type="file" id="file" name="file[]" onChange={this.handleFileSelect} />
                    <br /> <br />
                    <input type="button" onClick={this.handleSendFileClick} value="Send File" />
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
                                <tr key={message.sentBy + message.body}>
                                    <td> {message.body} </td>
                                    <td> {message.sentBy}  </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>

            </div>;


        } else {
            return <div>
                <div> Hello,Welcome to Strophe Web Client  </div>
                <br />
                Jid  <input type="text" value={this.state.jid} onChange={this.setJid} /> &nbsp;
                Password  <input type="password" value={this.state.password} onChange={this.setPassword} />
                <br /> <br />
                <input type="button" value="Log In" onClick={this.connect} />
            </div>;
        }

    }

}

export default Login