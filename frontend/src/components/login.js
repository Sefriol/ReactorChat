import React, { Component } from 'react';
import jquery from 'jquery';
import config from '../config'

export default class Login extends Component {
    constructor (props) {
        super(props);
        this.state = {};
    }

    onFormSubmit(event) {
        event.preventDefault();
        const email = this.refs.email.value;
        const password = this.refs.password.value;
        const userInfo = {email: email, password: password};
        jquery.ajax({
            type: "POST",
            url: `${config.BaseBackendURL}api/users/auth`,
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(userInfo),
            success: function(result) {
                this.props.setLogin(result.token, result.channels, result.user);
            }.bind(this),
            error: function() {
                jquery(".login-error").text("Login error");
            }
        });
        //this.props.setLogin(true);
    }


    render() {
        return (
		  <div className="container login">
		      <div className="row">
		        <div className="col l6 offset-l3 s12 center">Sign in</div>
		      </div>
		      <div className="row">
		        <form className="col s12" onSubmit={this.onFormSubmit.bind(this)}>
		          <div className="row">
		            <div className="input-field col l6 offset-l3 s12">
		              <input name="email" id="email" type="email" ref="email" className="validate" defaultValue={config.dev ? "test2@example.com" : null}/>
		              <label htmlFor="email">Email</label>
		            </div>
		          </div>
		          <div className="row">
		            <div className="input-field col l6 offset-l3 s12">
		              <input name="password" id="password" type="password" ref="password" className="validate" defaultValue={config.dev ? "12345678" : null}/>
		              <label htmlFor="password">Password</label>
		            </div>
		          </div>
		          <div className="row center">
		            <button className="btn waves-effect waves-light" type="submit" name="action">OK
		              <i className="material-icons right">send</i>
		            </button>
		          </div>
		        </form>
		      </div>
		      <div className="row">
		        <div className="col l6 offset-l3 s12 center login-error"></div>
		      </div>
		      <p className="center">Don't have an account? <a href="#!" onClick={this.props.setRegister.bind(this)}>Register</a></p>
		    </div>
        );
    }
}
