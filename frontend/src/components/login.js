import React, { Component } from 'react';

export default class Login extends Component {
	constructor (props) {
		super(props);

		this.state = {};
	}

	onFormSubmit(event) {
		event.preventDefault();
		var email = this.refs.email.value;
	    var password = this.refs.password.value;
		var userInfo = {email: email, password: password};
		/*$.ajax({
		    type: "POST",
		    url: apiBaseUrl+"users/auth",
		    contentType: "application/json",
		    dataType: "json",
		    data: JSON.stringify(userInfo),
		    success: function(result) {
		    	localStorage.setItem("bearer_token", result.token);
		    	window.location.href = "/dashboard";
		    },
		    error: function() {
		    	$(".login-error").text("Login error");
		    	console.log("Login error");
		    }
		});*/
		this.props.setLogin(true);
	}


	render() {
		return (
		  <div className="container login">
		      <div className="row">
		        <div className="col l6 offset-l3 s12 center">Sign in</div>
		        <div className="col l6 offset-l3 s12 center hint">Default email: test@test.com, pw: test123</div>
		      </div>
		      <div className="row">
		        <form className="col s12" onSubmit={this.onFormSubmit.bind(this)}>
		          <div className="row">
		            <div className="input-field col l6 offset-l3 s12">
		              <input name="email" id="email" type="email" ref="email" className="validate"/>
		              <label htmlFor="email">Email</label>
		            </div>
		          </div>
		          <div className="row">
		            <div className="input-field col l6 offset-l3 s12">
		              <input name="password" id="password" type="password" ref="password" className="validate"/>
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
		      <p className="center">Don't have an account? <a href="/register">Register</a></p>
		    </div>
		);
	}
}
