'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const follow = require('./follow'); // function to hop multiple links by "rel"
const when = require('when');
const root = '/api';
const stompClient = require('./websocket-listener');

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
        <td>{this.props.trade.entity.symbol}</td>
        <td>{this.props.trade.entity.volume}</td>
        <td>{this.props.trade.entity.price}</td>
        <td>
          <UpdateDialog trade={this.props.trade}
                  attributes={this.props.attributes}
                  onUpdate={this.props.onUpdate}/>
        </td>
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
      <Trade key={trade.entity._links.self.href} attributes={this.props.attributes} trade={trade} onDelete={this.props.onDelete}  onUpdate={this.props.onUpdate} />
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
    this.onUpdate = this.onUpdate.bind(this);
    this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
    this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
  }

  loadFromServer(pageSize) {
    follow(client, root, [
      {rel: 'trades', params: {size: pageSize}}]
    ).then(tradeCollection => {
      return client({
        method: 'GET',
        path: tradeCollection.entity._links.profile.href,
        headers: {'Accept': 'application/schema+json'}
      }).then(schema => {
        this.schema = schema.entity;
        this.links = tradeCollection.entity._links;
        return tradeCollection;
      });
    }).then(tradeCollection => {
      return tradeCollection.entity._embedded.trades.map(trade =>
        client({
          method: 'GET',
          path: trade._links.self.href
        })
      );
    }).then(tradePromises => {
      return when.all(tradePromises);
    }).then(trades => {
      this.setState({
        trades: trades,
        attributes: Object.keys(this.schema.properties),
        pageSize: pageSize,
        links: this.links
      });
    });
  }

  refreshAndGoToLastPage(message) {
    follow(client, root, [{
      rel: 'trades',
      params: {size: this.state.pageSize}
    }]).then(response => {
      if (response.entity._links.last !== undefined) {
        this.onNavigate(response.entity._links.last.href);
      } else {
        this.onNavigate(response.entity._links.self.href);
      }
    })
  }

  refreshCurrentPage(message) {
    follow(client, root, [{
      rel: 'trades',
      params: {
        size: this.state.pageSize,
        page: this.state.page.number
      }
    }]).then(tradeCollection => {
      this.links = tradeCollection.entity._links;
      this.page = tradeCollection.entity.page;

      return tradeCollection.entity._embedded.trades.map(trade => {
        return client({
          method: 'GET',
          path: trade._links.self.href
        })
      });
    }).then(tradePromises => {
      return when.all(tradePromises);
    }).then(trades => {
      this.setState({
        page: this.page,
        trades: trades,
        attributes: Object.keys(this.schema.properties),
        pageSize: this.state.pageSize,
        links: this.links
      });
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

  onUpdate(trade, updatedTrade) {
    client({
      method: 'PUT',
      path: trade.entity._links.self.href,
      entity: updatedTrade,
      headers: {
        'Content-Type': 'application/json',
        'If-Match': trade.headers.Etag
      }
    }).then(response => {
      this.loadFromServer(this.state.pageSize);
    }, response => {
      if (response.status.code === 412) {
        alert('DENIED: Unable to update ' +
          trade.entity._links.self.href + '. Your copy is stale.');
      }
    });
  }

  onNavigate(navUri) {
    client({method: 'GET', path: navUri})
      .then(tradeCollection => {

        this.links = tradeCollection.entity._links;

        return tradeCollection.entity._embedded.trades.map(trade =>
          client({
            method: 'GET',
            path: trade._links.self.href
          })
        );
      }).then(tradePromises => {
        return when.all(tradePromises);
      }).then(trades =>
        this.setState({
          trades: trades,
          attributes: Object.keys(this.schema.properties),
          pageSize: this.state.pageSize,
          links: this.links
        })
      )
  }

  componentDidMount() {
    this.loadFromServer(this.state.pageSize);
    stompClient.register([
      {route: '/topic/newTrade', callback: this.refreshAndGoToLastPage},
      {route: '/topic/updateTrade`', callback: this.refreshCurrentPage},
      {route: '/topic/deleteTrad', callback: this.refreshCurrentPage}
    ]);
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
                attributes={this.state.attributes}
                onCreate={this.onCreate}
                onUpdate={this.onUpdate}
                updatePageSize={this.updatePageSize}/>
      </div>
    )
  }
};

class UpdateDialog extends React.Component {

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    var updatedTrade = {};
    this.props.attributes.forEach(attribute => {
      updatedTrade[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
    });
    this.props.onUpdate(this.props.trade, updatedTrade);
    window.location = "#";
  }

  render() {
    var inputs = this.props.attributes.map(attribute =>
        <p key={this.props.trade.entity[attribute]}>
          <input type="text" placeholder={attribute}
               defaultValue={this.props.trade.entity[attribute]}
               ref={attribute} className="field" />
        </p>
    );

    var dialogId = "updateTrade-" + this.props.trade.entity._links.self.href;

    return (
      <div key={this.props.trade.entity._links.self.href}>
        <a href={"#" + dialogId}>Update</a>
        <div id={dialogId} className="modalDialog">
          <div>
            <a href="#" title="Close" className="close">X</a>

            <h2>Update a trade</h2>

            <form>
              {inputs}
              <button onClick={this.handleSubmit}>Update</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

};

ReactDOM.render(
  <App />,
  document.getElementById('react')
);
