import React, { Component, PropTypes } from 'react';

export default class Users extends Component {
    static propTypes = {
        users: PropTypes.array.isRequired,
        focuschannel: PropTypes.object.isRequired,
        onClick: PropTypes.func.isRequired
    }

    constructor (props) {
        super(props);

        this.state = {};
    }

    componentDidMount() {
        const { users } = this.props;
    }

    handleClick(event){
        this.props.onClick(event)
    }

    render() {
        const {users, focuschannel} = this.props;
        const filterusers = users.filter(usr => usr.channel === '/' + focuschannel._id)
        return (
          <div className='users'>
              <ul>
                  {
                      filterusers.map((user, i) => {
                          return (
                              <li key={i}>
                                  <a href="#!" onClick={this.handleClick.bind(this)} value={user.id}>{user.name}</a>
                              </li>
                          );
                      })
                  }
              </ul>                
          </div>
        );
    }
}