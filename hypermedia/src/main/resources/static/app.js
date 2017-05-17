'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const follow = require('./follow'); // function to hop multiple links by "rel"

const root = '/api';

class Trade extends React.Component {
  constructor(props) {
    super(props);
    this.handleDelete = this.handleDelete.bind(this);
  }
  handleDelete() {
    this.props.onDelete(this.props.trade);
  }
  render() {
    return (
      <tr>
        <td>{this.props.trade.symbol}</td>
        <td>{this.props.trade.volume}</td>
        <td>{this.props.trade.price}</td>
        <td>
          <button onClick={this.handleDelete}>Delete</button>
        </td>
      </tr>
    )
  }
}

class CreateDialog extends React.Component {

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    var newTrade= {};
    this.props.attributes.forEach(attribute => {
      newTrade[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
    });
    this.props.onCreate(newTrade);

    // clear out the dialog's inputs
    this.props.attributes.forEach(attribute => {
      ReactDOM.findDOMNode(this.refs[attribute]).value = '';
    });

    // Navigate away from the dialog to hide it.
    window.location = "#";
  }

  render() {
    var inputs = this.props.attributes.map(attribute =>
      <p key={attribute}>
        <input type="text" placeholder={attribute} ref={attribute} className="field" />
      </p>
    );

    return (
      <div>
        <a href="#createTrade">Create</a>

        <div id="createTrade" className="modalDialog">
          <div>
            <a href="#" title="Close" className="close">X</a>

            <h2>Create new trade</h2>

            <form>
              {inputs}
              <button onClick={this.handleSubmit}>Create</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

}

class TradeList extends React.Component {
  constructor(props) {
    super(props);
    this.handleNavFirst = this.handleNavFirst.bind(this);
    this.handleNavPrev = this.handleNavPrev.bind(this);
    this.handleNavNext = this.handleNavNext.bind(this);
    this.handleNavLast = this.handleNavLast.bind(this);
    this.handleInput = this.handleInput.bind(this);
  }

  handleInput(e) {
    e.preventDefault();
    var pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
    if (/^[0-9]+$/.test(pageSize)) {
      this.props.updatePageSize(pageSize);
    } else {
      ReactDOM.findDOMNode(this.refs.pageSize).value =
        pageSize.substring(0, pageSize.length - 1);
    }
  }

  handleNavFirst(e){
    e.preventDefault();
    this.props.onNavigate(this.props.links.first.href);
  }

  handleNavPrev(e) {
    e.preventDefault();
    this.props.onNavigate(this.props.links.prev.href);
  }

  handleNavNext(e) {
    e.preventDefault();
    this.props.onNavigate(this.props.links.next.href);
  }

  handleNavLast(e) {
    e.preventDefault();
    this.props.onNavigate(this.props.links.last.href);
  }

  render() {
    var trades= this.props.trades.map(trade =>
      <Trade key={trade._links.self.href} trade={trade} onDelete={this.props.onDelete} />
    );

    var navLinks = [];
    if ("first" in this.props.links) {
      navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
    }
    if ("prev" in this.props.links) {
      navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
    }
    if ("next" in this.props.links) {
      navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
    }
    if ("last" in this.props.links) {
      navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
    }

    return (
      <div>
        <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Volume</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {trades}
          </tbody>
        </table>
        <div>
          {navLinks}
        </div>
      </div>
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {trades: [], attributes: [], pageSize: 2, links: {}};
    this.updatePageSize = this.updatePageSize.bind(this);
    this.onCreate = this.onCreate.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onNavigate = this.onNavigate.bind(this);
  }

  loadFromServer(pageSize) {
    follow(client, root, [
      {rel: 'trades', params: {size: pageSize}}]
    ).then(tradeCollection => {
      console.log("here");
      console.log(tradeCollection);
      return client({
        method: 'GET',
        path: tradeCollection.entity._links.profile.href,
        headers: {'Accept': 'application/schema+json'}
      }).then(schema => {
        this.schema = schema.entity;
        return tradeCollection;
      });
    }).then(tradeCollection => {
      this.setState({
        trades: tradeCollection.entity._embedded.trades,
        attributes: Object.keys(this.schema.properties),
        pageSize: pageSize,
        links: tradeCollection.entity._links});
    });
  }

  updatePageSize(pageSize) {
    if (pageSize !== this.state.pageSize) {
      this.loadFromServer(pageSize);
    }
  }

  onDelete(trade) {
    client({method: 'DELETE', path: trade._links.self.href}).then(response => {
      this.loadFromServer(this.state.pageSize);
    });
  }

  onCreate(newTrade) {
    follow(client, root, ['trades']).then(tradeCollection => {
      return client({
        method: 'POST',
        path: tradeCollection.entity._links.self.href,
        entity: newTrade,
        headers: {'Content-Type': 'application/json'}
      })
    }).then(response => {
      return follow(client, root, [
        {rel: 'trades', params: {'size': this.state.pageSize}}]);
    }).then(response => {
      this.onNavigate(response.entity._links.last.href);
    });
  }

  onNavigate(navUri) {
    client({method: 'GET', path: navUri}).then(tradeCollection => {
      this.setState({
        trades: tradeCollection.entity._embedded.trades,
        attributes: this.state.attributes,
        pageSize: this.state.pageSize,
        links: tradeCollection.entity._links
      });
    });
  }

  componentDidMount() {
    console.log(this.state.pageSize);
    this.loadFromServer(this.state.pageSize);
  }

  render() {
    return (
      <div>
        <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
        <TradeList trades={this.state.trades}
                links={this.state.links}
                pageSize={this.state.pageSize}
                onNavigate={this.onNavigate}
                onDelete={this.onDelete}
                onCreate={this.onCreate}
                updatePageSize={this.updatePageSize}/>
      </div>
    )
  }
};


ReactDOM.render(
  <App />,
  document.getElementById('react')
);
