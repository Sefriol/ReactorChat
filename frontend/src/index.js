import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Login from "./components/login";
import Dashboard from "./components/dashboard";
import Header from "./components/header";
import "./styles/styles.scss";
import icons from 'material-design-icons';
import materialize from 'materialize-css';
import jquery from 'jquery';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {logged: false, users: [], messages: [], channels: []};
    }

    componentDidMount() {
    }

    _messageRecieve(message) {
        console.log('websocket msg:', message)
        var {messages} = this.state;
        messages.push(message);
        this.setState({messages});
    }

    _userJoined(data) {
        console.log('userjoin:', data)
        var {users} = this.state;
        var {user} = data;
        user.channel = socket.nsp
        users.push(user);
        this.setState({users});
    }

    _userLeft(socket, data) {
        var {users} = this.state;
        var {user} = data;
        var index = users.map(usr => usr.id + usr.channel).indexOf(user.id + socket.nsp);
        users.splice(index, 1);
        this.setState({users});
    }

    _statusRecieve(socket,data) {
        const {event} = data;
        console.log('statusreveive',event,data)
        switch (event) {
        case 'user:join':
            this._userJoined(this, socket, data);
            console.log('userjoincase')
            break;
        case 'user:left':
            this._userLeft(this, socket, data);
            break;
        case 'channels:update':
            const {channels} = data
            this.setState({ channels: channels });
        default:
            break;
        }
    }

    _authenticateWS(socket) {
        console.log('CONNECTED WS',this, socket)
        socket.emit('authenticate', {token: this.state.token})
        socket
                .on('chat', this._messageRecieve.bind(this))
                .on('status', this._statusRecieve.bind(this, socket))
                .on('disconnect', console.log('DCed'));
    }

    handleChannelClick(id) {
        var {chfocus, channels, sockets} = this.state
        if (sockets.map(socket => socket.nsp).indexOf('/' + id) === -1) {
            let socket = io('http://localhost/' + channels[index]._id);
            sockets.push(socket)
            socket.on('connect', this._authenticateWS.bind(this, socket));
        }
        chfocus = channels[channels.map(channel => channel._id).indexOf(id)];
        this.setState({ chfocus: chfocus, sockets: sockets })
    }
    handlelUserClick(id){
        console.log(id)
    }

    handleMessageSubmit(message) {
        const {sockets, chfocus} = this.state;
        sockets[sockets.map(socket => socket.nsp).indexOf('/' + chfocus._id)].emit('chat', message);
    }

    handleCreateChannel(channelname) {
        this.state.socket.emit('create', { name: channelname });
    }

    setLogin(token, channels, user) {
        this.setState({logged: true, channels: channels, token: token, chfocus: channels[0], user: user, sockets: []});
        let {sockets} = this.state;
        for (var index = 0; index < channels.length; index++) {
            let socket = io('http://localhost/' + channels[index]._id);
            sockets.push(socket)
            socket.on('connect', this._authenticateWS.bind(this, socket));
        }
        this.setState({sockets: sockets})
    }

    render () {
        var state;
        if (!this.state.logged) {
            state = <Login setLogin={this.setLogin.bind(this)}/>
        } else {
            state = <div><Header createChannel={this.handleCreateChannel.bind(this)} onClickChannel={this.handleChannelClick.bind(this)} onClickUser={this.handlelUserClick.bind(this)} user={this.state.user} channels={this.state.channels} users={this.state.users} focuschannel={this.state.chfocus} />
            <Dashboard messages={this.state.messages} socket={this.state.socket} onSend={this.handleMessageSubmit.bind(this)} focuschannel={this.state.chfocus} /></div>
        }
        return (
			<div className="app-container">
				{state}
			</div>
        );
    }
}

ReactDOM.render(<App />, document.querySelector(".app"));
