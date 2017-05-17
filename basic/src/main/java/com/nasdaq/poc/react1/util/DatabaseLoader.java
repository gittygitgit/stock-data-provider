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
		this.repository.save(new Trade("AAPL", 100, new BigDecimal("25.60")));
	}

}
