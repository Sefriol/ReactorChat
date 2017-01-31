import React, { Component } from 'react';

export default class Modal extends Component {
    constructor (props) {
        super(props);
        this.state = {};
    }
    openForm() {
        this.setState({open: true});
    }
    closeForm() {
        this.setState({open: false});
    }
    onFormSubmit(event) {
        event.preventDefault();
        const email = this.refs.email.value;
        const password = this.refs.password.value;
        const userInfo = {email: email, password: password};
    }


    render() {
        //if(!this.state.show) return null
        return (
            <div className="modal open">
                <div className="modal-content">
                <h4>Modal Header</h4>
                <p>A bunch of text</p>
                </div>
                <div className="modal-footer">
                <a href="#!" className=" modal-action modal-close waves-effect waves-green btn-flat">Agree</a>
                </div>
            </div>
        );
    }
}
