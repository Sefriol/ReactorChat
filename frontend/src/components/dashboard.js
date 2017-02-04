import React, { Component, PropTypes } from 'react';
import Moment from 'react-moment';
import moment from 'moment';

export default class Dashboard extends Component {

    static propTypes = {
        messages: PropTypes.array.isRequired,
        onSend: PropTypes.func.isRequired,
        focuschannel: PropTypes.object.isRequired
    };
    constructor (props) {
        super(props);

        this.state = {};

    }
    componentDidMount() {
        this.setState({focuschannel: this.props.focuschannel});
    }
    
    handleSubmit(event) {
        event.preventDefault();
        const text = this.refs.message.value;
        this.props.onSend(text);
        this.refs.message.value = '';
    }

    render() {
        //console.log('dashboard-messages',this.props.focuschannel._id, this.props.messages)
        const filtermessages = this.props.messages.filter(obj => obj.channel === this.props.focuschannel._id);
        return (
				<div className="container dashboard">
                    <div className="messageWrapper">
                    <ul className="collection">
                    {
                        filtermessages.map((msg, i) => {
                            return (
                                <li key={i} className="collection-item avatar">
                                <span className="title">
                                    <strong className="user-name">{msg.user.name}</strong>
                                    <span className="timestamp"><Moment fromNow date={msg.time}/></span>
                                </span>
                                <p>{msg.message}
                                </p>
                                </li>
                            );
                        })
                    }
                    </ul>
                    </div>
					<div className="row chatform">
						<form className="col s12" onSubmit={this.handleSubmit.bind(this)}>
                            <div className="row input-row">
                               <div className="input-field col s12">
                                    <i className="material-icons prefix">textsms</i>
                                    <input id="message" ref="message" type="text" autoComplete="off" />
                                    <label htmlFor="message">Send Message</label>
                                    <button className="btn waves-effect waves-light chatformbtn" type="submit" name="action">
                                        <i className="material-icons keyboard_return right">keyboard_return</i>Send
                                    </button>
                                </div>
                            </div>
						</form>
					</div>
				</div>
        );
    }
}
