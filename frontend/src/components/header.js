import React, { Component, PropTypes } from 'react';
import Users from "./users";

export default class Header extends Component {
    static propTypes = {
        onClickChannel: PropTypes.func.isRequired,
        onClickUser: PropTypes.func.isRequired,
        createChannel: PropTypes.func.isRequired,
        addUser: PropTypes.func.isRequired,
        users: PropTypes.array.isRequired,
        channels: PropTypes.array.isRequired,
        user: PropTypes.object.isRequired,
        focuschannel: PropTypes.object.isRequired
    };
    constructor (props) {
        super(props);

        this.state = {};
    }
    componentDidMount() {
        const { users, channels, user, focuschannel } = this.props;
        this.setState({showCinput: false, focuschannel: focuschannel});
    }
    handleClickUser(event) {
        this.props.onClickUser(event.target.attributes.value.value)
    }
    handleClickChannel(event) {
        event.preventDefault();
        this.setState({focuschannel: this.props.focuschannel});
        this.props.onClickChannel(event.target.attributes.value.value)
    }
    handleCreateChannel(event) {
        this.setState({showCinput: !this.state.showCinput});
        console.log('channel creation handle', event.target);
    }
    handleAddUser(event) {
        this.setState({showUinput: !this.state.showUinput});
    }
    handleCSubmit(event) {
        event.preventDefault();
        console.log(event, this.refs.channelname.value)
        const text = this.refs.channelname.value;
        this.props.createChannel(text);
        this.refs.channelname.value = '';
        this.setState({showCinput: !this.state.showCinput});
    }
    handleUSubmit(event) {
        event.preventDefault();
        console.log(event, this.refs.useremail.value)
        const text = this.refs.useremail.value;
        this.props.addUser(text);
        this.refs.useremail.value = '';
        this.setState({showUinput: !this.state.showUinput});
    }
    render() {
        return (
            <ul id="nav-mobile" className="side-nav fixed">
                <li>
                    <div className="userView">
                        <div className="background">
                        </div>
                        <a href="#!name"><span className="white-text name">{this.props.user.name}</span></a>
                        <a href="#!email"><span className="white-text email">{this.props.user.email}</span></a>
                    </div>
                </li>
                <li>
                    <div className="row subheaderrow">
                        <div className="col s12">
                            {
                                !this.state.showCinput
                                ? 
                                <div className="subheaderdiv">
                                    <a className="subheaderbutton material-icons right" onClick={this.handleCreateChannel.bind(this)}>add_circle_outline</a>
                                    <a className="subheader">Channels</a>
                                </div>
                                : 
                                <form className="col s12 subheaderinput">   
                                    <div className="input-field col s8">
                                        <input placeholder="Channel Name" id="channelname" ref="channelname" type="text" autoComplete="off" />
                                    </div>
                                    <div className="btn-flat waves-effect waves-light col s2" type="submit" name="action" onClick={this.handleCSubmit.bind(this)}>
                                        <i className="material-icons right">done</i>
                                    </div>
                                    <div className="btn-flat waves-effect waves-light col s2" onClick={this.handleCreateChannel.bind(this)}>
                                        <i className="material-icons right">clear</i>
                                    </div>
                                </form>
                            }
                        </div>
                    </div>
                </li>
                {
                    this.props.channels.map((channel, i) => {let comp = channel._id === this.props.focuschannel._id ? "active":null;
                        return (
                            <li key={i} className={comp}>
                                <a href="#!"value={channel._id} onClick={this.handleClickChannel.bind(this)}>{channel.name}</a>
                            </li>
                        );
                    })
                }
                <div className="row subheaderrow">
                    <div className="col s12">
                        {
                            !this.state.showUinput
                            ? 
                            <div className="subheaderdiv">
                                <a className="subheaderbutton material-icons right" onClick={this.handleAddUser.bind(this)}>add_circle_outline</a>
                                <a className="subheader">Users</a>
                            </div>
                            : 
                            <form className="col s12 subheaderinput">   
                                <div className="input-field col s8">
                                    <input placeholder="User email" id="useremail" ref="useremail" type="text" autoComplete="off" />
                                </div>
                                <div className="btn-flat waves-effect waves-light col s2" type="submit" name="action" onClick={this.handleUSubmit.bind(this)}>
                                    <i className="material-icons right">done</i>
                                </div>
                                <div className="btn-flat waves-effect waves-light col s2" onClick={this.handleAddUser.bind(this)}>
                                    <i className="material-icons right">clear</i>
                                </div>
                            </form>
                        }
                    </div>
                </div>
                <Users onClick={this.handleClickUser.bind(this)} users={this.props.users} focuschannel={this.props.focuschannel}/>
            </ul>
        );
    }
}
