package com.nasdaq.poc.react1.domain;

import java.math.BigDecimal;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

@Entity
public class Trade {
	private @Id @GeneratedValue Long id;
	private String symbol;
	private Integer volume;
	private BigDecimal price;
	
	public Trade() {
		super();
	}
	
	public Trade(String symbol, Integer volume, BigDecimal price) {
		super();
		this.symbol = symbol;
		this.volume = volume;
		this.price = price;
	}
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getSymbol() {
		return symbol;
	}
	public void setSymbol(String symbol) {
		this.symbol = symbol;
	}
	public Integer getVolume() {
		return volume;
	}
	public void setVolume(Integer volume) {
		this.volume = volume;
	}
	public BigDecimal getPrice() {
		return price;
	}
	public void setPrice(BigDecimal price) {
		this.price = price;
	}
}
