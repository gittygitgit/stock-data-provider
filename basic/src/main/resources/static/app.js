'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
class Trade extends React.Component {
  render() {
    return (
      <tr>
        <td>{this.props.trade.symbol}</td>
        <td>{this.props.trade.volume}</td>
        <td>{this.props.trade.price}</td>
      </tr>
    )
  }
}

class TradeList extends React.Component {
  render() {
    var trades = this.props.trades.map(trade => 
      <Trade key={trade._links.self.href} trade={trade}/>
    );

    return (
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Volume</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
        {trades}
        </tbody>
      </table>
    )  
  }
}
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {trades: []};
  }

  componentDidMount() {
    client({method: 'GET', path: '/api/trades'}).then(response => {this.setState({trades: response.entity._embedded.trades})});
  }

  render() {
    return (
      <TradeList trades={this.state.trades}/>
    )
  }
};


ReactDOM.render(
  <App />,
  document.getElementById('react')
);
