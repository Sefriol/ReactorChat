import React, { Component } from 'react';
import jquery from 'jquery';
import config from '../config'

export default class Register extends Component {
    constructor (props) {
        super(props);
        this.state = {};
    }

    onFormSubmit(event) {
        event.preventDefault();
        const username = this.refs.username.value;
        const email = this.refs.email.value;
        const password = this.refs.password.value;
        const passwordrepeat = this.refs.passwordrepeat.value;
        if (password !== passwordrepeat) return jquery(".register-error").text("Register error");
        const userInfo = {name: username, password: password, email: email};
        jquery.ajax({
            type: "PUT",
            url: `${config.BaseBackendURL}api/users/register`,
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(userInfo),
            success: function(result) {
                console.log('success',result)
                this.props.setRegister();
            }.bind(this),
            error: function(err) {
                console.log('error',err)
                jquery(".register-error").text("Register error");
            }
        });
    }


    render() {
        return (
		  <div className="container register">
		      <div className="row">
		        <div className="col l6 offset-l3 s12 center">Sign up</div>
		      </div>
		      <div className="row">
		        <form className="col s12" onSubmit={this.onFormSubmit.bind(this)}>
                  <div className="row">
		            <div className="input-field col l6 offset-l3 s12">
		              <input name="username" id="username" type="text" ref="username" className="validate" defaultValue={config.dev ? "testman" : null}/>
		              <label htmlFor="username">Username</label>
		            </div>
		          </div>
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
                  <div className="row">
		            <div className="input-field col l6 offset-l3 s12">
		              <input name="passwordrepeat" id="passwordrepeat" type="password" ref="passwordrepeat" className="validate" defaultValue={config.dev ? "12345678" : null}/>
		              <label htmlFor="password">Repeat Password</label>
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
		        <div className="col l6 offset-l3 s12 center register-error"></div>
		      </div>
		      <p className="center">Have an account? <a href="/">Login!</a></p>
		    </div>
        );
    }
}
