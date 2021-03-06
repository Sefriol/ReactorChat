import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Login from "./components/login";
import Register from "./components/register";
import Dashboard from "./components/dashboard";
import Header from "./components/header";
import "./styles/styles.scss";
import config from './config'

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {logged: false, register: false, users: [], messages: [], channels: []};
    }

    componentDidMount() {
    }

    _messageRecieve(message) {
        //console.log('websocket msg:', message)
        var {messages} = this.state;
        messages.push(message);
        this.setState({messages});
    }

    _userJoined(socket, data) {
        //console.log('userjoin:', data)
        var {users,chfocus} = this.state;
        var {user} = data;
        user.channel = socket.nsp
        users.push(user);
        if(socket.nsp === `/${chfocus._id}`) Materialize.toast(`User ${user.name} joined!`, 1500)
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
        const {event, message} = data;
        //console.log('statusreveive',event,data)
        switch (event) {
        case 'user:join':
            this._userJoined(socket, data);
            break;
        case 'user:left':
            this._userLeft(socket, data);
            break;
        case 'channels:update':
            const {channels} = data;
            this.setState({ channels: channels });
            Materialize.toast(`Updated channels`, 1500);
            break;
        case 'connected':
            const {users} = data;
            if (!users) break;
            users.filter(usr => usr.online).map(filtusr => this._userJoined(socket, {user: filtusr}));
            break;
        case 'error':
            Materialize.toast(`Error: ${message}`, 1500, 'red');
            break;
        case 'success':
            Materialize.toast(`${message}`, 1500, 'green');
            break;
        default:
            break;
        }
    }

    _authenticateWS(socket) {
        //console.log('CONNECTED WS',this, socket)
        socket.emit('authenticate', {token: this.state.token})
        socket
                .on('chat', this._messageRecieve.bind(this))
                .on('status', this._statusRecieve.bind(this, socket))
                .on('disconnect', console.log('DCed'));
    }

    handleChannelClick(id) {
        var {chfocus, channels, sockets} = this.state
        //console.log('handlecclick',id, sockets.map(socket => socket.nsp), sockets.map(socket => socket.nsp).indexOf('/' + id))
        if (sockets.map(socket => socket.nsp).indexOf('/' + id) === -1) {
            let socket = io(`${config.BaseBackendURL}${channels[channels.map(channel => channel._id).indexOf(id)]._id}`);
            sockets.push(socket)
            socket.on('connect', this._authenticateWS.bind(this, socket));
        }
        chfocus = channels[channels.map(channel => channel._id).indexOf(id)];
        this.setState({ chfocus: chfocus, sockets: sockets })
    }
    handlelUserClick(id){
        //console.log(id)
    }

    handleMessageSubmit(message) {
        const {sockets, chfocus} = this.state;
        sockets[sockets.map(socket => socket.nsp).indexOf(`/${chfocus._id}`)].emit('chat', message);
    }

    handleCreateChannel(channelname) {
        const {sockets, chfocus} = this.state;
        //console.log(sockets.map(socket => socket.nsp).indexOf(`/${chfocus._id}`),sockets.map(socket => socket.nsp))
        sockets[sockets.map(socket => socket.nsp).indexOf(`/${chfocus._id}`)].emit('create', { name: channelname });
    }

    handleAddUser(email) {
        const {sockets, chfocus} = this.state;
        sockets[sockets.map(socket => socket.nsp).indexOf(`/${chfocus._id}`)].emit('admin', {command:'addUser', email: email });
    }

    setLogin(token, channels, user) {
        this.setState({logged: true, channels: channels, token: token, chfocus: channels[0], user: user, sockets: []});
        let {sockets} = this.state;
        channels.map(channel => {
            let socket = io(`${config.BaseBackendURL}${channel._id}`);
            sockets.push(socket)
            socket.on('connect', this._authenticateWS.bind(this, socket));
        })
        this.setState({sockets: sockets})
    }

    setRegister() {
        this.setState({register: !this.state.register})
    }

    render () {
        var state;
        if (!this.state.logged && this.state.register) {
            state = <Register setRegister={this.setRegister.bind(this)}/>
        } else if (!this.state.logged && !this.state.register) {
            state = <Login setLogin={this.setLogin.bind(this)} setRegister={this.setRegister.bind(this)}/>
        } else {
            state = <div><Header createChannel={this.handleCreateChannel.bind(this)} onClickChannel={this.handleChannelClick.bind(this)} onClickUser={this.handlelUserClick.bind(this)} addUser={this.handleAddUser.bind(this)} user={this.state.user} channels={this.state.channels} users={this.state.users} focuschannel={this.state.chfocus} />
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
