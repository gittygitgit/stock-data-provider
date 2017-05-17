package com.nasdaq.poc.react1.util;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.nasdaq.poc.react1.dao.TradeRepository;
import com.nasdaq.poc.react1.domain.Trade;

@Component
public class DatabaseLoader implements CommandLineRunner {


	private final TradeRepository repository;

	@Autowired
	public DatabaseLoader(TradeRepository repository) {
		this.repository = repository;
	}

	@Override
	public void run(String... strings) throws Exception {
		this.repository.save(new Trade("AAPL", 50, new BigDecimal("25.60")));
		this.repository.save(new Trade("MSFT", 100, new BigDecimal("2.00")));
		this.repository.save(new Trade("MU", 20, new BigDecimal("3.15")));
		this.repository.save(new Trade("IBM", 1, new BigDecimal("23.10")));
		this.repository.save(new Trade("YHOO", 25, new BigDecimal("25.10")));
	}

}
