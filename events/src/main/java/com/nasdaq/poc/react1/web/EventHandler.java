package com.nasdaq.poc.react1.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.nasdaq.poc.react1.domain.Trade;

@Component
@RepositoryEventHandler(Trade.class)
public class EventHandler {

	private final SimpMessagingTemplate websocket;

	private final EntityLinks entityLinks;

	@Autowired
	public EventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
		this.websocket = websocket;
		this.entityLinks = entityLinks;
	}

	@HandleAfterCreate
	public void newTrade(Trade Trade) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/newTrade", getPath(Trade));
	}

	@HandleAfterDelete
	public void deleteTrade(Trade Trade) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/deleteTrade", getPath(Trade));
	}

	@HandleAfterSave
	public void updateTrade(Trade Trade) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/updateTrade", getPath(Trade));
	}

	/**
	 * Take an {@link Trade} and get the URI using Spring Data REST's {@link EntityLinks}.
	 *
	 * @param Trade
	 */
	private String getPath(Trade Trade) {
		return this.entityLinks.linkForSingleResource(Trade.getClass(),
				Trade.getId()).toUri().getPath();
	}

}