 ./mvnw spring-boot:run -s ~/.m2/settings.xml

curl -X POST localhost:8080/api/trades -d '{"symbol": "MSFT", "volume": "100", "price": "12.5"}' -H 'Content-Type:application/json'

