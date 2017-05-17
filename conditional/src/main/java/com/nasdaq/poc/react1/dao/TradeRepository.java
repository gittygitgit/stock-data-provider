package com.nasdaq.poc.react1.dao;

import org.springframework.data.repository.PagingAndSortingRepository;

import com.nasdaq.poc.react1.domain.Trade;

public interface TradeRepository extends PagingAndSortingRepository<Trade, Long>{

}
