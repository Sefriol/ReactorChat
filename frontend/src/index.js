import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Login from "./components/login";
import Dashboard from "./components/dashboard";
import "./styles/styles.scss";


class App extends Component {

	constructor(props) {
		super(props);
		this.state = {logged: false};
	}

	setLogin(loginState) {
		this.setState({logged: loginState});
	}

	render () {
		var state;
		if (!this.state.logged) {
			state = <Login setLogin={this.setLogin.bind(this)}/>
		} else {
			state = <Dashboard />
		}
		console.log(state);
		return (
			<div className="app-container">
				{state}
			</div>
		);
	}
}

ReactDOM.render(<App />, document.querySelector(".app"));
