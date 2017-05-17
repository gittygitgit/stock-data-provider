package com.nasdaq.poc.react1.dao;

import org.springframework.data.repository.CrudRepository;

import com.nasdaq.poc.react1.domain.Trade;

public interface TradeRepository extends CrudRepository<Trade, Long>{

}
